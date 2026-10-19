import { createHash } from 'node:crypto';
import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const identity = (...parts: (string | number)[]) =>
  createHash('sha256').update(JSON.stringify(parts)).digest('hex');
const reviewers = [
  { group: 1, type: 'department', referenceId: 'finance-one' },
  { group: 1, type: 'role', referenceId: 'reviewer' },
];
// Frozen defaults make fresh installations and upgrades converge without importing live definitions.
const defaults: Record<string, Record<string, unknown>> = {
  expenses: {
    autoApproveLimit: 5000,
    financeLimit: 50000,
    escalateAfterMinutes: 3,
  },
  tickets: { notificationPrefix: '', waitMinutes: 2, reopenDays: 7 },
  orders: { paymentWindowMinutes: 3 },
  invoices: { querySeconds: 30 },
  exports: { pollSeconds: 15, maxMinutes: 3 },
  subscriptions: { periodMinutes: 3, dunningMinutes: 1, maxDunning: 3 },
  reviewerDemo: { reviewerRule: reviewers },
  reviewerLiveDemo: { reviewerRule: reviewers },
};
const migration: MigrationDefinition = defineMigration({
  name: '202610160005_lifecycle_example_unified_parameters',
  async up(context) {
    await context.builder.createCollection(
      'lifecycleExampleWorkflowParameters',
      (table) => {
        table.string('id').primary().notNull();
        table.string('scope').notNull();
        table.string('status').notNull();
        table.integer('revision').notNull();
        table.json('values').notNull();
        table.string('actorId').notNull();
        table.string('at').notNull();
        table.string('requestId').nullable();
        table.text('fingerprint').nullable();
      },
    );
    const heads = await context
      .repository('lifecycleExampleParameterHeads')
      .findMany({ filter: { scope: 'demo' } });
    for (const [workflow, initial] of Object.entries(defaults)) {
      const id = `lifecycle.${workflow}`;
      const values = { ...initial };
      let revision = 0;
      for (const head of heads.filter((head) =>
        (head.groupKey as string).startsWith(`${id}.`),
      )) {
        const group = head.groupKey as string;
        const row = await context
          .repository('lifecycleExampleParameterVersions')
          .findOne({
            filter: { id: identity('demo', group, Number(head.revision)) },
          });
        if (!row)
          throw new Error(
            'Missing parameter version during workflow consolidation.',
          );
        const version = row.payload as { values: Record<string, unknown> };
        Object.assign(values, version.values);
        for (const [field, count] of Object.entries(
          row.selectionCounts as Record<string, number>,
        )) {
          const selections = [];
          for (let index = 0; index < count; index++) {
            const selection = await context
              .repository('lifecycleExampleParameterSelections')
              .findOne({
                filter: {
                  id: identity(
                    'demo',
                    group,
                    Number(head.revision),
                    field,
                    index,
                  ),
                },
              });
            if (!selection)
              throw new Error(
                'Missing reviewer selection during workflow consolidation.',
              );
            selections.push({
              group: Number(selection.group),
              type: selection.type as string,
              referenceId: selection.referenceId as string,
            });
          }
          values[field] = selections;
        }
        revision = Math.max(revision, Number(head.revision));
      }
      await context.repository('lifecycleExampleWorkflowParameters').createOne({
        values: {
          id,
          scope: 'demo',
          status: 'current',
          revision,
          values,
          actorId: 'migration',
          at: new Date().toISOString(),
        },
      });
    }
  },
  // Historical configurations and execution snapshots remain untouched.
  async down({ builder }) {
    await builder.dropCollection('lifecycleExampleWorkflowParameters');
  },
});
export default migration;
