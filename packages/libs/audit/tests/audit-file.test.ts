import { chmodSync, unlinkSync } from 'node:fs';
import { FileAuditOutput } from '../src/file-output.js';
import { AuditProvider } from '../src/runtime.js';
import {
  mkdtemp,
  readFile,
  readdir,
  mkdir,
  link,
  symlink,
  utimes,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { Application } from '@nocobase/app-server/application';
import {
  auditServiceToken,
  defineAuditConfig,
  describeAudit,
  type AuditConfig,
  type AuditEvent,
} from '../src/index.js';
import { LoggingProvider, loggingToken } from '@nocobase/app-server/logging';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { defineApiRoutes } from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { RotatingFileStream } from 'rotating-file-stream';
import {
  ServiceProvider,
  type ServiceProviderConstructor,
} from '@nocobase/service-provider';
import { expect, it, vi } from 'vitest';

vi.mock('node:fs', { spy: true });

async function start(
  rootDir: string,
  audit: AuditConfig | string,
  providers: readonly ServiceProviderConstructor<Application>[] = [],
  silent = false,
): Promise<Application> {
  const config = new AppConfig();
  const defaults = defineAuditConfig();
  if (typeof audit === 'string') config.loadFile(audit);
  await config.loadAll();
  config.mergeDefaults({
    app: { name: 'audit-test' },
    audit: typeof audit === 'string' ? defaults() : audit,
    logging: { level: silent ? 'silent' : 'info' },
  });
  config.defineSections(new Map([['audit', defaults.rules]]));
  const app = new Application({ config, paths: createAppPaths({ rootDir }) });
  if (silent) app.addServiceProvider(LoggingProvider);
  app.addServiceProviders(providers);
  app.addServiceProvider(AuditProvider);
  app.addRoutes(
    defineApiRoutes(() => {
      const router = new Hono();
      router.post(
        '/example',
        describeAudit({ action: 'test:example', captureBody: true }),
        (context) => context.json({ data: 'done' }),
      );
      return router;
    }),
  );
  return app;
}

function send(app: Application, requestId: string): Promise<Response> {
  return app.fetch(
    new Request('http://localhost/api/example', {
      method: 'POST',
      headers: {
        'x-request-id': requestId,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        password: 'not-for-the-log',
        profile: { privateCode: 'private-code', label: 'visible' },
      }),
    }),
  );
}

async function segmentPaths(file: string): Promise<string[]> {
  const directory = path.dirname(file);
  const prefix = path.basename(file, '.jsonl') + '.';
  return (await readdir(directory))
    .sort()
    .filter((name) => name.startsWith(prefix) && name.endsWith('.jsonl'))
    .map((name) => path.join(directory, name));
}

async function lines(file: string): Promise<AuditEvent[]> {
  const text = (
    await Promise.all(
      (await segmentPaths(file)).map((name) => readFile(name, 'utf8')),
    )
  ).join('');
  expect(text.endsWith('\n')).toBe(true);
  return text
    .trimEnd()
    .split('\n')
    .map((line) => JSON.parse(line) as AuditEvent);
}

it('applies YAML settings at startup and isolates running applications', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'audit-config-'));
  const configFile = path.join(root, 'config.yml');
  const audit = `audit:
  redact:
    fields:
      - privateCode
    paths:
      - data
  transports:
    file:
      driver: file
      options:
        path: audit.jsonl
`;
  await writeFile(configFile, audit);
  const first = await start(path.join(root, 'first'), configFile);
  try {
    expect((await send(first, 'before-edit')).status).toBe(200);
    await writeFile(
      configFile,
      audit.replace('audit:\n', 'audit:\n  captureBody: false\n'),
    );
    const second = await start(path.join(root, 'second'), configFile);
    try {
      expect((await send(second, 'new-app')).status).toBe(200);
      expect((await send(first, 'original-app')).status).toBe(200);
      const [beforeEdit, originalApp] = await lines(
        first.paths.storage('audit.jsonl'),
      );
      expect(beforeEdit).toMatchObject({
        request: {
          password: '******',
          profile: { privateCode: '******', label: 'visible' },
        },
        response: { data: '******' },
      });
      expect(originalApp).toMatchObject({
        request: beforeEdit?.request,
        response: beforeEdit?.response,
      });
      const [newApp] = await lines(second.paths.storage('audit.jsonl'));
      expect(newApp?.request).toBeUndefined();
      expect(newApp?.response).toBeUndefined();
    } finally {
      await second.shutdown();
    }
  } finally {
    await first.shutdown();
    await rm(root, { recursive: true, force: true });
  }
});

