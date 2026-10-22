# Restricted database access

Use `connection.restrict(policies, principal)` to give application code repository access limited to an explicit policy map. The result is a `RestrictedDatabase`, with no raw client, query builder, schema management, connection lifecycle, or mutation subscriptions.

```ts
const database = connection.restrict(
  {
    projects: (principal) => ({
      read: {
        scope: { tenantId: principal.tenantId },
        fields: ['id', 'name'],
      },
      create: {
        scope: { tenantId: principal.tenantId },
        defaults: { tenantId: principal.tenantId },
        fields: ['id', 'name'],
      },
      update: {
        scope: { tenantId: principal.tenantId },
        fields: ['name'],
      },
      delete: false,
    }),
  },
  { tenantId: 'T1' },
);

const projects = database.repository('projects');
const rows = await projects.findMany();
await database.transaction(async (transaction) => {
  await transaction.repository('projects').updateOne({
    filter: { id: 'p1' },
    values: { name: 'Updated' },
  });
  transaction.afterCommit(() => publishProjectChange('p1'));
});
```

## Access and lifetime

Only own entries in the policy map authorize direct repository access. An unlisted collection throws `POLICY_REQUIRED` immediately, before database access. A literal map also restricts collection names at compile time; a dynamically keyed `DatabasePolicyMap<P>` map retains the runtime check. An empty map permits no collection. `DatabasePolicyMap<P, TCollection>` is shared by `restrict()` and `withPolicies()`; the map itself does not determine which connection capabilities are exposed.

Policy factories receive the supplied principal and run once when the restricted database is created. Policies are normalized, detached from mutable inputs, and frozen. Nested transactions reuse these bindings without reevaluating factories. Create a restricted database per request or unit of work; do not share a principal-bound handle as a singleton.

`repository()` returns a `ScopedRepository`. It exposes `narrow()` and `explainPolicy()`, but no `withPolicy()`. Narrowing returns another restricted repository and cannot widen the original permissions. Both the restricted database and repository are frozen facades at runtime; type assertions do not reveal the underlying connection or adapter.

`explainPolicies()` returns detached policy snapshots. Mutating a `Date` obtained from an explanation cannot change the defaults used by the restricted database or its repositories.

The map controls direct repository access. Relation reads and writes still follow the originating repository's policy: authorizing a relation authorizes access through that relation even when its target has no map entry. Use `ref('collection')` in `read.relations` to explicitly reuse another entry's read rules. References resolve within the same map at binding time; missing targets, cycles, and boolean read targets are rejected with `INVALID_POLICY`. Relation writes do not inherit the target collection's policy.

## Transactions and callbacks

`database.transaction()` passes another `RestrictedDatabase` with the same collection keys and policies. Nested calls use the connection's existing savepoint behavior. Take repositories from the callback's restricted database to participate in that transaction; a repository taken from the outer handle still belongs to its original connection.

`afterCommit()` and `afterRollback()` have the same semantics as their connection counterparts. A savepoint commit waits for the outermost commit; rolling back the savepoint drops its commit callbacks. A released savepoint's rollback callbacks run if its enclosing transaction rolls back. Outside a transaction, commit callbacks start immediately and rollback callbacks are ignored. Write through the original restricted database or a new transaction after commit, because the completed transaction cannot accept new work.

Subscribe to repository mutation events through the trusted root connection. A listener can create a restricted database from its supplied connection; its repository writes and savepoints retain event ancestry and recursion limits. Restricted databases expose no subscription method, because listener callbacks receive full connections.

## Record types

```ts
interface Project {
  id: string;
  tenantId: string;
  name: string;
}

const projects = database.repository<Project>('projects');
const rows = await projects.findMany(); // Partial<Project>[]
```

Reads conservatively return `Partial<TRecord>` because a policy may omit fields, including after `narrow()`. Explicit create and update input types remain available through `repository<TRecord, TCreate, TUpdate>()`. This does not change the runtime policy checks.

## Choosing between withPolicies() and restrict()

`connection.withPolicies()` and `ScopedDatabaseConnection` remain supported without deprecation. Use `withPolicies()` to bind policies while retaining full connection capabilities, or `restrict()` to give application code only the restricted operations. `restrict()` creates a `RestrictedDatabase`; a policy node's `scope` still means its row filter.

| Behavior                                     | `withPolicies()`        | `restrict()`                               |
| -------------------------------------------- | ----------------------- | ------------------------------------------ |
| Unlisted direct repository                   | Unbound repository      | `POLICY_REQUIRED`                          |
| Raw `query`, `client`, builder and schema    | Available               | Absent                                     |
| Connection lifecycle and event subscriptions | Available               | Absent                                     |
| Policy-bound repository type                 | `Repository<TRecord>`   | `ScopedRepository<Partial<TRecord>>`       |
| Transaction callback                         | Policy-bound connection | Restricted database with the same policies |
| Policy factories and read references         | Evaluated at binding    | Evaluated at binding                       |

When choosing restricted access, list every collection the service accesses directly and add an explicit policy for each one. Keep schema setup, raw SQL, connection lifecycle, and event registration on the trusted connection. Pass a `RestrictedDatabase` into services that only need the restricted operations; a restricted database does not satisfy `DatabaseConnection` or integrations requiring `client()`, such as the lifecycle repository store's transaction handle.

Existing `withPolicies()` calls need no changes for this release. Custom implementations or complete mocks of the `DatabaseConnection` interface must implement the new required `restrict()` method. Driver packages using the shared Knex connection receive it automatically.
