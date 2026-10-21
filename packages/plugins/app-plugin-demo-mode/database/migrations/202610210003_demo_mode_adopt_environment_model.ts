import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/** Adopt the old binding once; this is a data migration, not a legacy runtime API. */
const migration: MigrationDefinition = defineMigration({
  name: '202610210003_demo_mode_adopt_environment_model',
  async up({ query }) {
    if (
      await query
        .selectFrom('demoModeModel')
        .select('id')
        .where('id', '=', 'default')
        .executeTakeFirst()
    )
      return;
    const previous = await query
      .selectFrom('demoModeDatasets')
      .select(['modelKey', 'modelService'])
      .where('modelKey', 'is not', null)
      .where('modelService', 'is not', null)
      .executeTakeFirst<{ modelKey: string; modelService: string }>();
    if (previous)
      await query
        .insertInto('demoModeModel')
        .values({ id: 'default', ...previous })
        .execute();
  },
  // Do not delete a binding that now belongs to the environment on rollback.
  async down() {},
});
export default migration;
