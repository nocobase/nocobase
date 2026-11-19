import { describe, expect, it } from 'vitest';

import { redactFailureMessage } from '../server/core/runs/failure-message.js';
import { failureDetailText } from '../shared/runs.js';

const SAID = 'Reconnect OpenCode Console to continue.';

describe('a failed run’s message', () => {
  it.each([
    [
      'an sk- key',
      'invalid key sk-proj-Abc123def456',
      'invalid key [REDACTED]',
    ],
    [
      'a bearer credential',
      'sent Authorization: Bearer lan.9f8e7d6c',
      'sent Authorization: Bearer [REDACTED]',
    ],
    [
      'a key= value',
      'gateway key=lan9f8e rejected',
      'gateway key=[REDACTED] rejected',
    ],
    ['a token= value', 'token=abc123 expired', 'token=[REDACTED] expired'],
    [
      'an apiKey: value in JSON',
      `${SAID} {"apiKey":"lan-9f8e7d6c5b4a"}`,
      `${SAID} {"apiKey":"[REDACTED]"}`,
    ],
    [
      'a long random string',
      'unknown credential Zq81mN0pL4kTx7Rw2Vb9Yc',
      'unknown credential [REDACTED]',
    ],
  ])('removes %s', (_name, message, expected) => {
    expect(redactFailureMessage(message)).toBe(expected);
  });

  it.each([
    ['the tool’s own words', SAID],
    [
      'a path and a model id',
      'Model not found: my-lan-gateway/qwen3.8-flash in /home/runner/work',
    ],
    ['token counts', 'prompt has 128000 tokens, max_tokens: 4096'],
    ['a commit hash', 'HEAD is 3f2a9c1d8e7b6a5f4e3d2c1b0a9f8e7d6c5b4a39'],
    ['a dated model id', 'claude-sonnet-4-5-20250929 is overloaded'],
    ['a long word', 'internationalization-configuration failed'],
  ])('keeps %s', (_name, message) => {
    expect(redactFailureMessage(message)).toBe(message);
  });

  it('is shown as its first line, at most 300 characters', () => {
    expect(failureDetailText(`\u001b[31m${SAID}\u001b[0m\nstderr: more`)).toBe(
      SAID,
    );
    const long = failureDetailText(`${SAID} ${'x'.repeat(400)}`)!;
    expect(long).toHaveLength(301);
    expect(long.endsWith('…')).toBe(true);
    expect(failureDetailText('  \n ')).toBeNull();
  });
});
