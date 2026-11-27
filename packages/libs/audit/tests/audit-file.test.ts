import { AuditProvider } from '../src/runtime.js';
import {
  mkdtemp,
  readFile,
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
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { defineApiRoutes } from '@nocobase/app-server/router';
import { Hono } from 'hono';
import {
  ServiceProvider,
  type ServiceProviderConstructor,
} from '@nocobase/service-provider';
import { expect, it, vi } from 'vitest';

async function start(
  rootDir: string,
  audit: AuditConfig,
  providers: readonly ServiceProviderConstructor<Application>[] = [],
): Promise<Application> {
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({ audit: { ...audit } });
  const app = new Application({ config, paths: createAppPaths({ rootDir }) });
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

async function lines(file: string): Promise<AuditEvent[]> {
  const text = await readFile(file, 'utf8');
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
      relative: { driver: 'file', options: { path: 'audit/events.jsonl' } },
      sameFile: { driver: 'file', options: { path: relative } },
      absolute: { driver: 'file', options: { path: absolute } },
    },
  });
  try {
    const requestIds = Array.from(
      { length: 20 },
      (_, index) => `event-${index}`,
    );
    const responses = await Promise.all(
      requestIds.map((requestId) => send(app, requestId)),
    );
    expect(responses.map(({ status }) => status)).toEqual(
      requestIds.map(() => 200),
    );
    const primary = await lines(relative);
    const secondary = await lines(absolute);
    expect(primary).toHaveLength(40);
    expect(secondary).toHaveLength(20);
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
      expect((await stat(relative)).mode & 0o777).toBe(0o600);
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
  await writeFile(unsafe, 'incomplete private content', { mode: 0o600 });
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
    expect(await readFile(unsafe, 'utf8')).toBe('incomplete private content');
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
      await rename(file, path.join(root, 'moved.jsonl'));
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
