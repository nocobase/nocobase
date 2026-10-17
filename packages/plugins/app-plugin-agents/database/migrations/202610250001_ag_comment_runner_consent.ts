import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610250001_ag_comment_runner_consent',
  async up({ builder }) {
    await builder.alterCollection('agRuns', (collection) => {
      collection.string('commentRootRunId', { length: 64 });
      collection.string('commentExecution', { length: 16 });
      collection.string('commentOwnerKey', { length: 128 });
      collection.index(['commentRootRunId', 'status'], {
        name: 'agRunsCommentChain',
      });
    });
    await builder.alterCollection('agRunRequests', (collection) => {
      collection.string('purpose', { length: 32 });
      collection.string('commentRunId', { length: 64 });
      collection.string('commentRootRunId', { length: 64 });
      collection.string('commentOwnerKey', { length: 128 });
      collection.index(['commentRootRunId', 'status'], {
        name: 'agRequestsCommentChain',
      });
    });
  },
  async down({ builder }) {
    await builder.dropIndex('agRunRequests', 'agRequestsCommentChain');
    await builder.alterCollection('agRunRequests', (collection) => {
      collection.dropField('commentOwnerKey');
      collection.dropField('commentRootRunId');
      collection.dropField('purpose');
      collection.dropField('commentRunId');
    });
    await builder.dropIndex('agRuns', 'agRunsCommentChain');
    await builder.alterCollection('agRuns', (collection) => {
      collection.dropField('commentOwnerKey');
      collection.dropField('commentExecution');
      collection.dropField('commentRootRunId');
    });
  },
});

export default migration;
