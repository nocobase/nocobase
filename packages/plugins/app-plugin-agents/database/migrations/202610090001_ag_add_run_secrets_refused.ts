import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * The personal runners that left a queued run because their owner may not receive its variables, as a JSON array of
 * runner ids, so the run's wait can say so (`secretsNotAllowed`). Null for a run no runner refused that way.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610090001_ag_add_run_secrets_refused',

  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRuns', (collection) => {
      collection.json('secretsRefusedBy').nullable();
    });
  },

  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRuns', (collection) => {
      collection.dropField('secretsRefusedBy');
    });
  },
});

export default migration;
