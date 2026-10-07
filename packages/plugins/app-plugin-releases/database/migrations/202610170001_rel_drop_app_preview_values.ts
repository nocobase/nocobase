import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * Drops `relAppVariables.previewValue`: a pull request preview is an App of its own, so an App no longer keeps a
 * separate value for its previews. Rows that held only a preview value go with it; `down` restores the empty column.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610170001_rel_drop_app_preview_values',

  async up({ builder, query }) {
    await query
      .deleteFrom('relAppVariables')
      .where('value', 'is', null)
      .execute();
    await builder.alterCollection('relAppVariables', (collection) => {
      collection.dropField('previewValue');
    });
  },

  async down({ builder }) {
    await builder.alterCollection('relAppVariables', (collection) => {
      collection.text('previewValue').nullable();
    });
  },
});

export default migration;
