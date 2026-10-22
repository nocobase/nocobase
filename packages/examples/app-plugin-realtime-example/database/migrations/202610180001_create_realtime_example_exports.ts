import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610180001_create_realtime_example_exports',
  async up({ builder, connection }) {
    await builder.createCollection('realtimeExampleExports', (c) => {
      c.uuid('id').primary().notNull();
      c.string('userId', { length: 255 }).notNull();
      c.string('activeUserId', { length: 255 }).unique();
      c.string('status', { length: 32 }).notNull();
      c.integer('processed').notNull().defaultTo(0);
      c.integer('total').notNull().defaultTo(0);
      c.string('createdAt', { length: 32 }).notNull();
      c.string('finishedAt', { length: 32 });
      c.string('reason', { length: 32 });
      c.text('content', {
        db: connection.dialect === 'mysql' ? { nativeType: 'longtext' } : {},
      });
      c.index('userId');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('realtimeExampleExports');
  },
});
export default migration;
