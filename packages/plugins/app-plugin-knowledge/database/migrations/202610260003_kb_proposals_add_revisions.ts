import { createHash } from 'node:crypto';

import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * Sending a proposal back for changes. A proposal sent back waits as `revising` until its proposer proposes again, and
 * the new proposal names it in `replacesId` (the old one becomes `superseded`). A document's version can be sent back
 * the same way: a `revising` record with `origin` `document` stands for it, with the version's content and source, so
 * the revision the proposer submits replaces it like any other.
 *
 * `openKey` keeps one active proposal per target and source under a unique index: the active proposal holds `open:`
 * and the SHA-256 of its target and source, a waiting or closed one its own id. The group's row lock guards its queue. The
 * encoding is written out here rather than imported, and must stay what the runtime (`server/services/proposals.ts`,
 * `openKeyOf`) computes.
 *
 * Existing pending proposals are not assumed to be unique per target and source: the check that kept them so ran before
 * the insert, without a lock, so two requests at once could both pass it. Where several share a key, the oldest holds it
 * and the others wait behind it. The group pointer and database lock govern every state change; none is deleted.
 */
const REPLACES_INDEX = 'kb_proposals_replaces_id';
const OPEN_KEY_INDEX = 'kb_proposals_open_key';
const PAGE = 500;

/** A column read as text, or null. */
const text = (value: unknown): string | null =>
  typeof value === 'string'
    ? value
    : typeof value === 'number' || typeof value === 'bigint'
      ? String(value)
      : null;

function openKeyOf(row: Record<string, unknown>): string {
  const docId = text(row.docId);
  const target = docId
    ? ['doc', docId]
    : ['new', text(row.spaceId), text(row.parentId), text(row.slug)];
  const sourceKind = text(row.sourceKind);
  const sourceId = text(row.sourceId);
  const source =
    sourceKind && sourceId
      ? ['source', sourceKind, sourceId]
      : ['proposer', text(row.proposerKind), text(row.proposerId)];
  return `open:${createHash('sha256')
    .update(JSON.stringify([...target, ...source]))
    .digest('hex')}`;
}

const migration: MigrationDefinition = defineMigration({
  name: '202610260003_kb_proposals_add_revisions',

  async up({ builder, query }: MigrationContext): Promise<void> {
    await builder.createCollection('kbProposalGroups', (collection) => {
      collection
        .string('groupKey', { length: 80 })
        .primary({ name: 'kb_proposal_groups_pkey' })
        .notNull();
      collection.string('activeProposalId', { length: 64 }).nullable();
      collection.string('lockToken', { length: 64 }).notNull();
    });
    await builder.alterCollection('kbProposals', (collection) => {
      // The proposal sent back that this one replaces.
      collection.string('replacesId', { length: 64 }).nullable();
      // `document` for a document's version sent back for changes; null for a proposal.
      collection.string('origin', { length: 16 }).nullable();
      // The activity slot, or the proposal's id while waiting or closed. Nullable until filled below.
      collection.string('openKey', { length: 80 }).nullable();
      collection.string('groupKey', { length: 80 }).nullable();
      collection.boolean('legacyDuplicate').notNull().defaultTo(false);
    });
    await builder.alterCollection('kbProposals', (collection) => {
      collection.index('replacesId', { name: REPLACES_INDEX });
    });

    // Every proposal first holds no slot: its own id. `set` takes values, not a column, so each row is written with its
    // own, a page at a time.
    for (;;) {
      const page = await query
        .selectFrom('kbProposals')
        .select([
          'id',
          'docId',
          'spaceId',
          'parentId',
          'slug',
          'sourceKind',
          'sourceId',
          'proposerKind',
          'proposerId',
        ])
        .where('openKey', 'is', null)
        .orderBy('id', 'asc')
        .limit(PAGE)
        .execute();
      if (page.length === 0) break;
      for (const row of page)
        await query
          .updateTable('kbProposals')
          .set({ openKey: text(row.id), groupKey: openKeyOf(row) })
          .where('id', '=', row.id)
          .execute();
    }
    // Then the pending ones, oldest first, take their target and source's key; a later one sharing it keeps its id.
    const pending = await query
      .selectFrom('kbProposals')
      .select([
        'id',
        'spaceId',
        'docId',
        'parentId',
        'slug',
        'sourceKind',
        'sourceId',
        'proposerKind',
        'proposerId',
      ])
      .where('status', '=', 'pending')
      .orderBy('createdAt', 'asc')
      .orderBy('id', 'asc')
      .execute();
    const holders = new Map<string, string>();
    const counts = new Map<string, number>();
    for (const row of pending) {
      const key = openKeyOf(row);
      const id = text(row.id);
      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (id !== null && !holders.has(key)) holders.set(key, id);
    }
    // One statement per key: each sets a different value, and there are as many as pending proposals at most.
    for (const [key, id] of holders) {
      await query
        .insertInto('kbProposalGroups')
        .values({ groupKey: key, activeProposalId: id, lockToken: id })
        .execute();
      await query
        .updateTable('kbProposals')
        .set({ openKey: key })
        .where('id', '=', id)
        .execute();
      if ((counts.get(key) ?? 0) > 1)
        await query
          .updateTable('kbProposals')
          .set({ legacyDuplicate: true })
          .where('groupKey', '=', key)
          .where('status', '=', 'pending')
          .execute();
    }

    await builder.alterField('kbProposals', 'openKey', {
      type: 'string',
      length: 80,
      nullable: false,
    });
    await builder.alterCollection('kbProposals', (collection) => {
      collection.unique(['openKey'], { name: OPEN_KEY_INDEX });
      collection.index('groupKey', { name: 'kb_proposals_group_key' });
    });
    await builder.alterField('kbProposals', 'groupKey', {
      type: 'string',
      length: 80,
      nullable: false,
    });
  },

  async down({ builder }: MigrationContext): Promise<void> {
    // Separate statements: SQL Server refuses to drop an indexed column, while SQLite rebuilds the table when a column
    // is dropped and takes the index with it.
    await builder.alterCollection('kbProposals', (collection) => {
      collection.dropConstraint(OPEN_KEY_INDEX);
    });
    await builder.alterCollection('kbProposals', (collection) => {
      collection.dropIndex(REPLACES_INDEX);
      collection.dropIndex('kb_proposals_group_key');
    });
    await builder.alterCollection('kbProposals', (collection) => {
      collection.dropField('openKey');
      collection.dropField('origin');
      collection.dropField('replacesId');
      collection.dropField('groupKey');
      collection.dropField('legacyDuplicate');
    });
    await builder.dropCollection('kbProposalGroups');
  },
});

export default migration;
