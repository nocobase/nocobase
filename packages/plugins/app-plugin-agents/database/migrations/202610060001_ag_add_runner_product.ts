import {
  defineMigration,
  type MigrationContext,
  type MigrationDefinition,
} from '@nocobase/db';

/**
 * The product a runner runs as (`nocobase-runner`, or a CLI that carries the runner), as it reports it on registration
 * and every heartbeat; the application offers it updates of that product. Null for a runner that has not reported one.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610060001_ag_add_runner_product',

  async up({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRunners', (collection) => {
      collection.string('product', { length: 64 }).nullable();
    });
  },

  async down({ builder }: MigrationContext): Promise<void> {
    await builder.alterCollection('agRunners', (collection) => {
      collection.dropField('product');
    });
  },
});

export default migration;
