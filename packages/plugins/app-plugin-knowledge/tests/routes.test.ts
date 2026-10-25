// @vitest-environment node
/** `/api/knowledge` over the services: answers as `{ data }`, refusals in the standard error body, access by the resolver. */
import { Auth, authenticationToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceContainer } from '@nocobase/service-provider';
import type { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiRoutes } from '../server/routes/index.js';
import { NO_ACCESS } from '../server/services/access.js';
import { knowledgeToken, knowledgeAccessToken } from '../server/tokens.js';
import {
  ADMIN,
  READER,
  createKnowledgeHarness,
  type KnowledgeHarness,
} from './harness.js';

describe('knowledge routes', () => {
  let h: KnowledgeHarness;
  let app: Hono;
  beforeEach(async () => {
    h = await createKnowledgeHarness();
    h.levels.set('admin', ADMIN);
    h.projects.set('p1', {
      id: 'p1',
      name: 'Acme',
      leadUserId: 'lead',
      seenBy: ['lead', 'admin'],
    });
    const authentication = new Auth({
      connection: h.database.connection(),
      secret: 'knowledge-test-authentication-secret-at-least-32-characters',
      baseURL: 'http://localhost',
    });
    vi.spyOn(authentication, 'getSession').mockImplementation(
      async (headers) => {
        const id = headers.get('x-user');
        if (!id) return null;
        const now = new Date();
        return {
          user: {
            id,
            name: id,
            email: `${id}@example.test`,
            emailVerified: true,
            createdAt: now,
            updatedAt: now,
          },
          session: {
            id: 'session',
            token: 'test',
            userId: id,
            expiresAt: new Date(Date.now() + 60000),
            createdAt: now,
            updatedAt: now,
          },
        };
      },
    );
    const container = new ServiceContainer();
    container.instance(authenticationToken, authentication);
    container.instance(knowledgeToken, h.knowledge);
    container.instance(knowledgeAccessToken, {
      ...NO_ACCESS,
      space: (space) =>
        space.scope === 'system'
          ? { scope: 'system', scopeId: '' }
          : space.scope === 'project' && space.scopeId
            ? space
            : null,
    });
    app = await apiRoutes.createRouter({
      appName: 'test',
      publicBasePath: '',
      config: {},
      paths: {},
      router: {},
      container,
    } as AppPluginApplication);
  });
  afterEach(async () => {
    await h?.close();
  });

  const call = (user: string, method: string, path: string, body?: unknown) =>
    app.request(`/knowledge${path}`, {
      method,
      headers: { 'x-user': user, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  it('requires native authentication for capability and semantic tool requests', async () => {
    for (const [method, path, body] of [
      ['GET', '/capabilities', undefined],
      ['GET', '/chunking?scope=project&scopeId=p1', undefined],
      ['PUT', '/chunking', { scope: 'project', scopeId: 'p1', override: null }],
      [
        'GET',
        '/search?scope=project&scopeId=p1&q=needle&explain=true',
        undefined,
      ],
    ] as const) {
      const response = await app.request(`/knowledge${path}`, {
        method,
        headers: { 'content-type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({
        error: { status: 'UNAUTHENTICATED', reason: 'AUTHENTICATION_REQUIRED' },
      });
    }
  });

  it('reports indexer notification coverage without changing snapshot data or permissions', async () => {
    const created = await call('lead', 'POST', '/docs', {
      scope: 'project',
      scopeId: 'p1',
      title: 'Index',
      content: '# Index',
    });
    const { data: doc } = (await created.json()) as { data: { id: string } };
    const off = await (
      await call('lead', 'GET', `/docs/${doc.id}/index`)
    ).json();
    expect(off).toMatchObject({
      data: { enabled: false },
      meta: { notifications: 'none' },
    });
    const unregister = h.knowledge.registerIndexer({
      notifications: 'complete',
      onChange: () => () => {},
      states: async () => new Map(),
      unfinished: async () => [],
      reindex: async () => {},
    });
    expect(
      await (await call('lead', 'GET', `/docs/${doc.id}/index`)).json(),
    ).toMatchObject({
      data: { enabled: true, pending: 1 },
      meta: { notifications: 'complete' },
    });
    expect(
      await (
        await call('lead', 'GET', '/indexing?scope=project&scopeId=p1')
      ).json(),
    ).toMatchObject({
      data: [],
      meta: { enabled: true, notifications: 'complete' },
    });
    expect(
      await (await call('lead', 'POST', `/docs/${doc.id}/reindex`)).json(),
    ).toMatchObject({ meta: { notifications: 'complete' } });
    expect((await call('nobody', 'GET', `/docs/${doc.id}/index`)).status).toBe(
      404,
    );
    unregister();
    expect(
      await (
        await call('lead', 'GET', '/indexing?scope=project&scopeId=p1')
      ).json(),
    ).toMatchObject({
      data: [],
      meta: { enabled: false, notifications: 'none' },
    });
  });

  it('creates, reads and edits under the version read', async () => {
    const created = await call('lead', 'POST', '/docs', {
      scope: 'project',
      scopeId: 'p1',
      title: 'Release',
      content: '# Release',
    });
    expect(created.status).toBe(201);
    const { data: doc } = (await created.json()) as {
      data: { id: string; version: number };
    };
    expect(doc.version).toBe(1);
    const tree = await call('lead', 'GET', '/spaces?scope=project&scopeId=p1');
    expect(tree.status).toBe(200);
    const listed = (await tree.json()) as {
      data: { space: { scope: string } }[];
      meta: { total: number };
    };
    expect(listed.data[0]?.space).toMatchObject({
      scope: 'project',
      scopeId: 'p1',
    });
    expect(listed.meta.total).toBe(listed.data.length);
    const stale = await call('lead', 'PATCH', `/docs/${doc.id}`, {
      expectedVersion: 2,
      content: 'x',
    });
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({
      error: {
        status: 'ABORTED',
        reason: 'KNOWLEDGE_VERSION_CONFLICT',
        domain: 'knowledge',
        metadata: { currentVersion: 1 },
      },
    });
    const unknownField = await call('lead', 'PATCH', `/docs/${doc.id}`, {
      expectedVersion: 1,
      content: 'x',
      colour: 'red',
    });
    expect(unknownField.status).toBe(400);
    expect(await unknownField.json()).toMatchObject({
      error: { reason: 'INVALID_INPUT' },
    });
    const missing = await call('lead', 'GET', '/docs/nope');
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({
      error: { reason: 'DOC_NOT_FOUND', domain: 'knowledge' },
    });
  });

  it('reports indexer registration and rejects semantic tools while preserving keyword search', async () => {
    const capabilities = async () =>
      (await call('lead', 'GET', '/capabilities')).json();
    expect(await capabilities()).toEqual({
      data: { semanticSearch: false, proposals: true },
    });
    const register = () =>
      h.knowledge.registerIndexer({
        // Registration alone determines availability, even before any state exists.
        states: async () => null,
        unfinished: async () => null,
        reindex: async () => {},
      });
    const unregister = register();
    expect(await capabilities()).toEqual({
      data: { semanticSearch: true, proposals: true },
    });
    unregister();
    expect(await capabilities()).toEqual({
      data: { semanticSearch: false, proposals: true },
    });
    await call('lead', 'POST', '/docs', {
      scope: 'project',
      scopeId: 'p1',
      title: 'Guide',
      content: 'Keyword needle.',
    });
    const before = await h.knowledge.chunking.get(h.user('lead'), {
      scope: 'project',
      scopeId: 'p1',
    });
    for (const [method, path, body] of [
      [
        'GET',
        '/search?scope=project&scopeId=p1&q=needle&explain=true',
        undefined,
      ],
      ['GET', '/chunking?scope=project&scopeId=p1', undefined],
      [
        'PUT',
        '/chunking',
        {
          scope: 'project',
          scopeId: 'p1',
          override: { headingDepth: 1, target: 800, max: 1200 },
        },
      ],
    ] as const) {
      const response = await call('lead', method, path, body);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: {
          status: 'FAILED_PRECONDITION',
          reason: 'SEMANTIC_SEARCH_UNAVAILABLE',
          domain: 'knowledge',
        },
      });
    }
    expect(
      await h.knowledge.chunking.get(h.user('lead'), {
        scope: 'project',
        scopeId: 'p1',
      }),
    ).toEqual(before);
    const keywords = await call(
      'lead',
      'GET',
      '/search?scope=project&scopeId=p1&q=needle',
    );
    expect(keywords.status).toBe(200);
    expect(await keywords.json()).toMatchObject({ data: [{ title: 'Guide' }] });
    register();
    expect(
      (await call('lead', 'GET', '/chunking?scope=project&scopeId=p1')).status,
    ).toBe(200);
    expect(
      (
        await call(
          'lead',
          'GET',
          '/search?scope=project&scopeId=p1&q=needle&explain=true',
        )
      ).status,
    ).toBe(200);
    h.projects.set('p1', { id: 'p1', name: 'Acme', leadUserId: 'lead' });
    h.levels.set('member', READER);
    expect(
      (
        await call('member', 'PUT', '/chunking', {
          scope: 'project',
          scopeId: 'p1',
          override: null,
        })
      ).status,
    ).toBe(403);
    expect(
      (await call('outsider', 'GET', '/chunking?scope=project&scopeId=hidden'))
        .status,
    ).toBe(404);
  });

  it('serves the chunking, the index state of a document and the unindexed list, and explains search when asked', async () => {
    const created = await call('lead', 'POST', '/docs', {
      scope: 'project',
      scopeId: 'p1',
      title: 'Release',
      content: '# Release\n\nShip it.',
    });
    const { data: doc } = (await created.json()) as { data: { id: string } };
    const unregister = h.knowledge.registerIndexer({
      states: async () => new Map(),
      unfinished: async () => [],
      reindex: async () => {},
    });
    const chunking = await call(
      'lead',
      'GET',
      '/chunking?scope=project&scopeId=p1',
    );
    expect(chunking.status).toBe(200);
    expect(await chunking.json()).toMatchObject({
      data: { override: null, canManage: true },
    });
    const set = await call('lead', 'PUT', '/chunking', {
      scope: 'project',
      scopeId: 'p1',
      override: { headingDepth: 2, target: 1000, max: 1500 },
    });
    expect(set.status).toBe(200);
    expect(await set.json()).toMatchObject({
      data: { effective: { headingDepth: 2, target: 1000, max: 1500 } },
    });
    const bad = await call('lead', 'PUT', '/chunking', {
      scope: 'project',
      scopeId: 'p1',
      override: { headingDepth: 9, target: 1000, max: 1500 },
    });
    expect(await bad.json()).toMatchObject({
      error: { reason: 'INVALID_CHUNKING' },
    });
    await h.knowledge.chunking.idle();

    unregister();
    const index = await call('lead', 'GET', `/docs/${doc.id}/index`);
    expect(await index.json()).toMatchObject({
      data: { docId: doc.id, enabled: false, total: 1, state: null },
    });
    const again = await call('lead', 'POST', `/docs/${doc.id}/reindex`);
    expect(again.status).toBe(200);
    const list = await call(
      'lead',
      'GET',
      '/indexing?scope=project&scopeId=p1',
    );
    expect(await list.json()).toEqual({
      data: [],
      meta: { enabled: false, notifications: 'none' },
    });

    h.knowledge.registerIndexer({
      states: async () => null,
      unfinished: async () => null,
      reindex: async () => {},
    });
    const explained = await call(
      'lead',
      'GET',
      '/search?scope=project&scopeId=p1&q=ship&explain=true',
    );
    const hits = (await explained.json()) as {
      data: { explain?: { normalized: number } }[];
    };
    expect(hits.data[0]?.explain?.normalized).toBe(1);
  });

  it('pages versions and proposals', async () => {
    const created = await call('lead', 'POST', '/docs', {
      scope: 'project',
      scopeId: 'p1',
      title: 'Release',
      content: 'one',
    });
    const { data: doc } = (await created.json()) as { data: { id: string } };
    await call('lead', 'PATCH', `/docs/${doc.id}`, {
      expectedVersion: 1,
      content: 'two',
    });
    const first = await call(
      'lead',
      'GET',
      `/docs/${doc.id}/versions?pageSize=1`,
    );
    expect(await first.json()).toMatchObject({
      data: [{ version: 2 }],
      meta: { page: 1, pageSize: 1, total: 2 },
    });
    const second = await call(
      'lead',
      'GET',
      `/docs/${doc.id}/versions?page=2&pageSize=1`,
    );
    expect(await second.json()).toMatchObject({ data: [{ version: 1 }] });
    expect(
      (await call('lead', 'GET', `/docs/${doc.id}/versions?pageSize=101`))
        .status,
    ).toBe(400);
    const listed = await call(
      'lead',
      'GET',
      '/proposals?scope=project&scopeId=p1&decidable=true',
    );
    expect(await listed.json()).toEqual({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0 },
    });
  });

  it('answers 404 to whoever does not read a space, and 400 to a space the application does not have', async () => {
    expect(
      (await call('member', 'GET', '/spaces?scope=project&scopeId=p1')).status,
    ).toBe(404);
    const unknown = await call('lead', 'GET', '/spaces?scope=team&scopeId=t1');
    expect(unknown.status).toBe(400);
    expect(await unknown.json()).toMatchObject({
      error: {
        reason: 'INVALID_SCOPE',
        domain: 'knowledge',
        fieldViolations: [{ field: 'scope' }],
      },
    });
    expect((await call('lead', 'GET', '/spaces')).status).toBe(400);
  });

  it('takes a proposal from someone who may propose but not edit, and refuses one who may not propose', async () => {
    h.projects.set('p1', {
      id: 'p1',
      name: 'Acme',
      leadUserId: 'lead',
      seenBy: ['lead', 'admin', 'member', 'reader'],
    });
    h.levels.set('reader', READER);
    const created = await call('lead', 'POST', '/docs', {
      scope: 'project',
      scopeId: 'p1',
      title: 'Release',
      content: '# Release\n\nTag it.',
    });
    const { data: doc } = (await created.json()) as { data: { id: string } };
    const change = {
      kind: 'update',
      docId: doc.id,
      baseVersion: 1,
      content: '# Release\n\nTag it, then deploy.',
      reason: 'The deploy step was missing.',
    };
    const proposed = await call('member', 'POST', '/proposals', change);
    expect(proposed.status).toBe(201);
    expect(await proposed.json()).toMatchObject({
      data: {
        kind: 'update',
        status: 'pending',
        docId: doc.id,
        baseVersion: 1,
        proposer: { kind: 'user', id: 'member' },
      },
    });
    const refused = await call('reader', 'POST', '/proposals', change);
    expect(refused.status).toBe(403);
    expect(await refused.json()).toMatchObject({
      error: { status: 'PERMISSION_DENIED', domain: 'knowledge' },
    });
    const missing = await call('member', 'POST', '/proposals', {
      ...change,
      reason: '',
    });
    expect(missing.status).toBe(400);
  });
});
