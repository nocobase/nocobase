import { defineMigration, type MigrationDefinition } from '@nocobase/db';

const migration: MigrationDefinition = defineMigration({
  name: '202609300002_pm_create_projects',

  async up({ builder }) {
    await builder.createCollections([
      {
        name: 'pmProjects',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('name', { length: 255 }).notNull();
          collection.text('description').nullable();
          collection
            .enum('visibility', { values: ['everyone', 'members'] })
            .notNull()
            .defaultTo('everyone');
          collection
            .enum('status', {
              values: [
                'planned',
                'in_progress',
                'paused',
                'completed',
                'cancelled',
              ],
            })
            .notNull()
            .defaultTo('planned');
          collection
            .enum('priority', {
              values: ['urgent', 'high', 'medium', 'low', 'none'],
            })
            .notNull()
            .defaultTo('none');
          collection.string('leadUserId', { length: 64 }).nullable();
          // The issue that sets the project up (its code scaffolded, say): until it is finished, every issue created in
          // the project waits for it (`blockedBy`).
          collection.string('setupIssueId', { length: 64 }).nullable();
          collection.date('startDate').nullable();
          collection.date('dueDate').nullable();
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection
            .belongsTo('lead', 'user')
            .targetKey('id')
            .foreignKey('leadUserId')
            .constraints(false);
          collection
            .hasMany('members', 'pmProjectMembers')
            .sourceKey('id')
            .foreignKey('projectId')
            .constraints(false);
          collection
            .hasMany('resources', 'pmProjectResources')
            .sourceKey('id')
            .foreignKey('projectId')
            .constraints(false);
        },
      },
      {
        name: 'pmProjectMembers',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('projectId', { length: 64 }).notNull();
          collection.string('userId', { length: 64 }).notNull();
          collection.datetimeTz('createdAt').notNull();
          collection.unique(['projectId', 'userId']);
          collection
            .belongsTo('project', 'pmProjects')
            .targetKey('id')
            .foreignKey('projectId')
            .constraints(true)
            .onDelete('cascade');
          collection
            .belongsTo('user', 'user')
            .targetKey('id')
            .foreignKey('userId')
            .constraints(false);
        },
      },
      {
        // A working directory of the project, in order: a git repository checked out for each piece of work, or a
        // directory that already exists on one runner (`runnerId`, opaque here) and is used in place.
        name: 'pmProjectResources',
        definition: (collection) => {
          collection.string('id', { length: 64 }).primary().notNull();
          collection.string('projectId', { length: 64 }).notNull();
          collection
            .enum('type', { values: ['gitRepo', 'directory'] })
            .notNull()
            .defaultTo('gitRepo');
          collection.string('url', { length: 2000 }).nullable();
          collection.string('defaultRef', { length: 255 }).nullable();
          collection.string('runnerId', { length: 64 }).nullable();
          collection.string('path', { length: 1024 }).nullable();
          collection.string('label', { length: 255 }).nullable();
          // What to do in the directory the first time work starts there; plain text, never run as a script.
          collection.text('initPrompt').nullable();
          // A git repository's binding to the host it lives on, as the application that linked it records it (the
          // host, the connection it reaches the repository through, the host's id and `owner/name`); opaque here.
          collection.string('bindingProvider', { length: 32 }).nullable();
          collection.string('bindingConnectionId', { length: 64 }).nullable();
          collection.string('bindingRepoId', { length: 64 }).nullable();
          collection.string('bindingFullName', { length: 255 }).nullable();
          collection.integer('position').notNull().defaultTo(0);
          collection.datetimeTz('createdAt').notNull();
          collection.datetimeTz('updatedAt').notNull();
          collection
            .belongsTo('project', 'pmProjects')
            .targetKey('id')
            .foreignKey('projectId')
            .constraints(true)
            .onDelete('cascade');
        },
      },
    ]);
  },

  async down({ builder }) {
    await builder.dropCollection('pmProjectResources');
    await builder.dropCollection('pmProjectMembers');
    await builder.dropCollection('pmProjects');
  },
});

export default migration;
