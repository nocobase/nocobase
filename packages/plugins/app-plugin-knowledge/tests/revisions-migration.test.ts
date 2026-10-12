// @vitest-environment node
/**
 * The proposals learn what they replace, whether they stand for a document's version sent back, and which one is open
 * per target and source. Pending proposals written before it are carried forward whole, duplicates included.
 */
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';
import { expect } from 'vitest';

import { openKeyOf, type OpenKeyInput } from '../server/services/proposals.js';

const sources: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-knowledge',
    directory: path.resolve(import.meta.dirname, '../database/migrations'),
  },
];

const base = {
  spaceId: 's1',
  docId: 'd1',
  kind: 'update',
  parentId: null,
  slug: null,
  content: 'Text.',
  reason: 'Why.',
  proposerKind: 'agent',
  proposerId: 'agent-1',
  authorizedById: 'u1',
  sourceKind: 'issue',
  sourceId: 'i1',
  status: 'pending',
} as const;

const at = (minute: number) =>
  new Date(Date.UTC(2026, 9, 5, 8, minute)).toISOString();

/** Proposals as the version before it wrote them. */
const legacy = [
  { ...base, id: 'single', docId: 'd2', createdAt: at(0) },
  // Two pending from one source for one document: the check before the insert let both through.
  { ...base, id: 'twin-old', createdAt: at(1) },
  { ...base, id: 'twin-new', content: 'Other text.', createdAt: at(2) },
  { ...base, id: 'twin-third', content: 'Third text.', createdAt: at(2) },
  // A new document under a parent, and a person's proposal without a source.
  {
    ...base,
    id: 'new-doc',
    kind: 'create',
    docId: null,
    parentId: 'folder',
    slug: 'deploy',
    createdAt: at(3),
  },
  {
    ...base,
    id: 'by-person',
    docId: 'd3',
    proposerKind: 'user',
    proposerId: 'u2',
    sourceKind: null,
    sourceId: null,
    createdAt: at(4),
  },
  // Closed: they hold no key.
  { ...base, id: 'accepted', status: 'accepted', createdAt: at(5) },
  { ...base, id: 'rejected', status: 'rejected', createdAt: at(6) },
  { ...base, id: 'withdrawn', status: 'withdrawn', createdAt: at(7) },
].map((row) => ({ ...row, updatedAt: row.createdAt }));

describeMigration('202610240040_kb_proposals_add_revisions', {
  sources,
  before: async ({ connection }) => {
    await connection.query.insertInto('kbProposals').values(legacy).execute();
  },
  up: async ({ expectCollection, connection }) => {
    const proposals = expectCollection('kbProposals');
    await proposals.toHaveField('replacesId', { nullable: true });
    await proposals.toHaveField('origin', { nullable: true });
    await proposals.toHaveField('openKey', { nullable: false });
    await proposals.toHaveIndex(['replacesId']);
    await proposals.toHaveIndex(['openKey'], { unique: true });
    await proposals.toHaveField('groupKey', { nullable: false });
    await proposals.toHaveField('legacyDuplicate');
    await proposals.toHaveIndex(['groupKey']);
    await expectCollection('kbProposalGroups').toHaveField('activeProposalId', {
      nullable: true,
    });

    const rows = await connection.query
      .selectFrom('kbProposals')
      .select([
        'id',
        'status',
        'content',
        'openKey',
        'groupKey',
        'legacyDuplicate',
      ])
      .execute();
    const byId = new Map(rows.map((row) => [String(row.id), row]));
    // Every proposal is still there, as it was.
    expect([...byId.keys()].sort()).toEqual(legacy.map((row) => row.id).sort());
    for (const row of legacy)
      expect(byId.get(row.id)).toMatchObject({
        status: row.status,
        content: row.content,
      });
    // The key the runtime computes, for each open one; the older of the twins holds it, the newer its own id.
    const keyOf = (id: string) => byId.get(id)?.openKey;
    const runtime = (id: string) =>
      openKeyOf(legacy.find((row) => row.id === id) as OpenKeyInput);
    for (const id of ['single', 'twin-old', 'new-doc', 'by-person'])
      expect(keyOf(id)).toBe(runtime(id));
    expect(runtime('twin-new')).toBe(runtime('twin-old'));
    expect(keyOf('twin-new')).toBe('twin-new');
    expect(keyOf('twin-third')).toBe('twin-third');
    const groups = await connection.query
      .selectFrom('kbProposalGroups')
      .select(['groupKey', 'activeProposalId'])
      .execute();
    expect(
      groups.find((row) => row.groupKey === runtime('twin-old')),
    ).toMatchObject({ activeProposalId: 'twin-old' });
    for (const row of legacy)
      expect(byId.get(row.id)?.groupKey).toBe(openKeyOf(row));
    for (const id of ['twin-old', 'twin-new', 'twin-third'])
      expect(Boolean(byId.get(id)?.legacyDuplicate)).toBe(true);
    for (const id of ['accepted', 'rejected', 'withdrawn'])
      expect(keyOf(id)).toBe(id);
  },
  down: async ({ expectCollection }) => {
    const proposals = expectCollection('kbProposals');
    await proposals.toExist();
    await proposals.not.toHaveField('replacesId');
    await proposals.not.toHaveField('origin');
    await proposals.not.toHaveField('openKey');
    await proposals.not.toHaveField('groupKey');
    await proposals.not.toHaveField('legacyDuplicate');
    await expectCollection('kbProposalGroups').not.toExist();
  },
});
