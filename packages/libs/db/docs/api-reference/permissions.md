# 7. Permissions

[Contents](./README.md) · [Previous: Repository](./repository.md) · [Next: Transactions](./transactions.md)

Permissions bind read/create/update/delete rules to repositories and derived connection handles. This chapter also covers the additional write restrictions accepted by individual mutations.

## Binding and access boundaries

| API                                         | Return and boundary                                                                                               |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `repository.withPolicy(policy)`             | One policy-bound `ScopedRepository`                                                                               |
| `repository.withPolicy(factory, principal)` | Evaluate a principal-dependent policy for one repository                                                          |
| `connection.withPolicies(map, principal)`   | A `ScopedDatabaseConnection`; retains full connection capabilities and allows unlisted repositories               |
| `connection.scope(map, principal)`          | A `DatabaseScope`; rejects unlisted direct repository access and exposes restricted repositories and transactions |
| `scopedRepository.narrow(patch)`            | A derived repository whose policy cannot widen the original                                                       |
| `explainPolicy()` / `explainPolicies()`     | The effective repository policy or collection policy map                                                          |

`withPolicies()` and `ScopedDatabaseConnection` currently carry `@deprecated` annotations in this checkout; both remain callable. The reference reproduces the current declarations. `scope()` is a separate contract, not an equivalent alias. The single-repository `withPolicy()` API is not deprecated.

Policies require read/create/update/delete nodes. A rule object's `scope` constrains rows; `fields` is an allowlist, and omission does not mean every field is allowed. `create.defaults` assigns values, while `create.scope` checks them. `ref()` explicitly reuses another entry's read rules in a policy map. Relation writes are authorized by the originating policy rather than automatically inheriting the target collection's policy.

Principal factories in a bound connection/scope run once when binding occurs. Repositories obtained from a scope can only narrow, expose no `withPolicy()` and use conservative partial record types. A scope's runtime surface is `repository`, `transaction`, `afterCommit`, `afterRollback` and `explainPolicies`. Keep full-connection capabilities in trusted code. See [policy signatures](./signatures/policies.md) and [scope behavior](../database-scope.md) for the complete contract.

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

## Transactions and event boundaries

A scope transaction retains the same policy bindings. See [Transactions](./transactions.md) for propagation and callbacks. A scope has no mutation subscription API; subscriptions belong to the full connection and are covered in [Events](./events.md).

[Contents](./README.md) · [Previous: Repository](./repository.md) · [Next: Transactions](./transactions.md)
