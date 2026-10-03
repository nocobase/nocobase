import type {
  DatabaseConnection,
  RepositoryMutationEvent,
  RepositoryMutationListeners,
  RowChange,
} from '../../../../../db/src/index.js';
import type { IntegrationTestContext } from '../../helpers.js';

/** Every Collection of the fixture and the logical fields that identify a row. */
export const eventCollections: Readonly<Record<string, readonly string[]>> = {
  users: ['id'],
  projectProfiles: ['id'],
  tasks: ['id'],
  tags: ['id'],
  projectTags: ['projectId', 'tagId'],
  projects: ['id'],
  // A through row is identified by its foreign keys, own primary key or not.
  memberships: ['teamId', 'userId'],
  teams: ['id'],
  notes: ['id'],
};

/**
 * Four relation types, a versioned root, a through Collection without a
 * primary key and one with its own versioned primary key, and a Collection
 * whose keys the database generates.
 */
export async function createEventsFixture(
  context: IntegrationTestContext,
): Promise<void> {
  await context.builder.createCollections([
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
  const connection = context.connection;
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
      { id: 'profile-loose', summary: 'Loose', projectId: null },
    ],
  });
  await connection.repository('tasks').createMany({
    values: [
      { id: 'task-loose', title: 'Loose', projectId: null },
      { id: 'task-edit', title: 'Edit', projectId: 'project-1' },
      { id: 'task-detach', title: 'Detach', projectId: 'project-1' },
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

export interface EventScenario {
  readonly name: string;
  run(connection: DatabaseConnection): Promise<unknown>;
}

const projects = (connection: DatabaseConnection) =>
  connection.repository('projects');
const project1 = { id: 'project-1' };

/** Every write method, and every nested relation operation on every relation type. */
export const eventScenarios: readonly EventScenario[] = [
  {
    name: 'createOne root only',
    run: (c) => projects(c).createOne({ values: { id: 'p-new', name: 'New' } }),
  },
  {
    name: 'createOne with nested create and connect on every relation type',
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
            connect: { id: 'task-loose' },
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
    name: 'createOne with a belongsTo create',
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
    name: 'createOne with a hasOne connect',
    run: (c) =>
      projects(c).createOne({
        values: {
          id: 'p-profile',
          name: 'Profile',
          profile: { connect: { id: 'profile-loose' } },
        },
      }),
  },
  {
    name: 'updateOne root values',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
        values: { status: 'published' },
      }),
  },
  {
    name: 'updateOne belongsTo connect',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
        values: { owner: { connect: { id: 'user-2' } } },
      }),
  },
  {
    name: 'updateOne belongsTo disconnect',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
        values: { owner: { disconnect: true } },
      }),
  },
  {
    name: 'updateOne belongsTo update',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
        values: { owner: { update: { values: { name: 'Ada L.' } } } },
      }),
  },
  {
    name: 'updateOne belongsTo upsert',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
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
        filter: project1,
        values: { owner: { create: { id: 'user-c', name: 'Created' } } },
      }),
  },
  {
    name: 'updateOne hasOne connect detaches the current target',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
        values: { profile: { connect: { id: 'profile-loose' } } },
      }),
  },
  {
    name: 'updateOne hasOne create detaches the current target',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
        values: { profile: { create: { id: 'profile-c', summary: 'C' } } },
      }),
  },
  {
    name: 'updateOne hasOne disconnect',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
        values: { profile: { disconnect: true } },
      }),
  },
  {
    name: 'updateOne hasOne update',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
        values: { profile: { update: { values: { summary: 'Changed' } } } },
      }),
  },
  {
    name: 'updateOne hasOne upsert creating the target',
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
        filter: project1,
        values: { profile: { delete: true } },
      }),
  },
  {
    name: 'updateOne hasMany create, connect, disconnect, update, upsert and delete',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
        values: {
          tasks: {
            create: { id: 'task-created', title: 'Created' },
            connect: { id: 'task-loose' },
            disconnect: { id: 'task-detach' },
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
    name: 'updateOne hasMany upsert updating the target',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
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
    name: 'updateOne hasMany disconnect of a target that is not attached',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
        values: { tasks: { disconnect: { id: 'task-loose' } } },
      }),
  },
  {
    name: 'updateOne hasMany set detaches the rest',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
        values: {
          tasks: { set: [{ id: 'task-edit' }, { id: 'task-loose' }] },
        },
      }),
  },
  {
    name: 'updateOne hasMany set to nothing',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
        values: { tasks: { set: [] } },
      }),
  },
  {
    name: 'updateOne nested update with a nested belongsTo connect',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
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
    name: 'updateOne belongsToMany connect with through values',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
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
        filter: project1,
        values: { tags: { disconnect: { id: 'tag-docs' } } },
      }),
  },
  {
    name: 'updateOne belongsToMany set',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
        values: { tags: { set: [{ id: 'tag-db' }, { id: 'tag-orm' }] } },
      }),
  },
  {
    name: 'updateOne belongsToMany update of the target',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
        values: {
          tags: {
            update: { filter: { id: 'tag-orm' }, values: { label: 'ORM!' } },
          },
        },
      }),
  },
  {
    name: 'updateOne belongsToMany delete of a target other sources share',
    run: (c) =>
      projects(c).updateOne({
        filter: project1,
        values: { tags: { delete: { filter: { id: 'tag-docs' } } } },
      }),
  },
  {
    name: 'updateOne belongsToMany through a versioned Collection with its own key',
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
    name: 'upsertOne creating',
    run: (c) =>
      projects(c).upsertOne({
        filter: { id: 'p-up' },
        create: { id: 'p-up', name: 'Up' },
        update: { name: 'never' },
      }),
  },
  {
    name: 'upsertOne updating',
    run: (c) =>
      projects(c).upsertOne({
        filter: project1,
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
    name: 'updateMany on a versioned Collection',
    run: (c) =>
      projects(c).updateMany({
        filter: { status: 'draft' },
        values: { status: 'archived' },
      }),
  },
  {
    name: 'updateMany returning records',
    run: (c) =>
      c.repository('tasks').updateMany({
        filter: { projectId: 'project-1' },
        values: { points: { increment: 2 } },
        select: (s) => s.fields('id'),
      }),
  },
  {
    name: 'deleteMany',
    run: (c) =>
      c.repository('tasks').deleteMany({ filter: { projectId: 'project-1' } }),
  },
  {
    name: 'deleteMany returning records',
    run: (c) =>
      c.repository('tasks').deleteMany({
        filter: { projectId: 'project-1' },
        select: (s) => s.fields('id'),
      }),
  },
  {
    name: 'createMany with supplied keys',
    run: (c) =>
      c.repository('tasks').createMany({
        values: [
          { id: 'task-a', title: 'A' },
          { id: 'task-b', title: 'B' },
        ],
      }),
  },
  {
    name: 'createMany with generated keys',
    run: (c) =>
      c.repository('notes').createMany({
        values: [{ body: 'three' }, { body: 'four' }],
      }),
  },
];

export type Snapshot = Record<string, Map<string, Record<string, unknown>>>;

/** Every row of the fixture, read through the Repository so it is portable. */
export async function snapshotEventsFixture(
  connection: DatabaseConnection,
): Promise<Snapshot> {
  const snapshot: Snapshot = {};
  for (const [collection, key] of Object.entries(eventCollections)) {
    const rows = (await connection.repository(collection).findMany()) as Record<
      string,
      unknown
    >[];
    snapshot[collection] = new Map(rows.map((row) => [rowKey(key, row), row]));
  }
  return snapshot;
}

export function rowKey(
  fields: readonly string[],
  row: Readonly<Record<string, unknown>>,
): string {
  return JSON.stringify(fields.map((field) => String(row[field])));
}

export interface RowDifference {
  readonly collection: string;
  readonly kind: RowChange['kind'];
  readonly key: string;
  readonly fields?: readonly string[];
}

export function diffSnapshots(
  before: Snapshot,
  after: Snapshot,
): RowDifference[] {
  const differences: RowDifference[] = [];
  for (const collection of Object.keys(eventCollections)) {
    const previous = before[collection]!;
    const current = after[collection]!;
    for (const [key, row] of current) {
      const old = previous.get(key);
      if (!old) {
        differences.push({ collection, kind: 'created', key });
        continue;
      }
      const fields = Object.keys(row).filter(
        (field) => JSON.stringify(row[field]) !== JSON.stringify(old[field]),
      );
      if (fields.length > 0) {
        differences.push({ collection, kind: 'updated', key, fields });
      }
    }
    for (const key of previous.keys()) {
      if (!current.has(key))
        differences.push({ collection, kind: 'deleted', key });
    }
  }
  return differences;
}

/** Collects what both phases receive. */
export function collectEvents(): {
  readonly inTransaction: RepositoryMutationEvent[];
  readonly batches: RepositoryMutationEvent[][];
  readonly listeners: Required<RepositoryMutationListeners>;
} {
  const inTransaction: RepositoryMutationEvent[] = [];
  const batches: RepositoryMutationEvent[][] = [];
  return {
    inTransaction,
    batches,
    listeners: {
      inTransaction: (event) => {
        inTransaction.push(event);
      },
      afterCommit: (events) => {
        batches.push([...events]);
      },
    },
  };
}

export function rowsOf(
  events: readonly RepositoryMutationEvent[],
): RowChange[] {
  return events.flatMap((event) =>
    event.granularity === 'rows' ? [...event.changes] : [],
  );
}
