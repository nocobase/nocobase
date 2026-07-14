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
      args: ['-p', 'Build a page', '--output-format', 'stream-json', '--verbose'],
      cwd: '/workspace',
    });
    expect(() =>
      claudeCodeAdapter.buildResumeCommand({
        providerSessionId: 'session-1',
        message: 'Continue',
      }),
    ).toThrow('Claude-style resume is not supported');
  });

  it('builds terminal-friendly commands without stream-json output', () => {
    expect(
      claudeCodeAdapter.buildStartCommand({
        prompt: 'Build a page',
        cwd: '/workspace',
        outputMode: 'terminal',
      }),
    ).toMatchObject({
      args: ['-p', 'Build a page'],
      cwd: '/workspace',
    });
  });

  it.each([
    ['--permission-mode', 'bypassPermissions'],
    ['--add-dir', '/tmp'],
  ])('rejects permission-expanding local policy args before launch: %s', (...args) => {
    expect(() => claudeCodeAdapter.validatePolicyArgs(args)).toThrow(/forbidden argument/);
  });

  it('normalizes simple JSON events and ignores malformed lines', () => {
    expect(parseClaudeCodeJsonLine({ rawLine: '{not-json' })).toBeNull();
    expect(
      claudeCodeAdapter.normalizeEvent({
        rawLine: '{"type":"assistant","uuid":"evt-1","message":"Done"}',
      }),
    ).toEqual([
      {
        eventType: 'agent.message',
        level: 'info',
        providerEventId: 'evt-1',
        correlationId: 'evt-1',
        message: 'Done',
        payloadJson: {
          type: 'assistant',
          uuid: 'evt-1',
          message: 'Done',
          textKind: 'message',
          rawProviderEvent: {
            type: 'assistant',
            uuid: 'evt-1',
            message: 'Done',
          },
        },
      },
    ]);
  });

  it('keeps fallback reasoning and raw provider events instead of dropping them', () => {
    expect(
      claudeCodeAdapter.normalizeEvent({
        rawLine: '{"type":"thinking_delta","uuid":"evt-reasoning","text":"Need to inspect the page first"}',
      }),
    ).toEqual([
      {
        eventType: 'agent.reasoning',
        level: 'info',
        providerEventId: 'evt-reasoning',
        correlationId: 'evt-reasoning',
        message: 'Need to inspect the page first',
        payloadJson: {
          type: 'thinking_delta',
          uuid: 'evt-reasoning',
          text: 'Need to inspect the page first',
          textKind: 'reasoning',
          rawProviderEvent: {
            type: 'thinking_delta',
            uuid: 'evt-reasoning',
            text: 'Need to inspect the page first',
          },
        },
      },
    ]);

    expect(
      claudeCodeAdapter.normalizeEvent({
        rawLine: '{"type":"event","uuid":"evt-raw","payload":{"phase":"unknown"}}',
      }),
    ).toEqual([
      {
        eventType: 'agent.raw',
        level: 'info',
        providerEventId: 'evt-raw',
        correlationId: 'evt-raw',
        message: 'event',
        payloadJson: {
          type: 'event',
          uuid: 'evt-raw',
          payload: {
            phase: 'unknown',
          },
          textKind: 'raw',
          rawProviderEvent: {
            type: 'event',
            uuid: 'evt-raw',
            payload: {
              phase: 'unknown',
            },
          },
        },
      },
    ]);
  });
});
