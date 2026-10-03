/**
 * Write scenarios for the SQLite-only Repository mutation event checks: the
 * exact SQL a connection without subscriptions sends, and the statements a
 * subscription adds. Row-level correctness of the events is covered for every
 * dialect by the shared integration suite.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Knex } from 'knex';
import {
  createDatabaseManager,
  InMemoryCollectionMetadataStore,
  type DatabaseConnection,
  type DatabaseManager,
} from '@nocobase/db';
import sqlite from '../../src/index.js';

export interface Fixture {
  readonly db: DatabaseManager;
  readonly connection: DatabaseConnection;
  readonly knex: Knex;
  destroy(): Promise<void>;
}

export async function createFixture(
  options: { file?: boolean } = {},
): Promise<Fixture> {
  const directory = options.file
    ? mkdtempSync(path.join(tmpdir(), 'nocobase-events-'))
    : undefined;
  const db = createDatabaseManager({
    drivers: { sqlite },
    metadataStore: new InMemoryCollectionMetadataStore(),
    connections: {
      main: {
        dialect: 'sqlite',
        filename: directory
          ? path.join(directory, 'events.sqlite')
          : ':memory:',
      },
    },
  });
  const connection = db.connection();
  await connection.connect();
  await defineSchema(connection);
  const knex = await connection.client<Knex>();
  return {
    db,
    connection,
    knex,
    async destroy() {
      await db.destroy();
      if (directory) rmSync(directory, { recursive: true, force: true });
    },
  };
}

async function defineSchema(connection: DatabaseConnection): Promise<void> {
  await connection.builder.createCollections([
    {
      name: 'users',
      definition: (c) => {
        c.string('id').primary().notNull();
        c.string('name').notNull();
      },
    },
    {
      name: 'projectProfiles',
      definition: (c) => {
        c.string('id').primary().notNull();
        c.string('summary').notNull();
        c.string('projectId').nullable();
        c.unique(['projectId']);
      },
    },
    {
      name: 'tasks',
      definition: (c) => {
        c.string('id').primary().notNull();
        c.string('title').notNull();
        c.string('status').notNull().defaultTo('draft');
        c.integer('points').notNull().defaultTo(0);
        c.string('projectId').nullable();
        c.string('assigneeId').nullable();
        c.belongsTo('assignee', 'users')
          .targetKey('id')
          .foreignKey('assigneeId');
      },
    },
    {
      name: 'tags',
      definition: (c) => {
        c.string('id').primary().notNull();
        c.string('label').notNull();
      },
    },
    {
      name: 'projectTags',
      definition: (c) => {
        c.string('projectId').notNull();
        c.string('tagId').notNull();
        c.string('role').nullable();
        c.unique(['projectId', 'tagId']);
      },
    },
    {
      name: 'projects',
      definition: (c) => {
        c.string('id').primary().notNull();
        c.string('name').notNull();
        c.string('status').notNull().defaultTo('draft');
        c.string('ownerId').nullable();
        c.integer('version').notNull();
        c.optimisticLock('version');
        c.belongsTo('owner', 'users').targetKey('id').foreignKey('ownerId');
        c.hasOne('profile', 'projectProfiles')
          .sourceKey('id')
          .foreignKey('projectId');
        c.hasMany('tasks', 'tasks').sourceKey('id').foreignKey('projectId');
        c.belongsToMany('tags', 'tags')
          .sourceKey('id')
          .targetKey('id')
          .through('projectTags')
          .foreignKey('projectId')
          .otherKey('tagId');
      },
    },
    {
      name: 'memberships',
      definition: (c) => {
        c.increments('id');
        c.string('teamId').notNull();
        c.string('userId').notNull();
        c.string('role').notNull();
        c.integer('version').notNull();
        c.optimisticLock('version');
      },
    },
    {
      name: 'teams',
      definition: (c) => {
        c.string('id').primary().notNull();
        c.string('name').notNull();
        c.belongsToMany('members', 'users')
          .sourceKey('id')
          .targetKey('id')
          .through('memberships')
          .foreignKey('teamId')
          .otherKey('userId');
      },
    },
    {
      name: 'notes',
      definition: (c) => {
        c.increments('id');
        c.string('body').notNull();
      },
    },
  ]);
}

export async function seed(connection: DatabaseConnection): Promise<void> {
  await connection.repository('users').createMany({
    values: [
      { id: 'user-1', name: 'Ada' },
      { id: 'user-2', name: 'Bob' },
      { id: 'user-3', name: 'Cy' },
    ],
  });
  await connection.repository('tags').createMany({
    values: [
      { id: 'tag-db', label: 'Database' },
      { id: 'tag-docs', label: 'Documentation' },
      { id: 'tag-orm', label: 'ORM' },
    ],
  });
  await connection.repository('projects').createMany({
    values: [
      { id: 'project-1', name: 'Guide', ownerId: 'user-1' },
      { id: 'project-2', name: 'Second', ownerId: 'user-3' },
      { id: 'project-other', name: 'Other', ownerId: 'user-2' },
    ],
  });
  await connection.repository('projectProfiles').createMany({
    values: [
      { id: 'profile-current', summary: 'Current', projectId: 'project-1' },
      { id: 'profile-existing', summary: 'Loose', projectId: null },
    ],
  });
  await connection.repository('tasks').createMany({
    values: [
      { id: 'task-existing', title: 'Loose', projectId: null },
      { id: 'task-edit', title: 'Edit', projectId: 'project-1' },
      { id: 'task-detached', title: 'Detach', projectId: 'project-1' },
      { id: 'task-obsolete', title: 'Obsolete', projectId: 'project-1' },
      { id: 'task-outside', title: 'Outside', projectId: 'project-other' },
    ],
  });
  await connection.repository('projectTags').createMany({
    values: [
      { projectId: 'project-1', tagId: 'tag-docs', role: 'secondary' },
      { projectId: 'project-1', tagId: 'tag-orm', role: 'primary' },
      { projectId: 'project-other', tagId: 'tag-docs', role: 'primary' },
    ],
  });
  await connection.repository('teams').createMany({
    values: [{ id: 'team-1', name: 'Core' }],
  });
  await connection.repository('memberships').createMany({
    values: [{ teamId: 'team-1', userId: 'user-1', role: 'lead' }],
  });
  await connection.repository('notes').createMany({
    values: [{ body: 'one' }, { body: 'two' }],
  });
}

export interface Scenario {
  readonly name: string;
  run(connection: DatabaseConnection): Promise<unknown>;
}

const projects = (connection: DatabaseConnection) =>
  connection.repository('projects');
const p1 = { id: 'project-1' };

export const scenarios: readonly Scenario[] = [
  {
    name: 'createOne root only',
    run: (c) => projects(c).createOne({ values: { id: 'p-new', name: 'New' } }),
  },
  {
    name: 'createOne nested create/connect on every relation type',
    run: (c) =>
      projects(c).createOne({
        values: {
          id: 'p-nested',
          name: 'Nested',
          owner: { connect: { id: 'user-2' } },
          profile: { create: { id: 'profile-new', summary: 'New' } },
          tasks: {
            create: [
              {
                id: 'task-new',
                title: 'New',
                assignee: { connect: { id: 'user-1' } },
              },
            ],
            connect: { id: 'task-existing' },
          },
          tags: {
            connect: [{ where: { id: 'tag-db' }, through: { role: 'main' } }],
            create: {
              values: { id: 'tag-new', label: 'New' },
              through: { role: 'aux' },
            },
          },
        },
      }),
  },
  {
    name: 'createOne belongsTo create',
    run: (c) =>
      projects(c).createOne({
        values: {
          id: 'p-owned',
          name: 'Owned',
          owner: { create: { id: 'user-new', name: 'New owner' } },
        },
      }),
  },
  {
    name: 'createOne hasOne connect',
    run: (c) =>
      projects(c).createOne({
        values: {
          id: 'p-profile',
          name: 'Profile',
          profile: { connect: { id: 'profile-existing' } },
        },
      }),
  },
  {
    name: 'updateOne root scalar',
    run: (c) =>
      projects(c).updateOne({ filter: p1, values: { status: 'published' } }),
  },
  {
    name: 'updateOne belongsTo connect',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: { owner: { connect: { id: 'user-2' } } },
      }),
  },
  {
    name: 'updateOne belongsTo disconnect (clear)',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: { owner: { disconnect: true } },
      }),
  },
  {
    name: 'updateOne belongsTo update',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: { owner: { update: { values: { name: 'Ada L.' } } } },
      }),
  },
  {
    name: 'updateOne belongsTo upsert (update branch)',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: {
          owner: {
            upsert: {
              create: { id: 'user-x', name: 'X' },
              update: { name: 'Ada U.' },
            },
          },
        },
      }),
  },
  {
    name: 'updateOne belongsTo delete',
    run: (c) =>
      projects(c).updateOne({
        filter: { id: 'project-2' },
        values: { owner: { delete: true } },
      }),
  },
  {
    name: 'updateOne belongsTo create',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: { owner: { create: { id: 'user-c', name: 'Created' } } },
      }),
  },
  {
    name: 'updateOne hasOne connect (detaches the current target)',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: { profile: { connect: { id: 'profile-existing' } } },
      }),
  },
  {
    name: 'updateOne hasOne create (detaches the current target)',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: { profile: { create: { id: 'profile-c', summary: 'C' } } },
      }),
  },
  {
    name: 'updateOne hasOne disconnect (clear by condition)',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: { profile: { disconnect: true } },
      }),
  },
  {
    name: 'updateOne hasOne update',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: { profile: { update: { values: { summary: 'Changed' } } } },
      }),
  },
  {
    name: 'updateOne hasOne upsert (create branch)',
    run: (c) =>
      projects(c).updateOne({
        filter: { id: 'project-2' },
        values: {
          profile: {
            upsert: {
              create: { id: 'profile-u', summary: 'U' },
              update: { summary: 'never' },
            },
          },
        },
      }),
  },
  {
    name: 'updateOne hasOne delete',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: { profile: { delete: true } },
      }),
  },
  {
    name: 'updateOne hasMany patch (create/connect/disconnect/update/upsert/delete)',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: {
          tasks: {
            create: { id: 'task-created', title: 'Created' },
            connect: { id: 'task-existing' },
            disconnect: { id: 'task-detached' },
            update: {
              filter: { id: 'task-edit' },
              values: { title: 'Edited', points: { increment: 1 } },
            },
            upsert: [
              {
                filter: { id: 'task-imported' },
                create: { id: 'task-imported', title: 'Imported' },
                update: { title: 'never' },
              },
            ],
            delete: { filter: { id: 'task-obsolete' } },
          },
        },
      }),
  },
  {
    name: 'updateOne hasMany upsert (update branch)',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: {
          tasks: {
            upsert: [
              {
                filter: { id: 'task-edit' },
                create: { id: 'task-edit', title: 'never' },
                update: { title: 'Upserted' },
              },
            ],
          },
        },
      }),
  },
  {
    name: 'updateOne hasMany disconnect of a task not attached (0 rows)',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: { tasks: { disconnect: { id: 'task-existing' } } },
      }),
  },
  {
    name: 'updateOne hasMany set (nulls remaining by condition)',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: {
          tasks: { set: [{ id: 'task-edit' }, { id: 'task-existing' }] },
        },
      }),
  },
  {
    name: 'updateOne hasMany set [] (nulls all by condition)',
    run: (c) =>
      projects(c).updateOne({ filter: p1, values: { tasks: { set: [] } } }),
  },
  {
    name: 'updateOne nested update with nested belongsTo connect',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: {
          tasks: {
            update: {
              filter: { id: 'task-edit' },
              values: { assignee: { connect: { id: 'user-3' } } },
            },
          },
        },
      }),
  },
  {
    name: 'updateOne belongsToMany connect (new edge + existing edge with through update)',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: {
          tags: {
            connect: [
              { where: { id: 'tag-db' }, through: { role: 'new' } },
              { where: { id: 'tag-docs' }, through: { role: 'changed' } },
            ],
          },
        },
      }),
  },
  {
    name: 'updateOne belongsToMany disconnect',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: { tags: { disconnect: { id: 'tag-docs' } } },
      }),
  },
  {
    name: 'updateOne belongsToMany set',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: { tags: { set: [{ id: 'tag-db' }, { id: 'tag-orm' }] } },
      }),
  },
  {
    name: 'updateOne belongsToMany update target',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: {
          tags: {
            update: { filter: { id: 'tag-orm' }, values: { label: 'ORM!' } },
          },
        },
      }),
  },
  {
    name: 'updateOne belongsToMany delete target (deletes edges by condition)',
    run: (c) =>
      projects(c).updateOne({
        filter: p1,
        values: { tags: { delete: { filter: { id: 'tag-docs' } } } },
      }),
  },
  {
    name: 'updateOne belongsToMany with own-PK versioned through',
    run: (c) =>
      c.repository('teams').updateOne({
        filter: { id: 'team-1' },
        values: {
          members: {
            connect: [
              { where: { id: 'user-1' }, through: { role: 'owner' } },
              { where: { id: 'user-2' }, through: { role: 'member' } },
            ],
          },
        },
      }),
  },
  {
    name: 'upsertOne create branch',
    run: (c) =>
      projects(c).upsertOne({
        filter: { id: 'p-up' },
        create: { id: 'p-up', name: 'Up' },
        update: { name: 'never' },
      }),
  },
  {
    name: 'upsertOne update branch',
    run: (c) =>
      projects(c).upsertOne({
        filter: p1,
        create: { id: 'project-1', name: 'never' },
        update: { name: 'Upserted' },
      }),
  },
  {
    name: 'deleteOne',
    run: (c) =>
      c.repository('tasks').deleteOne({ filter: { id: 'task-edit' } }),
  },
  {
    name: 'updateMany',
    run: (c) =>
      c.repository('tasks').updateMany({
        filter: { projectId: 'project-1' },
        values: { status: 'done' },
      }),
  },
  {
    name: 'updateMany zero rows',
    run: (c) =>
      c.repository('tasks').updateMany({
        filter: { projectId: 'nope' },
        values: { status: 'done' },
      }),
  },
  {
    name: 'updateMany versioned',
    run: (c) =>
      projects(c).updateMany({
        filter: { status: 'draft' },
        values: { status: 'archived' },
      }),
  },
  {
    name: 'deleteMany',
    run: (c) =>
      c.repository('tasks').deleteMany({ filter: { projectId: 'project-1' } }),
  },
  {
    name: 'createMany explicit keys',
    run: (c) =>
      c.repository('tasks').createMany({
        values: [
          { id: 'task-a', title: 'A' },
          { id: 'task-b', title: 'B' },
        ],
      }),
  },
  {
    name: 'createMany generated keys',
    run: (c) =>
      c.repository('notes').createMany({
        values: [{ body: 'three' }, { body: 'four' }],
      }),
  },
];

/** Counts statements a scenario sends, excluding the fixture and seed. */
export async function countStatements(
  knex: Knex,
  run: () => Promise<unknown>,
): Promise<{ count: number; sql: string[] }> {
  const sql: string[] = [];
  const listener = (query: { sql: string }) => sql.push(query.sql);
  knex.on('query', listener);
  try {
    await run();
  } finally {
    knex.off('query', listener);
  }
  return { count: sql.length, sql };
}
