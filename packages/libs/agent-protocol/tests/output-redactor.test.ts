import { expect, it } from 'vitest';
import { createRedactor, REDACTED } from '../src/redact.js';
import {
  createOutputRedactor,
  MAX_OUTPUT_HELD,
} from '../src/output-redactor.js';
it('preserves ordinary closing words in the isolated streaming scanner', () => {
  const redactor = createRedactor(['sample-secret']);
  for (const text of [
    'run all the tests',
    'Southeast Asia.',
    'Run npm_config_registry',
  ]) {
    const stream = createOutputRedactor(() => redactor);
    expect(stream.write(text) + stream.end()).toBe(text);
  }
});
it('handles every split of known, labelled, private-key and token credentials', () => {
  const known = 'known credential\nwith spaces 123456';
  const samples = [
    known,
    'ghp_' + 'a1'.repeat(18),
    'sk-' + 'a1'.repeat(20),
    'Bearer a1'.repeat(1) + 'a1'.repeat(10),
    'Basic dXNlcjpwYXNzd29yZDEyMw==',
    'x-api-key: fictional123456',
    'password=测试密码123456',
    'https://user:测试密码123456@example.test/path',
    'https://example.test/?token=测试密码123456',
    '-----BEGIN PRIVATE KEY-----\nBODY123456\n-----END PRIVATE KEY-----',
  ];
  const redactor = createRedactor([known]);
  for (const sample of samples)
    for (let split = 1; split < sample.length; split++) {
      const stream = createOutputRedactor(() => redactor);
      const result =
        stream.write('before ' + sample.slice(0, split)) +
        stream.write(sample.slice(split) + ' after') +
        stream.end();
      expect(result, `${samples.indexOf(sample)}:${split}`).toBe(
        redactor.text('before ' + sample + ' after'),
      );
      expect(stream.peakHeld).toBeLessThanOrEqual(MAX_OUTPUT_HELD);
    }
});
it('drops an oversized unresolved candidate without unbounded memory or releasing raw secrets', () => {
  const secret = 'A'.repeat(10_000);
  const redactor = createRedactor([secret]);
  const stream = createOutputRedactor(() => redactor);
  let result = '';
  for (let i = 0; i < secret.length; i += 20)
    result += stream.write(secret.slice(i, i + 20));
  expect(stream.heldSize).toBeLessThanOrEqual(MAX_OUTPUT_HELD);
  expect(stream.peakHeld).toBeLessThanOrEqual(MAX_OUTPUT_HELD);
  expect(result + stream.end()).not.toContain('AAAAAA');
  const short = createOutputRedactor(() =>
    createRedactor(['secret-value-123456']),
  );
  expect(short.write('secret-val') + short.end(true)).toBe(REDACTED);
});

it('preserves surrogate pairs across provider and internal scan boundaries', () => {
  const text = 'a'.repeat(255) + '😀你好🧪';
  for (let cut = 250; cut < text.length; cut++) {
    const stream = createOutputRedactor(() => createRedactor());
    expect(
      stream.write(text.slice(0, cut)) +
        stream.write(text.slice(cut)) +
        stream.end(),
    ).toBe(text);
  }
});

const reviewed = [
  'npm_' + 'a'.repeat(37) + ' finished.',
  'ghp_' + 'a'.repeat(36) + '. Next sentence.',
  'ordinaryprefixghp_' + 'a'.repeat(36) + ' done.',
];
it.each(reviewed)(
  'preserves every reviewed boundary and only emits canonical prefixes: %s',
  (text) => {
    const redactor = createRedactor();
    const expected = redactor.text(text);
    const splits = [
      ...Array.from({ length: text.length + 1 }, (_, i) => [
        text.slice(0, i),
        text.slice(i),
      ]),
      [...text],
    ];
    for (const pieces of splits) {
      const stream = createOutputRedactor(() => redactor);
      let actual = '';
      for (const piece of pieces) {
        actual += stream.write(piece);
        expect(expected.startsWith(actual)).toBe(true);
      }
      actual += stream.end();
      expect(actual).toBe(expected);
    }
  },
);

it('retains word boundaries across scan windows and boundaries introduced by known-value replacement', () => {
  const secret = 'knownvalue123';
  const redactor = createRedactor([secret]);
  for (const text of [
    'x'.repeat(256) + 'ghp_' + 'a'.repeat(36) + '.',
    secret + 'ghp_' + 'a'.repeat(36) + '.',
  ]) {
    for (const size of [1, 20, 256]) {
      const stream = createOutputRedactor(() => redactor);
      let live = '';
      for (let at = 0; at < text.length; at += size) {
        live += stream.write(text.slice(at, at + size));
        expect(redactor.text(text).startsWith(live)).toBe(true);
      }
      expect(live + stream.end()).toBe(redactor.text(text));
    }
  }
});
