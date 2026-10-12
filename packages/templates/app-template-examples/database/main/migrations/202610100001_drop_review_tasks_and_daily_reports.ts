import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * Drops the two tables whose only user moved out of this application, to an example plugin that owns collections of
 * its own: the quotation review tasks and the daily analytics reports. `down` recreates both as the migrations that
 * created and altered them left them.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610100001_drop_review_tasks_and_daily_reports',
  async up({ builder }) {
    await builder.dropCollection('quotationReviewTasks');
    await builder.dropCollection('exampleDailyReports');
  },
  async down({ builder }) {
    await builder.createCollection('exampleDailyReports', (collection) => {
      collection.string('date', { length: 10 }).primary().notNull();
      collection.integer('impressions').notNull();
      collection.integer('clicks').notNull();
      collection.integer('conversions').notNull();
      collection.integer('spendCents').notNull();
      collection.integer('revenueCents').notNull();
      collection.integer('profitCents').notNull();
    });
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
      collection.string('resumeRequestId', { length: 255, nullable: true });
    });
  },
});

export default migration;
