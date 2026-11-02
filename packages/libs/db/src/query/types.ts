export type Row = Record<string, unknown>;
export type SqlBool = boolean;
export type ReferenceExpression = string;
export type OrderDirection = 'asc' | 'desc';

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

export type ComparisonOperator = PortableComparisonOperator;

export type OperandValueExpressionOrList =
  unknown | readonly unknown[] | Expression<unknown> | SubqueryBuilder;

export interface CompiledQuery {
  sql: string;
  parameters: readonly unknown[];
}

export interface InsertResult {
  insertedCount?: number;
  insertId?: unknown;
  rows?: Row[];
}

export interface UpdateResult {
  updatedCount?: number;
  rows?: Row[];
}

export interface DeleteResult {
  deletedCount?: number;
  rows?: Row[];
}

export interface Expression<T = unknown> {
  readonly expressionType?: T;
}

export interface AliasedExpression<
  T = unknown,
  TAlias extends string = string,
> extends Expression<T> {
  readonly alias: TAlias;
}

export interface AggregateExpression<T = unknown> extends Expression<T> {
  as<TAlias extends string>(alias: TAlias): AliasedExpression<T, TAlias>;
  distinct(): AggregateExpression<T>;
}

export type ExpressionFactory<T = SqlBool> = (
  eb: ExpressionBuilder,
) => Expression<T>;

export type ExpressionInput<T = unknown> = Expression<T> | ExpressionFactory<T>;

export interface FunctionModule {
  /** SQL LOWER for portable ASCII case-insensitive matching; Unicode casing follows the database. */
  lower(
    column: ReferenceExpression | Expression<unknown>,
  ): Expression<string | null>;
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

export type SelectionExpression = string | AliasedExpression;
export type SelectionFactory = (
  eb: ExpressionBuilder,
) => readonly SelectionExpression[];
export type JoinCallback = (join: JoinBuilder) => JoinBuilder;

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

export interface InsertQuery<TRecord extends Row = Row> {
  values(data: TRecord | readonly TRecord[]): InsertQuery<TRecord>;
  execute(): Promise<InsertResult>;
  compile(): CompiledQuery;
}

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
