import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202611070002_foundation_snapshots',
  async up({ builder }) {
    await builder.createCollection('foundationSnapshots', (collection) => {
      collection.string('id', { primaryKey: true, nullable: false });
      collection.integer('revision', { nullable: false });
      collection.optimisticLock('revision');
      collection.string('kernelVersion', { nullable: false });
      collection.string('generation', { nullable: false });
      collection.string('status', { nullable: false });
      collection.boolean('countRecords', { nullable: false });
      collection.string('jobId');
      collection.string('snapshotKernelVersion');
      collection.json('overview');
      collection.json('checkpoint');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('foundationSnapshots');
  },
});

export default migration;
