import { databaseManagerToken } from '@nocobase/db';
import { provisionTestDatabases } from '@nocobase/db-testing';
import { Hono } from 'hono';
import { expect, it, vi } from 'vitest';

import { Application } from '../src/application/index.js';
import {
  describeAudit,
  auditServiceToken,
  type AuditEvent,
} from '../src/audit/index.js';
import { AuditCoordinator } from '../src/audit/service.js';
import { I18nProvider, i18nToken } from '../src/i18n/index.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import {
  defineApiRoutes,
  defineRepositoryApiRoutes,
  describeRoute,
} from '../src/router/index.js';

async function appWithAudit(
  settings: { enabled?: boolean; autoDetect?: boolean } = {},
): Promise<{
  app: Application;
  events: AuditEvent[];
}> {
  const values = {
    audit: {
      enabled: true,
      ...settings,
      transports: { capture: { driver: 'memory' } },
    },
  };
  const config = {
    get: <T>(key: string) => Reflect.get(values, key) as T | undefined,
    raw: () => values,
    reload: () => Promise.resolve({ changedNamespaces: [] }),
    subscribe: () => () => undefined,
  };
  const app = new Application({
    config,
    paths: createAppPaths({ rootDir: '/test/audit' }),
  });
  const events: AuditEvent[] = [];
  app.container.resolve(auditServiceToken).registerDriver({
    name: 'memory',
    createTransport: () => ({
      write: (event) => {
        events.push(event);
      },
    }),
  });
  return { app, events };
}

function request(path: string, json: unknown, headers?: HeadersInit): Request {
  const allHeaders = new Headers(headers);
  allHeaders.set('content-type', 'application/json');
  return new Request(`http://localhost/api/${path}`, {
    method: 'POST',
    body: JSON.stringify(json),
    headers: allHeaders,
  });
}