it.each([
  ['captureBody: "false"', 'audit.captureBody'],
  ['redact: [{ field: "password" }]', 'audit.redact'],
  ['redact: { fields: "password" }', 'audit.redact.fields'],
  ['redact: { paths: ["  "] }', 'audit.redact.paths'],
  ['redact: { fields: [12] }', 'audit.redact.fields'],
  ['redact: { path: "data" }', 'audit.redact.path'],
])('rejects invalid audit YAML at startup: %s', async (setting, key) => {
  const root = await mkdtemp(path.join(tmpdir(), 'audit-config-invalid-'));
  const configFile = path.join(root, 'config.yml');
  await writeFile(configFile, `audit:\n  ${setting}\n`);
  const app = await start(root, configFile);
  try {
    await expect(app.start()).rejects.toThrow(key);
  } finally {
    await app.shutdown();
    await rm(root, { recursive: true, force: true });
  }
});

it('appends complete private JSON lines to multiple named destinations under concurrent requests', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'audit-file-'));
  const absolute = path.join(root, 'other', 'audit.jsonl');
  const relative = path.join(root, 'storage', 'audit', 'events.jsonl');
  const app = await start(root, {
    transports: {
      relative: {
        driver: 'file',
        options: { path: 'audit/events.jsonl', maxFileSizeMB: 0.01 },
      },
      sameFile: { driver: 'file', options: { path: relative } },
      absolute: { driver: 'file', options: { path: absolute } },
    },
  });
  try {
    const requestIds = Array.from(
      { length: 1000 },
      (_, index) => `event-${index}`,
    );
    for (let offset = 0; offset < requestIds.length; offset += 32) {
      const batch = requestIds.slice(offset, offset + 32);
      const responses = await Promise.all(
        batch.map((requestId) => send(app, requestId)),
      );
      expect(responses.map(({ status }) => status)).toEqual(
        batch.map(() => 200),
      );
    }
    const segments = await segmentPaths(relative);
    expect(segments.length).toBeGreaterThan(2);
    const primary = await lines(relative);
    const secondary = await lines(absolute);
    expect(primary).toHaveLength(2000);
    expect(secondary).toHaveLength(1000);
    expect(primary.map(({ requestId }) => requestId).sort()).toEqual(
      [...requestIds, ...requestIds].sort(),
    );
    expect(secondary.map(({ requestId }) => requestId).sort()).toEqual(
      [...requestIds].sort(),
    );
    expect(
      secondary.every(
        (event) =>
          event.request &&
          Reflect.get(event.request as object, 'password') === '******',
      ),
    ).toBe(true);
    if (process.platform !== 'win32') {
      expect((await stat(segments[0])).mode & 0o777).toBe(0o600);
      expect((await stat(path.dirname(relative))).mode & 0o777).toBe(0o700);
    }
  } finally {
    await app.shutdown();
    await rm(root, { recursive: true, force: true });
  }
});

