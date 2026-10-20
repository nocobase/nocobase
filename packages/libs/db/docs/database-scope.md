# Database scopes

Use `connection.scope(policies, principal)` to give application code repository access limited to an explicit policy map. The result is a `DatabaseScope`, with no raw client, query builder, schema management, connection lifecycle, or mutation subscriptions.

```ts
const scope = connection.scope(
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

const projects = scope.repository('projects');
const rows = await projects.findMany();
await scope.transaction(async (transaction) => {
  await transaction.repository('projects').updateOne({
    filter: { id: 'p1' },
    values: { name: 'Updated' },
  });
  transaction.afterCommit(() => publishProjectChange('p1'));
});
```

## Access and lifetime

Only own entries in the policy map authorize direct repository access. An unlisted collection throws `POLICY_REQUIRED` immediately, before database access. A literal map also restricts collection names at compile time; a dynamically keyed `DatabaseScopePolicies<P>` map retains the runtime check. An empty map permits no collection.

Policy factories receive the supplied principal and run once when the scope is created. Policies are normalized, detached from mutable inputs, and frozen. Nested transactions reuse these bindings without reevaluating factories. Create a scope per request or unit of work; do not share a principal-bound scope as a singleton.

`repository()` returns a `ScopedRepository`. It exposes `narrow()` and `explainPolicy()`, but no `withPolicy()`. Narrowing returns another restricted repository and cannot widen the original permissions. Both the scope and repository are frozen facades at runtime; type assertions do not reveal the underlying connection or adapter.

`explainPolicies()` returns detached policy snapshots. Mutating a `Date` obtained from an explanation cannot change the defaults used by the scope or its repositories.

The map controls direct repository access. Relation reads and writes still follow the originating repository's policy: authorizing a relation authorizes access through that relation even when its target has no map entry. Use `ref('collection')` in `read.relations` to explicitly reuse another entry's read rules. References resolve within the same map at binding time; missing targets, cycles, and boolean read targets are rejected with `INVALID_POLICY`. Relation writes do not inherit the target collection's policy.

## Transactions and callbacks

`scope.transaction()` passes another `DatabaseScope` with the same collection keys and policies. Nested calls use the connection's existing savepoint behavior. Take repositories from the callback's scope to participate in that transaction; a repository taken from the outer scope still belongs to its original connection.

`afterCommit()` and `afterRollback()` have the same semantics as their connection counterparts. A savepoint commit waits for the outermost commit; rolling back the savepoint drops its commit callbacks. A released savepoint's rollback callbacks run if its enclosing transaction rolls back. Outside a transaction, commit callbacks start immediately and rollback callbacks are ignored. Write through the original scope or a new transaction after commit, because the completed transaction cannot accept new work.

Subscribe to repository mutation events through the trusted root connection. A listener can create a scope from its supplied connection; its repository writes and savepoints retain event ancestry and recursion limits. Scopes intentionally expose no subscription method, because listener callbacks receive full connections.

## Record types

```ts
interface Project {
  id: string;
  tenantId: string;
  name: string;
}

const projects = scope.repository<Project>('projects');
const rows = await projects.findMany(); // Partial<Project>[]
```

Reads conservatively return `Partial<TRecord>` because a policy may omit fields, including after `narrow()`. Explicit create and update input types remain available through `repository<TRecord, TCreate, TUpdate>()`. This does not change the runtime policy checks.

## Migrating from withPolicies()

`connection.withPolicies()` and `ScopedDatabaseConnection` are deprecated but remain available with their existing behavior. They are not aliases for `scope()`.

| Behavior                                     | `withPolicies()`         | `scope()`                               |
| -------------------------------------------- | ------------------------ | --------------------------------------- |
| Unlisted direct repository                   | Unbound repository       | `POLICY_REQUIRED`                       |
| Raw `query`, `client`, builder and schema    | Available                | Absent                                  |
| Connection lifecycle and event subscriptions | Available                | Absent                                  |
| Policy-bound repository type                 | `Repository<TRecord>`    | `ScopedRepository<Partial<TRecord>>`    |
| Transaction callback                         | Legacy scoped connection | Restricted scope with the same policies |
| Policy factories and read references         | Evaluated at binding     | Evaluated at binding                    |

Before replacing a call, list every collection the service accesses directly and add an explicit policy for each one. Keep schema setup, raw SQL, connection lifecycle, and event registration on the trusted connection. Pass a `DatabaseScope` into services that only need the restricted operations; a scope does not satisfy `DatabaseConnection` or integrations requiring `client()`, such as the lifecycle repository store's transaction handle.

Existing `withPolicies()` calls need no changes for this release. Custom implementations or complete mocks of the `DatabaseConnection` interface must implement the new required `scope()` method. Driver packages using the shared Knex connection receive it automatically.
