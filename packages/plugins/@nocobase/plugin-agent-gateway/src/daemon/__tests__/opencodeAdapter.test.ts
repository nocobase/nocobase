/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { opencodeAdapter, parseOpenCodeJsonLine } from '../adapters/opencode';

describe('OpenCode agent adapter', () => {
  it('declares conservative OpenCode capabilities', () => {
    expect(opencodeAdapter.provider).toBe('opencode');
    expect(opencodeAdapter.capabilities).toMatchObject({
      structuredEvents: true,
      terminalOutput: true,
      resumeSession: false,
      liveSemanticMessage: false,
      stdinMessage: false,
      interrupt: true,
      terminate: true,
      artifacts: true,
      resumeWithMessage: false,
    });
  });

  it('builds a start command and rejects resume', () => {
    expect(
      opencodeAdapter.buildStartCommand({
        prompt: 'Build a page',
        cwd: '/workspace',
      }),
    ).toMatchObject({
      commandKey: 'opencode',
      args: ['run', '--format', 'json', 'Build a page'],
      cwd: '/workspace',
    });
    expect(() =>
      opencodeAdapter.buildResumeCommand({
        providerSessionId: 'session-1',
        message: 'Continue',
      }),
    ).toThrow('OpenCode resume is not supported');
  });

  it('builds terminal-friendly commands with the formatted default output', () => {
    expect(
      opencodeAdapter.buildStartCommand({
        prompt: 'Build a page',
        cwd: '/workspace',
        outputMode: 'terminal',
      }),
    ).toMatchObject({
      commandKey: 'opencode',
      args: ['run', 'Build a page'],
      cwd: '/workspace',
    });
  });

  it('normalizes simple JSON events and ignores malformed lines', () => {
    expect(parseOpenCodeJsonLine({ rawLine: '{not-json' })).toBeNull();
    expect(
      opencodeAdapter.normalizeEvent({
        rawLine: '{"type":"message","id":"evt-1","message":"Done"}',
      }),
    ).toEqual([
      {
        eventType: 'opencode.message',
        level: 'info',
        providerEventId: 'evt-1',
        correlationId: 'evt-1',
        message: 'Done',
        payloadJson: {
          type: 'message',
          id: 'evt-1',
          message: 'Done',
        },
      },
    ]);
  });

  it('normalizes OpenCode text and step events into agent transcript events', () => {
    expect(
      opencodeAdapter.normalizeEvent({
        rawLine: JSON.stringify({
          type: 'text',
          timestamp: 1783179088364,
          sessionID: 'ses_1',
          part: {
            id: 'prt_text_1',
            messageID: 'msg_1',
            type: 'text',
            text: 'Page created successfully. Let me verify the result.',
          },
        }),
      }),
    ).toEqual([
      {
        eventType: 'agent.message',
        level: 'info',
        providerEventId: 'text:prt_text_1',
        correlationId: 'msg_1',
        message: 'Page created successfully. Let me verify the result.',
        payloadJson: {
          itemId: 'prt_text_1',
          sessionId: 'ses_1',
        },
      },
    ]);

    expect(
      opencodeAdapter.normalizeEvent({
        rawLine: JSON.stringify({
          type: 'step_start',
          sessionID: 'ses_1',
          part: {
            id: 'prt_step_1',
            messageID: 'msg_1',
          },
        }),
      }),
    ).toEqual([
      {
        eventType: 'agent.turn.started',
        level: 'info',
        providerEventId: 'step_start:prt_step_1',
        correlationId: 'msg_1',
        message: 'step_start',
        payloadJson: {
          type: 'step_start',
          sessionID: 'ses_1',
          part: {
            id: 'prt_step_1',
            messageID: 'msg_1',
          },
        },
      },
    ]);
  });

  it('normalizes OpenCode tool_use events with command, output, and status details', () => {
    expect(
      opencodeAdapter.normalizeEvent({
        rawLine: JSON.stringify({
          type: 'tool_use',
          sessionID: 'ses_1',
          part: {
            type: 'tool',
            tool: 'bash',
            callID: 'call_1',
            id: 'prt_tool_1',
            state: {
              status: 'completed',
              input: {
                command: 'nb api flow-surfaces get --page-schema-uid page-1 -j',
                description: 'Verify page structure',
              },
              output: 'Page OK',
              metadata: {
                output: 'Page OK',
                exit: 0,
                truncated: false,
              },
              time: {
                start: 1783178595689,
                end: 1783178595701,
              },
            },
          },
        }),
      }),
    ).toEqual([
      {
        eventType: 'agent.tool.completed',
        level: 'info',
        providerEventId: 'tool_use:call_1',
        correlationId: 'call_1',
        message: 'bash',
        payloadJson: {
          itemId: 'prt_tool_1',
          callId: 'call_1',
          toolName: 'bash',
          status: 'succeeded',
          command: 'nb api flow-surfaces get --page-schema-uid page-1 -j',
          input: {
            command: 'nb api flow-surfaces get --page-schema-uid page-1 -j',
            description: 'Verify page structure',
          },
          output: 'Page OK',
          exitCode: 0,
          durationMs: 12,
          metadata: {
            output: 'Page OK',
            exit: 0,
            truncated: false,
          },
        },
      },
    ]);
  });
});
