import {
  mkdir,
  writeFile,
  readFile,
  stat,
  readdir,
  open,
} from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { create, Header } from 'tar';
import { gzipSync } from 'node:zlib';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { logsTimeline } from '../src/logs.ts';
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
    const probe = await open(path.join(root, 'write-probe'), 'wx', 0o600);
    const writes = vi.spyOn(Object.getPrototypeOf(probe), 'writeFile');
    let result;
    try {
      result = await logsTimeline({ bundle, out });
      // Both the sorted chunks and final output must batch disk writes.
      const outputBytes = (await stat(out)).size;
      expect(writes.mock.calls.length).toBeLessThanOrEqual(
        2 * Math.ceil(outputBytes / (64 * 1024)) + 8,
      );
      expect(writes.mock.calls.length).toBeGreaterThan(2);
    } finally {
      writes.mockRestore();
      await probe.close();
    }
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
      (await readdir(root)).some((file) => file.startsWith('.logs-timeline-')),
    ).toBe(false);
  });
  it('批量写盘失败时删除部分输出并清理排序分片', async () => {
    const bundle = await archive({
      'runner.log': row('2026-11-01T00:00:00Z', 'record').repeat(2000),
    });
    const out = path.join(root, 'failed-write.jsonl');
    const probe = await open(path.join(root, 'failure-probe'), 'wx', 0o600);
    const prototype = Object.getPrototypeOf(probe);
    const original = prototype.writeFile;
    let outputWrites = 0;
    const writes = vi
      .spyOn(prototype, 'writeFile')
      .mockImplementation(function (this: typeof probe, ...args: unknown[]) {
        // Fail after one successful batch has reached the final output.
        if (existsSync(out) && ++outputWrites === 2)
          return Promise.reject(new Error('disk write failed'));
        return original.apply(this, args);
      });
    try {
      await expect(logsTimeline({ bundle, out })).rejects.toThrow(
        'disk write failed',
      );
      expect(await stat(out).catch(() => null)).toBeNull();
      expect(
        (await readdir(root)).some((file) =>
          file.startsWith('.logs-timeline-'),
        ),
      ).toBe(false);
    } finally {
      writes.mockRestore();
      await probe.close();
    }
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
        await logsTimeline({
          bundle,
          out,
          level: 'warn',
          requestId: 'request-fixture',
        })
      ).entries,
    ).toBe(1);
    const before = await readFile(out, 'utf8');
    expect(before).toContain('error');
    await expect(logsTimeline({ bundle, out })).rejects.toMatchObject({
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
      await expect(logsTimeline({ bundle, out })).rejects.toThrow();
      expect(await stat(out).catch(() => null)).toBeNull();
    },
  );
  it('原生 fd 文件转换后的 JSON 记录也可合并时间线', async () => {
    const bundle = await archive({
      'worker.stderr': row('2026-11-01T00:00:00Z', 'native crash'),
    });
    const out = path.join(root, 'stderr.jsonl');
    expect((await logsTimeline({ bundle, out })).entries).toBe(1);
    expect(JSON.parse((await readFile(out, 'utf8')).trim()).source).toBe(
      'worker.stderr',
    );
  });
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
        ['logs', 'timeline', bundle, '--out', out],
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