it('resumes audit writes in the next segment after a same-day restart with an incomplete line', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'audit-file-'));
  const file = path.join(root, 'audit.jsonl');
  const config: AuditConfig = {
    transports: { audit: { driver: 'file', options: { path: file } } },
  };
  const restartTime = new Date('2026-11-26T12:00:00Z');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(restartTime);
  const damaged = path.join(root, 'audit.2026-11-26.000003.jsonl');
  const recovered = path.join(root, 'audit.2026-11-26.000004.jsonl');
  const damagedContent = '{"requestId":"earlier"}\n{"requestId":';
  const report = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const app = await start(root, config);
  try {
    await writeFile(damaged, damagedContent, { mode: 0o600 });
    await utimes(damaged, restartTime, restartTime);
    expect((await send(app, 'after-restart')).status).toBe(200);
    expect((await send(app, 'next-event')).status).toBe(200);
    await app.shutdown();
    for (let index = 0; index < 3; index++) {
      const restarted = await start(root, config);
      try {
        expect((await send(restarted, `restart-${index}`)).status).toBe(200);
      } finally {
        await restarted.shutdown();
      }
    }
    expect(await segmentPaths(file)).toEqual([damaged, recovered]);
    expect(await readFile(damaged, 'utf8')).toBe(damagedContent);
    const records = (await readFile(recovered, 'utf8')).split('\n');
    expect(records.pop()).toBe('');
    expect(records.map((record) => JSON.parse(record))).toMatchObject([
      { requestId: 'after-restart' },
      { requestId: 'next-event' },
      { requestId: 'restart-0' },
      { requestId: 'restart-1' },
      { requestId: 'restart-2' },
    ]);
    expect(report).toHaveBeenCalledExactlyOnceWith(
      'Audit file ends with an incomplete line. Destination: audit.',
    );
  } finally {
    await app.shutdown();
    report.mockRestore();
    vi.useRealTimers();
    await rm(root, { recursive: true, force: true });
  }
});

it('isolates an unsafe file and continues writing to another destination', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'audit-file-'));
  const unsafe = path.join(root, 'unsafe.jsonl');
  const good = path.join(root, 'good.jsonl');
  const linkedFile = path.join(root, 'linked.jsonl');
  const date = new Date().toISOString().slice(0, 10);
  const linkedSegment = path.join(root, `unsafe.${date}.000000.jsonl`);
  await writeFile(linkedFile, 'incomplete private content', {
    mode: 0o600,
  });
  await link(linkedFile, linkedSegment);
  const report = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const app = await start(root, {
    enabled: true,
    transports: {
      unsafe: { driver: 'file', options: { path: unsafe } },
      good: { driver: 'file', options: { path: good } },
    },
  });
  try {
    expect((await send(app, 'recoverable')).status).toBe(200);
    expect(await segmentPaths(unsafe)).toEqual([linkedSegment]);
    expect(await readFile(linkedSegment, 'utf8')).toBe(
      'incomplete private content',
    );
    expect(await lines(good)).toMatchObject([{ requestId: 'recoverable' }]);
    expect(report).toHaveBeenCalledWith(
      'Could not write audit event. Destination: unsafe.',
    );
    expect(JSON.stringify(report.mock.calls)).not.toContain(root);
  } finally {
    report.mockRestore();
    await app.shutdown();
    await rm(root, { recursive: true, force: true });
  }
});

