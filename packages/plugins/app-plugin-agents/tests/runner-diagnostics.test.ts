import { mkdtemp, rm, readFile, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRunnerDiagnostics as createService } from '../server/runners/diagnostics.js';
import { createHarness, type Harness } from './harness.js';
import { HEADERS, type DiagnosticsRequest } from '@nocobase/agent-protocol';
const roots: string[] = [];
const saved = new Map<string, string>();
const onFile: Parameters<
  ReturnType<typeof createService>['collect']
>[0]['onFile'] = async (file) => {
  saved.set(`${file.runnerId}/${file.file}`, await readFile(file.path, 'utf8'));
};
function createRunnerDiagnostics(...args: Parameters<typeof createService>) {
  const service = createService(...args);
  return {
    ...service,
    collect(options: Omit<Parameters<typeof service.collect>[0], 'onFile'>) {
      return service.collect({ ...options, onFile });
    },
  };
}
let harness: Harness | undefined;
afterEach(async () => {
  saved.clear();
  await harness?.close();
  harness = undefined;
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});
const window = {
  since: '2026-11-01T00:00:00Z',
  until: '2026-11-02T00:00:00Z',
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
  it('服务端统一处理原始崩溃输出、跨行私钥和旧日志中的未脱敏字段', async () => {
    const service = createRunnerDiagnostics(async () => [
      { id: 'one', status: 'online', features: ['diagnostics'] },
    ]);
    const collecting = service.collect({
      runnerIds: ['one'],
      directory: await directory(),
      window,
    });
    const request = await take(service, 'one');
    const name = 'runs/2026-11-01/selected.stderr';
    const logs = [
      'native api_key=fixture-sensitive-value',
      '-----BEGIN PRIVATE KEY-----',
      'private-body-fixture',
      '-----END PRIVATE KEY-----',
      'final stack',
    ].map((msg) => ({
      ...record,
      file: name,
      entry: { ...record.entry, password: 'old-log-fixture', msg },
    }));
    await service.accept(
      'one',
      request.requestId,
      body([
        env,
        ...logs,
        { ...manifest, files: [{ ...manifest.files[0], file: name }] },
      ]),
    );
    await collecting;
    const text = saved.get(`one/${name}`)!;
    expect(text).not.toContain('fixture-sensitive-value');
    expect(text).not.toContain('private-body-fixture');
    expect(text).not.toContain('old-log-fixture');
    expect(text).toContain('final stack');
  });
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
    const text = saved.get(`online/${file}`)!;
    expect(text).not.toContain('fixture-sensitive-value');
    expect(text).toContain('request-fixture');
    expect(JSON.parse(text)).toMatchObject({
      inputTokens: 1234,
      tokensUsed: '9000',
    });
    expect(text).toContain('inputTokens=1234');
    expect(result.runners[0].files![0].bytes).toBe(Buffer.byteLength(text));
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
    },
  );
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
    }
  });
  it('离线与超时均返回跳过原因，多台执行机均可领取后依次上传', async () => {
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
    await take(service, 'three');
    const result = await collecting;
    expect(result.runners.every((runner) => runner.status === 'timeout')).toBe(
      true,
    );
    await expect(
      service.accept('one', first.requestId, body([env, record, manifest])),
    ).rejects.toMatchObject({ status: 'PERMISSION_DENIED' });
  });
  it('真实路由拒绝未登录、会话和错误执行机，仅接受合法执行机的一次上传', async () => {
    harness = await createHarness();
    const runner = await harness.registerRunner({ features: ['diagnostics'] });
    const other = await harness.registerRunner({ features: ['diagnostics'] });
    const collecting = harness.services.diagnostics.collect({
      runnerIds: [runner.runnerId],
      directory: await directory(),
      window,
      onFile,
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
  });
});

