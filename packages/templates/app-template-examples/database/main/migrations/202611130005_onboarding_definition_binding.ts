import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * Each record names the lifecycle definition that created it, so a second
 * version of a process can run on the same table without either version
 * reading or moving the other's records. Every record here was created by
 * the only definition its table has ever had, so that name is the reliable
 * binding; a value already present is kept.
 */
const BINDINGS: readonly (readonly [collection: string, definition: string])[] =
  [
    ['onboardingCases', 'onboarding'],
  ];

const migration: MigrationDefinition = defineMigration({
  name: '202611130005_onboarding_definition_binding',
  async up({ builder, query }) {
    for (const [collection, definition] of BINDINGS) {
      await builder.alterCollection(collection, (table) => {
        table.string('lifecycleDefinition').nullable();
      });
      await query
        .updateTable(collection)
        .set({ lifecycleDefinition: definition })
        .where('lifecycleDefinition', 'is', null)
        .execute();
    }
  },
  async down({ builder }) {
    for (const [collection] of [...BINDINGS].reverse())
      await builder.alterCollection(collection, (table) => {
        table.dropField('lifecycleDefinition');
      });
  },
});

export default migration;
