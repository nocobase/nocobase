import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * Adds `relEnvironments.purpose`: what an environment is for, `preview` or `test`. An existing environment holding a
 * pull request preview App (`relApps.previewOf`) is a preview one; every other is a test one. `down` drops the column.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202611020001_rel_environment_purpose',

  async up({ builder, query }) {
    await builder.alterCollection('relEnvironments', (collection) => {
      collection.string('purpose', { length: 16 }).notNull().defaultTo('test');
    });
    await query
      .updateTable('relEnvironments')
      .set({ purpose: 'preview' })
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('relApps')
            .select('relApps.id')
            .whereRef('relApps.environmentId', '=', 'relEnvironments.id')
            .where('relApps.previewOf', 'is not', null),
        ),
      )
      .execute();
  },

  async down({ builder }) {
    await builder.alterCollection('relEnvironments', (collection) => {
      collection.dropField('purpose');
    });
  },
});

export default migration;
