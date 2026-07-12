/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFile } from 'fs/promises';
import path from 'path';

import { codexAdapter, parseCodexJsonlLine } from '../adapters/codex';

describe('Codex agent adapter', () => {
  it('declares the initial Codex capabilities', () => {
    expect(codexAdapter.provider).toBe('codex');
    expect(codexAdapter.capabilities).toEqual({
      structuredEvents: true,
      terminalOutput: true,
      resumeSession: true,
      detectSessionId: true,
      resumeWithMessage: true,
      liveSemanticMessage: false,
      stdinMessage: false,
      interrupt: true,
      terminate: true,
      artifacts: true,
    });
  });

  it('builds start and resume commands as argv arrays', () => {
    expect(
      codexAdapter.buildStartCommand({
        prompt: 'Build a page',
        cwd: '/workspace',
      }),
    ).toMatchObject({
      commandKey: 'codex',
      args: ['exec', '--skip-git-repo-check', '--json', 'Build a page'],
      cwd: '/workspace',
    });
    expect(
      codexAdapter.buildResumeCommand({
        providerSessionId: '019f1e72-d75c-7c61-a9ba-cc99c653e0a2',
        message: 'Continue',
      }),
    ).toMatchObject({
      commandKey: 'codex',
      args: ['exec', 'resume', '--skip-git-repo-check', '--json', '019f1e72-d75c-7c61-a9ba-cc99c653e0a2', 'Continue'],
    });
  });

  it('uses terminal-friendly output only when terminal mode is explicitly requested', () => {
    expect(
      codexAdapter.buildStartCommand({
        prompt: 'Build a page',
        cwd: '/workspace',
        outputMode: 'terminal',
      }),
    ).toMatchObject({
      commandKey: 'codex',
      args: ['exec', '--skip-git-repo-check', 'Build a page'],
      cwd: '/workspace',
    });
    expect(
      codexAdapter.buildResumeCommand({
        providerSessionId: '019f1e72-d75c-7c61-a9ba-cc99c653e0a2',
        message: 'Continue',
        outputMode: 'terminal',
      }),
    ).toMatchObject({
      commandKey: 'codex',
      args: ['exec', 'resume', '--skip-git-repo-check', '019f1e72-d75c-7c61-a9ba-cc99c653e0a2', 'Continue'],
    });
  });

  it('keeps spaces, quotes, and newlines as one resume message argv element', () => {
    const message = 'Continue with spaces, "quotes", and a newline\nthen finish';
    const command = codexAdapter.buildResumeCommand({
      providerSessionId: '019f1e72-d75c-7c61-a9ba-cc99c653e0a2',
      message,
    });

    expect(command.args).toEqual([
      'exec',
      'resume',
      '--skip-git-repo-check',
      '--json',
      '019f1e72-d75c-7c61-a9ba-cc99c653e0a2',
      message,
    ]);
    expect(command.args.at(-1)).toBe(message);
  });

  it('detects session ids from valid thread.started JSONL', () => {
    expect(
      codexAdapter.detectSessionId({
        rawLine: '{"type":"thread.started","thread_id":"thread-1"}',
      }),
    ).toBe('thread-1');
  });

  it('detects session ids from terminal-friendly Codex output', () => {
    const providerSessionId = '019f2d69-1199-7212-a3de-82e3870de7f9';
    expect(
      codexAdapter.detectSessionId({
        rawLine: `session id: ${providerSessionId}`,
      }),
    ).toBe(providerSessionId);
    expect(
      codexAdapter.normalizeEvent({
        rawLine: `session id: ${providerSessionId}`,
      }),
    ).toEqual([
      {
        eventType: 'agent.session.started',
        level: 'info',
        providerEventId: `session.id:${providerSessionId}`,
        message: providerSessionId,
        payloadJson: {
          providerSessionId,
        },
      },
    ]);
  });

  it('detects session ids from the real captured local Codex JSONL sample', async () => {
    const fixture = await readFile(
      path.join(__dirname, '../../../test-fixtures/codex-real-exec-jsonl.sample.jsonl'),
      'utf8',
    );
    const providerSessionIds = fixture
      .split(/\r?\n/)
      .map((rawLine) => codexAdapter.detectSessionId({ rawLine }))
      .filter(Boolean);

    expect(providerSessionIds).toHaveLength(1);
    expect(providerSessionIds[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('ignores missing thread ids and malformed JSON safely', () => {
    expect(codexAdapter.detectSessionId({ rawLine: '{"type":"thread.started"}' })).toBeNull();
    expect(codexAdapter.detectSessionId({ rawLine: '{"type":"turn.started"}' })).toBeNull();
    expect(codexAdapter.detectSessionId({ rawLine: '{not-json' })).toBeNull();
    expect(parseCodexJsonlLine({ rawLine: '{not-json' })).toBeNull();
  });

  it('normalizes command execution and agent message events', () => {
    expect(
      codexAdapter.normalizeEvent({
        rawLine:
          '{"type":"item.completed","item":{"id":"item_1","type":"command_execution","command":"echo ok","aggregated_output":"ok\\n","exit_code":0,"status":"completed"}}',
      }),
    ).toEqual([
      {
        eventType: 'agent.command.completed',
        level: 'info',
        providerEventId: 'item.completed:item_1',
        correlationId: 'item_1',
        message: 'Command completed',
        payloadJson: {
          command: 'echo ok',
          output: 'ok\n',
          status: 'completed',
          exitCode: 0,
        },
      },
    ]);
    expect(
      codexAdapter.normalizeEvent({
        rawLine: '{"type":"item.completed","item":{"id":"item_2","type":"agent_message","text":"Done"}}',
      }),
    ).toEqual([
      {
        eventType: 'agent.message',
        level: 'info',
        providerEventId: 'item.completed:item_2',
        correlationId: 'item_2',
        message: 'Done',
        payloadJson: {
          itemId: 'item_2',
        },
      },
    ]);
    expect(
      codexAdapter.normalizeEvent({
        rawLine:
          '{"type":"item.started","item":{"id":"item_3","type":"command_execution","command":"echo SECRET","aggregated_output":"","exit_code":null,"status":"in_progress"}}',
      }),
    ).toEqual([
      {
        eventType: 'agent.command.started',
        level: 'info',
        providerEventId: 'item.started:item_3',
        correlationId: 'item_3',
        message: 'Command started',
        payloadJson: {
          command: 'echo SECRET',
          status: 'in_progress',
          exitCode: null,
        },
      },
    ]);
  });

  it('normalizes reasoning and unknown Codex JSONL as transcript events with raw payloads', () => {
    expect(
      codexAdapter.normalizeEvent({
        rawLine: JSON.stringify({
          type: 'item.completed',
          item: {
            id: 'reasoning-1',
            type: 'reasoning',
            summary: [
              {
                text: 'I need to inspect the current page first.',
              },
            ],
          },
        }),
      }),
    ).toEqual([
      {
        eventType: 'agent.reasoning',
        level: 'info',
        providerEventId: 'item.completed:reasoning-1',
        correlationId: 'reasoning-1',
        message: 'I need to inspect the current page first.',
        payloadJson: {
          itemId: 'reasoning-1',
          textKind: 'reasoning',
          rawProviderEvent: {
            type: 'item.completed',
            item: {
              id: 'reasoning-1',
              type: 'reasoning',
              summary: [
                {
                  text: 'I need to inspect the current page first.',
                },
              ],
            },
          },
        },
      },
    ]);

    expect(
      codexAdapter.normalizeEvent({
        rawLine: JSON.stringify({
          type: 'unexpected.event',
          id: 'raw-1',
          payload: {
            phase: 'not-yet-mapped',
          },
        }),
      }),
    ).toEqual([
      {
        eventType: 'agent.raw',
        level: 'debug',
        providerEventId: 'unexpected.event:raw-1',
        correlationId: 'raw-1',
        message: 'unexpected.event',
        payloadJson: {
          itemId: 'raw-1',
          providerEventType: 'unexpected.event',
          itemType: null,
          textKind: 'raw',
          rawProviderEvent: {
            type: 'unexpected.event',
            id: 'raw-1',
            payload: {
              phase: 'not-yet-mapped',
            },
          },
        },
      },
    ]);
  });

  it('keeps large command output in structured conversation events', () => {
    const largeOutput = 'x'.repeat(40 * 1024);

    expect(
      codexAdapter.normalizeEvent({
        rawLine: JSON.stringify({
          type: 'item.completed',
          item: {
            id: 'item_large_output',
            type: 'command_execution',
            command: 'node scripts/noisy-command.mjs',
            aggregated_output: largeOutput,
            exit_code: 0,
            status: 'completed',
          },
        }),
      }),
    ).toEqual([
      {
        eventType: 'agent.command.completed',
        level: 'info',
        providerEventId: 'item.completed:item_large_output',
        correlationId: 'item_large_output',
        message: 'Command completed',
        payloadJson: {
          command: 'node scripts/noisy-command.mjs',
          output: largeOutput,
          status: 'completed',
          exitCode: 0,
        },
      },
    ]);
  });

  it('normalizes Codex response item function calls and outputs with shared call ids', () => {
    expect(
      codexAdapter.normalizeEvent({
        rawLine: JSON.stringify({
          type: 'response_item',
          payload: {
            type: 'function_call',
            name: 'exec_command',
            arguments: '{"cmd":"rg --files packages/plugins/@nocobase/plugin-agent-gateway"}',
            call_id: 'call_exec_1',
          },
        }),
      }),
    ).toEqual([
      {
        eventType: 'agent.tool.started',
        level: 'info',
        providerEventId: 'response_item:function_call:call_exec_1',
        correlationId: 'call_exec_1',
        message: 'exec_command',
        payloadJson: {
          itemId: 'call_exec_1',
          callId: 'call_exec_1',
          toolName: 'exec_command',
          status: null,
          command: 'rg --files packages/plugins/@nocobase/plugin-agent-gateway',
          input: {
            cmd: 'rg --files packages/plugins/@nocobase/plugin-agent-gateway',
          },
          arguments: {
            cmd: 'rg --files packages/plugins/@nocobase/plugin-agent-gateway',
          },
        },
      },
    ]);

    expect(
      codexAdapter.normalizeEvent({
        rawLine: JSON.stringify({
          type: 'response_item',
          payload: {
            type: 'function_call_output',
            call_id: 'call_exec_1',
            output: 'packages/plugins/@nocobase/plugin-agent-gateway/src/daemon/adapters/codex.ts\n',
          },
        }),
      }),
    ).toEqual([
      {
        eventType: 'agent.tool.completed',
        level: 'info',
        providerEventId: 'response_item:function_call_output:call_exec_1',
        correlationId: 'call_exec_1',
        message: 'function_call_output',
        payloadJson: {
          itemId: 'call_exec_1',
          callId: 'call_exec_1',
          toolName: 'function_call_output',
          status: null,
          output: 'packages/plugins/@nocobase/plugin-agent-gateway/src/daemon/adapters/codex.ts\n',
        },
      },
    ]);
  });

  it('extracts command details from nested developer tool arguments', () => {
    const argumentsRecord = {
      tool_uses: [
        {
          recipient_name: 'functions.exec_command',
          parameters: {
            cmd: 'node scripts/run-suite.mjs --tasks tasks.yaml',
            workdir: '/root/work/myskills/skills/nb-opencode-ui-batch',
          },
        },
      ],
    };

    expect(
      codexAdapter.normalizeEvent({
        rawLine: JSON.stringify({
          type: 'response_item',
          payload: {
            type: 'function_call',
            name: 'multi_tool_use.parallel',
            arguments: JSON.stringify(argumentsRecord),
            call_id: 'call_parallel_1',
          },
        }),
      }),
    ).toEqual([
      {
        eventType: 'agent.tool.started',
        level: 'info',
        providerEventId: 'response_item:function_call:call_parallel_1',
        correlationId: 'call_parallel_1',
        message: 'multi_tool_use.parallel',
        payloadJson: {
          itemId: 'call_parallel_1',
          callId: 'call_parallel_1',
          toolName: 'multi_tool_use.parallel',
          status: null,
          command: 'node scripts/run-suite.mjs --tasks tasks.yaml',
          input: argumentsRecord,
          arguments: argumentsRecord,
        },
      },
    ]);
  });

  it('carries structured participant metadata for child agent messages and tools', () => {
    expect(
      codexAdapter.normalizeEvent({
        rawLine:
          '{"type":"item.completed","item":{"id":"item_child_1","type":"agent_message","text":"hi","participant":{"id":"sub-agent:aquinas","type":"sub-agent","name":"Aquinas","parentId":"agent:root"}}}',
      }),
    ).toEqual([
      {
        eventType: 'agent.message',
        level: 'info',
        providerEventId: 'item.completed:item_child_1',
        correlationId: 'item_child_1',
        message: 'hi',
        payloadJson: {
          itemId: 'item_child_1',
          participant: {
            id: 'sub-agent:aquinas',
            type: 'sub-agent',
            name: 'Aquinas',
            parentId: 'agent:root',
          },
        },
      },
    ]);
    expect(
      codexAdapter.normalizeEvent({
        rawLine:
          '{"type":"item.completed","item":{"id":"tool_spawn_1","type":"tool_call","name":"SpawnAgent","status":"completed","agent":{"name":"Agent","type":"root-agent"}}}',
      }),
    ).toEqual([
      {
        eventType: 'agent.tool.completed',
        level: 'info',
        providerEventId: 'item.completed:tool_spawn_1',
        correlationId: 'tool_spawn_1',
        message: 'SpawnAgent',
        payloadJson: {
          itemId: 'tool_spawn_1',
          toolName: 'SpawnAgent',
          status: 'completed',
          participant: {
            name: 'Agent',
            type: 'root-agent',
          },
        },
      },
    ]);
  });

  it('normalizes Codex collab tool events with child agent state', () => {
    expect(
      codexAdapter.normalizeEvent({
        rawLine:
          '{"type":"item.completed","item":{"id":"item_spawn","type":"collab_tool_call","tool":"spawn_agent","sender_thread_id":"root-thread","receiver_thread_ids":["child-thread-a"],"prompt":"Your name is Aquinas. Reply with exactly one line: hi.","agents_states":{"child-thread-a":{"status":"pending_init","message":null}},"status":"completed"}}',
      }),
    ).toEqual([
      {
        eventType: 'agent.tool.completed',
        level: 'info',
        providerEventId: 'item.completed:item_spawn',
        correlationId: 'item_spawn',
        message: 'spawn_agent',
        payloadJson: {
          itemId: 'item_spawn',
          toolName: 'spawn_agent',
          status: 'completed',
          collab: {
            tool: 'spawn_agent',
            senderThreadId: 'root-thread',
            receiverThreadIds: ['child-thread-a'],
            prompt: 'Your name is Aquinas. Reply with exactly one line: hi.',
            spawnedAgentName: 'Aquinas',
            agents: [
              {
                threadId: 'child-thread-a',
                status: 'pending_init',
                message: null,
              },
            ],
          },
        },
      },
    ]);

    expect(
      codexAdapter.normalizeEvent({
        rawLine:
          '{"type":"item.completed","item":{"id":"item_wait","type":"collab_tool_call","tool":"wait","sender_thread_id":"root-thread","receiver_thread_ids":["child-thread-a"],"agents_states":{"child-thread-a":{"status":"completed","message":"hi"}},"status":"completed"}}',
      }),
    ).toEqual([
      {
        eventType: 'agent.tool.completed',
        level: 'info',
        providerEventId: 'item.completed:item_wait',
        correlationId: 'item_wait',
        message: 'wait',
        payloadJson: {
          itemId: 'item_wait',
          toolName: 'wait',
          status: 'completed',
          collab: {
            tool: 'wait',
            senderThreadId: 'root-thread',
            receiverThreadIds: ['child-thread-a'],
            prompt: null,
            spawnedAgentName: null,
            agents: [
              {
                threadId: 'child-thread-a',
                status: 'completed',
                message: 'hi',
              },
            ],
          },
        },
      },
    ]);
  });
});
