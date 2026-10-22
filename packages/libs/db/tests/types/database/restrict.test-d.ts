import { expectTypeOf } from 'vitest';
import type {
  DatabaseConnection,
  RestrictedDatabase,
  DatabasePolicyMap,
  RepositoryQuery,
  ScopedDatabaseConnection,
} from '../../../src/index.js';

interface Project {
  id: string;
  tenantId: string;
  name: string;
}

export async function restrictContract(
  connection: DatabaseConnection,
): Promise<void> {
  const database = connection.restrict(
    {
      projects: (principal) => ({
        read: {
          scope: { tenantId: principal.tenantId },
          fields: ['id', 'name'],
        },
        create: false,
        update: false,
        delete: false,
      }),
    },
    { tenantId: 'T1' },
  );

  expectTypeOf(database).toEqualTypeOf<RestrictedDatabase<'projects'>>();
  const projects = database.repository<
    Project,
    { name: string },
    { name: string }
  >('projects');
  expectTypeOf(projects.findMany()).toEqualTypeOf<
    RepositoryQuery<Partial<Project>>
  >();
  expectTypeOf(
    projects.narrow({ read: { scope: true, fields: ['id'] } }).findMany(),
  ).toEqualTypeOf<RepositoryQuery<Partial<Project>>>();
  // @ts-expect-error the restricted database cannot promise a complete record
  const full: RepositoryQuery<Project> = projects.findMany();
  void full;
  // @ts-expect-error only collections in the policy map are accessible
  database.repository('tasks');
  // @ts-expect-error supplying a record type cannot widen the collection allowlist
  database.repository<Project>('tasks');
  // @ts-expect-error raw database access is not part of a database
  database.query;
  // @ts-expect-error the client cannot be recovered from a database
  database.client();
  // @ts-expect-error a restricted database cannot replace its policies
  database.restrict({}, undefined);
  // @ts-expect-error subscriptions hand out full connections and are not exposed
  database.onRepositoryMutation;
  // @ts-expect-error a scoped repository can narrow but cannot rebind its policy
  projects.withPolicy({ read: true, create: true, update: true, delete: true });
  // @ts-expect-error explicit create input types remain enforced
  projects.createOne({ values: { tenantId: 'T2' } });
  // @ts-expect-error a restricted database is not a full connection
  const raw: DatabaseConnection = database;
  void raw;

  await database.transaction(async (transaction) => {
    expectTypeOf(transaction).toEqualTypeOf<typeof database>();
    // @ts-expect-error restricted transactions retain the collection allowlist
    transaction.repository('tasks');
    // @ts-expect-error restricted transactions do not expose raw clients
    transaction.client();
    await transaction.transaction(async (savepoint) => {
      expectTypeOf(savepoint).toEqualTypeOf<typeof database>();
    });
  });

  const dynamic: DatabasePolicyMap<undefined> = {};
  connection.restrict(dynamic, undefined).repository('runtime-checked');
  // @ts-expect-error an empty static map permits no collection
  connection.restrict({}, undefined).repository('projects');
  // @ts-expect-error the unreleased connection.scope method was renamed to restrict
  connection.scope({}, undefined);
}

export async function policyBindingContract(
  connection: DatabaseConnection,
): Promise<void> {
  const policies: DatabasePolicyMap<{ tenantId: string }, 'projects'> = {
    projects: (principal) => ({
      read: { scope: { tenantId: principal.tenantId }, fields: ['id'] },
      create: false,
      update: false,
      delete: false,
    }),
  };
  const principal = { tenantId: 'T1' };
  const bound = connection.withPolicies(policies, principal);
  expectTypeOf(connection.restrict(policies, principal)).toEqualTypeOf<
    RestrictedDatabase<'projects'>
  >();
  expectTypeOf(bound).toEqualTypeOf<ScopedDatabaseConnection>();
  // @ts-expect-error policy-bound connections cannot replace their bindings
  bound.restrict({}, undefined);
  expectTypeOf(bound.query).toEqualTypeOf<DatabaseConnection['query']>();
  bound.repository('unlisted');
  await bound.transaction(async (transaction) => {
    expectTypeOf(transaction).toEqualTypeOf<ScopedDatabaseConnection>();
    transaction.repository('unlisted');
    transaction.client();
  });
}
