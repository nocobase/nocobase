import { defineMigration } from '@nocobase/db';
const optional = {
  pmIssues: ['executorId', 'executorType'],
  pmComments: [
    'authorId',
    'authorType',
    'deletedById',
    'deletedByType',
    'origin:json',
  ],
  pmActivities: ['actorId', 'actorType', 'details:json'],
  pmPlans: [
    'createdById',
    'createdByType',
    'executedById',
    'proposer:json',
    'sourceData:json',
  ],
  pmPlanRows: ['params:json', 'result:json'],
  studioProjectInits: ['agentId'],
  studioDelegations: ['agentId'],
  studioStageRunGuards: ['agentId', 'ruleConfig:json'],
  studioInboxNotices: ['actorId', 'actorType', 'data:json'],
  studioSettings: ['value:json'],
};

export default defineMigration({
  name: '202610300001_test_runner_references',
  async up({ builder }) {
    // The framework must not depend on optional application packages; declare only their reference-bearing fields.
    for (const [table, fields] of Object.entries(optional))
      await builder.createCollection(table, (c) => {
        c.string(table === 'studioSettings' ? 'key' : 'id', { length: 64 })
          .primary()
          .notNull();
        for (const field of fields) {
          const [column, type] = field.split(':');
          if (type === 'json') c.json(column).nullable();
          else c.string(column, { length: 64 }).nullable();
        }
      });
  },
  async down({ builder }) {
    for (const name of Object.keys(optional).reverse())
      await builder.dropCollection(name);
  },
});
