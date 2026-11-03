import type { SelectAst } from '../../../../../db/src/index.js';
import { type IntegrationTestContext } from '../../helpers.js';

/**
 * Two tenants sharing one pair of tables, which is the shape every Policy
 * claim is really about: T2's rows exist, are reachable by primary key, and
 * must stay invisible to a repository bound to T1.
 */
export async function createTenantFixture(
  context: IntegrationTestContext,
): Promise<void> {
  await context.builder.createCollections([
    {
      name: 'policyTasks',
      definition: (collection) => {
        collection.string('id').primary();
        collection.string('tenantId').notNull();
        collection.string('title').notNull();
        collection.string('secret').nullable();
        collection.string('projectId').nullable();
      },
    },
    {
      name: 'policyOwners',
      definition: (collection) => {
        collection.string('id').primary();
        collection.string('tenantId').notNull();
        collection.string('name').notNull();
      },
    },
    {
      name: 'policyProjects',
      definition: (collection) => {
        collection.string('id').primary();
        collection.string('tenantId').notNull();
        collection.string('name').notNull();
        collection.integer('budget').notNull().defaultTo(0);
        collection.integer('version').notNull().defaultTo(1);
        collection.optimisticLock('version');
        collection.string('ownerId').nullable();
        collection
          .hasMany('tasks', 'policyTasks')
          .sourceKey('id')
          .foreignKey('projectId');
        // A to-one relation writes its foreign key on this table, which is
        // what makes a relation operation able to move the root record.
        collection
          .belongsTo('owner', 'policyOwners')
          .targetKey('id')
          .foreignKey('ownerId')
          .constraints(false);
      },
    },
  ]);
  await context.database.repository('policyOwners').createMany({
    values: [
      { id: 'o1', tenantId: 'T1', name: 'Mine' },
      { id: 'o2', tenantId: 'T2', name: 'Theirs' },
    ],
  });
  // Seeded through the Repository rather than raw SQL so the fixture does not
  // have to know each dialect's physical column names.
  await context.database.repository('policyProjects').createMany({
    values: [
      {
        id: 'p1',
        tenantId: 'T1',
        name: 'Mine one',
        budget: 100,
        ownerId: 'o1',
      },
      // A record of this tenant pointing at another tenant's owner: the root
      // scope admits it, the relation scope does not.
      {
        id: 'p2',
        tenantId: 'T1',
        name: 'Mine two',
        budget: 200,
        ownerId: 'o2',
      },
      { id: 'p3', tenantId: 'T2', name: 'Theirs', budget: 300, ownerId: 'o2' },
    ],
  });
  await context.database.repository('policyTasks').createMany({
    values: [
      { id: 't1', tenantId: 'T1', title: 'Mine', secret: 'a', projectId: 'p1' },
      {
        id: 't2',
        tenantId: 'T2',
        title: 'Theirs',
        secret: 'b',
        projectId: 'p1',
      },
      {
        id: 't3',
        tenantId: 'T1',
        title: 'Other',
        secret: 'c',
        projectId: 'p3',
      },
      // Unattached, so a relation write can claim them without the explicit
      // reassignment that moving an already-owned row requires.
      {
        id: 't4',
        tenantId: 'T1',
        title: 'Free mine',
        secret: 'd',
        projectId: null,
      },
      {
        id: 't5',
        tenantId: 'T2',
        title: 'Free theirs',
        secret: 'e',
        projectId: null,
      },
    ],
  });
}

/** Every row as an unbound Repository sees it — no policy, so nothing hidden. */
export async function allProjects(
  context: IntegrationTestContext,
): Promise<Array<Record<string, unknown>>> {
  return context.database.repository('policyProjects').findMany({
    select: selection(['id', 'tenantId', 'budget', 'ownerId']),
  });
}

export const TENANT_FIELDS = ['id', 'tenantId', 'name', 'budget'] as const;

export function selection(fields: readonly string[]): SelectAst {
  return {
    kind: 'select',
    version: 1,
    root: { kind: 'selection', fields, includes: [] },
  };
}

/** Record every SQL statement a block issues, so a claim about pushdown can be checked. */
export async function captureSql<T>(
  context: IntegrationTestContext,
  run: () => PromiseLike<T>,
): Promise<{ result: T; statements: string[] }> {
  const statements: string[] = [];
  const listener = (event: { sql: string }) => statements.push(event.sql);
  context.db.on('query', listener);
  try {
    return { result: await run(), statements };
  } finally {
    context.db.off('query', listener);
  }
}
