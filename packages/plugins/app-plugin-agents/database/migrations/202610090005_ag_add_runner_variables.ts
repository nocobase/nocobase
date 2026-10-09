import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * Variables a run takes from the runner (`agRunnerVariables`): a name only, set on an agent, a working directory or a
 * scope the application registers like a variable with a value, and handed to the runner as a name it provides from its
 * own configuration (`RunWorkspace.passthrough`). And the names a runner last reported it provides (`agRunners.variables`,
 * a JSON array of names), null for a runner that reported none.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610090005_ag_add_runner_variables',

  async up({ builder }: MigrationContext): Promise<void> {
    await builder.createCollection('agRunnerVariables', (collection) => {
      collection.string('id', { length: 64 }).primary().notNull();
      // agent | workdir | a registered scope key, as on agSecrets.
      collection.string('scope', { length: 32 }).notNull();
      collection.string('scopeId', { length: 64 }).notNull();
      collection.string('name', { length: 128 }).notNull();
      collection.string('createdById', { length: 64 }).nullable();
      collection.string('updatedById', { length: 64 }).nullable();
      collection.datetimeTz('createdAt').notNull();
      collection.datetimeTz('updatedAt').notNull();
      collection.unique(['scope', 'scopeId', 'name']);
    });
    await builder.alterCollection('agRunners', (collection) => {
      collection.json('variables').nullable();
    });
  },

  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRunners', (collection) => {
      collection.dropField('variables');
    });
    await builder.dropCollection('agRunnerVariables');
  },
});

export default migration;
