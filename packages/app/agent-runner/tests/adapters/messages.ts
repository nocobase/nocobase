/** Builders for SDK messages used by the adapter tests. */
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';

export const SESSION_ID = '00000000-0000-4000-8000-000000000001';

const as = (value: unknown): SDKMessage => value as SDKMessage;

export function init(model = 'claude-test-1'): SDKMessage {
  return as({
    type: 'system',
    subtype: 'init',
    session_id: SESSION_ID,
    uuid: 'u-init',
    model,
    claude_code_version: '2.1.285',
    permissionMode: 'acceptEdits',
    cwd: '/work',
    tools: ['Bash', 'Write'],
    mcp_servers: [],
    apiKeySource: 'none',
    slash_commands: [],
    output_style: 'default',
    skills: [],
    plugins: [],
  });
}

export function assistant(
  content: unknown[],
  extra: Record<string, unknown> = {},
): SDKMessage {
  return as({
    type: 'assistant',
    session_id: SESSION_ID,
    uuid: `u-a-${Math.random()}`,
    parent_tool_use_id: null,
    message: {
      id: 'msg_1',
      role: 'assistant',
      model: 'claude-test-1',
      content,
      stop_reason: null,
      usage: {},
    },
    ...extra,
  });
}

export function toolResult(
  toolUseId: string,
  content: unknown,
  isError = false,
): SDKMessage {
  return as({
    type: 'user',
    session_id: SESSION_ID,
    uuid: `u-u-${Math.random()}`,
    parent_tool_use_id: null,
    message: {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: toolUseId,
          content,
          is_error: isError,
        },
      ],
    },
  });
}

export interface ResultExtra {
  subtype?: string;
  is_error?: boolean;
  result?: string;
  errors?: string[];
  usage?: Record<string, number>;
  modelUsage?: Record<string, Record<string, number>>;
  [key: string]: unknown;
}

export function result(extra: ResultExtra = {}): SDKMessage {
  return as({
    type: 'result',
    subtype: 'success',
    session_id: SESSION_ID,
    uuid: `u-r-${Math.random()}`,
    duration_ms: 10,
    duration_api_ms: 8,
    is_error: false,
    num_turns: 1,
    result: 'Done.',
    stop_reason: 'end_turn',
    total_cost_usd: 0.01,
    usage: {
      input_tokens: 10,
      output_tokens: 5,
      cache_read_input_tokens: 100,
      cache_creation_input_tokens: 20,
    },
    modelUsage: {
      'claude-test-1': {
        inputTokens: 10,
        outputTokens: 5,
        cacheReadInputTokens: 100,
        cacheCreationInputTokens: 20,
        webSearchRequests: 0,
        costUSD: 0.01,
        contextWindow: 200000,
        maxOutputTokens: 32000,
      },
    },
    permission_denials: [],
    ...extra,
  });
}
