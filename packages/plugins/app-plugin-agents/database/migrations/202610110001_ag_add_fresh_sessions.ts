import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610110001_ag_add_fresh_sessions',

  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRuns', (collection) => {
      collection.boolean('freshSession').notNull().defaultTo(false);
    });
    await builder.alterCollection('agRunRequests', (collection) => {
      collection.boolean('freshSession').notNull().defaultTo(false);
    });
  },

  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRunRequests', (collection) => {
      collection.dropField('freshSession');
    });
    await builder.alterCollection('agRuns', (collection) => {
      collection.dropField('freshSession');
    });
  },
});

export default migration;
