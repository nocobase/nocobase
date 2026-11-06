// @vitest-environment node
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createAppTest } from '@nocobase/app-testing/server';
import { signIn } from '@nocobase/app-plugin-authentication/testing';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { defineStandaloneServer } from '@nocobase/app-server/node';
import {
  resolveAppRuntime,
  startApplicationInScope,
} from '@nocobase/app-server/runtime';
import {
  findUndeclaredApiRoutes,
  findApiDocumentSchemaProblems,
  generateApiDocument,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { expect, vi } from 'vitest';
import { createKnowledgeIndexingRoutes } from '../server/routes/indexing.js';
import { apiRoutes } from '../server/routes/index.js';
import { knowledgeIndexingToken } from '../server/tokens.js';
import {
  KnowledgeIndexingReceiptSchema,
  KnowledgeIndexingSettingsSchema,
  KnowledgeIndexingStatusSchema,
} from '../server/routes/schemas.js';
import { textIndexingExtension } from './fixtures/text-indexing-extension.js';
import { createApp } from './fixtures/indexing-app/server/app.js';
import { createIndexingAppRuntime } from './fixtures/indexing-app/server/runtime.js';

const runtime = createIndexingAppRuntime([textIndexingExtension], false);
const standalone = defineStandaloneServer({
  rootDir: path.resolve(import.meta.dirname, 'fixtures/indexing-app'),
  appRuntime: runtime,
  createServer: async (scope) =>
    startApplicationInScope(
      scope,
      createApp(await resolveAppRuntime(runtime, scope)),
    ),
});
const test = createAppTest({
  scope: 'test',
  createServer: standalone.create,
  config: {
    knowledge: {
      indexing: { lexical: { name: 'Text fixture', type: 'fixture-text' } },
    },
  },
});
const json = (method: string, value: unknown): RequestInit => ({
  method,
  headers: { 'content-type': 'application/json', origin: 'http://localhost' },
  body: JSON.stringify(value),
});
const save = () => ({
  requestId: randomUUID(),
  expectedRevision: '0',
  config: { version: 1, key: 'lexical', options: {} },
  acknowledgeFullRebuild: true,
});
async function session(
  testApp: Parameters<typeof signIn>[0] & {
    request(path: string, init?: RequestInit): Promise<Response>;
  },
) {
  const credentials = {
    email: randomUUID() + '@example.test',
    password: 'fixture-password-123',
  };
  const response = await testApp.request(
    '/auth/sign-up/email',
    json('POST', { ...credentials, name: 'Index admin' }),
  );
  expect(response.status).toBe(200);
  return signIn(testApp, credentials);
}
test('authenticates before parsing, distinguishes read/configure/rebuild and retains standard conflict receipts', async ({
  app,
  testApp,
  request,
}) => {
  expect((await request('/knowledge/indexingSettings')).status).toBe(401);
  expect(
    (
      await request(
        '/knowledge/indexingSettings',
        json('PUT', { invalid: true }),
      )
    ).status,
  ).toBe(401);
  const user = await session(testApp);
  const authz = app.container.resolve(authorizationToken);
  const subject = { type: 'user', id: user.user.id };
  const grant = async (key: string, actions: string[]) => {
    await authz.permissionSets.create({
      key,
      grants: [
        {
          resource: { type: 'settings', id: 'kb.indexing' },
          actions: actions.map((action) => ({ action })),
        },
      ],
    });
    await authz.permissionSets.assign({ subject, permissionSet: key });
  };
  const denied = await user.fetch(
    '/knowledge/indexingSettings',
    json('PUT', { invalid: true }),
  );
  expect(denied.status).toBe(403);
  expect(await denied.json()).toMatchObject({
    error: { reason: 'AUTHORIZATION_DENIED' },
  });
  await grant('reader', ['read']);
  const settings = await user.fetch('/knowledge/indexingSettings');
  expect(settings.status).toBe(200);
  expect(
    KnowledgeIndexingSettingsSchema.parse((await settings.json()).data)
      .capabilities,
  ).toEqual({ configure: false, rebuild: false });
  expect(
    (await user.fetch('/knowledge/indexingSettings', json('PUT', save())))
      .status,
  ).toBe(403);
  await grant('configurer', ['configure']);
  const input = save();
  const accepted = await user.fetch(
    '/knowledge/indexingSettings',
    json('PUT', input),
  );
  expect(accepted.status).toBe(200);
  const receipt = KnowledgeIndexingReceiptSchema.parse(
    (await accepted.json()).data,
  );
  expect(receipt).toMatchObject({
    enabled: true,
    revision: '1',
    requestId: input.requestId,
  });
  expect(
    (
      await (
        await user.fetch('/knowledge/indexingSettings', json('PUT', input))
      ).json()
    ).data,
  ).toEqual(receipt);
  const reused = await user.fetch(
    '/knowledge/indexingSettings',
    json('PUT', { ...input, config: null }),
  );
  expect(reused.status).toBe(409);
  expect(await reused.json()).toMatchObject({
    error: {
      status: 'ABORTED',
      reason: 'INDEXING_REQUEST_CONFLICT',
      domain: 'knowledge',
    },
  });
  const stale = await user.fetch(
    '/knowledge/indexingSettings',
    json('PUT', { ...input, requestId: randomUUID() }),
  );
  expect(stale.status).toBe(409);
  expect(await stale.json()).toMatchObject({
    error: { status: 'ABORTED', reason: 'INDEXING_REVISION_CONFLICT' },
  });
  const rebuild = {
    requestId: randomUUID(),
    expectedRevision: '1',
    acknowledgeFullRebuild: true,
  };
  expect(
    (
      await user.fetch(
        '/knowledge/indexingSettings/rebuild',
        json('POST', rebuild),
      )
    ).status,
  ).toBe(403);
  await grant('rebuilder', ['rebuild']);
  const rebuilt = await user.fetch(
    '/knowledge/indexingSettings/rebuild',
    json('POST', rebuild),
  );
  expect(rebuilt.status).toBe(202);
  expect((await rebuilt.json()).data.revision).toBe('2');
  const status = await user.fetch('/knowledge/indexingSettings/status');
  expect(
    KnowledgeIndexingStatusSchema.safeParse((await status.json()).data).success,
  ).toBe(true);
});
test('validates strict bodies, refuses over 32 KiB after authorization and keeps catalogs credential-free', async ({
  app,
  testApp,
}) => {
  const user = await session(testApp);
  const authz = app.container.resolve(authorizationToken);
  await authz.permissionSets.assign({
    subject: { type: 'user', id: user.user.id },
    permissionSet: 'root',
  });
  const service = app.container.resolve(knowledgeIndexingToken);
  const spy = vi.spyOn(service, 'save');
  const extra = await user.fetch(
    '/knowledge/indexingSettings',
    json('PUT', { ...save(), spaceId: 'not-global' }),
  );
  expect(extra.status).toBe(400);
  expect(await extra.json()).toMatchObject({
    error: { reason: 'INVALID_INPUT' },
  });
  expect(spy).not.toHaveBeenCalled();
  const oversized = await user.fetch(
    '/knowledge/indexingSettings',
    json('PUT', {
      ...save(),
      config: {
        version: 1,
        key: 'lexical',
        options: { text: 'x'.repeat(33000) },
      },
    }),
  );
  expect(oversized.status).toBe(413);
  expect(await oversized.json()).toMatchObject({
    error: { reason: 'BODY_TOO_LARGE', domain: 'knowledge' },
  });
  expect(spy).not.toHaveBeenCalled();
  const invalidOptions = await user.fetch(
    '/knowledge/indexingSettings',
    json('PUT', {
      ...save(),
      config: { version: 1, key: 'lexical', options: { unknown: true } },
    }),
  );
  expect(invalidOptions.status).toBe(400);
  expect(await invalidOptions.json()).toMatchObject({
    error: { reason: 'INDEXING_OPTIONS_INVALID', domain: 'knowledge' },
  });
  const unknown = await user.fetch(
    '/knowledge/indexingSettings',
    json('PUT', {
      ...save(),
      config: { version: 1, key: 'missing', options: {} },
    }),
  );
  expect(unknown.status).toBe(400);
  expect(await unknown.json()).toMatchObject({
    error: { reason: 'INDEXING_INSTANCE_UNKNOWN' },
  });
  const catalog = await user.fetch('/knowledge/indexingInstances');
  expect(await catalog.json()).toEqual({
    data: [
      {
        key: 'lexical',
        name: 'Text fixture',
        type: 'fixture-text',
        channels: [{ name: 'terms', kind: 'lexical' }],
        available: true,
        reason: null,
      },
    ],
    meta: { total: 1, reason: null },
  });
  const models = await user.fetch('/knowledge/embeddingModels');
  expect(await models.json()).toMatchObject({
    data: [],
    meta: { total: 0, reason: 'INDEXING_MODEL_UNKNOWN' },
  });
  spy.mockRestore();
});
test('keeps a restricted key scope on the exact HTTP authorization context even for an unrestricted holder', async ({
  app,
}) => {
  const authz = app.container.resolve(authorizationToken);
  const subject = { type: 'user', id: 'scoped-holder' };
  await authz.permissionSets.assign({ subject, permissionSet: 'root' });
  const scoped = authz.for({
    principal: subject,
    subjects: [],
    keyScope: {
      keyId: 'read-only-key',
      allows: (_resource, action) => action === 'read',
      objects: () => 'all',
      permissions: [
        {
          resource: { type: 'settings', id: 'kb.indexing' },
          actions: ['read'],
        },
      ],
    },
  });
  const router = new Hono().route(
    '/knowledge',
    createKnowledgeIndexingRoutes(
      app.container.resolve(knowledgeIndexingToken),
      async (c, next) => {
        c.set('authz', scoped);
        await next();
      },
    ),
  );
  expect((await router.request('/knowledge/indexingSettings')).status).toBe(
    200,
  );
  const response = await router.request(
    '/knowledge/indexingSettings',
    json('PUT', save()),
  );
  expect(response.status).toBe(403);
  expect(await response.json()).toMatchObject({
    error: { reason: 'AUTHORIZATION_DENIED' },
  });
  expect(
    (
      await app.container
        .resolve(knowledgeIndexingToken)
        .settings(authz.for({ principal: subject, subjects: [] }))
    ).revision,
  ).toBe('0');
});
test('documents all seven global operations on the actual createRouter without hiding the original document index APIs', async ({
  app,
}) => {
  const router = await apiRoutes.createRouter(app);
  expect(findUndeclaredApiRoutes(router)).toEqual([]);
  const document = await generateApiDocument(router, {
    info: { title: 'Indexing fixture', version: '1.0.0' },
  });
  expect(findApiDocumentSchemaProblems(document)).toEqual([]);
  const ids = Object.values(document.paths ?? {}).flatMap((item) =>
    Object.values(item ?? {})
      .map((operation) => operation.operationId)
      .filter(Boolean),
  );
  expect(ids).toEqual(
    expect.arrayContaining([
      'knowledgeGetIndexingSettings',
      'knowledgeReplaceIndexingSettings',
      'knowledgeGetIndexingStatus',
      'knowledgeRebuildIndexing',
      'knowledgeRetryIndexing',
      'knowledgeListIndexingInstances',
      'knowledgeListEmbeddingModels',
      'knowledgeListUnindexedDocs',
      'knowledgeGetDocIndex',
      'knowledgeReindexDoc',
    ]),
  );
  expect(new Set(ids).size).toBe(ids.length);
});
