import {
  defineMigration,
  type MigrationDefinition,
  type MigrationContext,
} from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610240040_ag_discovery_preferences',
  async up({ builder }: MigrationContext): Promise<void> {
    await builder.createCollection('agDiscoveryPreferences', (collection) => {
      collection.string('key', { length: 256 }).primary();
      collection.boolean('ignored').notNull().defaultTo(false);
      collection.integer('revision').notNull().defaultTo(0);
      collection.datetimeTz('updatedAt').notNull();
    });
  },
  async down({ builder }: MigrationContext): Promise<void> {
    await builder.dropCollection('agDiscoveryPreferences');
  },
});

export default migration;
