import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * Variables a run may hand only to a team runner (`agSecrets.teamRunnersOnly`, off for every existing variable), and,
 * on a queued run a personal runner left for that reason, which of its variables asked for a team runner
 * (`agRuns.teamOnlyVariables`, a JSON array of `{ scope, scopeId, name }`), so its wait can say so. Null otherwise.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610090001_ag_add_team_runner_variables',

  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agSecrets', (collection) => {
      collection.boolean('teamRunnersOnly').notNull().defaultTo(false);
    });
    await builder.alterCollection('agRuns', (collection) => {
      collection.json('teamOnlyVariables').nullable();
    });
  },

  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRuns', (collection) => {
      collection.dropField('teamOnlyVariables');
    });
    await builder.alterCollection('agSecrets', (collection) => {
      collection.dropField('teamRunnersOnly');
    });
  },
});

export default migration;
