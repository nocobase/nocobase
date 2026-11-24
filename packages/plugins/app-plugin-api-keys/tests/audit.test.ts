import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import authentication, {
  authenticationToken,
} from '@nocobase/app-plugin-authentication/server';
import authorization, {
  authorizationToken,
} from '@nocobase/app-plugin-authorization/server';
import { Application } from '@nocobase/app-server/application';
import { auditServiceToken, type AuditEvent } from '@nocobase/app-server/audit';
import { CachingProvider } from '@nocobase/app-server/caching';
import {
  createAppPaths,
  type AppConfigAccessor,
} from '@nocobase/app-server/config';
import { DatabaseProvider } from '@nocobase/app-server/database';
import { IdGeneratorProvider } from '@nocobase/app-server/id-generator';
import {
  defineServerPlugins,
  resolveAppServerPlugins,
} from '@nocobase/app-server/plugins';
import {
  defineApiRoutes,
  defineRepositoryApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import {
  provisionTestDatabases,
  type ProvisionedTestDatabases,
} from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { Hono } from 'hono';
import { afterAll, beforeAll, expect, it } from 'vitest';

import apiKeys, { apiKey } from '../server/index.js';

const origin = 'http://localhost';
const credentials = {
  email: 'audit-owner@example.com',
  password: 'some-password-for-the-audit-test',
};
const events: AuditEvent[] = [];
const transactional = new Set<AuditEvent>();
let rejectAudit = false;
let directory: string;
let databases: ProvisionedTestDatabases;
let app: Application;

async function request(
  method: string,
  pathname: string,
  json?: unknown,
  headers?: HeadersInit,
): Promise<Response> {
  const requestHeaders = new Headers(headers);
  requestHeaders.set('origin', origin);
  requestHeaders.set('user-agent', 'audit integration');
  if (json !== undefined)
    requestHeaders.set('content-type', 'application/json');
  return app.fetch(
    new Request(new URL(pathname, origin), {
      method,
      headers: requestHeaders,
      body: json === undefined ? undefined : JSON.stringify(json),
    }),
    { incoming: { socket: { remoteAddress: '192.0.2.5' } } },
  );
}

beforeAll(async () => {
  directory = mkdtempSync(path.join(tmpdir(), 'audit-integration-'));
  databases = await provisionTestDatabases();
  const values: Record<string, unknown> = {
    app: {
      name: 'main',
      publicOrigin: origin,
      publicBasePath: '/',
      internalBasePath: '',
      publicApiUrl: '/api',
    },
    auth: {
      secret: 'audit-fixture-authentication-secret-over-32-bytes',
      plugins: [apiKey()],
      emailAndPassword: { enabled: true, autoSignIn: false },
      session: { storeSessionInDatabase: true },
    },
    api: { trustedProxies: ['192.0.2.0/24'] },
    caching: { default: 'memory', providers: { memory: { driver: 'memory' } } },
    database: {
      default: 'main',
      connections: {
        main: { ...databases.connectionConfig(), schemaManagement: 'managed' },
      },
    },
    snowflake: { workerId: 0 },
    apiKeys: { allowSameAsMe: true },
  };
  const config: AppConfigAccessor = {
    get: <TValue>(key: string): TValue => values[key] as TValue,
    raw: () => values,
    reload: () => Promise.resolve({ changedNamespaces: [] }),
    subscribe: () => () => undefined,
  };
  app = new Application({
    config,
    paths: createAppPaths({ rootDir: directory }),
  });
  app.addServiceProvider(DatabaseProvider);
  app.addServiceProvider(CachingProvider);
  app.addServiceProvider(IdGeneratorProvider);
  app.addServerPlugins(
    resolveAppServerPlugins(
      directory,
      defineServerPlugins([authentication, authorization, apiKeys]),
    ),
  );
  app.container.instance(auditServiceToken, {
    async record(event, options) {
      if (!options?.connection) {
        events.push(event);
        return;
      }
      options.connection.afterCommit(() => {
        transactional.add(event);
        events.push(event);
      });
      if (rejectAudit) throw new Error('Audit storage failed');
    },
  });
  const repository = defineRepositoryApiRoutes({
    repositories: [
      {
        name: 'auditOrders',
        actions: { createOne: {}, updateOne: {}, deleteOne: {}, count: {} },
        policy: { read: true, create: true, update: true, delete: true },
      },
    ],
    idempotency: {
      required: false,
      principal: (context) => context.get('auth')?.user.id,
    },
  });
  app.addRoutes(
    defineApiRoutes(async (app) => {
      const connection = app.container
        .resolve(databaseManagerToken)
        .connection();
      await connection.builder.createCollection('auditOrders', (collection) => {
        collection.string('id').primary();
        collection.string('name');
        collection.json('password');
      });
      await connection.builder.createCollection(
        'mutationReceipts',
        (collection) => {
          collection.string('id', { length: 64 }).primary();
          collection.string('digest', { length: 64 }).notNull();
          collection.json('result').nullable();
          collection.datetime('expiresAt').notNull();
        },
      );
      const router = new Hono();
      router.use(
        '/auditOrders/*',
        app.container.resolve(authenticationToken).required(),
      );
      const auth = app.container.resolve(authenticationToken);
      router.post(
        '/auditRun',
        auth.required({ scopedKeys: true }),
        describeRoute({
          operationId: 'auditRunAction',
          security: [{ runToken: [] }],
        }),
        (context) => context.json({ data: 'done' }),
      );
      router.route('/', await repository.createRouter(app));
      return router;
    }),
  );
  await app.start();
}, 60_000);

afterAll(async () => {
  await app?.shutdown();
  await databases?.drop();
  if (directory) rmSync(directory, { recursive: true, force: true });
});

it('attributes and commits native audit events without retaining credentials or duplicating retries', async () => {
  const signup = await request('POST', '/api/auth/sign-up/email', {
    name: 'Audit Owner',
    ...credentials,
  });
  if (signup.status !== 200) throw new Error(await signup.text());
  const { user } = (await signup.json()) as { user: { id: string } };
  expect(events.at(-1)).toMatchObject({
    action: 'auth:signUp',
    targets: [{ collection: 'user', key: user.id }],
  });
  app.container
    .resolve(authenticationToken)
    .addCredentialResolver(async (headers) =>
      headers.get('x-test-run') === 'valid-test-run'
        ? { id: 'run-1', type: 'run', userId: user.id, scheme: 'runToken' }
        : undefined,
    );
  const run = await request(
    'POST',
    '/api/auditRun',
    {},
    { 'x-test-run': 'valid-test-run' },
  );
  expect(run.status).toBe(200);
  expect(events.at(-1)).toMatchObject({
    action: 'auditRunAction',
    actor: { type: 'agentRun', userId: user.id, runId: 'run-1' },
  });
  const authz = app.container.resolve(authorizationToken);
  await authz.permissionSets.assign({
    subject: { type: 'user', id: user.id },
    permissionSet: 'root',
  });
  const failed = await request('POST', '/api/auth/sign-in/email', {
    ...credentials,
    password: 'invalid-credential',
  });
  expect(failed.status).toBe(401);
  expect(events.at(-1)).toMatchObject({
    action: 'auth:signIn',
    actor: { type: 'anonymous' },
    outcome: 'failure',
    status: 401,
  });
  expect(JSON.stringify(events.at(-1))).not.toContain(credentials.email);
  const signIn = await request('POST', '/api/auth/sign-in/email', credentials, {
    'x-request-id': 'audit-integration-request',
    'x-forwarded-for': '198.51.100.42, 192.0.2.20',
  });
  expect(signIn.status).toBe(200);
  const actor = { type: 'user', userId: user.id };
  expect(transactional.has(events.at(-1)!)).toBe(true);
  expect(events.at(-1)).toMatchObject({
    action: 'auth:signIn',
    actor,
    outcome: 'success',
    requestId: 'audit-integration-request',
    ip: '198.51.100.42',
    userAgent: 'audit integration',
    targets: [{ collection: 'user', key: user.id }],
  });
  const cookie = signIn.headers
    .getSetCookie()
    .map((header) => header.split(';')[0])
    .join('; ');
  const changed = await request(
    'POST',
    '/api/auth/change-password',
    {
      currentPassword: credentials.password,
      newPassword: 'the-replaced-audit-password',
    },
    { cookie },
  );
  expect(changed.status).toBe(200);
  expect(events.at(-1)).toMatchObject({
    action: 'auth:changePassword',
    actor,
    outcome: 'success',
  });

  const permissionSet = await request(
    'POST',
    '/api/authorization/permissionSets',
    { key: 'audit-test', grants: [] },
    { cookie },
  );
  if (permissionSet.status !== 201) throw new Error(await permissionSet.text());
  const updated = await request(
    'PATCH',
    '/api/authorization/permissionSets/audit-test',
    { title: 'Updated' },
    { cookie },
  );
  if (updated.status !== 200) throw new Error(await updated.text());
  expect(events.at(-1)).toMatchObject({
    resource: 'settings:authorization.permission-sets',
    action: 'update',
    actor,
    outcome: 'success',
    targets: [{ collection: 'authorizationPermissionSets', key: 'audit-test' }],
  });
  expect([...(events.at(-1)?.roles ?? [])].sort()).toEqual(['member', 'root']);
  const denied = await request(
    'PATCH',
    '/api/authorization/permissionSets/audit-test',
    { title: 'Denied' },
  );
  expect(denied.status).toBe(401);
  expect(events.at(-1)).toMatchObject({
    action: 'update',
    actor: { type: 'anonymous' },
    outcome: 'denied',
    targets: [{ collection: 'authorizationPermissionSets', key: 'audit-test' }],
  });

  const created = await request(
    'POST',
    '/api/apiKeys',
    { name: 'For auditing', expiresInDays: 90 },
    { cookie },
  );
  if (created.status !== 201) throw new Error(await created.text());
  const {
    data: { key, secret },
  } = (await created.json()) as {
    data: { key: { id: string }; secret: string };
  };
  expect(events.at(-1)).toMatchObject({
    action: 'apiKeysCreateKey',
    actor,
    outcome: 'success',
    targets: [{ collection: 'apikey', key: key.id }],
    response: { data: { key: '******', secret: '******' } },
  });
  const id = 'audit-order';
  const repositoryActor = { type: 'apiKey', userId: user.id, apiKeyId: key.id };
  const headers = {
    'x-api-key': secret,
    'idempotency-key': `${Date.now()}.${randomUUID()}`,
  };
  const input = {
    values: { id, name: 'Draft', password: { nested: 'secret-in-a-subtree' } },
  };
  const first = await request(
    'POST',
    '/api/auditOrders/createOne',
    input,
    headers,
  );
  if (first.status !== 200) throw new Error(await first.text());
  const replay = await request(
    'POST',
    '/api/auditOrders/createOne',
    input,
    headers,
  );
  expect(replay.headers.get('idempotency-replayed')).toBe('true');
  expect(
    events.filter(({ action }) => action === 'auditOrders:createOne'),
  ).toHaveLength(1);
  expect(events.at(-1)).toMatchObject({
    action: 'auditOrders:createOne',
    actor: repositoryActor,
    outcome: 'success',
    targets: [{ collection: 'auditOrders', key: { id } }],
    request: { values: { password: '******' } },
  });
  const filter = { id };
  const update = await request(
    'POST',
    '/api/auditOrders/updateOne',
    { filter, values: { name: 'Updated' } },
    { cookie },
  );
  if (update.status !== 200) throw new Error(await update.text());
  expect(events.at(-1)).toMatchObject({
    action: 'auditOrders:updateOne',
    actor,
    targets: [{ collection: 'auditOrders', key: { id } }],
  });
  const removed = await request(
    'POST',
    '/api/auditOrders/deleteOne',
    { filter },
    { cookie },
  );
  if (removed.status !== 200) throw new Error(await removed.text());
  expect(events.at(-1)).toMatchObject({
    action: 'auditOrders:deleteOne',
    actor,
    targets: [{ collection: 'auditOrders', key: { id } }],
  });
  const countBefore = events.length;
  expect(
    (await request('POST', '/api/auditOrders/count', {}, { cookie })).status,
  ).toBe(200);
  expect(events).toHaveLength(countBefore);

  rejectAudit = true;
  const rolledBack = await request(
    'POST',
    '/api/auditOrders/createOne',
    { values: { id } },
    { cookie },
  );
  rejectAudit = false;
  expect(rolledBack.status).toBe(500);
  expect(
    await app.container
      .resolve(databaseManagerToken)
      .repository('auditOrders')
      .count(),
  ).toBe(0);
  expect(events.at(-1)).toMatchObject({
    action: 'auditOrders:createOne',
    actor,
    outcome: 'failure',
    status: 500,
  });
  expect(
    events.filter(
      ({ action, outcome }) =>
        action === 'auditOrders:createOne' && outcome === 'success',
    ),
  ).toHaveLength(1);

  expect(
    (await request('DELETE', `/api/apiKeys/${key.id}`, undefined, { cookie }))
      .status,
  ).toBe(204);
  expect(events.at(-1)).toMatchObject({
    action: 'apiKeysRevokeKey',
    actor,
    outcome: 'success',
    targets: [{ collection: 'apikey', key: key.id }],
  });
  expect(transactional.has(events.at(-1)!)).toBe(true);
  const rules = await request(
    'PUT',
    '/api/apiKeys/rules',
    {
      allowSameAsMe: true,
      personalMaxDays: 180,
      personalDefaultDays: 90,
      idleDisableDays: null,
    },
    { cookie },
  );
  if (rules.status !== 200) throw new Error(await rules.text());
  expect(events.at(-1)).toMatchObject({
    action: 'apiKeysSaveRules',
    actor,
    targets: [{ collection: 'apiKeyRules', key: 'default' }],
  });
  expect(transactional.has(events.at(-1)!)).toBe(true);

  const system = await request(
    'POST',
    '/api/systemApiKeys',
    {
      name: 'Audited system key',
      expiresInDays: 90,
      permissions: { grants: [] },
    },
    { cookie },
  );
  if (system.status !== 201) throw new Error(await system.text());
  const { data: systemData } = (await system.json()) as {
    data: { key: { id: string; identityId: string }; secret: string };
  };
  expect(events.at(-1)).toMatchObject({
    action: 'apiKeysCreateSystemKey',
    actor,
    targets: [{ collection: 'apikey', key: systemData.key.id }],
  });
  expect(transactional.has(events.at(-1)!)).toBe(true);
  const revokeSystem = await request(
    'DELETE',
    `/api/systemApiKeys/${systemData.key.identityId}`,
    undefined,
    { cookie },
  );
  if (revokeSystem.status !== 204) throw new Error(await revokeSystem.text());
  expect(events.at(-1)).toMatchObject({
    action: 'apiKeysDeleteSystemKey',
    actor,
    targets: [{ collection: 'apikey', key: systemData.key.id }],
  });
  expect(transactional.has(events.at(-1)!)).toBe(true);

  const native = await request(
    'POST',
    '/api/auth/api-key/create',
    { name: 'Native key' },
    { cookie },
  );
  if (native.status !== 200) throw new Error(await native.text());
  const nativeKey = (await native.json()) as { id: string; key: string };
  expect(events.at(-1)).toMatchObject({
    action: 'auth:createApiKey',
    actor,
    targets: [{ collection: 'apikey', key: nativeKey.id }],
  });
  const nativeDelete = await request(
    'POST',
    '/api/auth/api-key/delete',
    { keyId: nativeKey.id },
    { cookie },
  );
  if (nativeDelete.status !== 200) throw new Error(await nativeDelete.text());
  expect(events.at(-1)).toMatchObject({
    action: 'auth:revokeApiKey',
    actor,
    targets: [{ collection: 'apikey', key: nativeKey.id }],
  });
  expect(transactional.has(events.at(-1)!)).toBe(true);
  const signOut = await request('POST', '/api/auth/sign-out', {}, { cookie });
  if (signOut.status !== 200) throw new Error(await signOut.text());
  expect(events.at(-1)).toMatchObject({
    action: 'auth:signOut',
    actor,
    targets: [{ collection: 'user', key: user.id }],
  });
  expect(transactional.has(events.at(-1)!)).toBe(true);
  const serialized = JSON.stringify(events);
  for (const value of [
    credentials.password,
    'the-replaced-audit-password',
    'secret-in-a-subtree',
    secret,
    systemData.secret,
    nativeKey.key,
  ])
    expect(serialized).not.toContain(value);
}, 20_000);