it.each(['register', 'boot'] as const)(
  'combines file and plugin drivers registered during %s and closes transports first',
  async (phase) => {
    const root = await mkdtemp(path.join(tmpdir(), 'audit-file-'));
    const file = path.join(root, 'storage', 'audit.jsonl');
    const write = vi.fn((event: AuditEvent) => {
      Object.assign(event, { action: 'changed-by-custom' });
      throw new Error('Destination failed');
    });
    const close = vi.fn();
    const pluginShutdown = vi.fn();
    const createTransport = vi.fn(() => ({ write, close }));
    class TestTransportProvider extends ServiceProvider<Application> {
      public readonly name = 'test-transport';

      public override register(): void {
        if (phase === 'register') this.registerDriver();
      }

      public override async boot(): Promise<void> {
        if (phase === 'boot') this.registerDriver();
        expect(createTransport).not.toHaveBeenCalled();
      }

      public override async start(): Promise<void> {
        expect(createTransport).toHaveBeenCalledOnce();
      }

      public override async shutdown(): Promise<void> {
        pluginShutdown();
      }

      private registerDriver(): void {
        this.app.container.resolve(auditServiceToken).registerDriver({
          name: 'custom',
          createTransport,
        });
      }
    }
    const app = await start(
      root,
      {
        transports: {
          file: { driver: 'file', options: { path: 'audit.jsonl' } },
          custom: { driver: 'custom' },
        },
      },
      [TestTransportProvider],
    );
    const report = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    try {
      expect((await send(app, 'shared-event')).status).toBe(200);
      expect(write).toHaveBeenCalledOnce();
      expect(await lines(file)).toMatchObject([
        { requestId: 'shared-event', action: 'test:example' },
      ]);
      expect(report).toHaveBeenCalledWith(
        'Could not write audit event. Destination: custom.',
      );
      await app.shutdown();
      expect(close).toHaveBeenCalledExactlyOnceWith();
      expect(close).toHaveBeenCalledBefore(pluginShutdown);
      await rename(
        (await segmentPaths(file))[0],
        path.join(root, 'moved.jsonl'),
      );
    } finally {
      report.mockRestore();
      await app.shutdown();
      await rm(root, { recursive: true, force: true });
    }
  },
);

it('rejects invalid built-in file options during startup', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'audit-file-'));
  const app = await start(root, {
    transports: {
      file: { driver: 'file', options: { path: '../outside.jsonl' } },
    },
  });
  try {
    await expect(app.start()).rejects.toThrow(
      'Invalid configuration for audit destination "file" (driver "file").',
    );
  } finally {
    await app.shutdown();
    await rm(root, { recursive: true, force: true });
  }
});

it('registers shared retention before writing and records with application logging silenced', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'audit-file-'));
  const directory = path.join(root, 'storage');
  const archive = path.join(directory, 'audit.2020-01-01.000000.jsonl');
  await mkdir(directory);
  await writeFile(archive, '{}\n', { mode: 0o600 });
  const modified = new Date(Date.now() - 3 * 86_400_000);
  await utimes(archive, modified, modified);
  const app = await start(
    root,
    {
      transports: {
        short: {
          driver: 'file',
          options: { path: 'audit.jsonl', retentionDays: 1 },
        },
        long: {
          driver: 'file',
          options: {
            path: path.join(directory, 'audit.jsonl'),
            retentionDays: 7,
          },
        },
      },
    },
    [],
    true,
  );
  try {
    await app.start();
    expect(app.container.resolve(loggingToken).getLogger('audit').level).toBe(
      'silent',
    );
    expect((await send(app, 'shared-retention')).status).toBe(200);
    await app.shutdown();
    expect(await readFile(archive, 'utf8')).toBe('{}\n');
    const segments = (
      await segmentPaths(path.join(directory, 'audit.jsonl'))
    ).filter((file) => file !== archive);
    expect(segments).toHaveLength(1);
    const output = await readFile(segments[0], 'utf8');
    expect(
      output
        .trimEnd()
        .split('\n')
        .map((line) => JSON.parse(line)),
    ).toMatchObject([
      { requestId: 'shared-retention' },
      { requestId: 'shared-retention' },
    ]);
  } finally {
    await app.shutdown();
    await rm(root, { recursive: true, force: true });
  }
});

it('keeps oversized records intact and recovers after a failed rotation', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'audit-file-'));
  const file = path.join(root, 'rotating.jsonl');
  const good = path.join(root, 'good.jsonl');
  const report = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const app = await start(root, {
    transports: {
      rotating: {
        driver: 'file',
        options: { path: file, maxFileSizeMB: 10 / 1024 ** 2 },
      },
      good: { driver: 'file', options: { path: good } },
    },
  });
  try {
    expect((await send(app, 'first')).status).toBe(200);
    const [first, second] = await segmentPaths(file);
    expect((await stat(first)).size).toBeGreaterThan(10);
    expect(await readFile(second, 'utf8')).toBe('');
    const next = second.replace(/\.000001\.jsonl$/, '.000002.jsonl');
    await mkdir(next);
    expect(await (await send(app, 'rotation-failed')).json()).toEqual({
      data: 'done',
    });
    expect(report).toHaveBeenCalledWith(
      'Could not write audit event. Destination: rotating.',
    );
    await rm(next, { recursive: true });
    expect((await send(app, 'recovered')).status).toBe(200);
    const expected = [
      { requestId: 'first' },
      { requestId: 'rotation-failed' },
      { requestId: 'recovered' },
    ];
    expect(await lines(file)).toMatchObject(expected);
    expect(await lines(good)).toMatchObject(expected);
  } finally {
    report.mockRestore();
    await app.shutdown();
    await rm(root, { recursive: true, force: true });
  }
});

