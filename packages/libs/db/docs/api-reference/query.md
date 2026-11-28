# 5. Query

[Contents](./README.md) · [Previous: Collection and Schema](./collection-and-schema.md) · [Next: Repository](./repository.md)

QueryAdapter composes database queries. Obtain it from `db.query(name?)` or `connection.query`. It uses connection naming; Collection-aware reads and writes are documented in [Repository](./repository.md).

## Query builders and execution

| Surface                   | Methods                                                                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `QueryAdapter`            | `selectFrom`, `insertInto`, `updateTable`, `deleteFrom`                                                                                              |
| `SelectQuery` composition | `select`, `selectAll`, `distinct`, `where`, `whereRef`, inner/left/right/cross joins, `groupBy`, `having`, `havingRef`, `orderBy`, `limit`, `offset` |
| `SelectQuery clearing`    | `clearSelect`, `clearWhere`, `clearJoins`, `clearGroupBy`, `clearHaving`, `clearOrderBy`, `clearLimit`, `clearOffset`                                |
| `SelectQuery` execution   | `execute`, `executeTakeFirst`, `executeTakeFirstOrThrow`, `value`, `pluck`, `exists`, `compile`                                                      |
| `InsertQuery`             | `values`, `execute`, `compile`                                                                                                                       |
| `UpdateQuery`             | `set`, `where`, `whereRef`, `clearWhere`, `allowAllRows`, `execute`, `compile`                                                                       |
| `DeleteQuery`             | `where`, `whereRef`, `clearWhere`, `allowAllRows`, `execute`, `compile`                                                                              |
| `ExpressionBuilder`       | Comparison call signature, `ref`, `val`, `and`, `or`, `not`, `between`, `exists`, `selectFrom`, `parens`, and `fn` aggregates                        |
| `JoinBuilder`             | `on`, `onRef`                                                                                                                                        |
| `SubqueryBuilder`         | `select`, `selectAll`, `distinct`, `where`, `whereRef`, `orderBy`, `limit`, `offset`, `as`                                                           |

## Expressions, joins, subqueries and aggregates

`ExpressionBuilder` supplies comparisons, references, values, Boolean composition and subqueries. `fn` supplies aggregate expressions. Join callbacks receive `JoinBuilder`; subqueries use `SubqueryBuilder` and can be aliased. These supporting contracts are reachable through callbacks without requiring root-exported constructors.

Use the [expression and query signatures](./signatures/query.md) for overloads and the existing [where](../zh-CN/query/where.md), [join](../zh-CN/query/joins.md) and [aggregate](../zh-CN/query/aggregates.md) pages for examples.

## Immutable chains and clearing clauses

Query chains are immutable. Derive queries from an existing chain or use the `clear*()` methods to remove selected clauses. `limit()` and `offset()` belong to database query pagination; Repository cursor pagination has its own contract.

## Compilation, writes and result decoding

`compile()` returns `{ sql, parameters }` without executing or performing the asynchronous metadata work used for some numeric projections. Executing compiled SQL directly through Knex bypasses Query result decoding. Unrestricted updates/deletes require an explicit `allowAllRows()` call.

Execution can inspect resolved numeric field metadata for precision handling. This differs from applying Collection-level naming overrides or Repository policies. Output type arguments such as `execute<MyRow>()` are caller assertions; they do not validate a selected row's shape. The default query result is a general `Row`, and selecting fields does not provide Repository-style projection inference.

Query does not enforce Repository policies, perform relation-aware mutation planning or emit Repository events. Obtain the Query handle from a transaction connection when it must participate in that transaction. See [query signatures](./signatures/query.md), [Transactions](./transactions.md) and [Events](./events.md).

[Contents](./README.md) · [Previous: Collection and Schema](./collection-and-schema.md) · [Next: Repository](./repository.md)
