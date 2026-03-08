import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { gwsRaw } from '@/lib/gws';

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {};

  // Check Claude CLI
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn('claude', ['--version'], { stdio: 'ignore' });
      child.on('close', (code) => {
        code === 0 ? resolve() : reject(new Error('Exit code: ' + code));
      });
      child.on('error', reject);
    });
    checks.claude = { status: 'ok' };
  } catch (e: any) {
    checks.claude = { status: 'error', message: e.message };
  }

  // Check GWS CLI
  try {
    await gwsRaw(['--help'], {});
    checks.gws = { status: 'ok' };
  } catch (e: any) {
    checks.gws = { status: 'error', message: e.message };
  }

  const allOk = Object.values(checks).every((c) => c.status === 'ok');

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'unhealthy', checks },
    { status: allOk ? 200 : 503 }
  );
}
