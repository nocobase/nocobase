import { mkdtemp, rm, readFile, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRunnerDiagnostics } from '../server/runners/diagnostics.js';
import { createHarness, type Harness } from './harness.js';
import { HEADERS, type DiagnosticsRequest } from '@nocobase/agent-protocol';
const roots: string[] = [];
let harness: Harness | undefined;
afterEach(async () => {
  await harness?.close();
  harness = undefined;
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});
const window = {
  since: '2026-11-01T00:00:00Z',
  until: '2026-11-02T00:00:00Z',
  runIds: [],
};
const env = {
  type: 'environment',
  version: 'fixture',
  os: 'linux',
  release: 'fixture',
  arch: 'x64',
  node: 'fixture',
  tools: [],
};
const file = 'runner.2026-11-01.000000.log';
const record = {
  type: 'log',
  file,
  entry: {
    time: '2026-11-01T12:00:00Z',
    level: 'error',
    msg: 'inputTokens=1234 api_key=fixture-sensitive-value',
    inputTokens: 1234,
    tokensUsed: '9000',
    requestId: 'request-fixture',
  },
};
const manifest = {
  type: 'manifest',
  files: [
    {
      file,
      dates: ['2026-11-01'],
      bytes: 1,
      truncated: false,
      omittedLines: 0,
    },
  ],
  truncated: false,
};
async function* body(records: unknown[]) {
  yield gzipSync(
    records
      .map((record) =>
        typeof record === 'string' ? record : JSON.stringify(record),
      )
      .join('\n') + '\n',
  );
}
async function directory() {
  const root = await mkdtemp(
    path.join(os.tmpdir(), 'runner-diagnostics-server-'),
  );
  roots.push(root);
  return root;
}
async function take(
  service: ReturnType<typeof createRunnerDiagnostics>,
  id: string,
) {
  let request: DiagnosticsRequest | undefined;
  await vi.waitFor(
    () => {
      request ??= service.take(id);
      expect(request).toBeDefined();
    },
    { interval: 1 },
  );
  return request!;
}

