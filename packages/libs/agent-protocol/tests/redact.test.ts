import { describe, expect, it } from 'vitest';

import {
  createRedactor,
  createStreamRedactor,
  REDACTED,
  redactPatterns,
} from '../src/index.js';

const GITHUB = `ghp_${'a1B2c3D4e5'.repeat(4)}`;
const FINE_GRAINED = `github_pat_11ABCDEFG0123456789_${'x'.repeat(40)}`;
const OPENAI = 'sk-proj-Abc123def456ghi789jkl012mno';
const ANTHROPIC = 'sk-ant-api03-AbC1dEf2GhI3jKl4MnO5pQr6';
const AWS_ID = 'AKIAIOSFODNN7EXAMPLE';
const AWS_SECRET = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
const RUN_TOKEN = `fgr_${'Zx9_-'.repeat(9)}`;
const PRIVATE_KEY = [
  '-----BEGIN OPENSSH PRIVATE KEY-----',
  'b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW',
  'QyNTUxOQAAACBzZWNyZXQgc2VjcmV0IHNlY3JldCBzZWNyZXQgc2VjcmV0AAAAA',
  '-----END OPENSSH PRIVATE KEY-----',
].join('\n');

describe('redactPatterns', () => {
  it.each([
    ['a GitHub token', `token ${GITHUB} here`, `token ${REDACTED} here`],
    ['a fine-grained GitHub token', `use ${FINE_GRAINED}`, `use ${REDACTED}`],
    ['an OpenAI key', `OPENAI_API_KEY=${OPENAI}`, `OPENAI_API_KEY=${REDACTED}`],
    ['an Anthropic key', `key: ${ANTHROPIC}.`, `key: ${REDACTED}.`],
    ['an AWS access key id', `id ${AWS_ID} ok`, `id ${REDACTED} ok`],
    [
      'an AWS secret access key',
      `aws_secret_access_key = ${AWS_SECRET}`,
      `aws_secret_access_key = ${REDACTED}`,
    ],
    [
      'a run token',
      `x-nocobase-run-token: ${RUN_TOKEN}`,
      `x-nocobase-run-token: ${REDACTED}`,
    ],
    [
      'a private key block',
      `before\n${PRIVATE_KEY}\nafter`,
      `before\n${REDACTED}\nafter`,
    ],
    [
      'a private key block cut short',
      `key:\n${PRIVATE_KEY.split('\n').slice(0, 2).join('\n')}`,
      `key:\n${REDACTED}`,
    ],
    [
      'a bearer token',
      'Authorization: Bearer eyAbc.def123.ghiJKL456mno',
      `Authorization: Bearer ${REDACTED}`,
    ],
    [
      'a basic credential',
      'Authorization: Basic dXNlcjpwYXNzd29yZDEyMw==',
      `Authorization: Basic ${REDACTED}`,
    ],
    [
      'a JSON Web Token',
      'jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
      `jwt ${REDACTED}`,
    ],
    [
      'a password in a URL',
      'git clone https://alice:hunter2pass@example.com/repo.git',
      `git clone https://${REDACTED}@example.com/repo.git`,
    ],
    [
      'a token as the user of a URL',
      `https://${GITHUB}@github.com/acme/app.git`,
      `https://${REDACTED}@github.com/acme/app.git`,
    ],
    [
      'a password parameter',
      'GET /login?user=bob&password=s3cret!&next=/',
      `GET /login?user=bob&password=${REDACTED}&next=/`,
    ],
    [
      'a password assignment',
      'psql --password=hunter22 -h db',
      `psql --password=${REDACTED} -h db`,
    ],
    [
      'an x-api-key header',
      '-H "x-api-key: abcdef0123456789"',
      `-H "x-api-key: ${REDACTED}"`,
    ],
    [
      'an npm token',
      `//registry/:_authToken=npm_${'a'.repeat(36)}`,
      `//registry/:_authToken=${REDACTED}`,
    ],
    ['a Slack token', 'xoxb-123456789012-abcdefABCDEF', REDACTED],
  ])('redacts %s', (_name, input, expected) => {
    expect(redactPatterns(input)).toBe(expected);
  });

  it.each([
    [
      'a git commit hash',
      'HEAD is at 3f2a9c1d8e7b6a5f4e3d2c1b0a9f8e7d6c5b4a39 now',
    ],
    ['a short hash', 'merged 3f2a9c1 into main'],
    ['a UUID', 'run 0f8fad5b-d9cb-469f-a165-70867728950e started'],
    ['prose', 'The bearer of this message asked for a token and a password.'],
    [
      'a package name',
      'pip install scikit-learn sk-video and use sk-learn-style APIs',
    ],
    [
      'an SSH remote',
      'git@github.com:acme/app.git and ssh://git@github.com/acme/app',
    ],
    ['a plain URL', 'see https://example.com:8080/path?q=1&page=2#top'],
    ['a base64 digest', 'sha512-Pm9q7o8E3qbuOqtQDDE2KO3dS2ff9Xg2cuThRvQ6+6Y='],
    [
      'code that mentions keys',
      'const apiKey = process.env.API_KEY; // set the bearer header',
    ],
  ])('leaves %s alone', (_name, input) => {
    expect(redactPatterns(input)).toBe(input);
  });
});

