import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202609300002_create_quotation_review_tasks',
  async up({ builder }) {
    await builder.createCollection('quotationReviewTasks', (collection) => {
      collection.increments('id');
      collection.string('runId', { length: 255, nullable: false });
      collection.string('quotationId', { length: 64, nullable: false });
      collection.integer('totalCents').notNull();
      collection.enum('route', {
        values: ['standard', 'manual-follow-up'],
        nullable: false,
      });
      collection.enum('status', {
        values: ['pending', 'submitting', 'submitted', 'unavailable'],
        nullable: false,
        defaultValue: 'pending',
      });
      collection.string('reviewerId', { length: 255, nullable: true });
      collection.string('confirmedBy', { length: 100, nullable: true });
      collection.enum('decision', {
        values: ['approved', 'rejected'],
        nullable: true,
      });
      collection.text('comment', { nullable: true });
      collection.datetime('createdAt', { nullable: false });
      collection.datetime('submittedAt', { nullable: true });
      collection.unique('runId');
      collection.index(['status', 'createdAt']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('quotationReviewTasks');
  },
});

export default migration;
