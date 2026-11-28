import { AuditProvider } from '../src/runtime.js';
import { databaseManagerToken } from '@nocobase/db';
import { provisionTestDatabases } from '@nocobase/db-testing';
import { Hono } from 'hono';
import { getRequestLocale } from '@nocobase/i18n/server';
import { expect, it, vi } from 'vitest';

import { Application } from '@nocobase/app-server/application';
import {
  auditRecordKey,
  describeAudit,
  auditServiceToken,
  type AuditConfig,
  type AuditEvent,
} from '../src/index.js';
import {
  I18nProvider,
  i18nHttpMiddleware,
  i18nToken,
} from '@nocobase/app-server/i18n';
import { AppConfig, createAppPaths } from '@nocobase/app-server/config';
import {
  defineApiRoutes,
  defineRepositoryApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';

async function appWithAudit(
  settings: AuditConfig = {},
  ipAddress?: {
    readonly trustedProxies: readonly unknown[];
    readonly ipAddressHeaders?: readonly string[];
  },
): Promise<{
  app: Application;
  events: AuditEvent[];
}> {
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({
    audit: {
      transports: { capture: { driver: 'memory' } },
      ...settings,
    },
    ...(ipAddress && { auth: { advanced: { ipAddress } } }),
  });
  const app = new Application({
    config,
    paths: createAppPaths({ rootDir: '/test/audit' }),
  });
  app.addServiceProvider(AuditProvider);
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

it.each([undefined, true, false])(
  'applies every route body setting with the application setting %s',
  async (captureBody) => {
    const { app, events } = await appWithAudit({ captureBody });
    const resolveTargets = vi.fn(({ response }: { response: unknown }) => {
      const id = auditRecordKey(response, 'data', 'id');
      return id === undefined ? undefined : { collection: 'items', key: id };
    });
    const optionNames = ['unset', 'on', 'off'] as const;
    const values = [undefined, true, false] as const;
    const enabledByApp = {
      unset: [false, true, false],
      on: [true, true, false],
      off: [false, false, false],
    };
    const expected =
      enabledByApp[
        captureBody === undefined ? 'unset' : captureBody ? 'on' : 'off'
      ];
    const requestBody = { name: 'new item' };
    const responseBody = { data: { id: 'item-1' } };
    app.addRoutes(
      defineApiRoutes(() => {
        const router = new Hono();
        for (const [index, routeSetting] of values.entries()) {
          router.post(
            `/items/${optionNames[index]}`,
            describeAudit({
              action: 'items.create',
              captureBody: routeSetting,
              target: () => ({ collection: 'items' }),
              resolveTargets,
            }),
            (context) => context.json(responseBody, 201),
          );
        }
        return router;
      }),
    );
    try {
      await app.start();
      for (const [index, name] of optionNames.entries()) {
        const input = request(`items/${name}`, requestBody);
        const cloneRequest = vi.spyOn(input, 'clone');
        const cloneResponse = vi.spyOn(Response.prototype, 'clone');
        const readStream = vi.spyOn(ReadableStream.prototype, 'getReader');
        const parse = vi.spyOn(JSON, 'parse');
        try {
          const response = await app.fetch(input);
          expect(response.status).toBe(201);
          if (expected[index]) {
            expect(events[index]).toMatchObject({
              request: requestBody,
              response: responseBody,
              targets: [{ collection: 'items', key: 'item-1' }],
            });
          } else {
            expect(cloneRequest).not.toHaveBeenCalled();
            expect(cloneResponse).not.toHaveBeenCalled();
            expect(readStream).not.toHaveBeenCalled();
            expect(parse).not.toHaveBeenCalledWith(JSON.stringify(requestBody));
            expect(parse).not.toHaveBeenCalledWith(
              JSON.stringify(responseBody),
            );
            expect(events[index]).toMatchObject({
              request: undefined,
              response: undefined,
              targets: [{ collection: 'items', key: undefined }],
            });
            expect(resolveTargets).toHaveBeenLastCalledWith(
              {
                status: 201,
                request: undefined,
                response: undefined,
                value: undefined,
              },
              expect.anything(),
            );
          }
        } finally {
          cloneRequest.mockRestore();
          cloneResponse.mockRestore();
          readStream.mockRestore();
          parse.mockRestore();
        }
      }
    } finally {
      await app.shutdown();
    }
  },
);

it('retains a basic event when a target resolver throws and reports no sensitive details', async () => {
  const { app, events } = await appWithAudit();
  const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  app.addRoutes(
    defineApiRoutes(() => {
      const router = new Hono();
      router.post(
        '/items/:id',
        describeAudit({
          action: 'items.update',
          target: (context) => ({
            collection: 'items',
            key: context.req.param('id'),
          }),
          resolveTargets: () => {
            throw new Error('private resolver data');
          },
        }),
        (context) => context.json({ data: 'updated' }),
      );
      return router;
    }),
  );
  try {
    const response = await app.fetch(request('items/item-1', {}));
    expect(await response.json()).toEqual({ data: 'updated' });
    expect(events).toMatchObject([
      {
        action: 'items.update',
        outcome: 'success',
        status: 200,
        targets: [{ collection: 'items', key: 'item-1' }],
      },
    ]);
    expect(log.mock.calls).toEqual([['Could not resolve audit targets.']]);
  } finally {
    log.mockRestore();
    await app.shutdown();
  }
});

it('masks entire sensitive fields on both snapshots and ignores forwarding without a trust list', async () => {
  const { app, events } = await appWithAudit({
    redact: { fields: ['privateMarker'], paths: ['settings.privateFields'] },
    transports: {
      first: { driver: 'memory' },
      second: { driver: 'memory' },
    },
  });
  app.addRoutes(
    defineApiRoutes(() => {
      const router = new Hono();
      router.post(
        '/settings/:id',
        describeAudit({
          target: (context) => ({
            collection: 'settings',
            key: {
              id: context.req.param('id'),
              privateMarker: 'target secret',
            },
          }),
          redact: {
            paths: [
              'team.0.mobile',
              'members.mobile',
              'groups.0.members.mobile',
              'matrix.0.mobile',
            ],
            fields: ['routeMarker'],
          },
          captureBody: true,
        }),
        describeRoute({ operationId: 'changeSettings', tags: ['Settings'] }),
        async (context) => context.json(await context.req.json()),
      );
      return router;
    }),
  );
  try {
    const json = {
      team: [{ mobile: 'private' }, { mobile: 'public' }],
      matrix: [[{ mobile: 'private' }], [{ mobile: 'public' }]],
      members: [
        { mobile: 'private first', label: 'keep' },
        { mobile: 'private second' },
      ],
      groups: [
        { members: [{ mobile: 'private' }, { mobile: 'private' }] },
        { members: [{ mobile: 'public' }] },
      ],
      password: { visibleWithoutWholeFieldMask: 'never persist' },
      apiKey: ['never persist'],
      settings: {
        privateFields: ['never persist'],
        other: { privateMarker: 'nested value', routeMarker: 'route value' },
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
    expect(events).toHaveLength(2);
    expect(events[1]).toEqual(events[0]);
    const expected = {
      team: [{ mobile: '******' }, { mobile: 'public' }],
      matrix: [[{ mobile: '******' }], [{ mobile: 'public' }]],
      members: [{ mobile: '******', label: 'keep' }, { mobile: '******' }],
      groups: [
        { members: [{ mobile: '******' }, { mobile: '******' }] },
        { members: [{ mobile: 'public' }] },
      ],
      password: '******',
      apiKey: '******',
      settings: {
        privateFields: '******',
        other: { privateMarker: '******', routeMarker: '******' },
        visible: 'keep',
      },
      nested: { cookie: '******', authorization: '******', secret: '******' },
    };
    expect(events[0]).toMatchObject({
      action: 'changeSettings',
      targets: [
        { collection: 'settings', key: { id: 'abc', privateMarker: '******' } },
      ],
      ip: '192.0.2.5',
      request: expected,
      response: expected,
    });
  } finally {
    await app.shutdown();
  }
});

it.each<{
  name: string;
  trustedProxies: readonly unknown[];
  ipAddressHeaders?: readonly string[];
  peer: string;
  headers: Record<string, string>;
  expected: string;
  invalidEntries?: readonly number[];
}>([
  {
    name: 'uses the nearest untrusted address along a trusted proxy chain',
    trustedProxies: ['192.0.2.0/24', '203.0.113.9'],
    peer: '192.0.2.10',
    headers: { 'x-forwarded-for': '198.51.100.99, 198.51.100.42, 203.0.113.9' },
    expected: '198.51.100.42',
  },
  {
    name: 'uses the first configured header that resolves a client',
    trustedProxies: ['192.0.2.0/24', '203.0.113.9'],
    ipAddressHeaders: ['X-Real-IP', 'X-Forwarded-For'],
    peer: '192.0.2.10',
    headers: {
      'x-real-ip': '198.51.100.99, 198.51.100.42, 203.0.113.9',
      'x-forwarded-for': '198.51.100.123',
    },
    expected: '198.51.100.42',
  },
  {
    name: 'tries the next configured header when the preferred chain is unusable',
    trustedProxies: ['192.0.2.0/24'],
    ipAddressHeaders: ['X-Client-IP', 'X-Real-IP', 'X-Forwarded-For'],
    peer: '192.0.2.10',
    headers: {
      'x-real-ip': '198.51.100.99, invalid, 192.0.2.20',
      'x-forwarded-for': '198.51.100.42',
    },
    expected: '198.51.100.42',
  },
  {
    name: 'ignores forged headers from an untrusted peer',
    trustedProxies: ['192.0.2.0/24'],
    ipAddressHeaders: ['X-Real-IP', 'X-Forwarded-For'],
    peer: '198.51.100.10',
    headers: {
      'x-real-ip': '198.51.100.123',
      'x-forwarded-for': '198.51.100.99, 192.0.2.20',
    },
    expected: '198.51.100.10',
  },
  {
    name: 'takes the socket peer when the trust list is empty',
    trustedProxies: [],
    peer: '192.0.2.10',
    headers: { 'x-forwarded-for': '198.51.100.99' },
    expected: '192.0.2.10',
  },
  {
    name: 'falls back to the peer when forwarding does not identify a client',
    trustedProxies: ['192.0.2.0/24'],
    ipAddressHeaders: ['X-Real-IP'],
    peer: '192.0.2.10',
    headers: {
      'x-real-ip': '192.0.2.20',
      'x-forwarded-for': '198.51.100.99',
    },
    expected: '192.0.2.10',
  },
  {
    name: 'warns about invalid proxies while keeping valid entries',
    trustedProxies: ['invalid', '192.0.2.0/33', '192.0.2.0/24'],
    peer: '192.0.2.10',
    headers: { 'x-forwarded-for': '198.51.100.42' },
    expected: '198.51.100.42',
    invalidEntries: [0, 1],
  },
  {
    name: 'ignores forwarding when all proxy entries are invalid',
    trustedProxies: [42, '2001:db8::/129', '192.0.2.10/'],
    ipAddressHeaders: ['X-Real-IP'],
    peer: '192.0.2.10',
    headers: { 'x-real-ip': '198.51.100.99' },
    expected: '192.0.2.10',
    invalidEntries: [0, 1, 2],
  },
])(
  '$name',
  async ({
    trustedProxies,
    ipAddressHeaders,
    peer,
    headers,
    expected,
    invalidEntries = [],
  }) => {
    const { app, events } = await appWithAudit(
      {},
      { trustedProxies, ipAddressHeaders },
    );
    app.addRoutes(
      defineApiRoutes(() => {
        const router = new Hono();
        router.post(
          '/example',
          describeAudit({ action: 'example' }),
          (context) => context.body(null, 204),
        );
        return router;
      }),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const response = await app.fetch(request('example', {}, headers), {
        incoming: { socket: { remoteAddress: peer } },
      });
      expect(response.status).toBe(204);
      expect(events).toMatchObject([{ ip: expected }]);
      expect(warn.mock.calls).toEqual(
        invalidEntries.map((index) => [
          `Ignoring auth.advanced.ipAddress.trustedProxies[${index}]: expected an IP address or CIDR range.`,
        ]),
      );
    } finally {
      warn.mockRestore();
      await app.shutdown();
    }
  },
);

it('bounds raw and serialized body snapshots while preserving the response', async () => {
  const { app, events } = await appWithAudit();
  app.addRoutes(
    defineApiRoutes(() => {
      const router = new Hono();
      router.post(
        '/large',
        describeAudit({ action: 'test:large', captureBody: true }),
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

it('matches baseline Repository responses and query operations with no audit destination', async () => {
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
  const second = await appWithAudit();
  const disabled = await appWithAudit({ enabled: false, autoDetect: true });
  const noDestinations = await appWithAudit({ transports: {} });
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
  child.post(
    '/documented',
    describeRoute({ operationId: 'documented' }),
    (context) => context.body(null, 204),
  );
  child.post('/unsupported', (context) => context.body(null, 204));
  child.get('/read', describeRoute({ operationId: 'read' }), (context) =>
    context.body(null, 204),
  );
  router.route('/mounted', child);
  for (const { app } of [first, second, disabled, noDestinations])
    app.addRoutes(defineApiRoutes(() => router));
  try {
    await Promise.all(
      [first, second, disabled, noDestinations].map(async ({ app }) => {
        for (const suffix of [
          'action/example',
          'dynamic',
          'opt-out',
          'hidden',
          'documented',
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
      { action: 'documented', operationName: 'documented', outcome: 'success' },
    ]);
    expect(second.events.map(({ action }) => action)).toEqual(['explicit']);
    expect(disabled.events).toEqual([]);
    expect(noDestinations.events).toEqual([]);
  } finally {
    await Promise.all([
      first.app.shutdown(),
      second.app.shutdown(),
      disabled.app.shutdown(),
      noDestinations.app.shutdown(),
    ]);
  }
});

it('stores the same default operation name and descriptor across request languages and outcomes', async () => {
  const { app, events } = await appWithAudit();
  app.addServiceProvider(I18nProvider);
  app.registerProviders();
  const runtime = app.container.resolve(i18nToken);
  runtime.registerApplicationNamespace('@example/app', {
    'en-US': () => Promise.resolve({}),
    'zh-CN': () => Promise.resolve({}),
  });
  runtime.registerNamespace('@example/audit', {
    'en-US': () =>
      Promise.resolve({
        actions: { create: 'Create an audit example', blank: ' ' },
      }),
    'zh-CN': () => Promise.resolve({ actions: { create: '创建审计示例' } }),
  });
  app.addHttpMiddleware(i18nHttpMiddleware);
  app.addRoutes(
    defineApiRoutes(() => {
      const router = new Hono();
      router.post(
        '/create/:result',
        describeAudit({
          action: 'create',
          operationName: {
            ns: '@example/audit',
            key: 'actions.create',
            defaultValue: 'Create an audit example',
          },
        }),
        (context) => {
          context.header('x-test-locale', getRequestLocale(context));
          const result = context.req.param('result');
          return context.body(
            null,
            result === 'denied' ? 403 : result === 'failure' ? 422 : 204,
          );
        },
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
      router.post(
        '/delete',
        describeAudit({
          action: 'delete',
          operationName: { ns: '@example/audit', key: 'actions.delete' },
        }),
        (context) => context.body(null, 204),
      );
      router.post(
        '/missing-label',
        describeAudit({
          action: 'missingLabel',
          operationName: {
            ns: '@example/audit',
            key: 'actions.missingLabel',
            defaultValue: 'English operation name',
          },
        }),
        describeRoute({ summary: 'Unused API summary' }),
        (context) => context.body(null, 204),
      );
      router.post(
        '/blank',
        describeAudit({
          action: 'blank',
          operationName: {
            ns: '@example/audit',
            key: 'actions.blank',
            defaultValue: 'Default operation name',
          },
        }),
        describeRoute({ summary: 'Unused API summary' }),
        (context) => context.body(null, 204),
      );
      return router;
    }),
  );
  try {
    for (const locale of ['en-US', 'zh-CN']) {
      for (const outcome of ['success', 'failure', 'denied']) {
        const response = await app.fetch(
          request(`create/${outcome}`, {}, { 'accept-language': locale }),
        );
        expect(response.headers.get('x-test-locale')).toBe(locale);
        expect(events.at(-1)).toMatchObject({
          action: 'create',
          operationName: 'Create an audit example',
          operationNameI18n: { ns: '@example/audit', key: 'actions.create' },
          outcome,
        });
      }
    }
    expect(events).toHaveLength(6);
    await app.fetch(
      request('missing-label', {}, { 'accept-language': 'zh-CN' }),
    );
    for (const action of ['update', 'delete', 'blank'])
      await app.fetch(request(action, {}));
    expect(
      events.slice(6).map(({ operationName, operationNameI18n }) => ({
        operationName,
        operationNameI18n,
      })),
    ).toEqual([
      {
        operationName: 'English operation name',
        operationNameI18n: {
          ns: '@example/audit',
          key: 'actions.missingLabel',
        },
      },
      {
        operationName: 'Update an audit example',
        operationNameI18n: { ns: '@example/audit', key: 'actions.missing' },
      },
      {
        operationName: 'delete',
        operationNameI18n: { ns: '@example/audit', key: 'actions.delete' },
      },
      {
        operationName: 'Default operation name',
        operationNameI18n: { ns: '@example/audit', key: 'actions.blank' },
      },
    ]);
  } finally {
    await app.shutdown();
  }
});
