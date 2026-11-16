import { describe, expect, it } from 'vitest';
import {
  sanitizeLog,
  LogLineFramer,
  boundedLogLines,
  createLogLineSanitizer,
} from '../src/index.js';

describe('诊断日志脱敏与逐行上限', () => {
  it.each([
    'inputTokens=1234',
    'maxTokens: 4096',
    'tokensUsed=9000',
    'inputTokens=1234 maxTokens: 4096 tokensUsed=9000',
    'Used inputTokens=1234 for this run',
    'token=0',
    'token="00123"',
    "tokensUsed='9000'",
    'payload={\\"inputTokens\\":\\"1234\\"}',
  ])('自由文本的纯数字 token 用量保留：%s', (text) => {
    expect(sanitizeLog(text)).toBe(text);
  });
  it('结构化字段和 JSON 文本保留纯数字 token 用量，包括嵌套及数字字符串', () => {
    const value = {
      inputTokens: 1234,
      maxTokens: 4096,
      tokensUsed: 9000,
      nested: { token: '00123', output_tokens: 0 },
    };
    expect(sanitizeLog(value)).toEqual(value);
    expect(JSON.parse(String(sanitizeLog(JSON.stringify(value))))).toEqual(
      value,
    );
    expect(sanitizeLog({ token: '1'.repeat(131072) })).toEqual({
      token: '[REDACTED]',
    });
  });
  it.each([
    'token',
    'accessToken',
    'inputTokens',
    'password',
    'secret',
    'apiKey',
    'passwordToken',
    'tokenSecret',
  ])('真正凭据和密码不会被数字用量例外放过：%s', (key) => {
    for (const value of [
      'fixture-sensitive-value',
      '1234abc',
      '1234.5',
      '-1234',
    ]) {
      expect(String(sanitizeLog(`${key}=${value}`))).not.toContain(value);
      expect(sanitizeLog({ [key]: value })).toEqual({ [key]: '[REDACTED]' });
    }
    if (!['token', 'accessToken', 'inputTokens'].includes(key)) {
      expect(String(sanitizeLog(`${key}=1234`))).not.toContain('1234');
      expect(sanitizeLog({ [key]: 1234 })).toEqual({ [key]: '[REDACTED]' });
      expect(sanitizeLog({ [key]: '1234' })).toEqual({ [key]: '[REDACTED]' });
    }
  });
  it('数字 token 用量不会阻止相邻凭据脱敏，含空格的密码仍整段遮蔽', () => {
    expect(
      sanitizeLog(
        'inputTokens=1234 password="fixture-sensitive-value with spaces"',
      ),
    ).toBe('inputTokens=1234 password=[REDACTED]');
    expect(sanitizeLog('token=1234 secret=5678')).toBe(
      'token=1234 secret=[REDACTED]',
    );
    expect(sanitizeLog('password=1234 with spaces')).toBe(
      'password=[REDACTED]',
    );
  });
  it.each([
    'api_key=fixture-sensitive-value',
    String.raw`payload={\"password\":\"fixture-sensitive-value\"}`,
    'fgk_fixture-sensitive-value',
    'fgr_fixture-sensitive-value',
    'Basic fixture-sensitive-value',
    'X-Api-Key: fixture-sensitive-value',
    'ANTHROPIC_API_KEY=fixture-sensitive-value',
    '{"password":"fixture-sensitive-value with spaces"}',
    '{"nested":{"client_secret":"fixture-sensitive-value"}}',
    'password="fixture-sensitive-value with spaces"',
    'https://user:fixture-sensitive-value@example.test',
    'sk-fixture-sensitive-value',
    'ghp_fixtureSensitiveValue123',
    'github_pat_fixtureSensitiveValue123',
    '-----BEGIN PRIVATE KEY-----\nfixture-sensitive-value\n-----END PRIVATE KEY-----',
    'password="fixture-sensitive-value',
  ])('导出时遮蔽常见秘密形式：%s', (input) => {
    expect(String(sanitizeLog(input))).not.toContain('fixture-sensitive-value');
    expect(String(sanitizeLog(input))).not.toContain(
      'fixtureSensitiveValue123',
    );
  });
  it.each([32768, 131072])('病态长串先截断且匹配耗时有界：%s 字节', (size) => {
    for (const seed of [
      'a',
      'a-',
      'aB0_-',
      'token-',
      'password-',
      'http://a:',
    ]) {
      const input = seed.repeat(Math.ceil(size / seed.length)).slice(0, size);
      sanitizeLog('warmup');
      const started = performance.now();
      const result = sanitizeLog(input);
      expect(performance.now() - started).toBeLessThan(50);
      expect(String(result).length).toBeLessThanOrEqual(32768);
    }
    const input =
      'x'.repeat(32720) +
      ' ANTHROPIC_API_KEY="fixture-sensitive-value with spaces"';
    expect(String(sanitizeLog(input))).not.toContain('fixture-sensitive-value');
  });
  it('截断的连接凭据仍隐藏，普通短 URL 的端口仍可诊断', () => {
    expect(
      String(
        sanitizeLog('https://user:' + 'fixture-sensitive-value'.repeat(10000)),
      ),
    ).not.toContain('fixture-sensitive-value');
    expect(sanitizeLog('http://localhost:3000')).toBe('http://localhost:3000');
  });
  it('嵌套字段、转义 JSON 和截断边界不泄露秘密', () => {
    const value = {
      api_key: 'fixture',
      nested: { password: 'fixture' },
      message: JSON.stringify({ password: 'fixture "quoted" value' }),
    };
    expect(JSON.stringify(sanitizeLog(value))).not.toContain('fixture');
    expect(
      String(
        sanitizeLog('a'.repeat(32750) + ' password=fixture-sensitive-value'),
      ),
    ).not.toContain('fixture');
  });
  it('跨块 UTF-8 正常，超长记录整行丢弃且不输出其尾巴', async () => {
    const records: (string | null)[] = [];
    async function* input() {
      yield Buffer.from('你').subarray(0, 1);
      yield Buffer.from('你').subarray(1);
      yield Buffer.from('\n' + 'x'.repeat(100000) + 'password=fixture\nnext\n');
    }
    for await (const line of boundedLogLines(input(), 16)) records.push(line);
    expect(records).toEqual(['你', null, 'next']);
    const redact = createLogLineSanitizer();
    expect(
      [
        '-----BEGIN PRIVATE KEY-----',
        'fixture',
        '-----END PRIVATE KEY-----',
        'next',
      ].map(redact),
    ).toEqual(['[REDACTED]', '[REDACTED]', '[REDACTED]', 'next']);
    const lines: string[] = [];
    const frame = new LogLineFramer(
      (line) => lines.push(line),
      () => {},
      8,
    );
    frame.write('partial');
    frame.flush();
    expect(lines).toEqual(['partial']);
  });
});