it('warns about cleanup failure without changing the HTTP result or another target', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'audit-file-'));
  const expired = path.join(root, 'broken.2020-01-01.000000.jsonl');
  await writeFile(expired, '{}\n', { mode: 0o600 });
  await utimes(expired, 0, 0);
  const report = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const app = await start(root, {
    transports: {
      broken: {
        driver: 'file',
        options: { path: path.join(root, 'broken.jsonl') },
      },
      good: {
        driver: 'file',
        options: { path: path.join(root, 'good.jsonl') },
      },
    },
  });
  vi.mocked(unlinkSync).mockImplementationOnce(() => {
    throw new Error('retention failure');
  });
  try {
    expect(await (await send(app, 'cleanup-isolated')).json()).toEqual({
      data: 'done',
    });
    await app.shutdown();
    expect(report).toHaveBeenCalledWith(
      'Could not clean up audit files. Destination: broken.',
    );
    expect(await readFile(expired, 'utf8')).toBe('{}\n');
    expect(await lines(path.join(root, 'good.jsonl'))).toMatchObject([
      { requestId: 'cleanup-isolated' },
    ]);
  } finally {
    report.mockRestore();
    await app.shutdown();
    await rm(root, { recursive: true, force: true });
  }
});

it('verifies a short append before delivering another record to the same file', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'audit-file-'));
  const file = path.join(root, 'audit.jsonl');
  const report = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const app = await start(root, {
    transports: { file: { driver: 'file', options: { path: file } } },
  });
  const append = RotatingFileStream.prototype._write;
  const short = vi.spyOn(RotatingFileStream.prototype, '_write');
  try {
    expect((await send(app, 'before-short-write')).status).toBe(200);
    const [first] = await segmentPaths(file);
    const complete = await readFile(first, 'utf8');
    short.mockImplementationOnce(function (chunk, encoding, done) {
      append.call(this, chunk.subarray(0, 10), encoding, done);
    });
    expect((await send(app, 'short-write')).status).toBe(200);
    const damaged = await readFile(first, 'utf8');
    expect(damaged.slice(0, -10)).toBe(complete);
    expect(damaged.endsWith('\n')).toBe(false);
    expect(report).toHaveBeenCalledWith(
      'Could not write audit event. Destination: file.',
    );
    expect((await send(app, 'after-short-write')).status).toBe(200);
    const [, recovered] = await segmentPaths(file);
    expect(await readFile(first, 'utf8')).toBe(damaged);
    expect(JSON.parse(await readFile(recovered, 'utf8'))).toMatchObject({
      requestId: 'after-short-write',
    });
  } finally {
    short.mockRestore();
    report.mockRestore();
    await app.shutdown();
    await rm(root, { recursive: true, force: true });
  }
});

