import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { Application } from '@nocobase/app-server/application';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import { defineApiRoutes, describeRoute } from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { expect, it, vi } from 'vitest';

import {
  auditRecordKey,
  auditServiceToken,
  describeAudit,
  type AuditCapturePolicy,
  type AuditCapturePolicyProvider,
  type AuditRedactRule,
  type AuditTransportEvent,
} from '../src/index.js';
import { AuditProvider } from '../src/runtime.js';

const input = {
  routeOnly: 'route value',
  extended: { appOnly: 'configured field', mobile: 'configured path' },
  password: 'built-in credential',
};

async function fixture(provider: AuditCapturePolicyProvider) {
  const rootDir = await mkdtemp(path.join(tmpdir(), 'audit-policy-'));
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({
    audit: {
      autoDetect: true,
      transports: {
        file: { driver: 'file', options: { path: 'audit.jsonl' } },
        memory: { driver: 'memory' },
      },
    },
  });
  const paths = createAppPaths({ rootDir });
  const app = new Application({ config, paths });
  app.addServiceProvider(AuditProvider);
  const service = app.container.resolve(auditServiceToken);
  service.registerCapturePolicyProvider(provider);
  const events: AuditTransportEvent[] = [];
  service.registerDriver({
    name: 'memory',
    createTransport: () => ({
      write(event) {
        events.push(event);
      },
    }),
  });

  const entered = Promise.withResolvers<void>();
  const resume = Promise.withResolvers<void>();
  const target = vi.fn(() => ({
    collection: 'widgets',
    key: { appOnly: 'target value', extended: { mobile: 'target path' } },
  }));
  const resolveTargets = vi.fn((response: unknown) => ({
    collection: 'widgets',
    key: {
      id: auditRecordKey(response, 'data', 'id'),
      appOnly: 'target value',
      extended: { mobile: 'target path' },
    },
  }));
  app.addRoutes(
    defineApiRoutes(() => {
      const router = new Hono();
      router.post(
        '/create/:request',
        describeAudit({
          action: 'widget.create',
          resource: 'widgets',
          operationName: 'Create a widget',
          target,
          resolveTargets: ({ response }) => resolveTargets(response),
          redact: [{ field: 'routeOnly' }],
        }),
        async (c) => {
          const data = await c.req.json<typeof input>();
          if (c.req.param('request') === 'started') {
            entered.resolve();
            await resume.promise;
          }
          return c.json({ ...data, data: { id: 'widget-1' } }, 201);
        },
      );
      router.post('/excluded', describeAudit(false), (c) =>
        c.json({ ok: true }),
      );
      router.post('/unmatched', (c) => c.json({ ok: true }));
      router.post(
        '/export/:outcome',
        describeAudit(false),
        describeRoute({ operationId: 'widgetExport' }),
        (c) => {
          const outcome = c.req.param('outcome');
          return c.json(
            { ok: outcome === 'success' },
            outcome === 'denied' ? 403 : outcome === 'failure' ? 500 : 200,
          );
        },
      );
      return router;
    }),
  );
  return {
    entered,
    resume,
    events,
    target,
    resolveTargets,
    send(route: string): Promise<Response> {
      return app.fetch(
        new Request(`http://localhost/api/${route}`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-request-id': 'caller-supplied-id',
          },
          body: JSON.stringify(input),
        }),
      );
    },
    async readFileEvents(): Promise<AuditTransportEvent[]> {
      const text = await readFile(
        path.join(paths.storageDir, 'audit.jsonl'),
        'utf8',
      );
      return text
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line) as AuditTransportEvent);
    },
    async close(): Promise<void> {
      resume.resolve();
      await app.shutdown();
      await rm(rootDir, { recursive: true, force: true });
    },
  };
}

it('uses one policy snapshot per eligible request and dispatches the same sanitized event', async () => {
  const rules: AuditRedactRule[] = [
    { field: 'appOnly' },
    { path: 'extended.mobile' },
  ];
  let policy: AuditCapturePolicy = {
    captureBody: true,
    redact: rules,
  };
  const provider = vi.fn(() => Promise.resolve(policy));
  const app = await fixture(provider);
  try {
    await app.send('excluded');
    await app.send('unmatched');
    expect(provider).not.toHaveBeenCalled();

    const first = app.send('create/started');
    await app.entered.promise;
    rules.length = 0;
    policy = { captureBody: false, redact: [] };
    try {
      expect((await app.send('create/later')).status).toBe(201);
      expect((await app.send('export/success')).status).toBe(200);
      expect((await app.send('export/denied')).status).toBe(403);
      expect((await app.send('export/failure')).status).toBe(500);
    } finally {
      app.resume.resolve();
      expect(await (await first).json()).toEqual({
        ...input,
        data: { id: 'widget-1' },
      });
    }
    expect(provider).toHaveBeenCalledTimes(2);
    expect(app.events).toMatchObject([
      {
        action: 'widget.create',
        targets: [{ collection: 'widgets', key: { id: 'widget-1' } }],
        request: undefined,
        response: undefined,
      },
      {
        action: 'widget.create',
        targets: [
          {
            collection: 'widgets',
            key: {
              id: 'widget-1',
              appOnly: '******',
              extended: { mobile: '******' },
            },
          },
        ],
        request: {
          routeOnly: '******',
          extended: { appOnly: '******', mobile: '******' },
          password: '******',
        },
        response: {
          routeOnly: '******',
          extended: { appOnly: '******', mobile: '******' },
          password: '******',
        },
      },
    ]);
    expect(await app.readFileEvents()).toEqual(
      JSON.parse(JSON.stringify(app.events)),
    );
  } finally {
    await app.close();
  }
});

it('keeps only the ordinary operation outcome when policy reads fail', async () => {
  const report = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const provider = vi.fn(() =>
    Promise.reject(new Error('private provider error')),
  );
  const app = await fixture(provider);
  try {
    expect((await app.send('create/ordinary')).status).toBe(201);
    expect((await app.send('export/success')).status).toBe(200);
    expect((await app.send('export/denied')).status).toBe(403);
    expect((await app.send('export/failure')).status).toBe(500);
    expect(provider).toHaveBeenCalledOnce();
    expect(app.target).not.toHaveBeenCalled();
    expect(app.resolveTargets).not.toHaveBeenCalled();
    expect(app.events).toEqual([
      {
        action: 'widget.create',
        occurredAt: expect.any(String),
        outcome: 'success',
        status: 201,
      },
    ]);
    expect(await app.readFileEvents()).toEqual(app.events);
    expect(report.mock.calls).toEqual([
      ['Could not read the audit capture policy.'],
    ]);
  } finally {
    report.mockRestore();
    await app.close();
  }
});
