// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { createKnowledgeRoutes } from '../server/routes/api.js';
import { proposalsRepo } from '../server/services/store.js';
import { groupsRepo } from '../server/services/proposal-groups.js';
import { openKeyOf } from '../server/services/proposals.js';
import {
  ADMIN,
  CONTRIBUTOR,
  READER,
  SYSTEM,
  createKnowledgeHarness,
  type KnowledgeHarness,
} from './harness.js';

const project = { scope: 'project', scopeId: 'p1' };
const other = { scope: 'project', scopeId: 'p2' };

describe('authorized knowledge aggregation', () => {
  let h: KnowledgeHarness;
  beforeEach(async () => {
    h = await createKnowledgeHarness();
    h.levels.set('admin', ADMIN);
    h.levels.set('member', READER);
    h.projects.set('p1', {
      id: 'p1',
      name: 'Acme',
      leadUserId: 'lead',
      seenBy: ['admin', 'lead', 'member'],
    });
    h.projects.set('p2', {
      id: 'p2',
      name: 'Private',
      leadUserId: 'admin',
      seenBy: ['admin'],
    });
  });
  afterEach(async () => h.close());

  it('counts readable documents, keeps unmaterialized empty spaces, deduplicates system and hides archived counts from readers', async () => {
    const admin = h.user('admin');
    const folder = await h.knowledge.docs.create(admin, {
      ...project,
      kind: 'folder',
      title: 'Folder',
    });
    await h.knowledge.docs.create(admin, {
      ...project,
      title: 'Live',
      parentId: folder.id,
    });
    const archived = await h.knowledge.docs.create(admin, {
      ...project,
      title: 'Old',
    });
    await h.knowledge.docs.archive(admin, archived.id);
    await h.knowledge.docs.create(admin, { ...SYSTEM, title: 'Shared' });
    const summaries = await h.knowledge.docs.summaries(h.user('member'), [
      project,
      other,
      SYSTEM,
      SYSTEM,
    ]);
    expect(summaries.map((entry) => entry.space.scopeId)).toEqual(['p1', '']);
    expect(
      summaries.map(({ documents, archivedDocuments }) => ({
        documents,
        archivedDocuments,
      })),
    ).toEqual([
      { documents: 1, archivedDocuments: 0 },
      { documents: 1, archivedDocuments: 0 },
    ]);
    const all = await h.knowledge.docs.summaries(admin, [
      project,
      other,
      SYSTEM,
    ]);
    expect(all[0]).toMatchObject({ documents: 1, archivedDocuments: 1 });
    expect(all[1]).toMatchObject({ space: { id: null }, documents: 0 });
  });

  it('searches all explicit spaces once with readable paths and filters hidden nodes, spaces and archives', async () => {
    const admin = h.user('admin');
    const folder = await h.knowledge.docs.create(admin, {
      ...project,
      kind: 'folder',
      title: 'Restricted folder',
    });
    const shared = await h.knowledge.docs.create(admin, {
      ...project,
      title: 'Shared child',
      parentId: folder.id,
      content: 'directoryneedle',
    });
    await h.knowledge.permissions.replace(admin, folder.id, {
      mode: 'custom',
      entries: [],
    });
    await h.knowledge.permissions.replace(admin, shared.id, {
      mode: 'custom',
      entries: [{ subject: { type: 'user', id: 'member' }, level: 'read' }],
    });
    await h.knowledge.docs.create(admin, {
      ...other,
      title: 'Other project',
      content: 'directoryneedle',
    });
    await h.knowledge.docs.create(admin, {
      ...SYSTEM,
      title: 'System',
      content: 'directoryneedle',
    });
    const old = await h.knowledge.docs.create(admin, {
      ...project,
      title: 'Archived',
      content: 'directoryneedle',
    });
    await h.knowledge.docs.archive(admin, old.id);
    const hits = await h.knowledge.docs.searchMany(
      h.user('member'),
      [project, other, SYSTEM, SYSTEM],
      'directoryneedle',
    );
    expect(hits.map((hit) => hit.title).sort()).toEqual([
      'Shared child',
      'System',
    ]);
    expect(hits.find((hit) => hit.docId === shared.id)).toMatchObject({
      folderPath: [],
      spaceTitle: 'Acme',
      inherited: false,
    });
    expect(
      (await h.knowledge.docs.summaries(h.user('member'), [project]))[0]
        ?.documents,
    ).toBe(1);
    const all = await h.knowledge.docs.searchMany(
      admin,
      [project, other, SYSTEM],
      'directoryneedle',
    );
    expect(all.map((hit) => hit.title).sort()).toEqual([
      'Other project',
      'Shared child',
      'System',
    ]);
    expect(all.find((hit) => hit.docId === shared.id)?.folderPath).toEqual([
      'Restricted folder',
    ]);
  });

  it('filters review permission before paging beyond 200 newer inaccessible candidates', async () => {
    h.levels.set('lead', { ...CONTRIBUTOR, manage: 'none' });
    const admin = h.user('admin');
    const allowed = await h.knowledge.docs.create(admin, {
      ...project,
      title: 'Allowed',
    });
    const hidden = await h.knowledge.docs.create(admin, {
      ...project,
      title: 'Hidden',
    });
    const visible = await h.knowledge.proposals.propose(h.user('lead'), {
      kind: 'update',
      docId: allowed.id,
      content: 'Review this',
      reason: 'Update',
    });
    const inaccessible = await h.knowledge.proposals.propose(admin, {
      kind: 'update',
      docId: hidden.id,
      content: 'Private',
      reason: 'Update',
    });
    await h.knowledge.permissions.replace(admin, hidden.id, {
      mode: 'custom',
      entries: [],
    });
    const repo = proposalsRepo(h.knowledge.connection());
    const row = (await repo.findOne({ filter: { id: inaccessible.id } }))!;
    for (let i = 0; i < 205; i++) {
      const id = `directory-review-${i}`;
      // Separate sources may propose for the same hidden target; each has its own active group.
      const source = { sourceKind: 'issue', sourceId: id };
      const groupKey = openKeyOf({ ...row, ...source });
      await groupsRepo(h.knowledge.connection()).createOne({
        values: { groupKey, activeProposalId: id, lockToken: id },
      });
      await repo.createOne({
        values: {
          ...row,
          ...source,
          id,
          openKey: groupKey,
          groupKey,
          createdAt: '2030-01-01T00:00:00.000Z',
        },
      });
    }
    const app = new Hono().route(
      '/knowledge',
      createKnowledgeRoutes(
        h.knowledge,
        () => h.user('lead'),
        (ref) => ref,
      ),
    );
    const response = await app.request(
      '/knowledge/proposals?decidable=true&page=1&pageSize=1',
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      data: [{ id: visible.id }],
      meta: { total: 1, page: 1, pageSize: 1 },
    });
  });
});
