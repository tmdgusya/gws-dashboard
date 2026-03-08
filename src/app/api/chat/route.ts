import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

interface ToolCall {
  name: string;
  command: string;
  params?: string;
  json?: string;
  flags?: string;
}

function parseToolCalls(response: string): ToolCall[] {
  const toolCalls: ToolCall[] = [];
  const toolCallsMatch = response.match(/<tool_calls>([\s\S]*?)<\/tool_calls>/);

  if (!toolCallsMatch) return toolCalls;

  const toolCallRegex = /<tool_call name="([^"]+)">([\s\S]*?)<\/tool_call>/g;
  let match;

  while ((match = toolCallRegex.exec(toolCallsMatch[1])) !== null) {
    const name = match[1];
    const content = match[2];

    const commandMatch = content.match(/<command>([\s\S]*?)<\/command>/);
    const paramsMatch = content.match(/<params>([\s\S]*?)<\/params>/);
    const jsonMatch = content.match(/<json>([\s\S]*?)<\/json>/);
    const flagsMatch = content.match(/<flags>([\s\S]*?)<\/flags>/);

    if (commandMatch) {
      toolCalls.push({
        name,
        command: commandMatch[1].trim(),
        params: paramsMatch ? paramsMatch[1].trim() : undefined,
        json: jsonMatch ? jsonMatch[1].trim() : undefined,
        flags: flagsMatch ? flagsMatch[1].trim() : undefined,
      });
    }
  }

  return toolCalls;
}

async function executeTool(toolCall: ToolCall): Promise<{ success: boolean; result: any; error?: string }> {
  try {
    const { gws } = await import('@/lib/gws');

    const args = toolCall.command.split(' ').filter(Boolean);
    const options: { params?: any; json?: any; flags?: string[] } = {};

    if (toolCall.params) {
      try {
        options.params = JSON.parse(toolCall.params);
      } catch (e) {
        return { success: false, result: null, error: `Invalid params JSON: ${e}` };
      }
    }

    if (toolCall.json) {
      try {
        options.json = JSON.parse(toolCall.json);
      } catch (e) {
        return { success: false, result: null, error: `Invalid json body: ${e}` };
      }
    }

    if (toolCall.flags) {
      options.flags = toolCall.flags.split(' ').filter(Boolean);
    }

    const result = await gws(args, options);
    return { success: true, result };
  } catch (error: any) {
    return { success: false, result: null, error: error.message };
  }
}

async function callClaude(prompt: string, systemPrompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      '-p',
      '--no-session-persistence',
      '--system-prompt',
      systemPrompt,
    ];

    const cleanEnv = { ...process.env };
    delete cleanEnv.CLAUDECODE;
    delete cleanEnv.CLAUDE_CODE;
    delete cleanEnv.CLAUDE_CODE_ENTRYPOINT;
    delete cleanEnv.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;

    const child = spawn('claude', args, {
      cwd: '/tmp',
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

    if (child.stdin) {
      child.stdin.write(prompt);
      child.stdin.end();
    }

    child.on('close', (code) => {
      if (code !== 0 && code !== null) {
        if (output && output.trim().length > 0) {
          resolve(output.trim());
        } else {
          reject(new Error(`Claude CLI exited with code ${code}: ${errorOutput}`));
        }
      } else {
        resolve(output.trim());
      }
    });

    child.on('error', reject);

    setTimeout(() => {
      child.kill();
      reject(new Error('Claude CLI timeout'));
    }, 60000);
  });
}

const SYSTEM_PROMPT = `You are GWS Workspace AI Agent, an intelligent assistant that helps users manage their Google Workspace (Gmail, Drive, Calendar) by actually executing commands.

You have access to the following tools. When you need to use a tool, output it in XML format:

<tool_calls>
<tool_call name="gws">
<command>calendar events list</command>
<params>{"timeMin": "2026-03-08T00:00:00Z", "maxResults": 10}</params>
</tool_call>
</tool_calls>

Available commands:
- calendar events list --params '{"timeMin": "...", "timeMax": "..."}'
- calendar events insert --flags '--summary "Meeting" --start "..." --end "..."'
- gmail users messages list --params '{"userId": "me", "maxResults": 20}'
- gmail users messages get --params '{"userId": "me", "id": "MESSAGE_ID"}'
- gmail users messages send --json '{"raw": "BASE64_ENCODED_EMAIL"}'
- drive files list --params '{"pageSize": 20}'
- drive files get --params '{"fileId": "FILE_ID"}'

Rules:
1. Always respond in Korean
2. When the user asks about their data (emails, events, files), you MUST use the appropriate tool
3. After receiving tool results, provide a helpful summary to the user
4. If a command fails, explain the error in user-friendly terms
5. NEVER make up data - always use tools to get real information
6. For emails: summarize content, don't just list message IDs
7. For calendar: help find free time slots and suggest optimal meeting times
8. For drive: help find and organize files`;

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build conversation context
    let conversation = '';
    if (Array.isArray(history) && history.length > 0) {
      const contextMessages = history.slice(-6);
      conversation = contextMessages
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');
      conversation += '\n\n';
    }
    conversation += `User: ${message}\n\nAssistant:`;

    // Agent loop: Call Claude, check for tools, execute, repeat
    let maxIterations = 3;
    let currentPrompt = conversation;
    let finalResponse = '';

    for (let i = 0; i < maxIterations; i++) {
      const response = await callClaude(currentPrompt, SYSTEM_PROMPT);

      const toolCalls = parseToolCalls(response);

      // If no tool calls, this is the final response
      if (toolCalls.length === 0) {
        finalResponse = response;
        break;
      }

      // Execute tools and build result context
      const toolResults: string[] = [];

      for (const toolCall of toolCalls) {
        console.log(`Executing tool: ${toolCall.name} ${toolCall.command}`);
        const result = await executeTool(toolCall);

        if (result.success) {
          toolResults.push(`<tool_result name="${toolCall.name}" status="success">\n${JSON.stringify(result.result, null, 2)}\n</tool_result>`);
        } else {
          toolResults.push(`<tool_result name="${toolCall.name}" status="error">\n${result.error}\n</tool_result>`);
        }
      }

      // Continue conversation with tool results
      currentPrompt = conversation + '\n' + response + '\n\n' + toolResults.join('\n\n') + '\n\nAssistant:';

      // If this was the last iteration, force final response
      if (i === maxIterations - 1) {
        currentPrompt += '\n(Note: Please provide your final response to the user based on the tool results above.)';
        finalResponse = await callClaude(currentPrompt, SYSTEM_PROMPT);
      }
    }

    return NextResponse.json({ response: finalResponse });
  } catch (error) {
    console.error('Chat API error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

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
