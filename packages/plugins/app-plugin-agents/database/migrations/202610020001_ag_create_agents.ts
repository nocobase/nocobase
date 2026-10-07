import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202610020001_ag_create_agents',

  async up({ builder }) {
    await builder.createCollections([
      {
        // An agent: who it is, its type, the coding tools or the models it works with, which runners may run it and who
        // may wake it.
        name: 'agAgents',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('name', { length: 200 }).notNull();
          collection.text('description').nullable();
          // `{ key, ns }` i18n references an application gives the agents it ships, shown in the viewer's language in
          // place of `name` and `description` until someone edits that field; null for text people wrote.
          collection.json('nameText').nullable();
          collection.json('descriptionText').nullable();
          collection.string('avatar', { length: 500 }).nullable();
          // runner (a coding tool on a runner) | online (a model on the server); never changes.
          collection
            .enum('type', { values: ['online', 'runner'] })
            .notNull()
            .defaultTo('runner');
          // The tools and models it works with, in order, the first its default: `[{ tool, model, effort }]` for a
          // runner agent (a coding tool, its model or null for the tool's default, its reasoning effort or null),
          // `[{ modelService, model, effort }]` for an online agent, which has none until one is configured.
          collection.json('modelEntries').notNull().defaultTo([]);
          collection.text('instructions').nullable();
          // The runners it may run on; empty: any runner that has its tool and may run the waking person's work.
          collection.json('runnerIds').notNull().defaultTo([]);
          // Business action keys the agent may perform, within what the person who woke it may do.
          collection.json('actions').notNull().defaultTo([]);
          // In conversations: always (every change goes through a plan) | larger (small changes directly).
          collection
            .enum('confirmChanges', { values: ['always', 'larger'] })
            .notNull()
            .defaultTo('larger');
          collection
            .enum('access', { values: ['ownerOnly', 'users', 'everyone'] })
            .notNull()
            .defaultTo('ownerOnly');
          collection.string('ownerUserId', { length: 64 }).notNull();
          collection.integer('maxConcurrentRuns').notNull().defaultTo(2);
          collection.integer('maxAttempts').notNull().defaultTo(3);
          // Overrides of the default tool policy; null keeps the defaults.
          collection.json('toolPolicy').nullable();
          // Written by every claim of one of the agent's runs, so concurrent claims for one agent take turns.
          collection.datetimeTz('lastClaimAt').nullable();
          collection.datetimeTz('archivedAt').nullable();
          // Raised by every change to its configuration; a change made against an older revision is refused. Raised
          // by hand rather than as an optimistic lock, so a claim writing `lastClaimAt` leaves it alone.
          collection.integer('revision').notNull().defaultTo(1);
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection.index(['archivedAt']);
        },
      },
      {
        // The history of an agent's configuration: who changed what and when. Variables are named, never valued.
        name: 'agAgentChanges',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('agentId', { length: 64 }).notNull();
          // The agent's revision after the change.
          collection.integer('revision').notNull();
          // created | updated | archived | restored | variables
          collection.string('action', { length: 32 }).notNull();
          collection.string('actorUserId', { length: 64 }).nullable();
          // [{ field, before?, after?, name?, change? }]
          collection.json('changes').notNull().defaultTo([]);
          collection.datetimeTz('createdAt').notNull();
          collection.index(['agentId', 'createdAt']);
          collection
            .belongsTo('agent', 'agAgents')
            .targetKey('id')
            .foreignKey('agentId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
      {
        // The users an agent with access `users` may be woken by.
        name: 'agAgentUsers',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('agentId', { length: 64 }).notNull();
          collection.string('userId', { length: 64 }).notNull();
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['agentId', 'userId']);
          collection
            .belongsTo('agent', 'agAgents')
            .targetKey('id')
            .foreignKey('agentId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('agAgentChanges');
    await builder.dropCollection('agAgentUsers');
    await builder.dropCollection('agAgents');
  },
});

export default migration;
