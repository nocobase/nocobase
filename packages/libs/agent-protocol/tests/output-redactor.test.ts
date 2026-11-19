import { expect, it } from 'vitest';
import {
  createRedactor,
  createStreamRedactor,
  REDACTED,
} from '../src/redact.js';
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

it.each([
  ['an unclosed quoted key', '{"apiKey":"lan-9f8e,7d6c 5b4a'],
  ['an unclosed short quoted key', '{"apiKey":"lan-9f'],
  ['an unquoted key cut short', 'MY_GATEWAY_TOKEN=abc'],
  ['a quoted x-api-key with a comma', '{"x-api-key": "abc, def123456'],
])(
  'never releases %s when the stream stops, in one piece or character by character',
  (_name, text) => {
    const value = text.replace(/^.*?[:=]\s*"?/u, '');
    for (const size of [1, 3, text.length]) {
      const stream = createOutputRedactor(() => createRedactor());
      let live = '';
      for (let at = 0; at < text.length; at += size)
        live += stream.write(text.slice(at, at + size));
      const out = live + stream.end(true);
      expect(out).toContain(REDACTED);
      expect(out).not.toContain(value);
      expect(out).not.toContain(value.slice(0, 3));
    }
  },
);

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

it('does not invent a right word boundary when retaining another candidate prefix', () => {
  const text = 'AKIA' + 'A'.repeat(16) + 'x';
  const redactor = createRedactor();
  for (let split = 0; split <= text.length; split++) {
    const stream = createOutputRedactor(() => redactor);
    let live = '';
    for (const piece of [text.slice(0, split), text.slice(split)]) {
      live += stream.write(piece);
      expect(redactor.text(text).startsWith(live)).toBe(true);
    }
    expect(live + stream.end()).toBe(text);
  }
});

const tokenFamilies = [
  { name: 'agents', values: [19, 20, 21].map((n) => 'fgk_' + 'a'.repeat(n)) },
  {
    name: 'GitHub',
    values: [35, 36, 255, 256].map((n) => 'ghp_' + 'a'.repeat(n)),
  },
  {
    name: 'fine-grained GitHub',
    values: [21, 22, 256].map((n) => 'github_pat_' + 'a'.repeat(n)),
  },
  { name: 'npm', values: [35, 36, 37].map((n) => 'npm_' + 'a'.repeat(n)) },
  { name: 'Slack', values: [9, 10, 11].map((n) => 'xoxb-' + 'a'.repeat(n)) },
  { name: 'Google', values: [34, 35, 36].map((n) => 'AIza' + 'a'.repeat(n)) },
  {
    name: 'sk',
    values: [
      'sk-' + 'a'.repeat(20),
      ...[18, 19, 20].map((n) => 'sk-' + 'a'.repeat(n) + '1'),
    ],
  },
  {
    name: 'Stripe',
    values: [15, 16, 17].map((n) => 'sk_live_' + 'a'.repeat(n)),
  },
  { name: 'AWS id', values: [15, 16, 17].map((n) => 'AKIA' + 'A'.repeat(n)) },
  {
    name: 'AWS secret',
    values: [39, 40, 41].map((n) => 'aws_secret_access_key = ' + 'a'.repeat(n)),
  },
  {
    name: 'JWT',
    values: [7, 8, 9].map(
      (n) =>
        'eyJ' + 'a'.repeat(n) + '.eyJ' + 'b'.repeat(n) + '.' + 'c'.repeat(n),
    ),
  },
  {
    name: 'Bearer',
    values: [14, 15, 16].map((n) => 'Bearer ' + 'a'.repeat(n) + '1'),
  },
  {
    name: 'Basic',
    values: [15, 16, 17].map((n) => 'Basic ' + 'a'.repeat(n) + '=='),
  },
  {
    name: 'API key',
    values: [7, 8, 9].map((n) => 'x-api-key: ' + 'a'.repeat(n)),
  },
  {
    name: 'URL',
    values: [
      'https://user:password@example.test',
      'https://' + 'a'.repeat(20) + '@example.test',
      'https://example.test',
    ],
  },
  {
    name: 'password',
    values: ['password=secret', '?token=secret', 'password='],
  },
  {
    name: 'labelled secret',
    values: [
      '{"apiKey":"lan-9f8e7d6c5b4a"}',
      'MY_GATEWAY_TOKEN=abcd1234efgh',
      'password: hunter2hunter2',
      'max_tokens: 40960',
      '{"apiKey":"lan-9f8e, 7d6c 5b4a"}',
      'api_key = lan9f8e7d6c5b4a',
      'const apiKey = process.env.API_KEY;',
      '{"x-api-key": "abc, def123456"}',
      'token: demo.example123',
      '{"apiKey":"lan-9f8e,7d6c 5b4a',
    ],
  },
  {
    name: 'private key',
    values: ['-----BEGIN PRIVATE KEY-----\nBODY\n-----END PRIVATE KEY-----'],
  },
  {
    name: 'known value',
    values: ['knownvalue123', 'known credential with spaces'],
  },
];

it.each(tokenFamilies)(
  'preserves canonical prefixes for $name lengths and surrounding characters',
  ({ values }) => {
    const redactor = createRedactor([
      'knownvalue123',
      'known credential with spaces',
    ]);
    for (const value of values)
      for (const prefix of ['', 'word', 'knownvalue123'])
        for (const suffix of [
          '',
          '. Next.',
          'x',
          'x. Next.',
          '_suffix',
          '/tail',
          '-tail',
        ]) {
          const text = prefix + value + suffix;
          const expected = redactor.text(text);
          for (const size of [1, 20, 256]) {
            const stream = createOutputRedactor(() => redactor);
            let live = '';
            for (let at = 0; at < text.length; at += size) {
              live += stream.write(text.slice(at, at + size));
              expect({
                text,
                size,
                at,
                prefix: expected.startsWith(live),
              }).toMatchObject({ prefix: true });
            }
            expect({ text, size, result: live + stream.end() }).toEqual({
              text,
              size,
              result: expected,
            });
            expect(stream.peakHeld).toBeLessThanOrEqual(MAX_OUTPUT_HELD);
          }
        }
  },
);

it('redacts labelled values adjacent to private keys before publishing them', () => {
  for (const suffix of ['', 'tail', '. Done.']) {
    const text =
      'x-api-key: zzzzzz-----BEGIN PRIVATE KEY-----\nBODY123456\n-----END PRIVATE KEY-----' +
      suffix;
    const redactor = createRedactor();
    for (let split = 1; split < text.length; split++) {
      const stream = createOutputRedactor(() => redactor);
      let live = stream.write(text.slice(0, split));
      expect(live).not.toContain('zzzzzz');
      live += stream.write(text.slice(split));
      expect(live).not.toContain('zzzzzz');
      expect(live + stream.end()).toBe(redactor.text(text));
    }
  }
});
it('bounds a long private key without releasing its adjacent labelled value', () => {
  const redactor = createRedactor();
  const text =
    'x-api-key: zzzzzz-----BEGIN PRIVATE KEY-----\n' +
    'A'.repeat(1_000_000) +
    '\n-----END PRIVATE KEY----- tail';
  const stream = createOutputRedactor(() => redactor);
  let live = '';
  for (let at = 0; at < text.length; at += 20) {
    live += stream.write(text.slice(at, at + 20));
    expect(stream.heldSize).toBeLessThanOrEqual(MAX_OUTPUT_HELD);
    expect(live).not.toContain('zzzzzz');
  }
  expect(live + stream.end()).toBe(redactor.text(text));
});

it('does not close a private key at a different key type', () => {
  const text =
    'x-api-key: zzzzzz-----BEGIN RSA PRIVATE KEY-----\nBODY123456\n-----END EC PRIVATE KEY-----\nSTILLPRIVATE';
  const redactor = createRedactor();
  const stream = createOutputRedactor(() => redactor);
  let live = '';
  for (const char of text) live += stream.write(char);
  expect(live + stream.end()).toBe(redactor.text(text));
});

/**
 * One fictional gateway key with an escaped quote, an escaped backslash, a comma and spaces, under each label and
 * quote style; whole-text redaction, the live preview and the log stream share one quote and escape rule.
 */
const cutOff = [
  String.raw`{"provider":"my-lan-gateway","apiKey": "lan-fict\"ional, gateway key\\ 9f8e"} done`,
  String.raw`{'provider':'my-lan-gateway','apiKey': 'lan-fict\'ional, "gateway" key\\ 9f8e'} done`,
  String.raw`{"x-api-key": "lan-fict\"ional, gateway key\\ 9f8e"} done`,
];
/** What the text cut after `cut` characters must redact to: the value, whole or in part, becomes one `REDACTED`. */
function cutOffExpected(text: string, cut: number): string {
  const open = /(?:apiKey|x-api-key)["']?\s*:\s*(["'])/u.exec(text)!;
  const start = open.index + open[0].length;
  let end = start;
  while (text[end] !== open[1]) end += text[end] === '\\' ? 2 : 1;
  if (cut <= start) return text.slice(0, cut);
  return text.slice(0, start) + REDACTED + text.slice(end, Math.max(end, cut));
}
it.each(cutOff)(
  'never exposes a quoted value cut off at any position, escapes, commas and spaces included: %s',
  (text) => {
    for (let cut = 0; cut <= text.length; cut++) {
      const prefix = text.slice(0, cut);
      const expected = cutOffExpected(text, cut);
      expect(createRedactor().text(prefix), `whole ${cut}`).toBe(expected);
      for (const size of [1, 3, cut || 1])
        for (const interrupted of [false, true]) {
          const stream = createOutputRedactor(() => createRedactor());
          let live = '';
          for (let at = 0; at < cut; at += size) {
            const piece = stream.write(
              prefix.slice(at, Math.min(cut, at + size)),
            );
            // What is published while the value is still open never reaches into it.
            expect(
              expected.startsWith(live + piece),
              `live ${cut}/${size}`,
            ).toBe(true);
            live += piece;
          }
          expect(
            live + stream.end(interrupted),
            `end ${cut}/${size}/${interrupted}`,
          ).toBe(expected);
        }
      const log = createStreamRedactor(createRedactor());
      let logged = '';
      for (let at = 0; at < cut; at += 3) {
        logged += log.write(prefix.slice(at, Math.min(cut, at + 3)), {
          partial: true,
        });
        expect(expected.startsWith(logged), `log live ${cut}`).toBe(true);
      }
      expect(logged + log.end(), `log ${cut}`).toBe(expected);
    }
  },
);

it.each([
  ['a double-quoted value holding a single quote', `{"apiKey":"ab'c`],
  ['a single-quoted value holding a double quote', `{'token': 'ab"c`],
  ['a value ending in a backslash', String.raw`{"apiKey":"a\\`],
  ['an escaped quote', String.raw`{"password":"a\"b`],
])('masks %s cut off before it closes, however short', (_name, text) => {
  for (const size of [1, 2, text.length]) {
    const stream = createOutputRedactor(() => createRedactor());
    let live = '';
    for (let at = 0; at < text.length; at += size)
      live += stream.write(text.slice(at, at + size));
    const out = live + stream.end(true);
    expect(out).toMatch(/\[REDACTED\]$/u);
    expect(out).not.toMatch(/ab|a\\/u);
  }
});