describe('createRedactor', () => {
  it('removes the values it was given, longest first, and their JSON-escaped forms', () => {
    const redactor = createRedactor([
      'hunter2-value',
      'hunter2-value-longer',
      'quote"d\\secret',
      'short',
      undefined,
      null,
    ]);
    expect(redactor.text('a hunter2-value-longer b hunter2-value c')).toBe(
      `a ${REDACTED} b ${REDACTED} c`,
    );
    expect(redactor.text(JSON.stringify({ v: 'quote"d\\secret' }))).toBe(
      `{"v":"${REDACTED}"}`,
    );
    // Too short to tell from ordinary text.
    expect(redactor.text('short')).toBe('short');
  });

  it('escapes values that look like regular expressions', () => {
    const redactor = createRedactor(['a.b*c+d?(e)']);
    expect(redactor.text('x a.b*c+d?(e) y aXbbbcd')).toBe(
      `x ${REDACTED} y aXbbbcd`,
    );
  });

  it('redacts every string in a JSON value and keeps its shape', () => {
    const redactor = createRedactor(['top-secret-value']);
    const input = {
      command: `curl -H "Authorization: Bearer ${GITHUB}"`,
      env: ['A=top-secret-value', 3, true, null],
      nested: { deeper: { key: OPENAI } },
      count: 2,
    };
    const output = redactor.value(input);
    expect(output).toEqual({
      command: `curl -H "Authorization: Bearer ${REDACTED}"`,
      env: [`A=${REDACTED}`, 3, true, null],
      nested: { deeper: { key: REDACTED } },
      count: 2,
    });
    expect(JSON.parse(JSON.stringify(output))).toEqual(output);
    // The input is not changed.
    expect(input.nested.deeper.key).toBe(OPENAI);
  });

  it('is fast on a large transcript', () => {
    const redactor = createRedactor(
      Array.from(
        { length: 50 },
        (_, index) => `secret-value-${index}-${'x'.repeat(20)}`,
      ),
    );
    const line =
      'diff --git a/src/index.ts b/src/index.ts 3f2a9c1d8e7b sk- Bearer the end\n';
    const text = line.repeat(Math.ceil(2_000_000 / line.length));
    const started = performance.now();
    const out = redactor.text(text);
    expect(performance.now() - started).toBeLessThan(1_000);
    expect(out).toBe(text);
  });
});

describe('createStreamRedactor', () => {
  it('catches a secret split across pieces of a line', () => {
    const secret = 'split-secret-0123456789';
    const stream = createStreamRedactor(createRedactor([secret]));
    const out = [
      stream.write('token is split-sec', { partial: true }),
      stream.write('ret-0123456789 and more', { partial: false }),
      stream.end(),
    ].join('');
    expect(out).toBe(`token is ${REDACTED} and more`);
  });

  it('catches a pattern split across pieces of a line', () => {
    const stream = createStreamRedactor(createRedactor());
    const out =
      stream.write(`export TOKEN=${GITHUB.slice(0, 10)}`, { partial: true }) +
      stream.write(GITHUB.slice(10)) +
      stream.end();
    expect(out).toBe(`export TOKEN=${REDACTED}`);
  });

  it('passes whole lines on at once', () => {
    const stream = createStreamRedactor(createRedactor(['a-secret-value']));
    expect(stream.write('compiled 42 files')).toBe('compiled 42 files');
    expect(stream.write('progress 10%', { partial: true })).toBe('progress ');
    expect(stream.write(' 20%')).toBe('10% 20%');
  });

  it('redacts a private key block that spans pieces', () => {
    const [begin, first, second, end] = PRIVATE_KEY.split('\n');
    const stream = createStreamRedactor(createRedactor());
    const out = [
      stream.write(`key follows\n${begin}\n${first}`),
      stream.write(second),
      stream.write(`${end}\nafter the key`),
      stream.end(),
    ].join('|');
    expect(out).toBe(`key follows\n${REDACTED}||\nafter the key|`);
  });

  it('redacts a secret cut short at the end of the stream', () => {
    const stream = createStreamRedactor(
      createRedactor(['ends-with-a-secret-value']),
    );
    expect(stream.write('last words ends-with-a-sec', { partial: true })).toBe(
      'last words ',
    );
    expect(stream.end()).toBe(REDACTED);
  });
});