describe('执行机上传边界', () => {
  it('宿主范围外的在线执行机不获请求、不能上传，也不挤占收集预算', async () => {
    const list = vi.fn(async () => [
      { id: 'other-personal', status: 'online', features: ['diagnostics'] },
      { id: 'chosen', status: 'online', features: ['diagnostics'] },
    ]);
    const service = createRunnerDiagnostics(list);
    const collecting = service.collect({
      runnerIds: ['chosen', 'chosen'],
      directory: await directory(),
      window,
      maxTotalBytes: 131072,
    });
    const request = await take(service, 'chosen');
    expect(request.maxBytes).toBe(131072);
    expect(service.take('other-personal')).toBeUndefined();
    await expect(
      service.accept(
        'other-personal',
        request.requestId,
        body([env, record, manifest]),
      ),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
    await service.accept(
      'chosen',
      request.requestId,
      body([env, record, manifest]),
    );
    const result = await collecting;
    expect(result.runners.map((item) => item.runnerId)).toEqual(['chosen']);
    expect(list).toHaveBeenCalledTimes(1);
    await result.dispose();
  });
  it('空执行机范围不下发请求，缺少范围不能退回全量收集', async () => {
    const service = createRunnerDiagnostics(async () => [
      { id: 'one', status: 'online', features: ['diagnostics'] },
    ]);
    const directoryPath = await directory();
    for (const runnerIds of [undefined, [''], [1]]) {
      await expect(
        service.collect({
          runnerIds: runnerIds as never,
          directory: directoryPath,
          window,
        }),
      ).rejects.toMatchObject({ status: 'INVALID_ARGUMENT' });
    }
    const result = await service.collect({
      runnerIds: [],
      directory: directoryPath,
      window,
    });
    expect(result.runners).toEqual([]);
    expect(service.take('one')).toBeUndefined();
    await result.dispose();
  });
  it('只消费指定执行机的一次请求，服务端再次脱敏并按真实字节生成清单', async () => {
    const service = createRunnerDiagnostics(async () => [
      { id: 'online', status: 'online', features: ['diagnostics'] },
      { id: 'offline', status: 'offline', features: [] },
      { id: 'old', status: 'online', features: [] },
    ]);
    const collecting = service.collect({
      runnerIds: ['online', 'offline', 'old'],
      directory: await directory(),
      window,
    });
    const request = await take(service, 'online');
    expect(service.take('online')).toBeUndefined();
    await expect(
      service.accept('other', request.requestId, body([env, record, manifest])),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
    await service.accept(
      'online',
      request.requestId,
      body([env, record, manifest]),
    );
    await expect(
      service.accept('online', request.requestId, body([])),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
    const result = await collecting;
    expect(result.runners.map((runner) => runner.status)).toEqual([
      'collected',
      'offline',
      'unsupported',
    ]);
    const saved = await readFile(
      path.join(result.runners[0].directory!, file),
      'utf8',
    );
    expect(saved).not.toContain('fixture-sensitive-value');
    expect(saved).toContain('request-fixture');
    expect(JSON.parse(saved)).toMatchObject({
      inputTokens: 1234,
      tokensUsed: '9000',
    });
    expect(saved).toContain('inputTokens=1234');
    expect(result.runners[0].files![0].bytes).toBe(Buffer.byteLength(saved));
    await expect(
      service.collect({
        runnerIds: ['online'],
        directory: result.directory,
        window,
      }),
    ).rejects.toMatchObject({ code: 409 });
    await result.dispose();
    expect(await stat(result.directory).catch(() => null)).toBeNull();
    await result.dispose();
  });
  it.each([
    [
      '路径穿越',
      [env, { ...record, file: '../credentials.json' }, manifest],
      'INVALID_ARGUMENT',
    ],
    [
      '未请求日期',
      [env, { ...record, file: 'runner.2026-01-01.000000.log' }, manifest],
      'INVALID_ARGUMENT',
    ],
    ['缺少终止清单', [env, record], 'INVALID_ARGUMENT'],
    ['清单后还有日志', [env, manifest, record], 'INVALID_ARGUMENT'],
    ['超长单行', [env, 'x'.repeat(70000)], 'RESOURCE_EXHAUSTED'],
    [
      '解压膨胀',
      [
        env,
        ...Array.from({ length: 100 }, () => ({
          ...record,
          entry: { ...record.entry, msg: 'x'.repeat(4000) },
        })),
      ],
      'RESOURCE_EXHAUSTED',
    ],
  ] as const)(
    '%s 上传被拒绝并清除临时内容',
    async (_title, records, status) => {
      const service = createRunnerDiagnostics(async () => [
        { id: 'one', status: 'online', features: ['diagnostics'] },
      ]);
      const collecting = service.collect({
        runnerIds: ['one'],
        directory: await directory(),
        window,
        maxTotalBytes: 131072,
      });
      const request = await take(service, 'one');
      await expect(
        service.accept('one', request.requestId, body([...records])),
      ).rejects.toMatchObject({ status });
      const result = await collecting;
      expect(result.runners[0].status).toBe(
        status === 'RESOURCE_EXHAUSTED' ? 'too_large' : 'failed',
      );
      await result.dispose();
    },
  );
  it('选中运行超过 64 份日志仍全部接收，清单保留全部来源', async () => {
    const service = createRunnerDiagnostics(async () => [
      { id: 'one', status: 'online', features: ['diagnostics'] },
    ]);
    const selectedWindow = {
      ...window,
      runIds: Array.from({ length: 20 }, (_, index) => `chosen-${index}`),
    };
    const collecting = service.collect({
      runnerIds: ['one'],
      directory: await directory(),
      window: selectedWindow,
    });
    const request = await take(service, 'one');
    const selectedNames = selectedWindow.runIds.flatMap((id) =>
      ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'].map(
        (date) => `runs/${date}/${id}.log`,
      ),
    );
    const names = [
      ...selectedNames,
      ...Array.from(
        { length: 64 },
        (_, index) => `runs/2026-11-01/ordinary-${index}.log`,
      ),
    ];
    names[79] = names[79].replace(/\.log$/, '.stderr');
    const logs = names.map((file) => ({ ...record, file }));
    const summary = {
      type: 'manifest',
      files: names.map((file) => ({
        ...manifest.files[0],
        file,
        dates: [file.split('/')[1]],
      })),
      truncated: false,
    };
    await service.accept(
      'one',
      request.requestId,
      body([env, ...logs, summary]),
    );
    const result = await collecting;
    expect(result.runners[0].status).toBe('collected');
    expect(result.runners[0].files).toHaveLength(144);
    expect(
      await readFile(
        path.join(result.runners[0].directory!, names.at(-1)!),
        'utf8',
      ),
    ).toContain('request-fixture');
    await result.dispose();
  });
  it('压缩输入也有独立上限，断流不能留下可下载的部分内容', async () => {
    for (const disconnect of [false, true]) {
      const service = createRunnerDiagnostics(async () => [
        { id: 'one', status: 'online', features: ['diagnostics'] },
      ]);
      const collecting = service.collect({
        runnerIds: ['one'],
        directory: await directory(),
        window,
        maxTotalBytes: 131072,
      });
      const request = await take(service, 'one');
      async function* input() {
        if (disconnect) {
          yield gzipSync(JSON.stringify(env) + '\n');
          throw new Error('Disconnected');
        }
        yield Buffer.alloc(131073);
      }
      await expect(
        service.accept('one', request.requestId, input()),
      ).rejects.toBeDefined();
      const result = await collecting;
      expect(result.runners[0].status).toBe(
        disconnect ? 'failed' : 'too_large',
      );
      await result.dispose();
    }
  });
  it('离线与超时均返回跳过原因，同时最多向两台执行机下发请求', async () => {
    const service = createRunnerDiagnostics(async () =>
      ['one', 'two', 'three'].map((id) => ({
        id,
        status: 'online' as const,
        features: ['diagnostics'] as const,
      })),
    );
    const collecting = service.collect({
      runnerIds: ['one', 'two', 'three'],
      directory: await directory(),
      window,
      timeoutMs: 100,
    });
    const first = await take(service, 'one');
    await take(service, 'two');
    expect(service.take('three')).toBeUndefined();
    const result = await collecting;
    expect(result.runners.every((runner) => runner.status === 'timeout')).toBe(
      true,
    );
    await expect(
      service.accept('one', first.requestId, body([env, record, manifest])),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
    await result.dispose();
  });
  it('真实路由拒绝未登录、会话和错误执行机，仅接受合法执行机的一次上传', async () => {
    harness = await createHarness();
    const runner = await harness.registerRunner({ features: ['diagnostics'] });
    const other = await harness.registerRunner({ features: ['diagnostics'] });
    const collecting = harness.services.diagnostics.collect({
      runnerIds: [runner.runnerId],
      directory: await directory(),
      window,
    });
    const request = await take(harness.services.diagnostics, runner.runnerId);
    const url = `/agents/runners/diagnostics/${request.requestId}`;
    const payload = gzipSync(
      [env, record, manifest].map((item) => JSON.stringify(item)).join('\n') +
        '\n',
    );
    for (const headers of [
      {},
      { 'x-test-user': 'owner' },
      { [HEADERS.runnerKey]: 'invalid' },
    ]) {
      const response = await harness.app.request(url, {
        method: 'POST',
        headers: { 'content-type': 'application/gzip', ...headers },
        body: payload,
      });
      expect(response.status).toBe(401);
    }
    const wrong = await harness.app.request(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/gzip',
        [HEADERS.runnerKey]: other.key,
      },
      body: payload,
    });
    expect(wrong.status).toBe(403);
    expect(harness.services.diagnostics.take(other.runnerId)).toBeUndefined();
    const response = await harness.app.request(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/gzip',
        [HEADERS.runnerKey]: runner.key,
      },
      body: payload,
    });
    expect(response.status).toBe(200);
    const result = await collecting;
    expect(result.runners.every((item) => item.status === 'collected')).toBe(
      true,
    );
    expect(result.runners.map((item) => item.runnerId)).toEqual([
      runner.runnerId,
    ]);
    await result.dispose();
  });
});
