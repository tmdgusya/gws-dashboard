import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

const SYSTEM_PROMPT = `You are an AI assistant for GWS Workspace Hub, a personal productivity dashboard for Google Workspace (Gmail, Drive, Calendar).

The user is viewing their workspace data in a web dashboard and chatting with you through the UI.

You can help with:
1. Gmail: Searching, reading, starring, deleting emails
2. Drive: File search, upload, download, sharing
3. Calendar: Viewing, creating, updating, deleting events
4. Interpreting dashboard data and giving advice

When the user asks about gws CLI commands, you can suggest appropriate commands they can run in their terminal.

Common gws commands:
- Gmail: gws gmail users messages list, gws gmail users messages get, gws gmail users messages send
- Drive: gws drive files list, gws drive files get, gws drive +upload
- Calendar: gws calendar events list, gws calendar events insert, gws calendar events update

Please respond in Korean to match the user's language preference.`;

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build the full prompt with context from history
    let fullPrompt = message;

    // If we have history, prepend it for context
    if (Array.isArray(history) && history.length > 0) {
      const contextMessages = history.slice(-6); // Keep last 6 messages for context
      const contextText = contextMessages
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');
      fullPrompt = `Previous conversation:\n${contextText}\n\nUser: ${message}\n\nAssistant:`;
    }

    // Execute claude CLI with print mode
    const response = await new Promise<string>((resolve, reject) => {
      const args = [
        '-p', // Print mode (non-interactive)
        '--no-session-persistence', // Don't persist session
        '--system-prompt',
        SYSTEM_PROMPT,
        fullPrompt,
      ];

      // Create a clean environment without CLAUDECODE to allow nested execution
      const cleanEnv = { ...process.env };
      delete cleanEnv.CLAUDECODE;
      delete cleanEnv.CLAUDE_CODE;
      delete cleanEnv.CLAUDE_CODE_ENTRYPOINT;
      delete cleanEnv.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;

      const child = spawn('claude', args, {
        cwd: '/tmp', // Run from /tmp to avoid nested session detection
        env: cleanEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      // Write empty newline to stdin to ensure process starts
      if (child.stdin) {
        child.stdin.write('\n');
        child.stdin.end();
      }

      child.on('close', (code) => {
        if (code !== 0 && code !== null) {
          // Check if it's just a warning or actual error
          if (output && output.trim().length > 0) {
            resolve(output.trim());
          } else {
            reject(
              new Error(`Claude CLI exited with code ${code}: ${errorOutput}`)
            );
          }
        } else {
          resolve(output.trim());
        }
      });

      child.on('error', (error) => {
        reject(error);
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        child.kill();
        reject(new Error('Claude CLI timeout'));
      }, 60000);
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    // If Claude CLI is not available, provide a helpful message
    if (errorMessage.includes('ENOENT') || errorMessage.includes('not found')) {
      return NextResponse.json(
        {
          error: 'Claude Code CLI not found',
          response:
            'Claude Code CLI가 설치되어 있지 않습니다. 터미널에서 `npm install -g @anthropic-ai/claude-code` 명령으로 설치해주세요.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process chat request', details: errorMessage },
      { status: 500 }
    );
  }
}
