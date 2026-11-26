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

import { Application } from '../src/application/index.js';
import {
  auditServiceToken,
  describeAudit,
  type AuditConfig,
  type AuditEvent,
} from '@nocobase/audit';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import { defineApiRoutes } from '../src/router/index.js';
import { Hono } from 'hono';
import { expect, it, vi } from 'vitest';

async function start(
  rootDir: string,
  audit: AuditConfig,
): Promise<Application> {
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({ audit: { ...audit } });
  const app = new Application({ config, paths: createAppPaths({ rootDir }) });
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

it('uses the file driver with a registered driver and closes the registered destination', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'audit-file-'));
  const file = path.join(root, 'storage', 'audit.jsonl');
  const app = await start(root, {
    transports: {
      file: { driver: 'file', options: { path: 'audit.jsonl' } },
      custom: { driver: 'custom' },
    },
  });
  const write = vi.fn((event: AuditEvent) => {
    Object.assign(event, { action: 'changed-by-custom' });
    throw new Error('Destination failed');
  });
  const close = vi.fn();
  const report = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  app.container.resolve(auditServiceToken).registerDriver({
    name: 'custom',
    createTransport: () => ({ write, close }),
  });
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
    expect(close).toHaveBeenCalledOnce();
    await rename(file, path.join(root, 'moved.jsonl'));
  } finally {
    report.mockRestore();
    await app.shutdown();
    await rm(root, { recursive: true, force: true });
  }
});

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
