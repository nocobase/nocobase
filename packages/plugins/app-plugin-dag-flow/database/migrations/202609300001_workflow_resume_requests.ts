import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202609300001_workflow_resume_requests',
  async up({ builder }): Promise<void> {
    await builder.alterCollection('workflowRuns', (collection) => {
      collection.string('leaseToken');
      collection.datetimeTz('leaseExpiresAt');
    });
    await builder.createCollection('workflowResumeRequests', (collection) => {
      collection.bigInt('id').primary().notNull();
      collection.bigInt('workflowRunId').notNull();
      collection.bigInt('nodeRunId').notNull();
      collection.string('nodeKey').notNull();
      collection.string('instructionType').notNull();
      collection.string('idempotencyKey').notNull();
      collection.json('payload');
      collection.string('payloadHash').notNull();
      collection.string('state').notNull();
      collection.string('reason');
      collection.integer('attempts').notNull().defaultTo(0);
      collection.string('slot');
      collection.datetimeTz('createdAt').notNull();
      collection.string('claimToken');
      collection.datetimeTz('claimedAt');
      collection.unique(['workflowRunId', 'nodeKey', 'idempotencyKey'], {
        mode: 'index',
      });
      collection.unique(['nodeRunId', 'slot'], { mode: 'index' });
      collection.index(['state', 'createdAt']);
    });
  },
  async down({ builder }): Promise<void> {
    await builder.dropCollection('workflowResumeRequests');
    await builder.alterCollection('workflowRuns', (collection) => {
      collection.dropField('leaseExpiresAt');
      collection.dropField('leaseToken');
    });
  },
});
