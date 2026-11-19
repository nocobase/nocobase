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
      'a key in parentheses',
      `${'Reconnect OpenCode Console to continue.'} (gateway apiKey: lan-9f8e7d6c5b4a)`,
      `${'Reconnect OpenCode Console to continue.'} (gateway apiKey: [REDACTED])`,
    ],
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
    [
      'a URL-safe random credential with hyphens',
      'gateway rejected Zq81mN0p-L4kTx7Rw2Vb9Yc-Hq3 for this model',
      'gateway rejected [REDACTED] for this model',
    ],
    [
      'a random credential in short hyphenated pieces',
      'gateway rejected Zq81mN0-pL4kTx7-Rw2Vb9Y-cHq3 for this model',
      'gateway rejected [REDACTED] for this model',
    ],
    [
      'a random credential in four-character pieces before a full stop',
      'unknown credential Zq81-mN0p-L4kT-x7Rw-2Vb9.',
      'unknown credential [REDACTED].',
    ],
    [
      'a hyphenated random credential before a full stop',
      'unknown credential q81mN0pL4kTx-7Rw2Vb9YcZ.',
      'unknown credential [REDACTED].',
    ],
    [
      'a long random string before a full stop',
      'unknown credential Zq81mN0pL4kTx7Rw2Vb9Yc. Sign in again.',
      'unknown credential [REDACTED]. Sign in again.',
    ],
    [
      'a whole quoted value with spaces',
      'apiKey: "sample gateway value" was refused',
      'apiKey: "[REDACTED]" was refused',
    ],
    [
      'a quoted value with a comma and an escaped quote',
      `{"token":"lan, 9f8e \\"7d6c\\" 5b4a"}`,
      '{"token":"[REDACTED]"}',
    ],
    [
      'a quoted value the message ends inside',
      "gateway key='sample gateway",
      "gateway key='[REDACTED]",
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
    ['a hyphenated model name', 'GPT-OSS-120B-Instruct is not available here'],
    ...[
      'Llama-4-Maverick-17B-128E-Instruct',
      'DeepSeek-R1-Distill-Qwen-32B',
      'Qwen2-VL-72B-Instruct-AWQ',
      'Mixtral-8x22B-Instruct-v0',
      'Meta-Llama-3-70B-Instruct-Turbo',
      'Phi-3-mini-4k-instruct',
      'ERR-RateLimit-Exceeded-429',
    ].map((model) => [
      `the model name ${model}`,
      `${model} is not available: ${SAID}`,
    ]),
    [
      'a hyphenated provider path',
      'Model my-lan-gateway/DeepSeek-V4-Flash-Free2 not found',
    ],
    ['a lower-case UUID', 'run 0f8fad5b-d9cb-469f-a165-70867728950e failed'],
    ['a long word', 'internationalization-configuration failed'],
    [
      'a hostname at the end of a sentence',
      'Cannot reach gateway.internal.example.',
    ],
  ])('keeps %s', (_name, message) => {
    expect(redactFailureMessage(message)).toBe(message);
  });

  it('is shown as its first line, at most 300 characters', () => {
    expect(failureDetailText(`\u001b[31m${SAID}\u001b[0m\nstderr: more`)).toBe(
      SAID,
    );
    // CR, LF and CRLF each end the first line, before control characters are removed.
    for (const end of ['\r', '\n', '\r\n'])
      expect(failureDetailText(`${SAID}${end}stderr: more`)).toBe(SAID);
    // 300 characters, the ellipsis included.
    const long = failureDetailText(`${SAID} ${'x'.repeat(400)}`)!;
    expect(long).toHaveLength(300);
    expect(long.endsWith('…')).toBe(true);
    expect(failureDetailText('x'.repeat(300))).toBe('x'.repeat(300));
    expect(failureDetailText('x'.repeat(301))).toHaveLength(300);
    expect(failureDetailText('  \n ')).toBeNull();
  });
});
