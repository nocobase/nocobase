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
});
