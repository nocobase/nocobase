// @vitest-environment node
/** `/api/knowledge` over the services: answers as `{ data }`, refusals in the standard error body, access by the resolver. */
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createKnowledgeRoutes } from '../server/routes/api.js';
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
    app = new Hono();
    app.route(
      '/knowledge',
      createKnowledgeRoutes(
        h.knowledge,
        (c) => ({ userId: c.req.header('x-user') ?? 'nobody' }),
        (space) =>
          space.scope === 'system'
            ? { scope: 'system', scopeId: '' }
            : space.scope === 'project' && space.scopeId
              ? space
              : null,
      ),
    );
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

  it('serves the chunking, the index state of a document and the unindexed list, and explains search when asked', async () => {
    const created = await call('lead', 'POST', '/docs', {
      scope: 'project',
      scopeId: 'p1',
      title: 'Release',
      content: '# Release\n\nShip it.',
    });
    const { data: doc } = (await created.json()) as { data: { id: string } };
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
    expect(await list.json()).toEqual({ data: [], meta: { enabled: false } });

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
