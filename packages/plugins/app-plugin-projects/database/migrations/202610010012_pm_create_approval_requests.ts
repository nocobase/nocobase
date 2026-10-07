import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// Status changes a workflow holds until one of its approvers approves them. The approvers are resolved when the
// request is made and kept with it, so a later change of roles or leads does not change who may decide.

const migration: MigrationDefinition = defineMigration({
  name: '202610010012_pm_create_approval_requests',

  async up({ builder }) {
    await builder.createCollections([
      {
        name: 'pmApprovalRequests',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('issueId', { length: 64 }).notNull();
          collection.string('fromStatus', { length: 32 }).notNull();
          collection.string('toStatus', { length: 32 }).notNull();
          collection.string('requestedByType', { length: 32 }).notNull();
          collection.string('requestedById', { length: 64 }).notNull();
          collection.json('approvers').notNull();
          collection.json('approverUserIds').notNull();
          collection
            .enum('status', {
              values: ['pending', 'approved', 'rejected', 'withdrawn', 'stale'],
            })
            .notNull()
            .defaultTo('pending');
          collection.string('decidedById', { length: 64 }).nullable();
          collection.datetimeTz('decidedAt').nullable();
          collection.text('comment').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.index(['issueId', 'status']);
          collection.index(['status', 'createdAt']);
          collection
            .belongsTo('issue', 'pmIssues')
            .targetKey('id')
            .foreignKey('issueId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('pmApprovalRequests');
  },
});

export default migration;