describe('流式收集', () => {
  it('逐文件消费后删除，同一导出两台执行机上传不积存文件，报告真实进度', async () => {
    const service = createService(async () =>
      ['one', 'two'].map((id) => ({
        id,
        status: 'online' as const,
        features: ['diagnostics'],
      })),
    );
    const root = await directory();
    const progress: { runnerId: string; status: string; bytes: number }[] = [];
    const names: string[] = [];
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    let entered!: () => void;
    const first = new Promise<void>((resolve) => {
      entered = resolve;
    });
    let calls = 0;
    const collecting = service.collect({
      runnerIds: ['one', 'two'],
      window,
      directory: root,
      onProgress: (event) => progress.push(event),
      onFile: async (file) => {
        const temporary = path.dirname(file.path);
        expect(await readdir(temporary)).toEqual(['current']);
        expect((await readFile(file.path)).length).toBe(file.bytes);
        names.push(`${file.runnerId}/${file.file}`);
        if (++calls === 1) {
          entered();
          await blocked;
        }
      },
    });
    const one = await take(service, 'one');
    const two = await take(service, 'two');
    const uploadOne = service.accept(
      'one',
      one.requestId,
      body([env, record, manifest]),
    );
    await first;
    const uploadTwo = service.accept(
      'two',
      two.requestId,
      body([env, record, manifest]),
    );
    expect(names).toEqual(['one/environment.json']);
    release();
    await Promise.all([uploadOne, uploadTwo]);
    const result = await collecting;
    expect(
      result.runners.every((runner) => runner.status === 'collected'),
    ).toBe(true);
    expect(names).toEqual([
      'one/environment.json',
      `one/${file}`,
      'two/environment.json',
      `two/${file}`,
    ]);
    expect(await readdir(root)).toEqual([]);
    for (const runnerId of ['one', 'two']) {
      const events = progress.filter((event) => event.runnerId === runnerId);
      expect(events.map((event) => event.status)).toEqual([
        'waiting',
        'uploading',
        'collected',
      ]);
      expect(events.at(-1)!.bytes).toBeGreaterThan(0);
    }
  });
  it('两次导出可并发，同一执行机按队列领取，互不删除文件或等待其他导出结束', async () => {
    const service = createService(async () => [
      { id: 'one', status: 'online', features: ['diagnostics'] },
    ]);
    const root = await directory();
    const options = { runnerIds: ['one'], window, directory: root, onFile };
    const first = service.collect(options);
    const one = await take(service, 'one');
    const second = service.collect(options);
    expect(service.take('one')).toBeUndefined();
    await service.accept('one', one.requestId, body([env, record, manifest]));
    expect((await first).runners[0].status).toBe('collected');
    const two = await take(service, 'one');
    expect(two.requestId).not.toBe(one.requestId);
    await service.accept('one', two.requestId, body([env, record, manifest]));
    expect((await second).runners[0].status).toBe('collected');
    expect(await readdir(root)).toEqual([]);
  });
  it('连接中止时停止消费并清除全部临时文件，队列请求不再可领取', async () => {
    const service = createService(async () => [
      { id: 'one', status: 'online', features: ['diagnostics'] },
    ]);
    const controller = new AbortController();
    const root = await directory();
    let entered!: () => void;
    const consumed = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const collecting = service.collect({
      runnerIds: ['one'],
      window,
      directory: root,
      signal: controller.signal,
      onFile: async (file) => {
        entered();
        await new Promise<void>((_resolve, reject) =>
          file.signal.addEventListener(
            'abort',
            () => reject(file.signal.reason),
            { once: true },
          ),
        );
      },
    });
    const expected = collecting.catch((error) => error);
    const request = await take(service, 'one');
    const uploading = service.accept(
      'one',
      request.requestId,
      body([env, record, manifest]),
    );
    const rejectedUpload = uploading.catch((error) => error);
    await consumed;
    controller.abort();
    expect(await expected).toBeInstanceOf(Error);
    expect(await rejectedUpload).toBeInstanceOf(Error);
    expect(await readdir(root)).toEqual([]);
    expect(service.take('one')).toBeUndefined();
  });
  it.each(['interleaved', 'outside-date', 'outside-run', 'sink-error'])(
    '拒绝 %s 并在消费失败时清理',
    async (reason) => {
      const service = createService(async () => [
        { id: 'one', status: 'online', features: ['diagnostics'] },
      ]);
      const root = await directory();
      const collecting = service.collect({
        runnerIds: ['one'],
        window: { ...window, runIds: ['chosen'] },
        directory: root,
        onFile: async () => {
          if (reason === 'sink-error') throw new Error('sink failed');
        },
      });
      const request = await take(service, 'one');
      const bad = {
        ...record,
        file:
          reason === 'outside-date'
            ? 'runs/2026-10-01/chosen.log'
            : reason === 'outside-run'
              ? 'runs/2026-11-01/other.log'
              : 'runs/2026-11-01/chosen.log',
      };
      const records =
        reason === 'interleaved'
          ? [env, record, bad, record, manifest]
          : [env, bad, manifest];
      await expect(
        service.accept('one', request.requestId, body(records)),
      ).rejects.toBeDefined();
      expect((await collecting).runners[0].status).toBe('failed');
      expect(await readdir(root)).toEqual([]);
    },
  );
});

describe('收集回调边界', () => {
  it('进度回调失败也结束所有排队请求并清理目录', async () => {
    const service = createService(async () => [
      { id: 'offline', status: 'offline', features: [] },
      { id: 'online', status: 'online', features: ['diagnostics'] },
    ]);
    const root = await directory();
    await expect(
      service.collect({
        runnerIds: ['offline', 'online'],
        window,
        directory: root,
        onFile,
        onProgress() {
          throw new Error('progress failed');
        },
      }),
    ).rejects.toThrow('progress failed');
    expect(service.take('online')).toBeUndefined();
    expect(await readdir(root)).toEqual([]);
  });
  it('大文件批量写入受反压约束，不为每条记录写盘', async () => {
    const service = createService(async () => [
      { id: 'one', status: 'online', features: ['diagnostics'] },
    ]);
    const root = await directory();
    const { open } = await import('node:fs/promises');
    const probe = await open(path.join(root, 'probe'), 'wx');
    const writes = vi.spyOn(Object.getPrototypeOf(probe), 'writeFile');
    try {
      const collecting = service.collect({
        runnerIds: ['one'],
        window,
        directory: root,
        onFile: async (file) => {
          expect((await readFile(file.path)).length).toBe(file.bytes);
        },
      });
      const request = await take(service, 'one');
      const rows = Array.from({ length: 2000 }, () => ({
        ...record,
        entry: { ...record.entry, msg: 'log'.repeat(300) },
      }));
      await service.accept(
        'one',
        request.requestId,
        body([env, ...rows, manifest]),
      );
      const result = await collecting;
      expect(result.runners[0].status).toBe('collected');
      const bytes = result.runners[0].files![0].bytes;
      expect(writes.mock.calls.length).toBeLessThanOrEqual(
        Math.ceil(bytes / (64 * 1024)) + 2,
      );
      expect(writes.mock.calls.length).toBeGreaterThan(2);
    } finally {
      writes.mockRestore();
      await probe.close();
    }
  });
});
