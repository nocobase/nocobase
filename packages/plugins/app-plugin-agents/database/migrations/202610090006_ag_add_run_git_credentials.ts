import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * The repositories whose credential the runner holding a run may ask for on demand (`agRuns.gitCredentialUrls`, a JSON
 * array of URLs exactly as the claim handed them out, null when there are none), and why the runner could not push a
 * repository at the end of a run (`agRunRepos.failureReason` and `failureDetail`, null when it pushed or did not try).
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610090006_ag_add_run_git_credentials',

  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRuns', (collection) => {
      collection.json('gitCredentialUrls').nullable();
    });
    await builder.alterCollection('agRunRepos', (collection) => {
      collection.string('failureReason', { length: 64 }).nullable();
      collection.text('failureDetail').nullable();
    });
  },

  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRunRepos', (collection) => {
      collection.dropField('failureDetail');
      collection.dropField('failureReason');
    });
    await builder.alterCollection('agRuns', (collection) => {
      collection.dropField('gitCredentialUrls');
    });
  },
});

export default migration;
