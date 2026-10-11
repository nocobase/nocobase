import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * The head a pull request was merged at, recorded only from what the host confirmed: a verified webhook delivery, a
 * read of the merged pull request, or the head Studio's own merge named. Runners take it as proof that a working
 * directory's commits reached the repository. Existing rows start without one; Git sync fills them in later.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610230010_studio_pull_request_merged_heads',
  async up({ builder }) {
    await builder.alterCollection('studioPullRequests', (collection) => {
      collection.string('mergedHeadSha', { length: 64 }).nullable();
      collection.string('mergedHeadSource', { length: 32 }).nullable();
      collection.datetimeTz('mergedHeadAt').nullable();
      collection.datetimeTz('mergedHeadCheckedAt').nullable();
    });
  },
  async down({ builder }) {
    await builder.alterCollection('studioPullRequests', (collection) => {
      collection.dropField('mergedHeadCheckedAt');
      collection.dropField('mergedHeadAt');
      collection.dropField('mergedHeadSource');
      collection.dropField('mergedHeadSha');
    });
  },
});

export default migration;
