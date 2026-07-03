/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { claudeCodeAdapter, parseClaudeCodeJsonLine } from '../adapters/claudeCode';

describe('Claude-style agent adapter', () => {
  it('declares conservative Claude-style capabilities', () => {
    expect(claudeCodeAdapter.provider).toBe('claude-code');
    expect(claudeCodeAdapter.capabilities).toMatchObject({
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
      claudeCodeAdapter.buildStartCommand({
        prompt: 'Build a page',
        cwd: '/workspace',
      }),
    ).toMatchObject({
      commandKey: 'claude-code',
      args: ['-p', 'Build a page', '--output-format', 'stream-json'],
      cwd: '/workspace',
    });
    expect(() =>
      claudeCodeAdapter.buildResumeCommand({
        providerSessionId: 'session-1',
        message: 'Continue',
      }),
    ).toThrow('Claude-style resume is not supported');
  });

  it('normalizes simple JSON events and ignores malformed lines', () => {
    expect(parseClaudeCodeJsonLine({ rawLine: '{not-json' })).toBeNull();
    expect(
      claudeCodeAdapter.normalizeEvent({
        rawLine: '{"type":"assistant","uuid":"evt-1","message":"Done"}',
      }),
    ).toEqual([
      {
        eventType: 'claude-code.assistant',
        level: 'info',
        providerEventId: 'evt-1',
        correlationId: 'evt-1',
        message: 'Done',
        payloadJson: {
          type: 'assistant',
          uuid: 'evt-1',
          message: 'Done',
        },
      },
    ]);
  });
});
