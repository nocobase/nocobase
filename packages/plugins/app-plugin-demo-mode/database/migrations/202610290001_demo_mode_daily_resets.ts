import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610290001_demo_mode_daily_resets',
  async up({ builder }) {
    await builder.createCollection('demoModeDailyResets', (collection) => {
      collection.string('day', {
        length: 16,
        primaryKey: true,
        nullable: false,
      });
      collection.string('token', { length: 36, nullable: false });
      collection.string('state', { length: 16, nullable: false });
      collection.integer('attempt', { nullable: false });
      collection.datetimeTz('startedAt', { nullable: false });
      collection.datetimeTz('updatedAt', { nullable: false });
      collection.datetimeTz('nextAt');
      collection.json('failure');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('demoModeDailyResets');
  },
});
export default migration;