it('masks entire sensitive fields on both snapshots and uses only a trusted peer', async () => {
  const { app, events } = await appWithAudit();
  app.addRoutes(
    defineApiRoutes(() => {
      const router = new Hono();
      router.post(
        '/settings/:id',
        describeAudit({
          target: (context) => ({
            collection: 'settings',
            key: context.req.param('id'),
          }),
          redact: [
            { path: 'settings.privateFields' },
            { field: 'privateMarker' },
          ],
        }),
        describeRoute({ operationId: 'changeSettings', tags: ['Settings'] }),
        async (context) => context.json(await context.req.json()),
      );
      return router;
    }),
  );
  try {
    const json = {
      password: { visibleWithoutWholeFieldMask: 'never persist' },
      apiKey: ['never persist'],
      settings: {
        privateFields: ['never persist'],
        other: { privateMarker: 'nested value' },
        visible: 'keep',
      },
      nested: {
        cookie: 'never persist',
        authorization: 'never persist',
        secret: 'never persist',
      },
    };
    const response = await app.fetch(
      request('settings/abc', json, { 'x-forwarded-for': '198.51.100.42' }),
      {
        incoming: { socket: { remoteAddress: '192.0.2.5' } },
      },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(json);
    expect(events).toHaveLength(1);
    const expected = {
      password: '******',
      apiKey: '******',
      settings: {
        privateFields: '******',
        other: { privateMarker: '******' },
        visible: 'keep',
      },
      nested: { cookie: '******', authorization: '******', secret: '******' },
    };
    expect(events[0]).toMatchObject({
      action: 'changeSettings',
      targets: [{ collection: 'settings', key: 'abc' }],
      ip: '192.0.2.5',
      request: expected,
      response: expected,
    });
  } finally {
    await app.shutdown();
  }
});

it('bounds raw and serialized body snapshots while preserving the response', async () => {
  const { app, events } = await appWithAudit();
  app.addRoutes(
    defineApiRoutes(() => {
      const router = new Hono();
      router.post(
        '/large',
        describeAudit({ action: 'test:large' }),
        async (context) => {
          const input = await context.req.json<{ value: string }>();
          return context.json({
            length: input.value.length,
            value: 'x'.repeat(20 * 1024),
          });
        },
      );
      return router;
    }),
  );
  try {
    const response = await app.fetch(
      request('large', { value: 'x'.repeat(260 * 1024) }),
    );
    expect(await response.json()).toMatchObject({ length: 260 * 1024 });
    expect(events[0]).toMatchObject({
      request: { truncated: true },
      response: { truncated: true },
    });
  } finally {
    await app.shutdown();
  }
});

it('matches baseline Repository responses and query operations with no audit provider', async () => {
  const databases = await provisionTestDatabases();
  const fixture = await databases.open();
  const config = new AppConfig();
  await config.loadAll();
  const app = new Application({
    config,
    paths: createAppPaths({ rootDir: '/test/audit' }),
  });
  const connection = fixture.database.connection();
  try {
    await connection.builder.createCollection('auditOrders', (collection) => {
      collection.string('id').primary();
      collection.string('name');
    });
    app.container.instance(databaseManagerToken, fixture.database);
    const policy = {
      read: true,
      create: true,
      update: true,
      delete: true,
    } as const;
    app.addRoutes(
      defineRepositoryApiRoutes({
        repositories: [
          { name: 'auditOrders', policy, actions: { createOne: {} } },
        ],
      }),
    );
    const auditDeclaration = vi.fn(() => ({ action: 'test:baseline' }));
    app.addRoutes(
      defineApiRoutes(() => {
        const router = new Hono();
        // The same handler behavior the Repository route had before audit instrumentation.
        router.post(
          '/baseline',
          describeAudit(auditDeclaration),
          async (context) => {
            const { values } = await context.req.json<{
              values: { id: string; name: string };
            }>();
            const data = await connection
              .repository('auditOrders')
              .withPolicy(policy)
              .createOne({ values });
            return context.json({ data });
          },
        );
        return router;
      }),
    );
    await app.start();
    await connection.repository('auditOrders').count();
    const client = await connection.client<{
      on(event: 'query', listener: (query: { sql: string }) => void): void;
      removeListener(
        event: 'query',
        listener: (query: { sql: string }) => void,
      ): void;
    }>();
    const queries: string[] = [];
    const observe = (query: { sql: string }) => {
      queries.push(query.sql);
    };
    client.on('query', observe);
    try {
      const input = { values: { id: 'order', name: 'Draft' } };
      const baseline = await app.fetch(request('baseline', input));
      const statements = queries.splice(0);
      expect(statements.length).toBeGreaterThan(0);
      await connection
        .repository('auditOrders')
        .deleteOne({ filter: { id: 'order' } });
      queries.length = 0;
      const actual = await app.fetch(request('auditOrders/createOne', input));
      expect(actual.status).toBe(baseline.status);
      expect(await actual.json()).toEqual(await baseline.json());
      expect(queries).toEqual(statements);
      expect(auditDeclaration).not.toHaveBeenCalled();
    } finally {
      client.removeListener('query', observe);
    }
  } finally {
    await app.shutdown();
    await fixture.destroy();
    await databases.drop();
  }
});

it('honors explicit declarations before guards and uses inference only for supported routes', async () => {
  const first = await appWithAudit({ autoDetect: true });
  const second = await appWithAudit({ autoDetect: false });
  const disabled = await appWithAudit({ enabled: false, autoDetect: true });
  const resolve = vi.fn(() => undefined);
  const declared = {
    action: 'explicit',
    operationName: 'A readable operation',
  };
  const explicit = describeAudit(declared);
  declared.action = 'mutated';
  const router = new Hono();
  const child = new Hono();
  child.post('/action/:id', explicit, (context) => context.body(null, 403));
  child.post(
    '/dynamic',
    describeAudit(resolve),
    describeRoute({ operationId: 'inferred', summary: 'Documented operation' }),
    (context) => context.body(null, 204),
  );
  child.post(
    '/opt-out',
    describeAudit(false),
    describeRoute({ operationId: 'excluded' }),
    (context) => context.body(null, 204),
  );
  child.post(
    '/hidden',
    describeRoute({ operationId: 'hidden', hide: true }),
    (context) => context.body(null, 204),
  );
  child.post('/unsupported', (context) => context.body(null, 204));
  child.get('/read', describeRoute({ operationId: 'read' }), (context) =>
    context.body(null, 204),
  );
  router.route('/mounted', child);
  for (const { app } of [first, second, disabled])
    app.addRoutes(defineApiRoutes(() => router));
  try {
    await Promise.all(
      [first, second, disabled].map(async ({ app }) => {
        for (const suffix of [
          'action/example',
          'dynamic',
          'opt-out',
          'hidden',
          'unsupported',
        ])
          await app.fetch(request(`mounted/${suffix}`, {}));
        await app.fetch(new Request('http://localhost/api/mounted/read'));
        await app.fetch(request('mounted/missing', {}));
      }),
    );
    expect(resolve).toHaveBeenCalledTimes(2);
    expect(
      first.events.map(({ action, operationName, outcome }) => ({
        action,
        operationName,
        outcome,
      })),
    ).toEqual([
      {
        action: 'explicit',
        operationName: 'A readable operation',
        outcome: 'denied',
      },
      {
        action: 'inferred',
        operationName: 'Documented operation',
        outcome: 'success',
      },
    ]);
    expect(second.events.map(({ action }) => action)).toEqual(['explicit']);
    expect(disabled.events).toEqual([]);
  } finally {
    await Promise.all([
      first.app.shutdown(),
      second.app.shutdown(),
      disabled.app.shutdown(),
    ]);
  }
});

it('stores a localized label with its descriptor and preserves a readable fallback', async () => {
  const { app, events } = await appWithAudit();
  app.addServiceProvider(I18nProvider);
  app.registerProviders();
  app.container.resolve(i18nToken).registerNamespace('@example/audit', {
    'en-US': () =>
      Promise.resolve({ actions: { create: 'Create an audit example' } }),
  });
  app.addRoutes(
    defineApiRoutes(() => {
      const router = new Hono();
      router.post(
        '/create',
        describeAudit({
          action: 'create',
          operationName: { ns: '@example/audit', key: 'actions.create' },
        }),
        (context) => context.body(null, 204),
      );
      router.post(
        '/update',
        describeAudit({
          action: 'update',
          operationName: { ns: '@example/audit', key: 'actions.missing' },
        }),
        describeRoute({ summary: 'Update an audit example' }),
        (context) => context.body(null, 204),
      );
      router.post('/delete', describeAudit({ action: 'delete' }), (context) =>
        context.body(null, 204),
      );
      return router;
    }),
  );
  try {
    for (const action of ['create', 'update', 'delete'])
      await app.fetch(request(action, {}));
    expect(
      events.map(({ operationName, operationNameI18n }) => ({
        operationName,
        operationNameI18n,
      })),
    ).toEqual([
      {
        operationName: 'Create an audit example',
        operationNameI18n: { ns: '@example/audit', key: 'actions.create' },
      },
      {
        operationName: 'Update an audit example',
        operationNameI18n: { ns: '@example/audit', key: 'actions.missing' },
      },
      { operationName: 'delete', operationNameI18n: undefined },
    ]);
  } finally {
    await app.shutdown();
  }
});

it('delivers in parallel, isolates mutation and failures, and closes every instance', async () => {
  const coordinator = new AuditCoordinator(vi.fn());
  const blocked = Promise.withResolvers<void>();
  const observed = Promise.withResolvers<AuditEvent>();
  const close = vi.fn();
  coordinator.registerDriver({
    name: 'test',
    createTransport: (_options, { name }) => ({
      close,
      write: async (event) => {
        if (name === 'slow') {
          (event.request as { data: string }).data = 'changed';
          await blocked.promise;
          throw new Error('write failure');
        }
        observed.resolve(event);
      },
    }),
  });
  await coordinator.start(
    {
      enabled: true,
      transports: { slow: { driver: 'test' }, parallel: { driver: 'test' } },
    },
    createAppPaths({ rootDir: '/test/audit' }),
  );
  const writing = coordinator.record({
    requestId: 'example',
    action: 'save',
    resource: 'settings',
    operationName: 'Save settings',
    actor: { type: 'anonymous' },
    roles: [],
    targets: [],
    status: 200,
    outcome: 'success',
    durationMs: 1,
    occurredAt: '2026-01-01T00:00:00.000Z',
    request: { data: 'original' },
  });
  try {
    await expect(observed.promise).resolves.toMatchObject({
      request: { data: 'original' },
    });
    blocked.resolve();
    await writing;
  } finally {
    blocked.resolve();
    await coordinator.close();
  }
  expect(close).toHaveBeenCalledTimes(2);
});

it('refuses unknown active destinations and aborts timed-out writes', async () => {
  const report = vi.fn();
  const coordinator = new AuditCoordinator(report);
  const paths = createAppPaths({ rootDir: '/test/audit' });
  await expect(
    coordinator.start(
      {
        enabled: true,
        transports: { history: { driver: 'unknown' } },
      },
      paths,
    ),
  ).rejects.toThrow('unregistered driver');
  await coordinator.close();

  const bounded = new AuditCoordinator(report);
  const abort = vi.fn();
  bounded.registerDriver({
    name: 'blocked',
    createTransport: () => ({
      write: (_event, { signal }) =>
        new Promise<void>((resolve) => {
          signal.addEventListener(
            'abort',
            () => {
              abort();
              resolve();
            },
            { once: true },
          );
        }),
    }),
  });
  await bounded.start(
    { enabled: true, transports: { slow: { driver: 'blocked' } } },
    paths,
  );
  await bounded.record({
    requestId: 'example',
    action: 'save',
    resource: 'settings',
    operationName: 'Save settings',
    actor: { type: 'anonymous' },
    roles: [],
    targets: [],
    status: 200,
    outcome: 'success',
    durationMs: 1,
    occurredAt: '2026-01-01T00:00:00.000Z',
  });
  expect(abort).toHaveBeenCalledOnce();
  expect(report).toHaveBeenCalledWith(
    'Audit destination write timed out.',
    'slow',
  );
  await bounded.close();
});
