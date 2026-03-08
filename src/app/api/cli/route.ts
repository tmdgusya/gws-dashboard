import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export const dynamic = 'force-dynamic';

/**
 * API route to execute gws CLI commands and stream back JSON/NDJSON output.
 * 
 * Supports both JSON and multipart/form-data (for file uploads).
 */
export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null;
  try {
    const contentType = req.headers.get('Content-Type') || '';
    let parts: string[] = [];
    let params: any = null;
    let json: any = null;
    let flags: string[] = [];
    let file: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      parts = JSON.parse(formData.get('parts') as string || '[]');
      params = JSON.parse(formData.get('params') as string || 'null');
      json = JSON.parse(formData.get('json') as string || 'null');
      flags = JSON.parse(formData.get('flags') as string || '[]');
      file = formData.get('file') as File | null;
    } else {
      const body = await req.json();
      parts = body.parts;
      params = body.params;
      json = body.json;
      flags = body.flags;
    }

    if (!parts || !Array.isArray(parts) || parts.length === 0) {
      return new Response(JSON.stringify({ error: 'parts is required and must be a non-empty array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const args = [...parts];

    if (params && Object.keys(params).length > 0) {
      args.push('--params', JSON.stringify(params));
    }

    if (json && Object.keys(json).length > 0) {
      args.push('--json', JSON.stringify(json));
    }

    if (flags && Array.isArray(flags)) {
      args.push(...flags);
    }

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      tempFilePath = join(tmpdir(), `gws-upload-${Date.now()}-${file.name}`);
      await writeFile(tempFilePath, buffer);
      args.push('--upload', tempFilePath);
    }

    // Default to JSON format if not specified and not a schema call (schema returns JSON anyway)
    if (!args.includes('--format') && parts[0] !== 'schema') {
      args.push('--format', 'json');
    }

    const child = spawn('gws', args, {
      env: { ...process.env },
    });

    const isNDJSON = flags && (flags.includes('--page-all') || flags.includes('-A'));

    const stream = new ReadableStream({
      start(controller) {
        child.stdout.on('data', (data) => {
          controller.enqueue(data);
        });

        child.stderr.on('data', (data) => {
          // stderr logging. We don't stream stderr to stdout to avoid corrupting JSON/NDJSON
          // console.error(`gws stderr: ${data}`);
        });

        child.on('close', async (code) => {
          if (tempFilePath) {
            try {
              await unlink(tempFilePath);
            } catch (err) {
              console.error(`Failed to delete temp file: ${tempFilePath}`, err);
            }
          }
          controller.close();
        });

        child.on('error', (err) => {
          controller.error(err);
        });
      },
      cancel() {
        child.kill();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': isNDJSON ? 'application/x-ndjson' : 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (err) {
        // ignore cleanup error
      }
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