it('bounds pending file writes and closes the stream after accepted writes settle', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'audit-file-'));
  const file = path.join(root, 'audit.jsonl');
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const overflow = Promise.withResolvers<void>();
  const report = vi.spyOn(console, 'error').mockImplementation((message) => {
    if (
      message ===
      'Audit destination has too many pending writes. Destination: file.'
    )
      overflow.resolve();
  });
  const app = await start(root, {
    transports: { file: { driver: 'file', options: { path: file } } },
  });
  const append = RotatingFileStream.prototype._write;
  const closed = vi.fn();
  const write = vi.spyOn(RotatingFileStream.prototype, '_write');
  write.mockImplementationOnce(function (chunk, encoding, done) {
    this.once('close', closed);
    entered.resolve();
    void release.promise.then(() => append.call(this, chunk, encoding, done));
  });
  try {
    await app.start();
    const requests = Array.from({ length: 65 }, (_, index) =>
      send(app, `queued-${index}`),
    );
    await entered.promise;
    await overflow.promise;
    expect(write).toHaveBeenCalledTimes(1);
    release.resolve();
    expect(
      (await Promise.all(requests)).every(({ status }) => status === 200),
    ).toBe(true);
    expect(await lines(file)).toHaveLength(64);
    await app.shutdown();
    expect(closed).toHaveBeenCalledOnce();
  } finally {
    release.resolve();
    write.mockRestore();
    report.mockRestore();
    await app.shutdown();
    await rm(root, { recursive: true, force: true });
  }
});

it('retains recent and unrelated files and prunes again on an idle UTC rollover', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'audit-file-'));
  const file = path.join(root, 'audit.jsonl');
  const now = new Date('2026-11-26T23:00:00Z');
  const retention = 180 * 86_400_000;
  const expired = path.join(root, 'audit.2025-01-01.000000.jsonl');
  const recent = path.join(root, 'audit.2025-01-01.000001.jsonl');
  const active = path.join(root, 'audit.2026-11-26.000000.jsonl');
  const next = path.join(root, 'audit.2026-11-27.000000.jsonl');
  const unrelated = [
    file,
    path.join(root, 'other.2025-01-01.000000.jsonl'),
    path.join(root, 'audit.2025-02-30.000000.jsonl'),
    path.join(root, 'audit.2025-01-01.000002.log'),
  ];
  const old = (age: number): Date => new Date(now.getTime() - age);
  for (const entry of [expired, recent, ...unrelated]) {
    await writeFile(entry, '{}\n', { mode: 0o600 });
    const modified = old(retention + (entry === recent ? -60_000 : 60_000));
    await utimes(entry, modified, modified);
  }
  const archiveLink = path.join(root, 'audit.2025-01-01.000003.jsonl');
  await link(file, archiveLink);
  const seed = '{"requestId":"seed"}\n';
  await writeFile(active, seed, { mode: 0o600 });
  await utimes(active, 0, 0);
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  vi.setSystemTime(now);
  const app = await start(root, {
    transports: { file: { driver: 'file', options: { path: file } } },
  });
  try {
    await app.start();
    await vi.waitFor(async () =>
      expect(await readdir(root)).not.toContain(path.basename(expired)),
    );
    expect(await readFile(active, 'utf8')).toBe(seed);
    expect(await readFile(recent, 'utf8')).toBe('{}\n');
    expect((await send(app, 'before-midnight')).status).toBe(200);
    expect(await readFile(active, 'utf8')).toContain(
      '"requestId":"before-midnight"',
    );
    await vi.advanceTimersByTimeAsync(3_600_000);
    await vi.waitFor(async () => expect(await readFile(next, 'utf8')).toBe(''));
    await app.shutdown();
    const remaining = await readdir(root);
    expect(remaining).not.toContain(path.basename(recent));
    expect(remaining).toEqual(
      expect.arrayContaining(
        [active, next, archiveLink, ...unrelated].map((entry) =>
          path.basename(entry),
        ),
      ),
    );
  } finally {
    await app.shutdown();
    vi.useRealTimers();
    await rm(root, { recursive: true, force: true });
  }
});

