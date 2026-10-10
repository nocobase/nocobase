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
 */
const INDEX_NAME = 'kb_proposals_replaces_id';

const migration: MigrationDefinition = defineMigration({
  name: '202610080010_kb_proposals_add_revisions',

  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('kbProposals', (collection) => {
      // The proposal sent back that this one replaces.
      collection.string('replacesId', { length: 64 }).nullable();
      // `document` for a document's version sent back for changes; null for a proposal.
      collection.string('origin', { length: 16 }).nullable();
    });
    await builder.alterCollection('kbProposals', (collection) => {
      collection.index('replacesId', { name: INDEX_NAME });
    });
  },

  async down({ builder }: MigrationContext): Promise<void> {
    // Separate statements: SQL Server refuses to drop an indexed column, while SQLite rebuilds the table when a column
    // is dropped and takes the index with it.
    await builder.alterCollection('kbProposals', (collection) => {
      collection.dropIndex(INDEX_NAME);
    });
    await builder.alterCollection('kbProposals', (collection) => {
      collection.dropField('origin');
      collection.dropField('replacesId');
    });
  },
});

export default migration;
