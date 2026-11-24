import { databaseManagerToken } from '@nocobase/db';
import { provisionTestDatabases } from '@nocobase/db-testing';
import { Hono } from 'hono';
import { expect, it, vi } from 'vitest';

import { Application } from '../src/application/index.js';
import {
  auditRoute,
  auditServiceToken,
  type AuditEvent,
} from '../src/audit/index.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import {
  defineApiRoutes,
  defineRepositoryApiRoutes,
  describeRoute,
} from '../src/router/index.js';

async function appWithAudit(): Promise<{
  app: Application;
  events: AuditEvent[];
}> {
  const config = new AppConfig();
  await config.loadAll();
  const app = new Application({
    config,
    paths: createAppPaths({ rootDir: '/test/audit' }),
  });
  const events: AuditEvent[] = [];
  app.container.instance(auditServiceToken, {
    async record(event) {
      events.push(event);
    },
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
        auditRoute({
          target: (context) => ({
            collection: 'settings',
            key: context.req.param('id'),
          }),
          redact: ['settings.privateFields'],
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
      settings: { privateFields: ['never persist'], visible: 'keep' },
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
      settings: { privateFields: '******', visible: 'keep' },
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
        auditRoute({ action: 'test:large' }),
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
          auditRoute(auditDeclaration),
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