it.skipIf(process.platform === 'win32')(
  'refuses an unsafe segment after the library opens it during rotation',
  async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'audit-file-'));
    const file = path.join(root, 'logs', 'audit.jsonl');
    const target = path.join(root, 'outside.jsonl');
    const report = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const app = await start(root, {
      transports: {
        file: {
          driver: 'file',
          options: { path: file, maxFileSizeMB: 10 / 1024 ** 2 },
        },
      },
    });
    try {
      expect((await send(app, 'before-link')).status).toBe(200);
      const [, empty] = await segmentPaths(file);
      const linked = empty.replace(/\.000001\.jsonl$/, '.000002.jsonl');
      await symlink(target, linked);
      expect((await send(app, 'rotated')).status).toBe(200);
      await app.shutdown();
      expect(await readFile(target, 'utf8')).toBe('');
      expect(await readFile(empty, 'utf8')).toContain('"requestId":"rotated"');
      expect(report).toHaveBeenCalledWith(
        'Could not write audit event. Destination: file.',
      );
    } finally {
      await app.shutdown();
      report.mockRestore();
      await rm(root, { recursive: true, force: true });
    }
  },
);

it.skipIf(process.platform === 'win32')(
  'holds a write during idle rotation until the new segment passes its file checks',
  async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'audit-file-'));
    const report = vi.fn();
    const output = new FileAuditOutput(root, 'audit');
    output.attach(report, 50, 180);
    const signal = new AbortController().signal;
    const rejected = Promise.withResolvers<boolean>();
    const append = RotatingFileStream.prototype._write;
    const write = vi.spyOn(RotatingFileStream.prototype, '_write');
    write.mockImplementationOnce(function (chunk, encoding, done) {
      this.once('rotation', () => {
        this.prependOnceListener('open', (file: string) =>
          chmodSync(file, 0o644),
        );
        void output
          .write(Buffer.from('{"requestId":"waiting"}\n'), signal)
          .then(
            () => rejected.resolve(false),
            () => rejected.resolve(true),
          );
      });
      append.call(this, chunk, encoding, done);
    });
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(new Date('2026-11-26T23:59:59Z'));
    try {
      await output.write(Buffer.from('{}\n'), signal);
      await vi.advanceTimersByTimeAsync(1_000);
      expect(await rejected.promise).toBe(true);
      expect(
        await readFile(
          path.join(root, 'audit.2026-11-27.000000.jsonl'),
          'utf8',
        ),
      ).toBe('');
      expect(write).toHaveBeenCalledOnce();
    } finally {
      await output.detach(report, () => undefined);
      vi.useRealTimers();
      write.mockRestore();
      await rm(root, { recursive: true, force: true });
    }
  },
);

it.skipIf(process.platform === 'win32')(
  'keeps a relative destination inside storage after symlink resolution',
  async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'audit-file-'));
    const storage = path.join(root, 'storage');
    await mkdir(storage);
    await symlink(root, path.join(storage, 'escape'), 'dir');
    const report = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const app = await start(root, {
      transports: {
        unsafe: {
          driver: 'file',
          options: { path: 'escape/beyond/events.jsonl' },
        },
      },
    });
    try {
      expect((await send(app, 'outside-storage')).status).toBe(200);
      expect(await readdir(root)).toEqual(['storage']);
      expect(report).toHaveBeenCalledWith(
        'Could not write audit event. Destination: unsafe.',
      );
    } finally {
      report.mockRestore();
      await app.shutdown();
      await rm(root, { recursive: true, force: true });
    }
  },
);

it.each([
  { path: 'audit.log' },
  { path: 'audit.events.jsonl' },
  { path: 'audit.jsonl/' },
  { path: 'audit.jsonl\\' },
  { path: 'audit.jsonl', enabled: true },
  { path: 'audit.jsonl', maxFileSizeMB: 0 },
  { path: 'audit.jsonl', maxFileSizeMB: Infinity },
  { path: 'audit.jsonl', retentionDays: -10 },
  { path: 'audit.jsonl', retentionDays: '30' },
])('rejects unsupported file options %j during startup', async (options) => {
  const root = await mkdtemp(path.join(tmpdir(), 'audit-file-'));
  const app = await start(root, {
    transports: { file: { driver: 'file', options } },
  });
  try {
    await expect(app.start()).rejects.toThrow('audit.transports.file.options.');
  } finally {
    await app.shutdown();
    await rm(root, { recursive: true, force: true });
  }
});
