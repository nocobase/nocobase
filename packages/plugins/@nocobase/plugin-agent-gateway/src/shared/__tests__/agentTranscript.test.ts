/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { buildAgentTranscript } from '../agentTranscript';

describe('agent transcript parser', () => {
  it('merges terminal-live chunks into one agent turn and folds parsed tool calls', () => {
    const transcript = buildAgentTranscript([
      {
        id: 'user-1',
        eventType: 'agent.user.message',
        source: 'codex',
        sequence: 1,
        contentText: 'Build a page',
        createdAt: '2026-07-05T01:00:00.000Z',
      },
      {
        id: 'live-1',
        eventType: 'agent.message',
        source: 'terminal-live',
        sequence: 2,
        contentText: 'I will inspect the app first.\n\nexec\n',
        createdAt: '2026-07-05T01:00:01.000Z',
      },
      {
        id: 'live-2',
        eventType: 'agent.message',
        source: 'terminal-live',
        sequence: 3,
        contentText: 'rg "AgentTimeline" packages/plugins\nsucceeded in 42ms\n\nNow I can update the UI.',
        createdAt: '2026-07-05T01:00:02.000Z',
      },
    ]);

    expect(transcript.messages).toHaveLength(2);
    expect(transcript.messages[0]).toMatchObject({
      role: 'user',
      text: 'Build a page',
    });
    expect(transcript.messages[1].role).toBe('agent');
    expect(transcript.messages[1].text).toContain('I will inspect the app first.');
    expect(transcript.messages[1].text).toContain('Now I can update the UI.');
    expect(transcript.messages[1].toolCalls).toHaveLength(1);
    expect(transcript.messages[1].parts.map((part) => part.type)).toEqual(['text', 'tool-calls', 'text']);
    expect(transcript.messages[1].parts[0]).toMatchObject({
      type: 'text',
      text: 'I will inspect the app first.',
    });
    expect(transcript.messages[1].parts[1]).toMatchObject({
      type: 'tool-calls',
      toolCalls: [
        expect.objectContaining({
          command: 'rg "AgentTimeline" packages/plugins',
        }),
      ],
    });
    expect(transcript.messages[1].parts[2]).toMatchObject({
      type: 'text',
      text: 'Now I can update the UI.',
    });
    expect(transcript.messages[1].toolCalls[0]).toMatchObject({
      kind: 'exec',
      status: 'succeeded',
      command: 'rg "AgentTimeline" packages/plugins',
      durationText: '42ms',
    });
  });

  it('keeps consecutive explicit command events inside the surrounding agent turn', () => {
    const transcript = buildAgentTranscript([
      {
        id: 'message-1',
        eventType: 'agent.message',
        source: 'codex',
        sequence: 1,
        contentText: 'Starting checks',
      },
      {
        id: 'command-1',
        eventType: 'agent.command.completed',
        source: 'codex',
        sequence: 2,
        contentText: 'Command completed',
        contentJson: {
          status: 'succeeded',
          exitCode: 0,
        },
      },
      {
        id: 'command-2',
        eventType: 'agent.command.completed',
        source: 'codex',
        sequence: 3,
        contentText: 'Command failed',
        contentJson: {
          status: 'failed',
          exitCode: 1,
        },
      },
    ]);

    expect(transcript.messages).toHaveLength(1);
    expect(transcript.messages[0].toolCalls).toHaveLength(2);
    expect(transcript.messages[0].parts.map((part) => part.type)).toEqual(['text', 'tool-calls']);
    expect(transcript.messages[0].parts[1]).toMatchObject({
      type: 'tool-calls',
      toolCalls: [
        expect.objectContaining({
          status: 'succeeded',
        }),
        expect.objectContaining({
          status: 'failed',
        }),
      ],
    });
    expect(transcript.stats).toMatchObject({
      total: 2,
      succeeded: 1,
      failed: 1,
    });
    expect(transcript.stats.byKind.exec).toMatchObject({
      total: 2,
      failed: 1,
    });
  });

  it('merges explicit command start and completion events by correlation id', () => {
    const transcript = buildAgentTranscript([
      {
        id: 'message-1',
        eventType: 'agent.message',
        source: 'codex',
        sequence: 1,
        contentText: 'Running the suite',
      },
      {
        id: 'command-start',
        eventType: 'agent.command.started',
        source: 'codex',
        sequence: 2,
        providerEventId: 'item.started:item-1',
        correlationId: 'item-1',
        contentText: 'Command started',
        contentJson: {
          status: 'in_progress',
          command: 'node scripts/run-suite.mjs --tasks tasks.yaml',
        },
      },
      {
        id: 'command-complete',
        eventType: 'agent.command.completed',
        source: 'codex',
        sequence: 3,
        providerEventId: 'item.completed:item-1',
        correlationId: 'item-1',
        contentText: 'Command completed',
        contentJson: {
          status: 'completed',
          command: 'node scripts/run-suite.mjs --tasks tasks.yaml',
          aggregated_output: 'Suite completed: 12/12 tasks passed.',
          exitCode: 0,
          durationMs: 61000,
        },
      },
    ]);

    expect(transcript.messages).toHaveLength(1);
    expect(transcript.messages[0].toolCalls).toHaveLength(1);
    expect(transcript.messages[0].toolCalls[0]).toMatchObject({
      status: 'succeeded',
      command: 'node scripts/run-suite.mjs --tasks tasks.yaml',
      output: 'Suite completed: 12/12 tasks passed.',
      exitCode: 0,
      durationMs: 61000,
      eventIds: ['command-start', 'command-complete'],
    });
    expect(transcript.stats).toMatchObject({
      total: 1,
      running: 0,
      succeeded: 1,
    });
  });

  it('extracts nested tool input and output and merges by call id', () => {
    const transcript = buildAgentTranscript([
      {
        id: 'tool-start',
        eventType: 'agent.tool.started',
        source: 'codex',
        sequence: 1,
        providerEventId: 'response_item:function_call:call-1',
        contentText: 'exec_command',
        contentJson: {
          callId: 'call-1',
          toolName: 'exec_command',
          arguments: '{"cmd":"rg --files packages/plugins/@nocobase/plugin-agent-gateway"}',
        },
      },
      {
        id: 'tool-output',
        eventType: 'agent.tool.completed',
        source: 'codex',
        sequence: 2,
        providerEventId: 'response_item:function_call_output:call-1',
        contentText: 'function_call_output',
        contentJson: {
          callId: 'call-1',
          output: 'packages/plugins/@nocobase/plugin-agent-gateway/src/shared/agentTranscript.ts',
        },
      },
    ]);

    expect(transcript.messages).toHaveLength(1);
    expect(transcript.messages[0].toolCalls).toHaveLength(1);
    expect(transcript.messages[0].toolCalls[0]).toMatchObject({
      kind: 'exec',
      status: 'succeeded',
      command: 'rg --files packages/plugins/@nocobase/plugin-agent-gateway',
      input: '{"cmd":"rg --files packages/plugins/@nocobase/plugin-agent-gateway"}',
      output: 'packages/plugins/@nocobase/plugin-agent-gateway/src/shared/agentTranscript.ts',
      eventIds: ['tool-start', 'tool-output'],
    });
    expect(transcript.stats).toMatchObject({
      running: 0,
      succeeded: 1,
    });
  });

  it('updates a running tool after participant changes split the timeline', () => {
    const transcript = buildAgentTranscript([
      {
        id: 'tool-start',
        eventType: 'agent.tool.started',
        source: 'codex',
        sequence: 1,
        correlationId: 'call-1',
        contentText: 'exec_command',
        contentJson: {
          toolName: 'exec_command',
          command: 'npm test',
        },
      },
      {
        id: 'child-message',
        eventType: 'agent.message',
        source: 'codex',
        sequence: 2,
        contentText: 'hi',
        contentJson: {
          participant: {
            id: 'sub-agent:aquinas',
            type: 'sub-agent',
            name: 'Aquinas',
          },
        },
      },
      {
        id: 'tool-output',
        eventType: 'agent.tool.completed',
        source: 'codex',
        sequence: 3,
        correlationId: 'call-1',
        contentText: 'function_call_output',
        contentJson: {
          output: 'PASS',
        },
      },
    ]);

    expect(transcript.toolCalls).toHaveLength(1);
    expect(transcript.toolCalls[0]).toMatchObject({
      status: 'succeeded',
      command: 'npm test',
      output: 'PASS',
      eventIds: ['tool-start', 'tool-output'],
    });
    expect(transcript.stats.running).toBe(0);
    expect(transcript.stats.succeeded).toBe(1);
  });

  it('keeps raw details for running tool calls with no parsed command details', () => {
    const transcript = buildAgentTranscript([
      {
        id: 'tool-start',
        eventType: 'agent.tool.started',
        source: 'codex',
        sequence: 1,
        correlationId: 'call-unknown',
        contentText: 'unknown_tool',
        contentJson: {
          callId: 'call-unknown',
          toolName: 'unknown_tool',
          status: 'running',
        },
      },
    ]);

    expect(transcript.toolCalls).toHaveLength(1);
    expect(transcript.toolCalls[0]).toMatchObject({
      status: 'running',
      details: JSON.stringify(
        {
          eventType: 'agent.tool.started',
          source: 'codex',
          correlationId: 'call-unknown',
          contentText: 'unknown_tool',
          contentJson: {
            callId: 'call-unknown',
            toolName: 'unknown_tool',
            status: 'running',
          },
        },
        null,
        2,
      ),
    });
  });

  it('keeps event metadata when an explicit tool call has no command payload', () => {
    const transcript = buildAgentTranscript([
      {
        id: 'tool-start-empty',
        eventType: 'agent.tool.started',
        source: 'codex',
        sequence: 1,
        providerEventId: 'item.started:item-empty',
        correlationId: 'item-empty',
        contentText: 'Tool started',
      },
    ]);

    expect(transcript.toolCalls).toHaveLength(1);
    expect(transcript.toolCalls[0]).toMatchObject({
      status: 'running',
      details: JSON.stringify(
        {
          eventType: 'agent.tool.started',
          source: 'codex',
          providerEventId: 'item.started:item-empty',
          correlationId: 'item-empty',
          contentText: 'Tool started',
        },
        null,
        2,
      ),
    });
  });

  it('closes dangling running tool calls when the turn or run has ended', () => {
    const events = [
      {
        id: 'tool-start',
        eventType: 'agent.tool.started',
        source: 'codex',
        sequence: 1,
        correlationId: 'call-no-output',
        contentText: 'exec_command',
        contentJson: {
          callId: 'call-no-output',
          toolName: 'exec_command',
          arguments: '{"cmd":"node scripts/no-completion.mjs"}',
          status: 'running',
        },
      },
    ];

    expect(buildAgentTranscript(events).toolCalls[0]).toMatchObject({
      status: 'running',
      command: 'node scripts/no-completion.mjs',
    });
    expect(buildAgentTranscript(events, { closeDanglingToolCalls: true }).toolCalls[0]).toMatchObject({
      status: 'unknown',
      command: 'node scripts/no-completion.mjs',
    });

    const transcript = buildAgentTranscript([
      ...events,
      {
        id: 'turn-complete',
        eventType: 'agent.turn.completed',
        source: 'codex',
        sequence: 2,
        contentText: 'turn.completed',
      },
    ]);
    expect(transcript.toolCalls[0]).toMatchObject({
      status: 'unknown',
      command: 'node scripts/no-completion.mjs',
    });
  });

  it('extracts nested command details from parallel tool uses', () => {
    const transcript = buildAgentTranscript([
      {
        id: 'tool-start',
        eventType: 'agent.tool.started',
        source: 'codex',
        sequence: 1,
        correlationId: 'call-parallel',
        contentText: 'multi_tool_use.parallel',
        contentJson: {
          callId: 'call-parallel',
          toolName: 'multi_tool_use.parallel',
          arguments: {
            tool_uses: [
              {
                recipient_name: 'functions.exec_command',
                parameters: {
                  cmd: 'node scripts/run-suite.mjs --tasks tasks.yaml',
                  workdir: '/root/work/myskills/skills/nb-opencode-ui-batch',
                },
              },
            ],
          },
        },
      },
    ]);

    expect(transcript.toolCalls[0]).toMatchObject({
      command: 'node scripts/run-suite.mjs --tasks tasks.yaml',
      input: JSON.stringify(
        {
          tool_uses: [
            {
              recipient_name: 'functions.exec_command',
              parameters: {
                cmd: 'node scripts/run-suite.mjs --tasks tasks.yaml',
                workdir: '/root/work/myskills/skills/nb-opencode-ui-batch',
              },
            },
          ],
        },
        null,
        2,
      ),
    });
  });

  it('recognizes wait and terminal blocks from live terminal text', () => {
    const transcript = buildAgentTranscript([
      {
        id: 'live-1',
        eventType: 'agent.message',
        source: 'terminal-live',
        sequence: 1,
        contentText: 'Waited for background task for 2s\nTerminal\nserver ready\n',
      },
    ]);

    expect(transcript.toolCalls.map((toolCall) => toolCall.kind)).toEqual(['wait', 'terminal']);
    expect(transcript.stats.total).toBe(2);
  });

  it('returns to agent prose after a terminal tool block and blank line', () => {
    const transcript = buildAgentTranscript([
      {
        id: 'live-1',
        eventType: 'agent.message',
        source: 'terminal-live',
        sequence: 1,
        contentText: 'live task output is visible before completion\n\nexec\n',
      },
      {
        id: 'live-2',
        eventType: 'agent.message',
        source: 'terminal-live',
        sequence: 2,
        contentText:
          'yarn test packages/plugins/@nocobase/plugin-agent-gateway/src/shared/__tests__/agentTranscript.test.ts\nsucceeded in 5ms\n\nlive task still running',
      },
    ]);

    expect(transcript.messages[0].text).toContain('live task output is visible before completion');
    expect(transcript.messages[0].text).toContain('live task still running');
    expect(transcript.messages[0].parts.map((part) => part.type)).toEqual(['text', 'tool-calls', 'text']);
    expect(transcript.messages[0].toolCalls[0]).toMatchObject({
      kind: 'exec',
      status: 'succeeded',
    });
  });

  it('filters Codex terminal prompt echo before parsing live tool calls', () => {
    const transcript = buildAgentTranscript([
      {
        id: 'user-1',
        eventType: 'agent.user.message',
        source: 'agent-gateway-task',
        sequence: 0,
        contentText: 'Run the uploaded skill harness.',
      },
      {
        id: 'live-1',
        eventType: 'agent.message',
        source: 'terminal-live',
        sequence: 1,
        contentText: [
          'OpenAI Codex v0.142.5',
          '--------',
          'workdir: /root/work/nocobase',
          'model: gpt-5.5',
          'session id: 019f314c-d246-74c0-8c76-ca7665b567ad',
          '--------',
          'user',
          'Run the uploaded nb-opencode-ui-batch Agent Gateway skill harness.',
          'Instruction:',
          'Run a minimal real nb-opencode-ui-batch smoke from the uploaded skill installation.',
          'Custom Agent Gateway skills installed for this run:',
          '- skill-id: /root/.agent-gateway-daemon/skills/skill-id/SKILL.md',
          'Read and follow the relevant SKILL.md before executing the task when applicable.',
          'deprecated: [features].codex_hooks is deprecated.',
          'Enable it with --enable hooks.',
          '**Considering memory use**',
        ].join('\n'),
      },
    ]);

    expect(transcript.messages).toHaveLength(2);
    expect(transcript.messages[1].text).toBe('**Considering memory use**');
    expect(transcript.messages[1].toolCalls).toHaveLength(0);
  });

  it('suppresses redacted Codex JSONL and gateway terminal exit lines', () => {
    const transcript = buildAgentTranscript([
      {
        id: 'live-json',
        eventType: 'agent.message',
        source: 'terminal-live',
        sequence: 1,
        contentText: '{"type":"turn.completed","usage":{"input_tokens":[REDACTED],"cached_input_tokens":[REDACTED]}}\n',
      },
      {
        id: 'live-exit',
        eventType: 'agent.message',
        source: 'terminal-live',
        sequence: 2,
        contentText: '[agent-gateway] process exited with code 0\n',
      },
    ]);

    expect(transcript.messages).toHaveLength(0);
  });

  it('does not treat prose that starts with tool as a generic tool call', () => {
    const transcript = buildAgentTranscript([
      {
        id: 'live-1',
        eventType: 'agent.message',
        source: 'terminal-live',
        sequence: 1,
        contentText: [
          '- Tool failure analysis must read existing per-attempt artifacts only.',
          '- When OpenCode bash fails, show both layers as evidence.',
          '',
          'tool',
          'view_image(path=/tmp/screenshot.png)',
        ].join('\n'),
      },
    ]);

    expect(transcript.messages[0].text).toContain('Tool failure analysis');
    expect(transcript.messages[0].toolCalls).toHaveLength(1);
    expect(transcript.messages[0].toolCalls[0]).toMatchObject({
      kind: 'tool',
      command: 'view_image(path=/tmp/screenshot.png)',
    });
  });

  it('splits terminal-only child agent replies into independent participants', () => {
    const transcript = buildAgentTranscript([
      {
        id: 'user-1',
        eventType: 'agent.user.message',
        source: 'agent-gateway-task',
        sequence: 1,
        contentText: '启动 2 个子 agent 分别说一句 hi',
      },
      {
        id: 'live-1',
        eventType: 'agent.message',
        source: 'terminal-live',
        sequence: 2,
        contentText: [
          '**Spawning subagents**',
          '',
          'I will start two child agents.',
          'collab: SpawnAgent',
          'collab: SpawnAgent',
          'collab: Wait',
          'Aquinas: hi',
          'Bacon: hi',
        ].join('\n'),
      },
    ]);

    expect(transcript.participants.map((participant) => [participant.id, participant.type, participant.name])).toEqual(
      expect.arrayContaining([
        ['user:requester', 'user', 'You'],
        ['agent:root', 'root-agent', 'Agent'],
        ['sub-agent:aquinas', 'sub-agent', 'Aquinas'],
        ['sub-agent:bacon', 'sub-agent', 'Bacon'],
      ]),
    );
    expect(
      transcript.messages.map((message) => [message.participant.type, message.participant.name, message.text]),
    ).toEqual([
      ['user', 'You', '启动 2 个子 agent 分别说一句 hi'],
      ['root-agent', 'Agent', '**Spawning subagents**\n\nI will start two child agents.'],
      ['sub-agent', 'Aquinas', 'hi'],
      ['sub-agent', 'Bacon', 'hi'],
    ]);
    expect(transcript.messages[1].toolCalls.map((toolCall) => toolCall.title)).toEqual([
      'SpawnAgent',
      'SpawnAgent',
      'Wait',
    ]);
  });

  it('keeps ordinary terminal summary labels on the root agent message', () => {
    const transcript = buildAgentTranscript([
      {
        id: 'live-1',
        eventType: 'agent.message',
        source: 'terminal-live',
        sequence: 1,
        contentText: ['Summary: created two child agents.', 'Result: both replied hi.'].join('\n'),
      },
    ]);

    expect(transcript.participants.map((participant) => [participant.type, participant.name])).toEqual([
      ['root-agent', 'Agent'],
    ]);
    expect(transcript.messages.map((message) => [message.participant.type, message.text])).toEqual([
      ['root-agent', 'Summary: created two child agents.\nResult: both replied hi.'],
    ]);
  });

  it('uses structured participant metadata from provider events', () => {
    const transcript = buildAgentTranscript([
      {
        id: 'root-1',
        eventType: 'agent.message',
        source: 'codex',
        sequence: 1,
        contentText: 'Main agent started.',
      },
      {
        id: 'child-1',
        eventType: 'agent.message',
        source: 'codex',
        sequence: 2,
        contentText: 'hi',
        contentJson: {
          participant: {
            id: 'sub-agent:aquinas',
            type: 'sub-agent',
            name: 'Aquinas',
            parentId: 'agent:root',
            provider: 'codex',
          },
        },
      },
    ]);

    expect(transcript.messages).toHaveLength(2);
    expect(transcript.messages[0]).toMatchObject({
      participantId: 'agent:root',
      text: 'Main agent started.',
    });
    expect(transcript.messages[1]).toMatchObject({
      participantId: 'sub-agent:aquinas',
      text: 'hi',
      participant: {
        type: 'sub-agent',
        name: 'Aquinas',
        parentId: 'agent:root',
        provider: 'codex',
      },
    });
  });

  it('turns Codex collab wait results into child agent transcript messages', () => {
    const transcript = buildAgentTranscript([
      {
        id: 'user-1',
        eventType: 'agent.user.message',
        source: 'agent-gateway-task',
        sequence: 1,
        contentText: '启动两个子 agent 分别说 hi',
      },
      {
        id: 'spawn-aquinas',
        eventType: 'agent.tool.completed',
        source: 'codex',
        sequence: 2,
        contentText: 'spawn_agent',
        contentJson: {
          itemId: 'spawn-aquinas',
          toolName: 'spawn_agent',
          status: 'completed',
          collab: {
            tool: 'spawn_agent',
            receiverThreadIds: ['thread-aquinas'],
            spawnedAgentName: 'Aquinas',
          },
        },
      },
      {
        id: 'spawn-bacon',
        eventType: 'agent.tool.completed',
        source: 'codex',
        sequence: 3,
        contentText: 'spawn_agent',
        contentJson: {
          itemId: 'spawn-bacon',
          toolName: 'spawn_agent',
          status: 'completed',
          collab: {
            tool: 'spawn_agent',
            receiverThreadIds: ['thread-bacon'],
            spawnedAgentName: 'Bacon',
          },
        },
      },
      {
        id: 'wait-children',
        eventType: 'agent.tool.completed',
        source: 'codex',
        sequence: 4,
        contentText: 'wait',
        contentJson: {
          itemId: 'wait-children',
          toolName: 'wait',
          status: 'completed',
          collab: {
            tool: 'wait',
            receiverThreadIds: ['thread-aquinas', 'thread-bacon'],
            agents: [
              {
                threadId: 'thread-aquinas',
                status: 'completed',
                message: 'hi',
              },
              {
                threadId: 'thread-bacon',
                status: 'completed',
                message: 'hi',
              },
            ],
          },
        },
      },
      {
        id: 'root-final',
        eventType: 'agent.message',
        source: 'codex',
        sequence: 5,
        contentText: 'done',
      },
    ]);

    expect(transcript.participants.map((participant) => [participant.id, participant.type, participant.name])).toEqual(
      expect.arrayContaining([
        ['sub-agent:aquinas', 'sub-agent', 'Aquinas'],
        ['sub-agent:bacon', 'sub-agent', 'Bacon'],
      ]),
    );
    expect(transcript.messages.map((message) => [message.participant.name, message.text])).toEqual([
      ['You', '启动两个子 agent 分别说 hi'],
      ['Agent', ''],
      ['Aquinas', 'hi'],
      ['Bacon', 'hi'],
      ['Agent', 'done'],
    ]);
    expect(transcript.messages[1].toolCalls.map((toolCall) => toolCall.title)).toEqual([
      'spawn_agent',
      'spawn_agent',
      'wait',
    ]);
  });
});
