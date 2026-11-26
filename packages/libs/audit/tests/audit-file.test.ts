import { unlinkSync } from 'node:fs';
import { AuditProvider } from '../src/runtime.js';
import {
  mkdtemp,
  readFile,
  readdir,
  mkdir,
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
  describeAudit,
  type AuditConfig,
  type AuditEvent,
} from '../src/index.js';
import { LoggingProvider, loggingToken } from '@nocobase/app-server/logging';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { defineApiRoutes } from '@nocobase/app-server/router';
import { Hono } from 'hono';
import {
  ServiceProvider,
  type ServiceProviderConstructor,
} from '@nocobase/service-provider';
import { expect, it, vi } from 'vitest';

vi.mock('node:fs', { spy: true });

async function start(
  rootDir: string,
  audit: AuditConfig,
  providers: readonly ServiceProviderConstructor<Application>[] = [],
  silent = false,
): Promise<Application> {
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({
    app: { name: 'audit-test' },
    audit: { ...audit },
    logging: { level: silent ? 'silent' : 'info' },
  });
  const app = new Application({ config, paths: createAppPaths({ rootDir }) });
  if (silent) app.addServiceProvider(LoggingProvider);
  app.addServiceProviders(providers);
  app.addServiceProvider(AuditProvider);
  app.addRoutes(
    defineApiRoutes(() => {
      const router = new Hono();
      router.post(
        '/example',
        describeAudit({ action: 'test:example' }),
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
      body: JSON.stringify({ password: 'not-for-the-log' }),
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

it('isolates an unsafe file and continues writing to another destination', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'audit-file-'));
  const unsafe = path.join(root, 'unsafe.jsonl');
  const good = path.join(root, 'good.jsonl');
  const date = new Date().toISOString().slice(0, 10);
  const partialSegment = path.join(root, `unsafe.${date}.000000.jsonl`);
  await writeFile(partialSegment, 'incomplete private content', {
    mode: 0o600,
  });
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
    expect(await readFile(partialSegment, 'utf8')).toBe(
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

it('keeps the previous segment and the HTTP result when the next segment cannot open', async () => {
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
    const [segment] = await segmentPaths(file);
    const next = segment.replace(/\.000000\.jsonl$/, '.000001.jsonl');
    await mkdir(next);
    expect(await (await send(app, 'rotation-failed')).json()).toEqual({
      data: 'done',
    });
    expect(await readFile(segment, 'utf8')).toContain('"requestId":"first"');
    expect(await readFile(segment, 'utf8')).not.toContain('rotation-failed');
    expect(await lines(good)).toMatchObject([
      { requestId: 'first' },
      { requestId: 'rotation-failed' },
    ]);
    expect(report).toHaveBeenCalledWith(
      'Could not write audit event. Destination: rotating.',
    );
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
