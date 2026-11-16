import { mkdir, writeFile, readFile, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { create, Header } from 'tar';
import { gzipSync } from 'node:zlib';
import { afterAll, describe, expect, it } from 'vitest';
import { diagnosticsTimeline } from '../src/diagnostics.ts';
import { cli, cliEnv } from './packaged/helpers.ts';
import { createServer } from 'node:http';
import { tempDir, removeDir } from './helpers.ts';
const root = tempDir('diagnostics-timeline-');
afterAll(() => removeDir(root));
let serial = 0;
async function archive(files: Record<string, string>) {
  const directory = path.join(root, String(serial++));
  await mkdir(directory);
  for (const [name, content] of Object.entries(files))
    await writeFile(path.join(directory, name), content);
  const bundle = path.join(root, `${serial}.tar.gz`);
  await create(
    { cwd: directory, gzip: true, file: bundle },
    Object.keys(files),
  );
  return bundle;
}
const row = (
  time: string | number,
  msg: string,
  level = 'info',
  requestId = 'request-fixture',
) => JSON.stringify({ time, msg, level, requestId }) + '\n';

describe('本地诊断时间线', () => {
  it('无服务端连接地跨文件和外部排序分片合并日志，标出来源并再次脱敏', async () => {
    const source =
      row('2026-11-01T03:00:00Z', 'api_key=fixture-sensitive-value') +
      row('2026-11-01T01:00:00Z', 'early') +
      'invalid\n' +
      row('2026-11-01T02:00:00Z', 'middle').repeat(60000);
    const bundle = await archive({
      'runner.log': source,
      'server.jsonl': row(Date.parse('2026-11-01T00:00:00Z'), 'first'),
      'environment.json': '{}',
    });
    const out = path.join(root, 'timeline.jsonl');
    const result = await diagnosticsTimeline({ bundle, out });
    const text = await readFile(out, 'utf8');
    const lines = text
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    expect(result.entries).toBe(60003);
    expect(result.omitted).toBe(1);
    expect(lines[0].msg).toBe('first');
    expect(lines[1].msg).toBe('early');
    expect(lines.at(-1).time).toBe('2026-11-01T03:00:00.000Z');
    expect(lines.at(-1).source).toBe('runner.log');
    expect(text).not.toContain('fixture-sensitive-value');
    expect(
      (await readdir(root)).some((file) =>
        file.startsWith('.diagnostics-timeline-'),
      ),
    ).toBe(false);
  });
  it('按最低级别及请求 ID 筛选，并拒绝覆盖已有文件', async () => {
    const bundle = await archive({
      'request.log':
        row('2026-11-01T00:00:00Z', 'info') +
        row('2026-11-01T00:00:01Z', 'error', 'error') +
        row('2026-11-01T00:00:02Z', 'other', 'error', 'other'),
    });
    const out = path.join(root, 'filtered.jsonl');
    expect(
      (
        await diagnosticsTimeline({
          bundle,
          out,
          level: 'warn',
          requestId: 'request-fixture',
        })
      ).entries,
    ).toBe(1);
    const before = await readFile(out, 'utf8');
    expect(before).toContain('error');
    await expect(diagnosticsTimeline({ bundle, out })).rejects.toMatchObject({
      code: 'EEXIST',
    });
    expect(await readFile(out, 'utf8')).toBe(before);
  });
  it.each(['../outside.log', '/absolute.log', 'safe.log'])(
    '拒绝不安全路径或过大的解压声明：%s',
    async (name) => {
      const bundle = path.join(root, `unsafe-${serial++}.tar.gz`);
      const header = new Header({
        path: name,
        type: 'File',
        size: name === 'safe.log' ? 600 * 1024 ** 2 : 0,
      });
      header.encode();
      await writeFile(
        bundle,
        gzipSync(Buffer.concat([header.block!, Buffer.alloc(1024)])),
      );
      const out = `${bundle}.jsonl`;
      await expect(diagnosticsTimeline({ bundle, out })).rejects.toThrow();
      expect(await stat(out).catch(() => null)).toBeNull();
    },
  );
  it('注册静态命令，不加载登录状态或调用 fetch', async () => {
    const bundle = await archive({
      'request.log': row('2026-11-01T00:00:00Z', 'local'),
    });
    const out = path.join(root, 'native.jsonl');
    let requests = 0;
    const server = createServer((_request, response) => {
      requests++;
      response.writeHead(403);
      response.end();
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    try {
      const address = server.address() as { port: number };
      const result = await cli(
        ['diagnostics', 'timeline', bundle, '--out', out],
        cliEnv(path.join(root, 'cli-home'), {
          ACME_SERVER: `http://127.0.0.1:${address.port}`,
        }),
      );
      expect({ code: result.code, stderr: result.stderr }).toMatchObject({
        code: 0,
        stderr: '',
      });
      expect(await stat(out)).toBeDefined();
      expect(requests).toBe(0);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
