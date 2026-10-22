# Query and expressions: signatures

Compose portable database queries using connection naming rather than Collection-level naming overrides. Execution can inspect resolved numeric field metadata; Repository policies are not applied. Use execute/executeTakeFirst/value/pluck to execute and compile to inspect SQL and bindings.

[Chapter](../query.md) · [Contents](../README.md) · [All exports](../exports.md)

Signatures below are extracted from declaration output. Generic parameters, overloads, optional properties and JSDoc describe the declared contract. Type-only exports cannot be imported as runtime constructors. Supporting contracts are reachable from signatures but are not package-entry exports; do not deep-import them. Private members are omitted; protected hooks are shown only for exported runtime classes.

| Declaration                                                   | Access              |
| ------------------------------------------------------------- | ------------------- |
| [AggregateExpression](#aggregateexpression)                   | Supporting contract |
| [AliasedExpression](#aliasedexpression)                       | Supporting contract |
| [ComparisonOperator](#comparisonoperator)                     | `@nocobase/db` type |
| [CompiledQuery](#compiledquery)                               | Supporting contract |
| [DeleteQuery](#deletequery)                                   | `@nocobase/db` type |
| [DeleteResult](#deleteresult)                                 | Supporting contract |
| [Expression](#expression)                                     | `@nocobase/db` type |
| [ExpressionBuilder](#expressionbuilder)                       | `@nocobase/db` type |
| [ExpressionFactory](#expressionfactory)                       | Supporting contract |
| [ExpressionInput](#expressioninput)                           | Supporting contract |
| [FunctionModule](#functionmodule)                             | Supporting contract |
| [InsertQuery](#insertquery)                                   | `@nocobase/db` type |
| [InsertResult](#insertresult)                                 | Supporting contract |
| [JoinBuilder](#joinbuilder)                                   | Supporting contract |
| [JoinCallback](#joincallback)                                 | Supporting contract |
| [OperandValueExpressionOrList](#operandvalueexpressionorlist) | Supporting contract |
| [OrderDirection](#orderdirection)                             | Supporting contract |
| [PortableComparisonOperator](#portablecomparisonoperator)     | Supporting contract |
| [QueryAdapter](#queryadapter)                                 | `@nocobase/db` type |
| [ReferenceExpression](#referenceexpression)                   | Supporting contract |
| [Row](#row)                                                   | `@nocobase/db` type |
| [SelectQuery](#selectquery)                                   | `@nocobase/db` type |
| [SelectionExpression](#selectionexpression)                   | Supporting contract |
| [SelectionFactory](#selectionfactory)                         | Supporting contract |
| [SqlBool](#sqlbool)                                           | `@nocobase/db` type |
| [SubqueryBuilder](#subquerybuilder)                           | Supporting contract |
| [UpdateQuery](#updatequery)                                   | `@nocobase/db` type |
| [UpdateResult](#updateresult)                                 | Supporting contract |

## AggregateExpression

[Source](../../../src/query/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface AggregateExpression<T = unknown> extends Expression<T> {
  as<TAlias extends string>(alias: TAlias): AliasedExpression<T, TAlias>;
  distinct(): AggregateExpression<T>;
}
```

Related declarations: [AliasedExpression](./query.md#aliasedexpression), [Expression](./query.md#expression).

## AliasedExpression

[Source](../../../src/query/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface AliasedExpression<
  T = unknown,
  TAlias extends string = string,
> extends Expression<T> {
  readonly alias: TAlias;
}
```

Related declarations: [Expression](./query.md#expression).

## ComparisonOperator

[Source](../../../src/query/types.ts)

Import: `import type { ComparisonOperator } from '@nocobase/db'`.

```ts
export type ComparisonOperator = PortableComparisonOperator;
```

Related declarations: [PortableComparisonOperator](./query.md#portablecomparisonoperator).

## CompiledQuery

[Source](../../../src/query/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface CompiledQuery {
  sql: string;
  parameters: readonly unknown[];
}
```

## DeleteQuery

[Source](../../../src/query/types.ts)

Import: `import type { DeleteQuery } from '@nocobase/db'`.

```ts
export interface DeleteQuery<TRecord extends Row = Row> {
  where(
    lhs: ReferenceExpression | Expression<unknown>,
    op: ComparisonOperator,
    rhs: OperandValueExpressionOrList,
  ): DeleteQuery<TRecord>;
  where(expression: Expression<SqlBool>): DeleteQuery<TRecord>;
  where(factory: ExpressionFactory<SqlBool>): DeleteQuery<TRecord>;
  whereRef(
    lhs: ReferenceExpression,
    op: ComparisonOperator,
    rhs: ReferenceExpression,
  ): DeleteQuery<TRecord>;
  clearWhere(): DeleteQuery<TRecord>;
  allowAllRows(): DeleteQuery<TRecord>;
  execute(): Promise<DeleteResult>;
  compile(): CompiledQuery;
}
```

Related declarations: [ComparisonOperator](./query.md#comparisonoperator), [CompiledQuery](./query.md#compiledquery), [DeleteResult](./query.md#deleteresult), [Expression](./query.md#expression), [ExpressionFactory](./query.md#expressionfactory), [OperandValueExpressionOrList](./query.md#operandvalueexpressionorlist), [ReferenceExpression](./query.md#referenceexpression), [Row](./query.md#row), [SqlBool](./query.md#sqlbool).

## DeleteResult

[Source](../../../src/query/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface DeleteResult {
  deletedCount?: number;
  rows?: Row[];
}
```

Related declarations: [Row](./query.md#row).

## Expression

[Source](../../../src/query/types.ts)

Import: `import type { Expression } from '@nocobase/db'`.

```ts
export interface Expression<T = unknown> {
  readonly expressionType?: T;
}
```

## ExpressionBuilder

[Source](../../../src/query/types.ts)

Import: `import type { ExpressionBuilder } from '@nocobase/db'`.

```ts
export interface ExpressionBuilder {
  (
    lhs: ReferenceExpression | Expression<unknown>,
    op: ComparisonOperator,
    rhs: OperandValueExpressionOrList,
  ): Expression<SqlBool>;
  readonly eb: ExpressionBuilder;
  readonly fn: FunctionModule;
  ref(reference: ReferenceExpression): Expression<unknown>;
  val(value: unknown): Expression<unknown>;
  and(
    expressions: readonly ExpressionInput<SqlBool>[] | Record<string, unknown>,
  ): Expression<SqlBool>;
  or(
    expressions: readonly ExpressionInput<SqlBool>[] | Record<string, unknown>,
  ): Expression<SqlBool>;
  not(expression: ExpressionInput<SqlBool>): Expression<SqlBool>;
  between(
    expr: ReferenceExpression | Expression<unknown>,
    start: unknown,
    end: unknown,
  ): Expression<SqlBool>;
  exists(query: SubqueryBuilder): Expression<SqlBool>;
  selectFrom(table: string): SubqueryBuilder;
  parens<T = unknown>(expression: ExpressionInput<T>): Expression<T>;
}
```

Related declarations: [ComparisonOperator](./query.md#comparisonoperator), [Expression](./query.md#expression), [ExpressionInput](./query.md#expressioninput), [FunctionModule](./query.md#functionmodule), [OperandValueExpressionOrList](./query.md#operandvalueexpressionorlist), [ReferenceExpression](./query.md#referenceexpression), [SqlBool](./query.md#sqlbool), [SubqueryBuilder](./query.md#subquerybuilder).

## ExpressionFactory

[Source](../../../src/query/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type ExpressionFactory<T = SqlBool> = (
  eb: ExpressionBuilder,
) => Expression<T>;
```

Related declarations: [Expression](./query.md#expression), [ExpressionBuilder](./query.md#expressionbuilder), [SqlBool](./query.md#sqlbool).

## ExpressionInput

[Source](../../../src/query/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type ExpressionInput<T = unknown> = Expression<T> | ExpressionFactory<T>;
```

Related declarations: [Expression](./query.md#expression), [ExpressionFactory](./query.md#expressionfactory).

## FunctionModule

[Source](../../../src/query/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface FunctionModule {
  count<T = number>(
    column: ReferenceExpression | Expression<unknown>,
  ): AggregateExpression<T>;
  countAll<T = number>(table?: string): AggregateExpression<T>;
  sum<T = string | number | null>(
    column: ReferenceExpression | Expression<unknown>,
  ): AggregateExpression<T>;
  avg<T = string | number | null>(
    column: ReferenceExpression | Expression<unknown>,
  ): AggregateExpression<T>;
  min<T = unknown>(
    column: ReferenceExpression | Expression<unknown>,
  ): AggregateExpression<T>;
  max<T = unknown>(
    column: ReferenceExpression | Expression<unknown>,
  ): AggregateExpression<T>;
}
```

Related declarations: [AggregateExpression](./query.md#aggregateexpression), [Expression](./query.md#expression), [ReferenceExpression](./query.md#referenceexpression).

## InsertQuery

[Source](../../../src/query/types.ts)

Import: `import type { InsertQuery } from '@nocobase/db'`.

```ts
export interface InsertQuery<TRecord extends Row = Row> {
  values(data: TRecord | readonly TRecord[]): InsertQuery<TRecord>;
  execute(): Promise<InsertResult>;
  compile(): CompiledQuery;
}
```

Related declarations: [CompiledQuery](./query.md#compiledquery), [InsertResult](./query.md#insertresult), [Row](./query.md#row).

## InsertResult

[Source](../../../src/query/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface InsertResult {
  insertedCount?: number;
  insertId?: unknown;
  rows?: Row[];
}
```

Related declarations: [Row](./query.md#row).

## JoinBuilder

[Source](../../../src/query/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface JoinBuilder {
  on(
    lhs: ReferenceExpression | Expression<unknown>,
    op: ComparisonOperator,
    rhs: OperandValueExpressionOrList,
  ): JoinBuilder;
  on(expression: Expression<SqlBool>): JoinBuilder;
  on(factory: ExpressionFactory<SqlBool>): JoinBuilder;
  onRef(
    lhs: ReferenceExpression,
    op: ComparisonOperator,
    rhs: ReferenceExpression,
  ): JoinBuilder;
}
```

Related declarations: [ComparisonOperator](./query.md#comparisonoperator), [Expression](./query.md#expression), [ExpressionFactory](./query.md#expressionfactory), [OperandValueExpressionOrList](./query.md#operandvalueexpressionorlist), [ReferenceExpression](./query.md#referenceexpression), [SqlBool](./query.md#sqlbool).

## JoinCallback

[Source](../../../src/query/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type JoinCallback = (join: JoinBuilder) => JoinBuilder;
```

Related declarations: [JoinBuilder](./query.md#joinbuilder).

## OperandValueExpressionOrList

[Source](../../../src/query/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type OperandValueExpressionOrList =
  unknown | readonly unknown[] | Expression<unknown> | SubqueryBuilder;
```

Related declarations: [Expression](./query.md#expression), [SubqueryBuilder](./query.md#subquerybuilder).

## OrderDirection

[Source](../../../src/query/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type OrderDirection = 'asc' | 'desc';
```

## PortableComparisonOperator

[Source](../../../src/query/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type PortableComparisonOperator =
  | '='
  | '!='
  | '<>'
  | '>'
  | '>='
  | '<'
  | '<='
  | 'in'
  | 'not in'
  | 'is'
  | 'is not'
  | 'like'
  | 'not like';
```

## QueryAdapter

[Source](../../../src/query/types.ts)

Import: `import type { QueryAdapter } from '@nocobase/db'`.

```ts
export interface QueryAdapter {
  /**
   * Database-layer query builder.
   * Table sources are connection-relative identifiers and use Connection naming.
   * Collection-level naming overrides are not applied. Execution resolves
   * numeric field types to preserve DECIMAL results before driver conversion.
   */
  selectFrom<TRecord extends Row = Row>(
    table: string,
  ): SelectQuery<TRecord, Row>;
  /**
   * Database-layer insert builder.
   * The table is a connection-relative identifier and uses Connection naming.
   */
  insertInto<TRecord extends Row = Row>(table: string): InsertQuery<TRecord>;
  /**
   * Database-layer update builder.
   * The table is a connection-relative identifier and uses Connection naming.
   */
  updateTable<TRecord extends Row = Row>(table: string): UpdateQuery<TRecord>;
  /**
   * Database-layer delete builder.
   * The table is a connection-relative identifier and uses Connection naming.
   */
  deleteFrom<TRecord extends Row = Row>(table: string): DeleteQuery<TRecord>;
}
```

Related declarations: [DeleteQuery](./query.md#deletequery), [InsertQuery](./query.md#insertquery), [Row](./query.md#row), [SelectQuery](./query.md#selectquery), [UpdateQuery](./query.md#updatequery).

## ReferenceExpression

[Source](../../../src/query/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type ReferenceExpression = string;
```

## Row

[Source](../../../src/query/types.ts)

Import: `import type { Row } from '@nocobase/db'`.

```ts
export type Row = Record<string, unknown>;
```

## SelectQuery

[Source](../../../src/query/types.ts)

Import: `import type { SelectQuery } from '@nocobase/db'`.

```ts
export interface SelectQuery<
  TRecord extends Row = Row,
  TResult extends Row = TRecord,
> {
  select(selection: SelectionExpression): SelectQuery<TRecord, Row>;
  select(selections: readonly SelectionExpression[]): SelectQuery<TRecord, Row>;
  select(factory: SelectionFactory): SelectQuery<TRecord, Row>;
  selectAll(table?: string): SelectQuery<TRecord, Row>;
  distinct(): SelectQuery<TRecord, TResult>;
  where(
    lhs: ReferenceExpression | Expression<unknown>,
    op: ComparisonOperator,
    rhs: OperandValueExpressionOrList,
  ): SelectQuery<TRecord, TResult>;
  where(expression: Expression<SqlBool>): SelectQuery<TRecord, TResult>;
  where(factory: ExpressionFactory<SqlBool>): SelectQuery<TRecord, TResult>;
  whereRef(
    lhs: ReferenceExpression,
    op: ComparisonOperator,
    rhs: ReferenceExpression,
  ): SelectQuery<TRecord, TResult>;
  innerJoin(
    table: string,
    leftRef: ReferenceExpression,
    rightRef: ReferenceExpression,
  ): SelectQuery<TRecord, TResult>;
  innerJoin(
    table: string,
    callback: JoinCallback,
  ): SelectQuery<TRecord, TResult>;
  leftJoin(
    table: string,
    leftRef: ReferenceExpression,
    rightRef: ReferenceExpression,
  ): SelectQuery<TRecord, TResult>;
  leftJoin(
    table: string,
    callback: JoinCallback,
  ): SelectQuery<TRecord, TResult>;
  rightJoin(
    table: string,
    leftRef: ReferenceExpression,
    rightRef: ReferenceExpression,
  ): SelectQuery<TRecord, TResult>;
  rightJoin(
    table: string,
    callback: JoinCallback,
  ): SelectQuery<TRecord, TResult>;
  crossJoin(table: string): SelectQuery<TRecord, TResult>;
  groupBy(column: string): SelectQuery<TRecord, TResult>;
  groupBy(columns: readonly string[]): SelectQuery<TRecord, TResult>;
  having(
    lhs: ReferenceExpression | Expression<unknown>,
    op: ComparisonOperator,
    rhs: OperandValueExpressionOrList,
  ): SelectQuery<TRecord, TResult>;
  having(expression: Expression<SqlBool>): SelectQuery<TRecord, TResult>;
  having(factory: ExpressionFactory<SqlBool>): SelectQuery<TRecord, TResult>;
  havingRef(
    lhs: ReferenceExpression,
    op: ComparisonOperator,
    rhs: ReferenceExpression,
  ): SelectQuery<TRecord, TResult>;
  orderBy(
    column: string,
    direction?: OrderDirection,
  ): SelectQuery<TRecord, TResult>;
  limit(count: number): SelectQuery<TRecord, TResult>;
  offset(count: number): SelectQuery<TRecord, TResult>;
  clearSelect(): SelectQuery<TRecord, Row>;
  clearWhere(): SelectQuery<TRecord, TResult>;
  clearJoins(): SelectQuery<TRecord, TResult>;
  clearGroupBy(): SelectQuery<TRecord, TResult>;
  clearHaving(): SelectQuery<TRecord, TResult>;
  clearOrderBy(): SelectQuery<TRecord, TResult>;
  clearLimit(): SelectQuery<TRecord, TResult>;
  clearOffset(): SelectQuery<TRecord, TResult>;
  execute<T = TResult>(): Promise<T[]>;
  executeTakeFirst<T = TResult>(): Promise<T | undefined>;
  executeTakeFirstOrThrow<T = TResult>(): Promise<T>;
  value<T = unknown>(column: string): Promise<T | undefined>;
  pluck<T = unknown>(column: string): Promise<T[]>;
  exists(): Promise<boolean>;
  compile(): CompiledQuery;
}
```

Related declarations: [ComparisonOperator](./query.md#comparisonoperator), [CompiledQuery](./query.md#compiledquery), [Expression](./query.md#expression), [ExpressionFactory](./query.md#expressionfactory), [JoinCallback](./query.md#joincallback), [OperandValueExpressionOrList](./query.md#operandvalueexpressionorlist), [OrderDirection](./query.md#orderdirection), [ReferenceExpression](./query.md#referenceexpression), [Row](./query.md#row), [SelectionExpression](./query.md#selectionexpression), [SelectionFactory](./query.md#selectionfactory), [SqlBool](./query.md#sqlbool).

## SelectionExpression

[Source](../../../src/query/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type SelectionExpression = string | AliasedExpression;
```

Related declarations: [AliasedExpression](./query.md#aliasedexpression).

## SelectionFactory

[Source](../../../src/query/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type SelectionFactory = (
  eb: ExpressionBuilder,
) => readonly SelectionExpression[];
```

Related declarations: [ExpressionBuilder](./query.md#expressionbuilder), [SelectionExpression](./query.md#selectionexpression).

## SqlBool

[Source](../../../src/query/types.ts)

Import: `import type { SqlBool } from '@nocobase/db'`.

```ts
export type SqlBool = boolean;
```

## SubqueryBuilder

[Source](../../../src/query/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface SubqueryBuilder<TResult extends Row = Row> {
  select(selection: SelectionExpression): SubqueryBuilder<TResult>;
  select(selections: readonly SelectionExpression[]): SubqueryBuilder<TResult>;
  select(factory: SelectionFactory): SubqueryBuilder<TResult>;
  selectAll(table?: string): SubqueryBuilder<TResult>;
  distinct(): SubqueryBuilder<TResult>;
  where(
    lhs: ReferenceExpression | Expression<unknown>,
    op: ComparisonOperator,
    rhs: OperandValueExpressionOrList,
  ): SubqueryBuilder<TResult>;
  where(expression: Expression<SqlBool>): SubqueryBuilder<TResult>;
  where(factory: ExpressionFactory<SqlBool>): SubqueryBuilder<TResult>;
  whereRef(
    lhs: ReferenceExpression,
    op: ComparisonOperator,
    rhs: ReferenceExpression,
  ): SubqueryBuilder<TResult>;
  orderBy(column: string, direction?: OrderDirection): SubqueryBuilder<TResult>;
  limit(count: number): SubqueryBuilder<TResult>;
  offset(count: number): SubqueryBuilder<TResult>;
  as<TAlias extends string>(alias: TAlias): AliasedExpression<TResult, TAlias>;
}
```

Related declarations: [AliasedExpression](./query.md#aliasedexpression), [ComparisonOperator](./query.md#comparisonoperator), [Expression](./query.md#expression), [ExpressionFactory](./query.md#expressionfactory), [OperandValueExpressionOrList](./query.md#operandvalueexpressionorlist), [OrderDirection](./query.md#orderdirection), [ReferenceExpression](./query.md#referenceexpression), [Row](./query.md#row), [SelectionExpression](./query.md#selectionexpression), [SelectionFactory](./query.md#selectionfactory), [SqlBool](./query.md#sqlbool).

## UpdateQuery

[Source](../../../src/query/types.ts)

Import: `import type { UpdateQuery } from '@nocobase/db'`.

```ts
export interface UpdateQuery<TRecord extends Row = Row> {
  set(data: Partial<TRecord>): UpdateQuery<TRecord>;
  where(
    lhs: ReferenceExpression | Expression<unknown>,
    op: ComparisonOperator,
    rhs: OperandValueExpressionOrList,
  ): UpdateQuery<TRecord>;
  where(expression: Expression<SqlBool>): UpdateQuery<TRecord>;
  where(factory: ExpressionFactory<SqlBool>): UpdateQuery<TRecord>;
  whereRef(
    lhs: ReferenceExpression,
    op: ComparisonOperator,
    rhs: ReferenceExpression,
  ): UpdateQuery<TRecord>;
  clearWhere(): UpdateQuery<TRecord>;
  allowAllRows(): UpdateQuery<TRecord>;
  execute(): Promise<UpdateResult>;
  compile(): CompiledQuery;
}
```

Related declarations: [ComparisonOperator](./query.md#comparisonoperator), [CompiledQuery](./query.md#compiledquery), [Expression](./query.md#expression), [ExpressionFactory](./query.md#expressionfactory), [OperandValueExpressionOrList](./query.md#operandvalueexpressionorlist), [ReferenceExpression](./query.md#referenceexpression), [Row](./query.md#row), [SqlBool](./query.md#sqlbool), [UpdateResult](./query.md#updateresult).

## UpdateResult

[Source](../../../src/query/types.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface UpdateResult {
  updatedCount?: number;
  rows?: Row[];
}
```

Related declarations: [Row](./query.md#row).
