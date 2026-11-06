# 6. Repository

[Contents](./README.md) · [Previous: Query](./query.md) · [Next: Permissions](./permissions.md)

Repository operates on logical Collection records and relations. Obtain it from `db.repository(name)` or `connection.repository(name)`.

## Reads, writes and result wrappers

`Repository<TRecord, TCreate, TUpdate>` defaults create/update inputs to `Partial<TRecord>`. Those defaults do not replace runtime schema validation. The [full declaration](./signatures/repository.md#repository) includes selection-builder overloads; the following table describes the ordinary return wrappers.

| Method                                 | Main input                                                                      | Return                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `findMany(options?)`                   | `filter`, `select`, `sort`, `distinct`, cursor/direction, limit/offset, context | `RepositoryQuery<T>`; awaiting yields `T[]`, iteration yields individual `T` records |
| `findOne(options)`                     | `filter` or a nonempty `sort`; optional `select`, `context`                     | `Promise<T \| undefined>`                                                            |
| `count(options?)` / `exists(options?)` | Optional `filter`, `context`                                                    | `Promise<number>` / `Promise<boolean>`                                               |
| `aggregate(options)`                   | Aggregate builder or AST; optional filter/context                               | A promise of aggregate aliases and values                                            |
| `groupBy(options)`                     | Nonempty `by`, aggregate; optional filter/having/sort/context                   | A promise of grouped records                                                         |
| `createOne(options)`                   | `values`; optional select/context/writePolicy/meta                              | `Promise<SingleMutationResult<T>>`                                                   |
| `createMany(options)`                  | Nonempty scalar values array; optional select/context/writePolicy/meta          | Created count, plus selected records when requested                                  |
| `updateOne(options)`                   | `filter`, `values`; optional ifVersion/select/context/writePolicy/meta          | `Promise<SingleMutationResult<T>>`                                                   |
| `updateMany(options)`                  | `values` and either `filter` or `all: true`                                     | Updated count, plus selected records when requested                                  |
| `upsertOne(options)`                   | Unique selector in `filter`, separate `create` and `update` inputs              | `Promise<SingleMutationResult<T>>`                                                   |
| `deleteOne(options)`                   | `filter`; optional ifVersion/select/context/meta                                | `{ deleted: true }`, plus the selected record when requested                         |
| `deleteMany(options)`                  | Either `filter` or `all: true`; optional select/context/meta                    | Deleted count, plus selected records when requested                                  |
| `describeMutation(options)`            | `operation: 'createOne' \| 'updateOne'`                                         | A mutation capability description                                                    |
| `validateMutation(options)`            | Operation-specific selector and values                                          | `{ valid, errors }` without performing the requested mutation                        |

`SingleMutationResult<T>` contains `record`, `createdTargets` and optional `version`. It is not the record itself. `upsertOne()` does not add a `created` flag. Bulk mutation inputs do not accept nested relation writes or per-record `ifVersion`.

`findOne()` selects one row and returns `undefined` when absent; it does not assert uniqueness. Single update/delete operations reject an absent or ambiguous match. `findMany()` is lazy and supports either promise consumption or async iteration; mixing consumption modes or iterating twice fails. Use a transaction-bound query before the transaction finishes. Exact typing of projection callbacks and serialized ASTs differs; a declared `TRecord` is not a guarantee that every property was selected at runtime.

```ts
import type { DatabaseConnection } from '@nocobase/db';

declare const connection: DatabaseConnection;

interface Project {
  id: string;
  name: string;
  tenantId: string;
}

const projects = connection.repository<Project>('projects');
const rows = await projects.findMany({
  filter: { tenantId: 'T1' },
  select: (select) => select.fields('id', 'name'),
  sort: (sort) => sort.field('id').asc(),
  limit: 20,
});

const result = await projects.updateOne({
  filter: { id: 'p1' },
  values: { name: 'Updated' },
});
result.record;
```

See the [method usage pages](../zh-CN/reference/repository-api.md) for examples and runtime errors. No `findFirst`, `findUnique`, `upsertMany` or root `relations` option is declared by this API.

## Input builders and ASTs

The [input reference](./signatures/inputs.md) contains every re-exported input and inference type, including their exact unions and callback signatures.

| Input                                   | Accepted shape and purpose                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `RepositoryFilter`                      | Filter shorthand, callback or `FilterAst`; field/relation conditions and explicit variables                   |
| `RepositorySelect`                      | Select callback or `SelectAst`; fields, relation branches and relation aggregates                             |
| `RepositorySort`                        | Sort callback or `SortAst`; field or relation aggregate ordering                                              |
| `RepositoryCursor`                      | Values on the ordering axis; used with direction and a compatible sort                                        |
| `AggregateBuilder` / `AggregateAst`     | Count/sum/avg/min/max selections and aliases                                                                  |
| `MutationValuesInput` / `ValuesBuilder` | Model-shaped values or synchronous callbacks, including explicit variable/literal expressions                 |
| Relation mutation inputs/builders       | Create/connect and the supported update/disconnect/set/upsert/delete operations, constrained by relation kind |
| `RelationMutationAst`                   | A normalized relation plan type; not a root-level CRUD input option                                           |
| `RepositoryContext`                     | Values used by explicit variable references; not a transaction object or an authorization resolver            |

Builder interfaces are passed to callbacks; importing their types does not construct a builder. Standalone builders exported by the separate `@nocobase/repository-input` package are outside this package's export list unless explicitly re-exported here.

Known typing limitation: a serialized `SelectAst` can select only a subset of fields while read/mutation overloads still expose the complete `TRecord`. Treat the actual projection as authoritative; this inconsistency is tracked in [review finding F4](./release-review.md#f4-serialized-projections-promise-fields-they-do-not-return).

## Relations and nested writes

Selection builders describe relation branches and relation aggregates. Mutation values describe nested creates/connects and update/disconnect/set/upsert/delete operations supported by each relation kind. They use model-shaped input or builder/JSON forms; `RelationMutationAst` describes the normalized plan and is not a root `relations` option.

`createMany()` and `updateMany()` accept scalar inputs rather than nested relation writes. For supported actions, through-record fields and unique target selectors, see [relation mutation examples](../zh-CN/repository/relation-mutations.md) and the [complete input declarations](./signatures/inputs.md).

## Aggregation, pagination and asynchronous iteration

`aggregate()` returns aggregate aliases and values; `groupBy()` combines nonempty grouping fields with aggregate selections. Their callbacks and ASTs have distinct inference types in the input reference.

`findMany()` supports sorting, distinct selection, limit/offset and cursor/direction options. A cursor must match its ordering axis. The returned `RepositoryQuery` supports awaiting or async iteration; mixed consumption and repeated iteration fail. See [pagination](../zh-CN/repository/pagination.md), [distinct](../zh-CN/repository/distinct.md) and [iteration](../zh-CN/repository/methods/stream.md).

## Optimistic locking and mutation validation

A Collection's `OptimisticLockDefinition` configures its version field. Supported single-record mutations accept `ifVersion`; successful create/update/upsert results may include `version`. Bulk inputs do not support a per-record version condition. See the [mutation option signatures](./signatures/repository.md) for which operations accept this field.

`describeMutation()` reports relation mutation capabilities and plan limits. `validateMutation()` returns `{ valid, errors }` without performing the requested mutation. Validation does not replace execution-time checks. See [mutation validation examples](../zh-CN/repository/methods/mutation-validation.md).

## Field capability discovery

`filterOperatorsForFieldType()`, `isSortableFieldType()` and `supportsFilterShorthand()` describe supported field operations. `isManagedField()` and `writableFields()` identify scalar fields available to writers; they do not authorize a caller. Their signatures are in [Values and errors](./signatures/values.md).

## Permissions, transactions and events

Repository option `context` resolves explicit variable references; it is not a transaction object or an authorization resolver. Permission bindings and method-level `writePolicy` are documented in [Permissions](./permissions.md). Use repositories obtained from the callback's connection or scope for [Transactions](./transactions.md). [Events](./events.md) describes mutation subscriptions and their delivery boundaries.

[Contents](./README.md) · [Previous: Query](./query.md) · [Next: Permissions](./permissions.md)
