import { describe, expect, it } from 'vitest';

import { classifyClaudeFailure } from '../../src/agent/adapters/classify.ts';
import type { ClaudeFailureSignal } from '../../src/agent/adapters/classify.ts';
import type { FailureReason } from '../../src/agent/adapters/types.ts';

const abortError = Object.assign(
  new Error('Claude Code process aborted by user'),
  { name: 'AbortError' },
);

const cases: [string, ClaudeFailureSignal, FailureReason][] = [
  ['an abort', { aborted: true }, 'cancelled'],
  ['an AbortError', { error: abortError }, 'cancelled'],
  [
    'a known startup failure',
    { startupFailureReason: 'gateway_signin_required' },
    'toolAuth',
  ],
  [
    'an unknown startup failure',
    { startupFailureReason: 'cli_version_too_old' },
    'toolProcess',
  ],
  ['a missing cwd', { startupFailureReason: 'cwd_unavailable' }, 'setupFailed'],
  [
    'a context overflow',
    { terminalReason: 'prompt_too_long' },
    'contextOverflow',
  ],
  [
    'an auth error code',
    { assistantError: 'authentication_failed' },
    'toolAuth',
  ],
  ['a billing error code', { assistantError: 'billing_error' }, 'toolQuota'],
  ['a rate limit code', { assistantError: 'rate_limit' }, 'toolRateLimit'],
  ['an overload code', { assistantError: 'overloaded' }, 'toolNetwork'],
  ['a 401 status', { apiErrorStatus: 401 }, 'toolAuth'],
  ['a 429 status', { apiErrorStatus: 429 }, 'toolRateLimit'],
  ['a 529 status', { apiErrorStatus: 529 }, 'toolNetwork'],
  ['a budget stop', { resultSubtype: 'error_max_budget_usd' }, 'toolQuota'],
  [
    'a login message',
    { resultErrors: ['Not logged in · Please run /login'] },
    'toolAuth',
  ],
  [
    'a quota message',
    { resultErrors: ['Your credit balance is too low'] },
    'toolQuota',
  ],
  [
    'a network error',
    { error: new Error('fetch failed: ECONNRESET') },
    'toolNetwork',
  ],
  [
    'a missing binary',
    { error: new Error('Claude Code executable not found at /x/claude') },
    'toolProcess',
  ],
  [
    'a crashed process',
    { error: new Error('Claude Code process exited with code 1') },
    'toolProcess',
  ],
  [
    'an unknown model',
    { assistantError: 'model_not_found', resultErrors: ['no such model'] },
    'modelUnavailable',
  ],
  [
    'a model the account cannot use',
    {
      apiErrorStatus: 404,
      resultErrors: [
        "There's an issue with the selected model (gpt-6). It may not exist or you may not have access to it.",
      ],
    },
    'modelUnavailable',
  ],
  ['max turns', { resultSubtype: 'error_max_turns' }, 'unknown'],
  [
    'an invalid request code',
    { assistantError: 'invalid_request', resultErrors: ['bad'] },
    'unknown',
  ],
];

describe('classifyClaudeFailure', () => {
  it.each(cases)('maps %s', (_name, signal, reason) => {
    expect(classifyClaudeFailure(signal).reason).toBe(reason);
  });

  it('does not read ordinary numbers as HTTP statuses', () => {
    expect(
      classifyClaudeFailure({ resultErrors: ['edited 500 lines in 401 files'] })
        .reason,
    ).toBe('unknown');
  });

  it('builds a message from the available parts', () => {
    expect(
      classifyClaudeFailure({
        error: new Error('boom'),
        resultErrors: ['stderr tail'],
      }).message,
    ).toBe('boom; stderr tail');
    expect(classifyClaudeFailure({}).message).toBe('Claude Code run failed');
  });
});
