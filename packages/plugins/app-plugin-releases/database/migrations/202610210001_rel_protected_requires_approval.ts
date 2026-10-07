import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * Merges `relEnvironments.requiresApproval` into `protected`: a protected environment now takes every deployment
 * through an approved request, so an environment that required approval becomes protected and the column goes.
 * `down` restores the column with each protected environment requiring approval.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610210001_rel_protected_requires_approval',

  async up({ builder, query }) {
    await query
      .updateTable('relEnvironments')
      .set({ protected: true })
      .where('requiresApproval', '=', true)
      .execute();
    await builder.alterCollection('relEnvironments', (collection) => {
      collection.dropField('requiresApproval');
    });
  },

  async down({ builder, query }) {
    await builder.alterCollection('relEnvironments', (collection) => {
      collection.boolean('requiresApproval').notNull().defaultTo(false);
    });
    await query
      .updateTable('relEnvironments')
      .set({ requiresApproval: true })
      .where('protected', '=', true)
      .execute();
  },
});

export default migration;
