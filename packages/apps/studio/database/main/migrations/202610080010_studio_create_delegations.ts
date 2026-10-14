import { defineMigration, type MigrationDefinition } from '@nocobase/db';

// Work a conversation handed to another agent through an issue (`server/agents/conversation/delegation.ts`): one row
// per conversation, issue and agent, while the person follows it; and the milestones reported back to the
// conversation, one row each, so a milestone is told once and the wakes it caused can be counted.
const migration: MigrationDefinition = defineMigration({
  name: '202610080010_studio_create_delegations',

  async up({ builder }) {
    await builder.createCollections([
      {
        name: 'studioDelegations',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          // The agents plugin's conversation and agent, the projects plugin's issue; no foreign keys, as their tables
          // are the plugins' own.
          collection.string('conversationId', { length: 64 }).notNull();
          collection.string('issueId', { length: 64 }).notNull();
          collection.string('agentId', { length: 64 }).notNull();
          // The conversation's owner, who executed the plan and alone may see or stop following it.
          collection.string('userId', { length: 64 }).notNull();
          collection.boolean('followed').notNull().defaultTo(true);
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['conversationId', 'issueId', 'agentId'], {
            mode: 'index',
          });
          collection.index(['issueId']);
        },
      },
      {
        name: 'studioDelegationEvents',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('delegationId', { length: 64 }).notNull();
          collection.string('conversationId', { length: 64 }).notNull();
          // What was reported, unique per delegation: `run:<runId>`, `status:<revision>`, `pr:<pullRequestId>`.
          collection.string('key', { length: 160 }).notNull();
          collection.string('kind', { length: 32 }).notNull();
          // Whether the report woke the conversation's agent; counted against the conversation's wake limit.
          collection.boolean('woke').notNull().defaultTo(false);
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['delegationId', 'key'], { mode: 'index' });
          collection.index(['conversationId', 'createdAt']);
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('studioDelegationEvents');
    await builder.dropCollection('studioDelegations');
  },
});

export default migration;
