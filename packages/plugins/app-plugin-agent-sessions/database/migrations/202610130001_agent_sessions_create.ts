import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610130001_agent_sessions_create',

  async up({ builder }) {
    await builder.createCollections([
      {
        // A computer a person connected with `<cli> acp start`; only its owner's sessions run on it.
        name: 'agentSessionComputers',
        definition: (collection) => {
          collection.string('id', { length: 36 }).primary().notNull();
          collection.string('userId', { length: 64 }).notNull();
          collection.string('name', { length: 200 }).notNull();
          collection.string('platform', { length: 32 }).notNull();
          collection.string('arch', { length: 32 }).notNull();
          // The command line that runs the bridge and its version.
          collection.string('host', { length: 200 }).notNull();
          // The person's home directory there, shown as `~`; null from a bridge that does not say.
          collection.text('home').nullable();
          // The directories sessions may work in, and the agents found: `AgentInfo[]` of `@nocobase/acp-bridge`.
          collection.json('roots').notNull().defaultTo([]);
          collection.json('agents').notNull().defaultTo([]);
          // What each agent offered in the latest session there, by agent id: the choices a new session starts from.
          collection.json('choices').notNull().defaultTo({});
          // The slash commands each agent offered in the latest session there, by agent id.
          collection.json('commands').notNull().defaultTo({});
          // The directories its owner lets sessions work in, under `roots`; null for all of `roots`.
          collection.json('folders').nullable();
          // Every poll writes it; a computer silent for a minute is offline.
          collection.datetimeTz('lastSeenAt').notNull();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.index(['userId']);
        },
      },
      {
        // One conversation with an agent on one of its owner's computers. A removed computer leaves its sessions.
        name: 'agentSessions',
        definition: (collection) => {
          collection.string('id', { length: 36 }).primary().notNull();
          collection.string('userId', { length: 64 }).notNull();
          collection.string('computerId', { length: 36 }).notNull();
          collection.string('agentId', { length: 40 }).notNull();
          // The project the session works for, as the application names projects; null for none.
          collection.string('projectId', { length: 64 }).nullable();
          collection.text('cwd').notNull();
          // The title its owner gave it; the agent's title or the first message stand in until then.
          collection.string('title', { length: 500 }).nullable();
          collection.string('firstMessage', { length: 500 }).notNull();
          // The agent's own session id, which every reopening continues.
          collection.string('acpSessionId', { length: 200 }).nullable();
          // What the bridge last reported: `SessionState` of `@nocobase/acp-bridge`.
          collection.json('state').nullable();
          // The choices its owner made, applied whenever the session reopens.
          collection.json('settings').notNull().defaultTo({});
          collection.boolean('running').notNull().defaultTo(false);
          // Permission requests waiting for its owner.
          collection.integer('pendingPermissions').notNull().defaultTo(0);
          collection.integer('lastSeq').notNull().defaultTo(0);
          // The last report taken from the bridge run that started at `bridgeStartedAt`; a repeated one is ignored.
          collection.integer('reportedBatch').notNull().defaultTo(0);
          collection.string('bridgeStartedAt', { length: 40 }).nullable();
          collection.datetimeTz('archivedAt').nullable();
          collection.datetimeTz('lastActivityAt').notNull();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.index(['userId', 'archivedAt', 'lastActivityAt']);
          collection.index(['computerId']);
        },
      },
      {
        // A session's transcript, in order: `SessionEvent` of `@nocobase/acp-bridge`, its kind and the rest as data.
        name: 'agentSessionEvents',
        definition: (collection) => {
          collection.string('id', { length: 36 }).primary().notNull();
          collection.string('sessionId', { length: 36 }).notNull();
          collection.integer('seq').notNull();
          collection.string('kind', { length: 32 }).notNull();
          collection.json('data').notNull();
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['sessionId', 'seq']);
          collection
            .belongsTo('session', 'agentSessions')
            .targetKey('id')
            .foreignKey('sessionId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
      {
        // Commands waiting for a computer's bridge; a poll takes them away.
        name: 'agentSessionCommands',
        definition: (collection) => {
          collection.string('id', { length: 36 }).primary().notNull();
          collection.string('computerId', { length: 36 }).notNull();
          // `BridgeCommand` of `@nocobase/acp-bridge`.
          collection.json('command').notNull();
          collection.datetimeTz('createdAt').notNull();
          collection.index(['computerId', 'createdAt']);
        },
      },
      {
        // What the application tied to a session, such as the issues its agent created.
        name: 'agentSessionLinks',
        definition: (collection) => {
          collection.string('id', { length: 36 }).primary().notNull();
          collection.string('sessionId', { length: 36 }).notNull();
          collection.string('kind', { length: 64 }).notNull();
          collection.string('refId', { length: 200 }).notNull();
          // The transcript's `link` event that announced it, which orders the session's links.
          collection.integer('seq').notNull();
          // When its owner started the work on it from the session, or chose not to; null while that waits for them.
          collection.datetimeTz('decidedAt').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['sessionId', 'kind', 'refId']);
          collection.index(['kind', 'refId']);
          collection
            .belongsTo('session', 'agentSessions')
            .targetKey('id')
            .foreignKey('sessionId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('agentSessionLinks');
    await builder.dropCollection('agentSessionCommands');
    await builder.dropCollection('agentSessionEvents');
    await builder.dropCollection('agentSessions');
    await builder.dropCollection('agentSessionComputers');
  },
});

export default migration;
