import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610260010_studio_pull_request_link_choices',
  async up({ builder }) {
    await builder.createCollection(
      'studioPullRequestLinkChoices',
      (collection) => {
        collection.string('id', { length: 64 }).primary().notNull();
        collection.string('issueId', { length: 64 }).notNull();
        collection.string('pullRequestId', { length: 64 }).notNull();
        collection.boolean('suppressed').notNull().defaultTo(false);
        collection.datetimeTz('updatedAt').notNull();
        collection.unique(['issueId', 'pullRequestId'], {
          name: 'studio_pr_link_choice_unique',
        });
      },
    );
  },
  async down({ builder }) {
    await builder.dropCollection('studioPullRequestLinkChoices');
  },
});
export default migration;
