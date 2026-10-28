import { defineMigration, type MigrationDefinition } from '@nocobase/db';
const migration: MigrationDefinition = defineMigration({
  name: '202610260099_submission_fixture',
  async up({ builder }) {
    await builder.createCollection('borrowings', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('name').notNull();
      c.string('assetTag').notNull();
      c.string('status').notNull().defaultTo('draft');
      c.datetimeTz('statusChangedAt').notNull();
      c.integer('lifecycleVersion').notNull().defaultTo(0);
    });
    await builder.createCollection('inventoryEntries', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('borrowingId', { length: 64 }).notNull();
    });
    await builder.createCollection('lifecycleTransitions', (c) => {
      c.bigInt('id').primary().autoIncrement().notNull();
      c.string('lifecycle').notNull();
      c.string('recordId').notNull();
      c.string('transition').notNull();
      c.string('from').nullable();
      c.string('to').notNull();
      c.string('actorId').notNull();
      c.json('input').notNull();
      c.datetimeTz('at').notNull();
      c.integer('version').notNull();
      c.string('requestId').nullable();
      c.string('requestKey').notNull();
      c.unique(['lifecycle', 'recordId', 'version']);
      c.unique(['lifecycle', 'recordId', 'requestKey']);
    });
    await builder.createCollection('lifecycleEffectRuns', (c) => {
      c.bigInt('id').primary().autoIncrement().notNull();
      c.bigInt('transitionId').notNull();
      c.string('lifecycle').notNull();
      c.string('recordId').notNull();
      c.string('effect').notNull();
      c.boolean('stayBound').notNull();
      c.string('status').notNull();
      c.integer('attempts').notNull();
      c.integer('maxAttempts').notNull();
      c.json('result').nullable();
      c.text('error').nullable();
      c.datetimeTz('createdAt').notNull();
      c.datetimeTz('updatedAt').notNull();
      c.datetimeTz('claimedAt').nullable();
      c.datetimeTz('runAfter').nullable();
      c.json('continuation').nullable();
      c.datetimeTz('continuationDueAt').nullable();
      c.datetimeTz('continuationAbandonedAt').nullable();
    });
  },
  async down({ builder }) {
    await builder.dropCollection('lifecycleEffectRuns');
    await builder.dropCollection('lifecycleTransitions');
    await builder.dropCollection('inventoryEntries');
    await builder.dropCollection('borrowings');
  },
});
export default migration;
