# 7. Permissions

[Contents](./README.md) · [Previous: Repository](./repository.md) · [Next: Transactions](./transactions.md)

Permissions bind read/create/update/delete rules to repositories and derived connection handles. This chapter also covers the additional write restrictions accepted by individual mutations.

## Binding and access boundaries

| API                                         | Return and boundary                                                                                                    |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `repository.withPolicy(policy)`             | One policy-bound `ScopedRepository`                                                                                    |
| `repository.withPolicy(factory, principal)` | Evaluate a principal-dependent policy for one repository                                                               |
| `connection.withPolicies(map, principal)`   | A `ScopedDatabaseConnection`; retains full connection capabilities and allows unlisted repositories                    |
| `connection.restrict(map, principal)`       | A `RestrictedDatabase`; rejects unlisted direct repository access and exposes restricted repositories and transactions |
| `scopedRepository.narrow(patch)`            | A derived repository whose policy cannot widen the original                                                            |
| `explainPolicy()` / `explainPolicies()`     | The effective repository policy or collection policy map                                                               |

`withPolicy()`, `withPolicies()` and `ScopedDatabaseConnection` remain supported without deprecation. Use `withPolicies()` for policy binding with full connection capabilities, or `restrict()` for a `RestrictedDatabase`. These APIs provide different access boundaries, so adopting `restrict()` requires an explicit policy for every directly accessed collection and keeping raw operations on the trusted connection.

Policies require read/create/update/delete nodes. A rule object's `scope` constrains rows; `fields` is an allowlist, and omission does not mean every field is allowed. `create.defaults` assigns values, while `create.scope` checks them. `ref()` explicitly reuses another entry's read rules in a policy map. Relation writes are authorized by the originating policy rather than automatically inheriting the target collection's policy.

Both methods accept `DatabasePolicyMap<P, TCollection>`. Principal factories run once when binding occurs. Repositories obtained from a restricted database can only narrow, expose no `withPolicy()` and use conservative partial record types. A restricted database's runtime surface is `repository`, `transaction`, `afterCommit`, `afterRollback` and `explainPolicies`. Keep full-connection capabilities in trusted code. See [policy signatures](./signatures/policies.md) and [restricted database behavior](../restricted-database.md) for the complete contract.

Known typing limitations: narrowing a repository initially bound with `read: true` can remove fields while its return type still promises a complete record. `withPolicies().repository()` also retains the unbound `Repository` type: mapped collections can return partial records, and calling the type-visible `withPolicy()` on an already-bound repository throws. These are unresolved contracts described in [review finding F3](./release-review.md#f3-policy-derived-repositories-overstate-their-records-and-methods).

## Building, normalizing and referencing policies

| API                           | Purpose                                                      |
| ----------------------------- | ------------------------------------------------------------ |
| `buildRepositoryPolicy()`     | Build a policy through read/create/update/delete callbacks   |
| `normalizeRepositoryPolicy()` | Normalize policy input into the runtime contract             |
| `narrowRepositoryPolicy()`    | Apply a patch that can only retain or tighten existing rules |
| `ref()`                       | Refer explicitly to another collection's read policy         |
| `expandPolicyRefs()`          | Expand those read references using a policy map              |

Policy construction has dedicated builders for scalar fields, relation shapes, relation operations and through-record fields. See [policy signatures](./signatures/policies.md) for their exact shapes and [policy examples](../zh-CN/repository/policy-quick-start.md) for row scopes and field/relation allowlists.

## Method-level writePolicy

Mutation options can carry a server-side `writePolicy` independently of a bound repository policy. Omitted or `true` adds no write restriction; `false` denies the mutation. Object policies constrain writable fields, relation actions and through-record fields. Bulk methods use the narrower field-only policy contract; `upsertOne()` distinguishes create and update policies.

`buildWritePolicy()` and `buildUpsertWritePolicy()` build these inputs. `writePolicyProblems()` checks a policy against Collection metadata and returns structured problems; it does not execute a write or grant permissions. See [write-policy signatures](./signatures/policies.md#buildwritepolicy), [metadata validation signatures](./signatures/values.md#writepolicyproblems) and [write-policy examples](../zh-CN/repository/write-policy.md).

## Connection-wide write checks

Register `connection.addWriteCheck(check)` when an application needs to deny runtime writes across a connection, including writes from background jobs and to tables created after startup. Register in every process and on each named connection that performs the protected writes. Use the supplied connection's `query` or Repository to read database state. The supplied connection shares the statement's transaction or savepoint, so those reads can see changes made earlier in the same transaction.

```ts
const remove = db.connection().addWriteCheck(async (write, connection) => {
  if (isProtectedTable(write.table) && (await isReadOnly(connection))) {
    throw new Error('This table is read-only');
  }
});
```

Checks run in registration order immediately before each covered statement. Throw or reject to prevent the statement and surface that error to the caller. A bulk statement is checked once, while operations that issue several statements are checked before each one. If a multi-statement operation fails in a caller-owned transaction, let its error escape the transaction callback or use a savepoint to roll back earlier statements. Keep checks read-only and call the returned `remove` function when the registration should end.

Register `afterCommit` and `afterRollback` on the caller's explicit transaction connection outside the check. A connection supplied to a check for an implicit Repository transaction or savepoint can run `afterCommit` immediately and ignore `afterRollback`.

`DatabaseWrite` identifies the connection, physical table without a schema or alias, and operation (`insert`, `update` or `delete`). Repository writes also identify the logical Collection, including the relation target or through Collection when that table is written. QueryAdapter writes and `upsertPhysicalRow()` use the `query` source. Checks follow the root connection into transactions, policy bindings, restricted repositories and mutation listener handles. `compile()` and read APIs do not invoke them.

Migration and seed context handles, schema and metadata management, native client access such as `connection.client()` and raw SQL, and database-side trigger or cascade effects are outside this runtime hook. Use database permissions or database-side enforcement when those paths also need protection. See the [write check signatures](./signatures/connection.md#databasewritecheck).

## Transactions and event boundaries

A restricted database transaction retains the same policy bindings. See [Transactions](./transactions.md) for propagation and callbacks. A restricted database has no mutation subscription API; subscriptions belong to the full connection and are covered in [Events](./events.md).

[Contents](./README.md) · [Previous: Repository](./repository.md) · [Next: Transactions](./transactions.md)