describe('日志导出命令', () => {
  it('通过真实 HTTP 流下载同一包并按清单输出英文来源结果', async () => {
    const bundle = await archive({
      'app.log': row('2026-11-01T00:00:00Z', 'streamed'),
      'manifest.json': JSON.stringify({
        sources: [
          { name: 'app logs', status: 'complete', bytes: 13002342 },
          {
            name: 'runner-fixture',
            status: 'truncated',
            bytes: 20 * 1024 ** 2,
          },
          { name: 'offline-fixture', status: 'offline' },
        ],
      }),
    });
    const payload = await readFile(bundle);
    const requests: { url: string; body: Record<string, unknown> }[] = [];
    const server = createServer(async (request, response) => {
      if (request.url === '/test/api/swagger') {
        response.setHeader('content-type', 'application/json');
        response.end(
          JSON.stringify({
            paths: {
              '/api/logs/export': { post: { operationId: 'logsExport' } },
            },
          }),
        );
        return;
      }
      if (request.url === '/test/api/logs/export') {
        let body = '';
        for await (const chunk of request) body += chunk;
        requests.push({ url: request.url, body: JSON.parse(body) });
        response.writeHead(200, {
          'content-type': 'application/gzip',
          'content-disposition': 'attachment; filename="studio-logs.tar.gz"',
        });
        response.write(payload.subarray(0, 50));
        setImmediate(() => response.end(payload.subarray(50)));
        return;
      }
      response.writeHead(404);
      response.end();
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    try {
      const { port } = server.address() as { port: number };
      const out = path.join(root, 'exported.tar.gz');
      const result = await cli(
        [
          'logs',
          'export',
          '--days',
          '14',
          '--runner',
          'runner-fixture',
          '--app-log',
          '--out',
          out,
        ],
        cliEnv(path.join(root, 'export-home'), {
          ACME_SERVER: `http://127.0.0.1:${port}/test`,
          ACME_API_KEY: 'fixture-key',
        }),
      );
      expect({ code: result.code, stderr: result.stderr }).toEqual({
        code: 0,
        stderr: '',
      });
      expect(result.stdout).toMatch(/app logs\s+complete\s+12\.4 MB/);
      expect(result.stdout).toMatch(/runner-fixture\s+truncated\s+20\.0 MB/);
      expect(result.stdout).toMatch(/offline-fixture\s+offline/);
      expect(result.stdout).toContain('Saved');
      expect(await readFile(out)).toEqual(payload);
      expect(requests).toHaveLength(1);
      expect(requests[0].body).toMatchObject({
        runners: ['runner-fixture'],
        appLog: true,
        requestLog: false,
      });
      expect(requests[0].body).not.toHaveProperty('bundleId');
      expect(requests[0].body).not.toHaveProperty('issues');
      const jsonOut = path.join(root, 'exported-json.tar.gz');
      const json = await cli(
        ['logs', 'export', '--out', jsonOut, '--json'],
        cliEnv(path.join(root, 'export-json-home'), {
          ACME_SERVER: `http://127.0.0.1:${port}/test`,
          ACME_API_KEY: 'fixture-key',
        }),
      );
      expect(json.code).toBe(0);
      expect(JSON.parse(json.stdout)).toMatchObject({
        ok: true,
        command: 'logs export',
        result: {
          data: {
            sources: [
              { name: 'app logs', status: 'complete', bytes: 13002342 },
              { name: 'runner-fixture', status: 'truncated', bytes: 20971520 },
              { name: 'offline-fixture', status: 'offline' },
            ],
          },
        },
      });
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
  it('本地时间线排除数据库运行记录，日期参数按本地整日校验', async () => {
    const { logsExportInput } = await import('../src/logs.ts');
    const now = new Date(2026, 10, 16, 12);
    expect(logsExportInput({ days: 3, out: 'unused' }, now)).toMatchObject({
      since: new Date(2026, 10, 14).toISOString(),
      until: new Date(2026, 10, 17).toISOString(),
      appLog: true,
      requestLog: true,
    });
    expect(logsExportInput({ days: 14, out: 'unused' }, now)).toMatchObject({
      since: new Date(2026, 10, 3).toISOString(),
      until: new Date(2026, 10, 17).toISOString(),
    });
    expect(
      logsExportInput(
        { since: '2026-11-03', until: '2026-11-16', out: 'unused' },
        now,
      ),
    ).toMatchObject({ since: new Date(2026, 10, 3).toISOString() });
    for (const options of [
      { days: 0 },
      { days: 1.5 },
      { days: Number.MAX_SAFE_INTEGER },
      { days: 3, since: '2026-11-15', until: '2026-11-16' },
      { since: '2026-11-15' },
      { since: '2026-11-16', until: '2026-11-15' },
      { since: '2026-11-16', until: '2026-11-17' },
      { since: '2026-02-31', until: '2026-11-16' },
    ])
      expect(() =>
        logsExportInput({ ...options, out: 'unused' }, now),
      ).toThrow();
    const bundle = await archive({
      'events.jsonl': row('2026-11-01T00:00:00Z', 'database event'),
      'app.log': row('2026-11-01T00:00:01Z', 'log'),
    });
    const out = path.join(root, 'logs-only.jsonl');
    expect((await logsTimeline({ bundle, out })).entries).toBe(1);
    expect(await readFile(out, 'utf8')).not.toContain('database event');
  });
});
