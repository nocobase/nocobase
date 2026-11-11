// @vitest-environment node
/** `createKnowledgePlugin({ indexing: false })`: nothing of semantic indexing is registered, and search still answers. */
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createAppTest } from '@nocobase/app-testing/server';
import { signIn } from '@nocobase/app-plugin-authentication/testing';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { defineStandaloneServer } from '@nocobase/app-server/node';
import {
  generateApiDocument,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  resolveAppRuntime,
  startApplicationInScope,
} from '@nocobase/app-server/runtime';
import { describe, expect, it } from 'vitest';
import { createKnowledgePlugin } from '../server/index.js';
import { apiRoutes, createApiRoutes } from '../server/routes/index.js';
import { SETTINGS_SECTION } from '../server/providers/authorization.js';
import {
  knowledgeAccessToken,
  knowledgeIndexingExtensionsToken,
  knowledgeIndexingToken,
  knowledgeToken,
} from '../server/tokens.js';
import { createApp } from './fixtures/indexing-app/server/app.js';
import { createIndexingAppRuntime } from './fixtures/indexing-app/server/runtime.js';
import { textIndexingExtension } from './fixtures/text-indexing-extension.js';

const INDEXING_OPERATIONS = [
  'knowledgeGetIndexingSettings',
  'knowledgeReplaceIndexingSettings',
  'knowledgeGetIndexingStatus',
  'knowledgeRebuildIndexing',
  'knowledgeRetryIndexing',
  'knowledgeListIndexingInstances',
  'knowledgeListEmbeddingModels',
  // Indexing-only operations among the knowledge routes.
  'knowledgeGetChunking',
  'knowledgeUpdateChunking',
  'knowledgeListUnindexedDocs',
  'knowledgeReindexDoc',
];

async function session(
  testApp: Parameters<typeof signIn>[0] & {
    request(path: string, init?: RequestInit): Promise<Response>;
  },
) {
  const credentials = {
    email: randomUUID() + '@example.test',
    password: 'fixture-password-123',
  };
  const response = await testApp.request('/auth/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost' },
    body: JSON.stringify({ ...credentials, name: 'Reader' }),
  });
  expect(response.status).toBe(200);
  return signIn(testApp, credentials);
}

function appTest(indexing: boolean) {
  const runtime = createIndexingAppRuntime([], false, indexing);
  const standalone = defineStandaloneServer({
    rootDir: path.resolve(import.meta.dirname, 'fixtures/indexing-app'),
    appRuntime: runtime,
    createServer: async (scope) =>
      startApplicationInScope(
        scope,
        createApp(await resolveAppRuntime(runtime, scope)),
      ),
  });
  return createAppTest({ scope: 'test', createServer: standalone.create });
}

async function operationIds(
  app: AppPluginApplication,
  routes: AppApiRouteContribution<AppPluginApplication>,
): Promise<string[]> {
  const document = await generateApiDocument(await routes.createRouter(app), {
    info: { title: 'Knowledge fixture', version: '1.0.0' },
  });
  return Object.values(document.paths ?? {}).flatMap((item) =>
    Object.values(item ?? {}).flatMap((operation) =>
      operation.operationId ? [operation.operationId] : [],
    ),
  );
}

describe('with indexing off', () => {
  const test = appTest(false);

  test('registers no index service, settings item or indexing routes', async ({
    app,
    testApp,
  }) => {
    expect(app.container.has(knowledgeIndexingToken)).toBe(false);
    expect(app.container.has(knowledgeIndexingExtensionsToken)).toBe(false);
    const authz = app.container.resolve(authorizationToken);
    expect(() => authz.settings.grant('kb.indexing', ['read'])).toThrow(
      'Unknown settings item: kb.indexing',
    );
    expect(authz.ui.sections.has(SETTINGS_SECTION)).toBe(false);
    expect(
      authz.resourceTypes.get('kb').items?.get('kb.knowledge'),
    ).toBeTruthy();
    const ids = await operationIds(app, createApiRoutes({ indexing: false }));
    for (const id of INDEXING_OPERATIONS) expect(ids).not.toContain(id);
    expect(ids).toEqual(
      expect.arrayContaining(['knowledgeSearchDocs', 'knowledgeGetDocIndex']),
    );
    const user = await session(testApp);
    for (const [method, path] of [
      ['GET', '/knowledge/indexingSettings'],
      ['GET', '/knowledge/chunking?scope=project&scopeId=p1'],
      ['PUT', '/knowledge/chunking'],
      ['GET', '/knowledge/indexing?scope=project&scopeId=p1'],
      ['POST', '/knowledge/docs/1/reindex'],
    ] as const)
      expect(
        (
          await user.fetch(path, {
            method,
            headers: { origin: 'http://localhost' },
          })
        ).status,
        `${method} ${path}`,
      ).toBe(404);
  });

  test('searches by text, reads sections and reports semantic search off', async ({
    app,
    testApp,
  }) => {
    app.container.singleton(knowledgeAccessToken, () => ({
      space: (space) => space,
      inherits: () => [],
      forReader: () => ({
        access: async () => ({
          read: true,
          propose: true,
          edit: true,
          manage: true,
        }),
      }),
      title: async () => null,
      names: async () => new Map(),
    }));
    const knowledge = app.container.resolve(knowledgeToken);
    expect(knowledge.indexing.enabled()).toBe(false);
    const admin = { kind: 'user', userId: 'fixture-admin' } as const;
    const space = { scope: 'project', scopeId: 'p1' } as const;
    const doc = await knowledge.docs.create(admin, {
      ...space,
      title: 'Release checklist',
      content: 'Tag the build after the changelog is merged.',
    });
    await knowledge.docs.create(admin, {
      ...space,
      title: 'Other',
      content: 'Nothing related.',
    });
    const hits = await knowledge.docs.searchMany(admin, [space], 'changelog');
    expect(hits.map((hit) => hit.docId)).toEqual([doc.id]);
    const user = await session(testApp);
    const sections = await user.fetch(`/knowledge/docs/${doc.id}/index`);
    expect(sections.status).toBe(200);
    const { data } = (await sections.json()) as {
      data: { enabled: boolean; chunks: { state: unknown }[] };
    };
    expect(data.enabled).toBe(false);
    expect(data.chunks.length).toBeGreaterThan(0);
    expect(data.chunks.every((chunk) => chunk.state === null)).toBe(true);
  });
});

describe('with indexing on (the default)', () => {
  const test = appTest(true);

  test('registers the index service, its grouped settings item and routes', async ({
    app,
  }) => {
    expect(app.container.has(knowledgeIndexingToken)).toBe(true);
    const authz = app.container.resolve(authorizationToken);
    expect(authz.settings.grant('kb.indexing', ['read', 'rebuild'])).toEqual({
      resource: { type: 'settings', id: 'kb.indexing' },
      actions: [{ action: 'read' }, { action: 'rebuild' }],
    });
    expect(
      authz.ui.placementOf({ type: 'settings', id: 'kb.indexing' })?.section,
    ).toBe(SETTINGS_SECTION);
    expect(await operationIds(app, apiRoutes)).toEqual(
      expect.arrayContaining(INDEXING_OPERATIONS),
    );
  });
});

describe('createKnowledgePlugin', () => {
  it('refuses index backends with indexing off', () => {
    expect(() =>
      createKnowledgePlugin({
        indexing: false,
        indexingExtensions: [textIndexingExtension],
      }),
    ).toThrow(TypeError);
  });
});
