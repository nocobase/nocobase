import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610150001_project_reports',
  async up({ builder }) {
    await builder.createCollections([
      {
        name: 'projectReportSettings',
        definition(collection) {
          collection.string('projectId', { length: 64 }).primary().notNull();
          collection.boolean('enabled').notNull().defaultTo(false);
          collection.integer('revision').notNull();
          collection.json('config').notNull();
          collection.datetimeTz('updatedAt').notNull();
        },
      },
      {
        name: 'projectReports',
        definition(collection) {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('projectId', { length: 64 }).notNull();
          collection.string('date', { length: 10 }).notNull();
          collection.string('timezone', { length: 100 }).notNull();
          collection.string('scopeHash', { length: 64 }).notNull();
          collection.integer('generation').notNull();
          collection.string('attemptId', { length: 36 }).notNull();
          collection.string('publishedAttemptId', { length: 36 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.index(['projectId', 'date']);
        },
      },
      {
        name: 'projectReportAttempts',
        definition(collection) {
          collection.string('id', { length: 36 }).primary().notNull();
          collection.string('reportId', { length: 64 }).notNull();
          collection.string('runId', { length: 64 }).nullable();
          collection.string('state', { length: 20 }).notNull();
          collection.text('error').nullable();
          collection.json('context').notNull();
          collection.json('facts').nullable();
          collection.string('factsHash', { length: 64 }).nullable();
          collection.json('totals').nullable();
          collection.json('published').nullable();
          collection.string('publishedHash', { length: 64 }).nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.index(['reportId', 'createdAt']);
          collection.unique(['runId']);
          collection.belongsTo('report', 'projectReports').targetKey('id').foreignKey('reportId').constraints(true).onDelete('cascade');
        },
      },
    ]);
  },
  async down({ builder }) {
    await builder.dropCollection('projectReportAttempts');
    await builder.dropCollection('projectReports');
    await builder.dropCollection('projectReportSettings');
  },
});
export default migration;
