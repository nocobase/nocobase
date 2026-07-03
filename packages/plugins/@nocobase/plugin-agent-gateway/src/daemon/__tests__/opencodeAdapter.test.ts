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
});
