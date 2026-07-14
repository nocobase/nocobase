/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AgentProviderKey } from '../src/shared/providerCapabilities';

export interface ProviderLogFixture {
  provider: Extract<AgentProviderKey, 'codex' | 'opencode' | 'claude-code'>;
  sessionId: string;
  session: string;
  reasoning: string;
  message: string;
  tool: string;
  usage: string;
  malformed: string;
  artifactReference: string;
}

export const PROVIDER_LOG_FIXTURES: ProviderLogFixture[] = [
  {
    provider: 'codex',
    sessionId: 'thread-fixture-1',
    session: JSON.stringify({ type: 'thread.started', thread_id: 'thread-fixture-1' }),
    reasoning: JSON.stringify({
      type: 'item.completed',
      item: { id: 'reasoning-1', type: 'reasoning', summary: [{ text: 'Inspect the current state.' }] },
    }),
    message: JSON.stringify({
      type: 'item.completed',
      item: { id: 'message-1', type: 'agent_message', text: 'Finished the task.' },
    }),
    tool: JSON.stringify({
      type: 'response_item',
      payload: {
        id: 'tool-1',
        call_id: 'call-1',
        type: 'function_call',
        name: 'read_file',
        arguments: JSON.stringify({ file_path: 'reports/codex.json' }),
      },
    }),
    usage: JSON.stringify({
      type: 'turn.completed',
      id: 'turn-1',
      usage: { input_tokens: 12, cached_input_tokens: 3, output_tokens: 5, reasoning_output_tokens: 2 },
    }),
    malformed: '{not-json',
    artifactReference: 'reports/codex.json',
  },
  {
    provider: 'opencode',
    sessionId: 'ses_opencode_1',
    session: JSON.stringify({ type: 'step_start', sessionID: 'ses_opencode_1', part: { id: 'step-1' } }),
    reasoning: JSON.stringify({ type: 'thinking_delta', id: 'reasoning-1', text: 'Inspect the current state.' }),
    message: JSON.stringify({
      type: 'text',
      sessionID: 'ses_opencode_1',
      part: { id: 'text-1', messageID: 'message-1', text: 'Finished the task.' },
    }),
    tool: JSON.stringify({
      type: 'tool_use',
      sessionID: 'ses_opencode_1',
      part: {
        id: 'tool-1',
        tool: 'read',
        callID: 'call-1',
        state: {
          status: 'completed',
          input: { file_path: 'reports/opencode.json' },
          output: 'ok',
          metadata: { exit: 0 },
        },
      },
    }),
    usage: JSON.stringify({
      type: 'step_finish',
      sessionID: 'ses_opencode_1',
      part: { id: 'step-2', tokens: { input: 12, output: 5, reasoning: 2 } },
    }),
    malformed: '{not-json',
    artifactReference: 'reports/opencode.json',
  },
  {
    provider: 'claude-code',
    sessionId: 'ses_claude_1',
    session: JSON.stringify({ type: 'system', subtype: 'init', session_id: 'ses_claude_1' }),
    reasoning: JSON.stringify({ type: 'thinking_delta', uuid: 'reasoning-1', text: 'Inspect the current state.' }),
    message: JSON.stringify({
      type: 'assistant',
      uuid: 'message-1',
      message: { content: [{ type: 'text', text: 'Finished the task.' }] },
    }),
    tool: JSON.stringify({
      type: 'assistant',
      uuid: 'message-2',
      message: {
        content: [{ type: 'tool_use', id: 'call-1', name: 'Read', input: { file_path: 'reports/claude.json' } }],
      },
    }),
    usage: JSON.stringify({
      type: 'result',
      uuid: 'result-1',
      result: 'done',
      usage: { input_tokens: 12, cache_read_input_tokens: 3, output_tokens: 5 },
    }),
    malformed: '{not-json',
    artifactReference: 'reports/claude.json',
  },
];
