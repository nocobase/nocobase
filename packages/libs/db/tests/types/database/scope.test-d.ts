import { expectTypeOf } from 'vitest';
import type {
  DatabaseConnection,
  DatabaseScope,
  DatabaseScopePolicies,
  RepositoryQuery,
  ScopedDatabaseConnection,
} from '../../../src/index.js';

interface Project {
  id: string;
  tenantId: string;
  name: string;
}

export async function scopeContract(
  connection: DatabaseConnection,
): Promise<void> {
  const scope = connection.scope(
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

  expectTypeOf(scope).toEqualTypeOf<DatabaseScope<'projects'>>();
  const projects = scope.repository<
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
  // @ts-expect-error the scope cannot promise a complete record
  const full: RepositoryQuery<Project> = projects.findMany();
  void full;
  // @ts-expect-error only collections in the policy map are accessible
  scope.repository('tasks');
  // @ts-expect-error supplying a record type cannot widen the collection allowlist
  scope.repository<Project>('tasks');
  // @ts-expect-error raw database access is not part of a scope
  scope.query;
  // @ts-expect-error the client cannot be recovered from a scope
  scope.client();
  // @ts-expect-error a scope cannot replace its policies
  scope.scope({}, undefined);
  // @ts-expect-error subscriptions hand out full connections and are not exposed
  scope.onRepositoryMutation;
  // @ts-expect-error a scoped repository can narrow but cannot rebind its policy
  projects.withPolicy({ read: true, create: true, update: true, delete: true });
  // @ts-expect-error explicit create input types remain enforced
  projects.createOne({ values: { tenantId: 'T2' } });
  // @ts-expect-error a scope is not a full connection
  const raw: DatabaseConnection = scope;
  void raw;

  await scope.transaction(async (transaction) => {
    expectTypeOf(transaction).toEqualTypeOf<typeof scope>();
    // @ts-expect-error transaction scopes retain the collection allowlist
    transaction.repository('tasks');
    // @ts-expect-error transaction scopes do not expose raw clients
    transaction.client();
    await transaction.transaction(async (savepoint) => {
      expectTypeOf(savepoint).toEqualTypeOf<typeof scope>();
    });
  });

  const dynamic: DatabaseScopePolicies<undefined> = {};
  connection.scope(dynamic, undefined).repository('runtime-checked');
  // @ts-expect-error an empty static map permits no collection
  connection.scope({}, undefined).repository('projects');
}

export function legacyContract(legacy: ScopedDatabaseConnection): void {
  // Adding scope to DatabaseConnection must not add it to the legacy wrapper.
  // @ts-expect-error legacy bindings cannot be rebound through the new API
  legacy.scope({}, undefined);
  legacy.query;
  legacy.repository('unlisted');
}
