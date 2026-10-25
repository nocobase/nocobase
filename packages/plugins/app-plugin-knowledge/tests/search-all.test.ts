// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MAX_PAGE_SIZE,
  SearchQuery,
  SpaceOnlyQuery,
} from '../server/routes/schemas.js';
import { chunksRepo, spacesRepo } from '../server/services/store.js';
import {
  ADMIN,
  SYSTEM,
  createKnowledgeHarness,
  type KnowledgeHarness,
} from './harness.js';

describe('all readable knowledge spaces', () => {
  let h: KnowledgeHarness;
  beforeEach(async () => {
    h = await createKnowledgeHarness();
    h.levels.set('admin', ADMIN);
  });
  afterEach(async () => {
    await h?.close();
  });

  it('searches all candidates once, filters access and never creates spaces', async () => {
    const { docs } = h.knowledge;
    const refs = ['p1', 'p2', 'secret'].map((scopeId) => ({
      scope: 'project',
      scopeId,
    }));
    for (const ref of refs)
      h.projects.set(ref.scopeId, {
        id: ref.scopeId,
        name: ref.scopeId,
        leadUserId: 'admin',
        seenBy: ref.scopeId === 'secret' ? ['admin'] : undefined,
      });
    const created = [];
    for (const ref of refs)
      created.push(
        await docs.create(h.user('admin'), {
          ...ref,
          title: ref.scopeId,
          content: 'release procedure',
        }),
      );
    const searchMany = vi.spyOn(docs, 'searchMany');
    const repo = spacesRepo(h.database.connection());
    const before = await repo.findMany();
    const hits = await docs.searchAll(h.user('reader'), 'release', {
      explain: true,
    });
    expect(hits.map((hit) => hit.docId).sort()).toEqual(
      created
        .slice(0, 2)
        .map((doc) => doc.id)
        .sort(),
    );
    expect(hits.every((hit) => !hit.inherited && !hit.explain)).toBe(true);
    expect(searchMany).toHaveBeenCalledTimes(1);
    expect(await repo.findMany()).toEqual(before);
    expect(await docs.searchAll(h.user('reader'), '')).toEqual([]);
    expect(await docs.searchMany(h.user('reader'), [], 'release')).toEqual([]);
    expect(await docs.searchAll(h.user('reader'), 'no-such-material')).toEqual(
      [],
    );
    h.levels.set('denied', {
      read: 'none',
      propose: 'none',
      edit: 'none',
      manage: 'none',
    });
    expect(await docs.searchAll(h.user('denied'), 'release')).toEqual([]);
    expect(await repo.findMany()).toEqual(before);
  });

  it('includes candidates after 200 spaces and ignores unregistered remnants', async () => {
    const repo = spacesRepo(h.database.connection());
    for (let i = 0; i < 205; i++)
      await repo.createOne({
        values: {
          id: `space-${String(i).padStart(3, '0')}`,
          scope: 'project',
          scopeId: `p${i}`,
          settings: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    h.projects.set('last', { id: 'last', name: 'Last', leadUserId: 'admin' });
    const doc = await h.knowledge.docs.create(h.user('admin'), {
      scope: 'project',
      scopeId: 'last',
      title: 'Last',
      content: 'needle',
    });
    await repo.createOne({
      values: {
        id: 'remnant',
        scope: 'removed',
        scopeId: '',
        settings: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    expect(
      (await h.knowledge.docs.searchAll(h.user('reader'), 'needle')).map(
        (hit) => hit.docId,
      ),
    ).toEqual([doc.id]);
  });

  it('does not prune spaces with no base read when a custom node grants access', async () => {
    h.projects.set('custom', {
      id: 'custom',
      name: 'Custom',
      leadUserId: 'admin',
    });
    const create = (title: string) =>
      h.knowledge.docs.create(h.user('admin'), {
        scope: 'project',
        scopeId: 'custom',
        title,
        content: 'needle',
      });
    const visible = await create('Visible');
    await create('Hidden');
    h.levels.set('reader', {
      read: 'none',
      propose: 'none',
      edit: 'none',
      manage: 'none',
    });
    await h.knowledge.permissions.replace(h.user('admin'), visible.id, {
      mode: 'custom',
      entries: [{ subject: { type: 'user', id: 'reader' }, level: 'read' }],
    });
    expect(
      (await h.knowledge.docs.searchAll(h.user('reader'), 'needle')).map(
        (hit) => hit.docId,
      ),
    ).toEqual([visible.id]);
    await h.knowledge.permissions.replace(h.user('admin'), visible.id, {
      mode: 'custom',
      entries: [],
    });
    expect(
      await h.knowledge.docs.searchAll(h.user('reader'), 'needle'),
    ).toEqual([]);
  });
  it('returns no hits on an empty database without materializing a default space', async () => {
    expect(
      await h.knowledge.docs.searchAll(h.user('reader'), 'release'),
    ).toEqual([]);
    expect(await spacesRepo(h.database.connection()).findMany()).toEqual([]);
    expect(await h.knowledge.docs.search(h.user('admin'), SYSTEM, '')).toEqual(
      [],
    );
  });
  it('does not expose documents or names from a legacy space no longer recognized by the resolver', async () => {
    h.projects.set('retired', {
      id: 'retired',
      name: 'Retired secret',
      leadUserId: 'admin',
    });
    const doc = await h.knowledge.docs.create(h.user('admin'), {
      scope: 'project',
      scopeId: 'retired',
      title: 'Retired secret',
      content: 'legacy needle',
    });
    const repo = spacesRepo(h.database.connection());
    await repo.updateMany({
      filter: { scope: 'project', scopeId: 'retired' },
      values: { scope: 'removed' },
    });
    const before = await repo.findMany();
    const hits = await h.knowledge.docs.searchAll(h.user('admin'), 'legacy');
    expect(hits).toEqual([]);
    expect(JSON.stringify(hits)).not.toContain(doc.id);
    expect(JSON.stringify(hits)).not.toContain('Retired secret');
    expect(await repo.findMany()).toEqual(before);
  });
  it('rechecks stale and archived chunks even when an external provider returns them', async () => {
    h.projects.set('p1', { id: 'p1', name: 'Project', leadUserId: 'admin' });
    const doc = await h.knowledge.docs.create(h.user('admin'), {
      scope: 'project',
      scopeId: 'p1',
      title: 'Document',
      content: 'obsolete needle',
    });
    const chunks = chunksRepo(h.database.connection());
    const stale = (await chunks.findMany({ filter: { docId: doc.id } }))[0]!;
    await h.knowledge.docs.update(h.user('admin'), doc.id, {
      expectedVersion: 1,
      content: 'Current text.',
    });
    if (!(await chunks.findOne({ filter: { id: stale.id } })))
      await chunks.createOne({ values: stale });
    h.knowledge.registerSearchProvider({
      name: 'stale-fixture',
      search: async () => [{ chunkId: stale.id, score: 1 }],
    });
    expect(
      await h.knowledge.docs.searchAll(h.user('reader'), 'needle'),
    ).toEqual([]);
    expect(
      (await h.knowledge.docs.searchAll(h.user('reader'), 'Current')).map(
        (hit) => hit.docId,
      ),
    ).toEqual([doc.id]);
    await h.knowledge.docs.archive(h.user('admin'), doc.id);
    expect(
      await h.knowledge.docs.searchAll(h.user('reader'), 'Current'),
    ).toEqual([]);
  });
  it('deduplicates shared inherited documents globally while scoped search retains inheritance and limits', async () => {
    for (const id of ['p1', 'p2'])
      h.projects.set(id, { id, name: id, leadUserId: 'admin' });
    const shared = await h.knowledge.docs.create(h.user('admin'), {
      ...SYSTEM,
      title: 'Shared',
      content: 'shared needle',
    });
    const local = await h.knowledge.docs.create(h.user('admin'), {
      scope: 'project',
      scopeId: 'p1',
      title: 'Local',
      content: 'local needle',
    });
    const global = await h.knowledge.docs.searchAll(h.user('reader'), 'needle');
    expect(global.map((hit) => hit.docId).sort()).toEqual(
      [shared.id, local.id].sort(),
    );
    expect(global.every((hit) => !hit.inherited)).toBe(true);
    const scoped = await h.knowledge.docs.search(
      h.user('reader'),
      { scope: 'project', scopeId: 'p2' },
      'needle',
      { limit: 1 },
    );
    expect(scoped).toHaveLength(1);
    expect(scoped[0]).toMatchObject({ docId: shared.id, inherited: true });
  });
});

describe('optional search scope only', () => {
  it('validates scope and owner together without changing other space queries', () => {
    expect(SearchQuery.parse({})).toMatchObject({ q: '' });
    expect(SearchQuery.safeParse({ scopeId: 'owner' }).success).toBe(false);
    expect(SearchQuery.safeParse({ scope: '' }).success).toBe(false);
    expect(SearchQuery.safeParse({ scopeId: '' }).success).toBe(true);
    expect(SearchQuery.safeParse({ pageSize: 0 }).success).toBe(false);
    expect(SearchQuery.safeParse({ pageSize: MAX_PAGE_SIZE }).success).toBe(
      true,
    );
    expect(SearchQuery.safeParse({ pageSize: MAX_PAGE_SIZE + 1 }).success).toBe(
      false,
    );
    expect(SearchQuery.safeParse({ pageSize: 1.5 }).success).toBe(false);
    expect(SearchQuery.parse({ scope: 'system' })).toMatchObject({
      scope: 'system',
      scopeId: '',
    });
    expect(SpaceOnlyQuery.safeParse({}).success).toBe(false);
  });
});
