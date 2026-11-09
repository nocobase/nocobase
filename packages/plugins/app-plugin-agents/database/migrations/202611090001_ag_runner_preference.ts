import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * Which kind of runner a person's runs go to first (`personal` or `team`; null: either, whoever is first). The person
 * chooses it in `agChatPreferences`; a run keeps the choice its actor had when it was queued, so a claim reads it from
 * the run it already holds.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202611090001_ag_runner_preference',
  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agChatPreferences', (collection) => {
      collection.string('runnerPreference', { length: 16 }).nullable();
    });
    await builder.alterCollection('agRuns', (collection) => {
      collection.string('runnerPreference', { length: 16 }).nullable();
    });
  },
  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRuns', (collection) => {
      collection.dropField('runnerPreference');
    });
    await builder.alterCollection('agChatPreferences', (collection) => {
      collection.dropField('runnerPreference');
    });
  },
});

export default migration;
