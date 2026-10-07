import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610020008_ag_create_conversations',

  async up({ builder }) {
    await builder.createCollections([
      {
        // A person's conversation with an agent. The fields follow the platform AI employee's `aiConversations`
        // (`userId`, `title`, `category`, `read`, `thread`), so the two can be merged later.
        name: 'agConversations',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          // The owner: the only person who reads the conversation.
          collection.string('userId', { length: 64 }).notNull();
          collection.string('agentId', { length: 64 }).notNull();
          // chat | work: the type of the agent it was started with, for its whole life. It only ever moves to an agent
          // of the same type.
          collection
            .enum('mode', { values: ['online', 'runner'] })
            .notNull()
            .defaultTo('runner');
          // An online conversation: the entry of its agent's list the owner chose (a model service and model); null
          // for the agent's default. Ignored while the agent no longer lists it.
          collection.string('modelService', { length: 100 }).nullable();
          collection.string('model', { length: 200 }).nullable();
          // While on the system default agent: the agent to switch back to.
          collection.string('fallbackFromAgentId', { length: 64 }).nullable();
          collection.string('title', { length: 200 }).nullable();
          // auto | agent | user
          collection.string('titleSource', { length: 16 }).notNull();
          collection.string('category', { length: 16 }).notNull();
          // panel | askAgent | intake
          collection.string('source', { length: 16 }).notNull();
          collection.boolean('read').notNull().defaultTo(true);
          // The session generation: each switch of agent starts a new one, so runs never resume an older session.
          collection.integer('thread').notNull().defaultTo(0);
          // The highest message `seq`.
          collection.integer('lastSeq').notNull().defaultTo(0);
          // How far the agent's run events have been turned into messages.
          collection.string('syncRunId', { length: 64 }).nullable();
          collection.integer('syncSeq').notNull().defaultTo(0);
          collection.datetimeTz('lastMessageAt').notNull();
          collection.datetimeTz('archivedAt').nullable();
          // Written first by every change, so changes to one conversation run one after another.
          collection.datetimeTz('lockedAt').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.index(['userId', 'archivedAt', 'lastMessageAt']);
          collection
            .hasMany('messages', 'agConversationMessages')
            .sourceKey('id')
            .foreignKey('conversationId')
            .constraints(false);
        },
      },
      {
        // A message of a conversation. The fields follow the platform AI employee's `aiMessages` (`role`, `content`,
        // `toolCalls`, `attachments`, `workContext`, `metadata`).
        name: 'agConversationMessages',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('conversationId', { length: 64 }).notNull();
          collection.integer('seq').notNull();
          // user | assistant | system
          collection.string('role', { length: 16 }).notNull();
          // `{ type: 'text', content }`
          collection.json('content').notNull();
          // The content as plain text, for search.
          collection.text('searchText').notNull();
          collection.json('toolCalls').nullable();
          collection.json('attachments').nullable();
          // A user message's page context, resolved when it was sent.
          collection.json('workContext').nullable();
          collection.json('metadata').notNull().defaultTo({});
          collection.string('runId', { length: 64 }).nullable();
          // An assistant message: the run event it came from; one message per event.
          collection.integer('runEventSeq').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.unique(['conversationId', 'seq']);
          collection.unique(['runId', 'runEventSeq']);
        },
      },
      {
        // A person's chat settings: their default chat agent.
        name: 'agChatPreferences',
        definition: (collection) => {
          collection.string('userId', { length: 64 }).primary().notNull();
          collection.string('defaultAgentId', { length: 64 }).nullable();
          collection.datetimeTz('updatedAt').notNull();
        },
      },
      {
        // The plugin's team-wide settings, one row per key (`chat`: the system default chat agent).
        name: 'agSettings',
        definition: (collection) => {
          collection.string('key', { length: 64 }).primary().notNull();
          collection.json('value').notNull();
          collection.string('updatedById', { length: 64 }).nullable();
          collection.datetimeTz('updatedAt').notNull();
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('agSettings');
    await builder.dropCollection('agChatPreferences');
    await builder.dropCollection('agConversationMessages');
    await builder.dropCollection('agConversations');
  },
});

export default migration;
