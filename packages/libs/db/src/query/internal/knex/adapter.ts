import { decimalString } from '../../../numeric/decimal.js';
import type {
  CollectionDefinition,
  FieldDefinition,
} from '../../../collection/types.js';
import {
  aggregateSql,
  aggregateProjection,
  hasNativeNumericResults,
  decodeAggregate,
} from '../../../numeric/aggregate.js';

import type { Knex } from 'knex';

import type { NamingStrategy } from '../../../naming/strategy.js';
import {
  getDatabaseDriverRuntime,
  type DatabaseDriverRuntime,
} from '../../../database/runtime.js';
import {
  decodeJsonValue,
  encodeJsonValue,
  type JsonValue,
} from '../../../json.js';
import {
  decodeBooleanValue,
  normalizeBooleanValue,
} from '../../../repository/boolean.js';
import {
  isTemporalType,
  normalizeTemporalValue,
  normalizeTemporalResultValue,
} from '../../../repository/temporal.js';
import { temporalProjection } from '../../../repository/internal/temporal-sql.js';
import { RepositoryError } from '../../../repository/errors.js';
import type {
  AggregateExpression,
  AliasedExpression,
  ComparisonOperator,
  CompiledQuery,
  DeleteQuery,
  DeleteResult,
  Expression,
  ExpressionBuilder,
  ExpressionFactory,
  ExpressionInput,
  FunctionModule,
  InsertQuery,
  InsertResult,
  JoinBuilder,
  JoinCallback,
  OperandValueExpressionOrList,
  OrderDirection,
  QueryAdapter,
  ReferenceExpression,
  Row,
  SelectQuery,
  SelectionExpression,
  SelectionFactory,
  SqlBool,
  SubqueryBuilder,
  UpdateQuery,
  UpdateResult,
} from '../../types.js';

type CollectionLookup = (
  name: string,
) => Promise<CollectionDefinition | undefined>;
const emptyStringSet: ReadonlySet<string> = new Set();

export class KnexQueryAdapter implements QueryAdapter {
  constructor(
    private readonly getClient: () => Knex,
    private readonly naming: NamingStrategy,
    private readonly lookup: CollectionLookup | undefined = undefined,
    readonly runtime: DatabaseDriverRuntime | undefined = undefined,
  ) {}

  selectFrom<TRecord extends Row = Row>(
    table: string,
  ): SelectQuery<TRecord, Row> {
    return new KnexSelectQuery<TRecord>(
      this.getClient,
      this.naming,
      table,
      emptySelectState(),
      this.lookup,
    );
  }

  insertInto<TRecord extends Row = Row>(table: string): InsertQuery<TRecord> {
    return new KnexInsertQuery<TRecord>(
      this.getClient,
      this.naming,
      table,
      undefined,
      this.lookup,
    );
  }

  updateTable<TRecord extends Row = Row>(table: string): UpdateQuery<TRecord> {
    return new KnexUpdateQuery<TRecord>(
      this.getClient,
      this.naming,
      table,
      undefined,
      emptyMutationState(),
      this.lookup,
    );
  }

  deleteFrom<TRecord extends Row = Row>(table: string): DeleteQuery<TRecord> {
    return new KnexDeleteQuery<TRecord>(
      this.getClient,
      this.naming,
      table,
      emptyMutationState(),
      this.lookup,
    );
  }
}

type SelectItem =
  | { type: 'selection'; selection: SelectionExpression }
  | { type: 'all'; table?: string };

interface OrderByItem {
  column: string;
  direction: OrderDirection;
}

interface JoinItem {
  type: 'inner' | 'left' | 'right' | 'cross';
  table: string;
  conditions: ExpressionNode[];
}

interface SelectState {
  selections: SelectItem[];
  distinct: boolean;
  joins: JoinItem[];
  where: ExpressionNode[];
  groupBy: string[];
  having: ExpressionNode[];
  orderBy: OrderByItem[];
  limit?: number;
  offset?: number;
}

interface MutationState {
  where: ExpressionNode[];
  allowAllRows: boolean;
}

const emptySelectState = (): SelectState => ({
  selections: [],
  distinct: false,
  joins: [],
  where: [],
  groupBy: [],
  having: [],
  orderBy: [],
});

const emptyMutationState = (): MutationState => ({
  where: [],
  allowAllRows: false,
});

class KnexSelectQuery<
  TRecord extends Row = Row,
  TResult extends Row = TRecord,
> implements SelectQuery<TRecord, TResult> {
  constructor(
    private readonly getClient: () => Knex,
    private readonly naming: NamingStrategy,
    private readonly tableName: string,
    private readonly state: SelectState = emptySelectState(),
    private readonly lookup: CollectionLookup | undefined = undefined,
  ) {}

  select(
    input:
      SelectionExpression | readonly SelectionExpression[] | SelectionFactory,
  ): SelectQuery<TRecord, Row> {
    return this.clone<Row>({
      selections: [
        ...this.state.selections,
        ...normalizeSelectionInput(input, this.createExpressionBuilder()).map(
          (selection) => ({
            type: 'selection' as const,
            selection,
          }),
        ),
      ],
    });
  }

  selectAll(table?: string): SelectQuery<TRecord, Row> {
    return this.clone<Row>({
      selections: [...this.state.selections, { type: 'all', table }],
    });
  }

  distinct(): SelectQuery<TRecord, TResult> {
    return this.clone({ distinct: true });
  }

  where(
    lhsOrExpression:
      ReferenceExpression | Expression<unknown> | ExpressionFactory<SqlBool>,
    op?: ComparisonOperator,
    rhs?: OperandValueExpressionOrList,
  ): SelectQuery<TRecord, TResult> {
    return this.clone({
      where: [
        ...this.state.where,
        resolveConditionArguments(
          arguments,
          lhsOrExpression,
          op,
          rhs,
          this.createExpressionBuilder(),
        ),
      ],
    });
  }

  whereRef(
    lhs: ReferenceExpression,
    op: ComparisonOperator,
    rhs: ReferenceExpression,
  ): SelectQuery<TRecord, TResult> {
    return this.clone({
      where: [
        ...this.state.where,
        binaryExpressionNode(
          lhs,
          op,
          createExpression({ type: 'ref', reference: rhs }),
        ),
      ],
    });
  }

  innerJoin(
    table: string,
    leftRefOrCallback: ReferenceExpression | JoinCallback,
    rightRef?: ReferenceExpression,
  ): SelectQuery<TRecord, TResult> {
    return this.join('inner', table, leftRefOrCallback, rightRef);
  }

  leftJoin(
    table: string,
    leftRefOrCallback: ReferenceExpression | JoinCallback,
    rightRef?: ReferenceExpression,
  ): SelectQuery<TRecord, TResult> {
    return this.join('left', table, leftRefOrCallback, rightRef);
  }

  rightJoin(
    table: string,
    leftRefOrCallback: ReferenceExpression | JoinCallback,
    rightRef?: ReferenceExpression,
  ): SelectQuery<TRecord, TResult> {
    return this.join('right', table, leftRefOrCallback, rightRef);
  }

  crossJoin(table: string): SelectQuery<TRecord, TResult> {
    return this.clone({
      joins: [...this.state.joins, { type: 'cross', table, conditions: [] }],
    });
  }

  groupBy(input: string | readonly string[]): SelectQuery<TRecord, TResult> {
    return this.clone({
      groupBy: [...this.state.groupBy, ...normalizeStringList(input)],
    });
  }

  having(
    lhsOrExpression:
      ReferenceExpression | Expression<unknown> | ExpressionFactory<SqlBool>,
    op?: ComparisonOperator,
    rhs?: OperandValueExpressionOrList,
  ): SelectQuery<TRecord, TResult> {
    return this.clone({
      having: [
        ...this.state.having,
        resolveConditionArguments(
          arguments,
          lhsOrExpression,
          op,
          rhs,
          this.createExpressionBuilder(),
        ),
      ],
    });
  }

  havingRef(
    lhs: ReferenceExpression,
    op: ComparisonOperator,
    rhs: ReferenceExpression,
  ): SelectQuery<TRecord, TResult> {
    return this.clone({
      having: [
        ...this.state.having,
        binaryExpressionNode(
          lhs,
          op,
          createExpression({ type: 'ref', reference: rhs }),
        ),
      ],
    });
  }

  orderBy(
    column: string,
    direction: OrderDirection = 'asc',
  ): SelectQuery<TRecord, TResult> {
    return this.clone({
      orderBy: [...this.state.orderBy, { column, direction }],
    });
  }

  limit(count: number): SelectQuery<TRecord, TResult> {
    return this.clone({ limit: count });
  }

  offset(count: number): SelectQuery<TRecord, TResult> {
    return this.clone({ offset: count });
  }

  clearSelect(): SelectQuery<TRecord, Row> {
    return this.clone<Row>({ selections: [] });
  }

  clearWhere(): SelectQuery<TRecord, TResult> {
    return this.clone({ where: [] });
  }

  clearJoins(): SelectQuery<TRecord, TResult> {
    return this.clone({ joins: [] });
  }

  clearGroupBy(): SelectQuery<TRecord, TResult> {
    return this.clone({ groupBy: [] });
  }

  clearHaving(): SelectQuery<TRecord, TResult> {
    return this.clone({ having: [] });
  }

  clearOrderBy(): SelectQuery<TRecord, TResult> {
    return this.clone({ orderBy: [] });
  }

  clearLimit(): SelectQuery<TRecord, TResult> {
    return this.clone({ limit: undefined });
  }

  clearOffset(): SelectQuery<TRecord, TResult> {
    return this.clone({ offset: undefined });
  }

  async execute<T = TResult>(): Promise<T[]> {
    const lookup = memoizedCollectionLookup(this.lookup);
    const numericLookup = hasNativeNumericResults(this.getClient())
      ? undefined
      : lookup;
    const selections = await prepareDecimalSelections(
      this.state.selections,
      [this.tableName, ...this.state.joins.map((join) => join.table)],
      numericLookup,
    );
    const numericCollections = lookup
      ? await collectNumericCollections(this.state, this.tableName, lookup)
      : undefined;
    const { query, resultMap } = this.buildSelectQuery(
      selections,
      numericCollections,
    );
    const decode = await prepareAggregateDecoder(
      selections,
      [this.tableName, ...this.state.joins.map((join) => join.table)],
      numericLookup,
    );
    const rows = await query;
    return normalizeRows(rows).map((row) =>
      decode(mapResultRow(row, resultMap, this.naming)),
    ) as T[];
  }

  async executeTakeFirst<T = TResult>(): Promise<T | undefined> {
    const lookup = memoizedCollectionLookup(this.lookup);
    const numericLookup = hasNativeNumericResults(this.getClient())
      ? undefined
      : lookup;
    const selections = await prepareDecimalSelections(
      this.state.selections,
      [this.tableName, ...this.state.joins.map((join) => join.table)],
      numericLookup,
    );
    const numericCollections = lookup
      ? await collectNumericCollections(this.state, this.tableName, lookup)
      : undefined;
    const { query, resultMap } = this.buildSelectQuery(
      selections,
      numericCollections,
    );
    const decode = await prepareAggregateDecoder(
      selections,
      [this.tableName, ...this.state.joins.map((join) => join.table)],
      numericLookup,
    );
    const row = await query.first();
    return row === undefined
      ? undefined
      : (decode(mapResultRow(row as Row, resultMap, this.naming)) as T);
  }

  async executeTakeFirstOrThrow<T = TResult>(): Promise<T> {
    const row = await this.executeTakeFirst<T>();
    if (row === undefined) {
      throw new Error('No row found.');
    }
    return row;
  }

  async value<T = unknown>(column: string): Promise<T | undefined> {
    const row = await this.clearSelect().select(column).executeTakeFirst<Row>();
    return row?.[logicalResultKeyForSelection(column)] as T | undefined;
  }

  async pluck<T = unknown>(column: string): Promise<T[]> {
    const rows = await this.clearSelect().select(column).execute<Row>();
    const key = logicalResultKeyForSelection(column);
    return rows.map((row) => row[key] as T);
  }

  async exists(): Promise<boolean> {
    const client = this.getClient();
    const tableScope = this.createTableScope();
    const query = this.buildFilteredQuery(client, tableScope)
      .select(client.raw('1 as value'))
      .limit(1);
    const row = await query.first();
    return row !== undefined;
  }

  compile(): CompiledQuery {
    const compiled = this.buildSelectQuery().query.toSQL();
    return {
      sql: compiled.sql,
      parameters: compiled.bindings ?? [],
    };
  }

  private join(
    type: JoinItem['type'],
    table: string,
    leftRefOrCallback: ReferenceExpression | JoinCallback,
    rightRef?: ReferenceExpression,
  ): SelectQuery<TRecord, TResult> {
    const conditions =
      typeof leftRefOrCallback === 'function'
        ? (
            leftRefOrCallback(
              new KnexJoinBuilder(this.createExpressionBuilder()),
            ) as KnexJoinBuilder
          ).conditions
        : [
            binaryExpressionNode(
              leftRefOrCallback,
              '=',
              createExpression({
                type: 'ref',
                reference: assertRightJoinReference(rightRef),
              }),
            ),
          ];

    return this.clone({
      joins: [...this.state.joins, { type, table, conditions }],
    });
  }

  private clone<TNextResult extends Row = TResult>(
    patch: Partial<SelectState>,
  ): KnexSelectQuery<TRecord, TNextResult> {
    return new KnexSelectQuery<TRecord, TNextResult>(
      this.getClient,
      this.naming,
      this.tableName,
      {
        selections: patch.selections ?? this.state.selections,
        distinct: patch.distinct ?? this.state.distinct,
        joins: patch.joins ?? this.state.joins,
        where: patch.where ?? this.state.where,
        groupBy: patch.groupBy ?? this.state.groupBy,
        having: patch.having ?? this.state.having,
        orderBy: patch.orderBy ?? this.state.orderBy,
        limit: Object.prototype.hasOwnProperty.call(patch, 'limit')
          ? patch.limit
          : this.state.limit,
        offset: Object.prototype.hasOwnProperty.call(patch, 'offset')
          ? patch.offset
          : this.state.offset,
      },
      this.lookup,
    );
  }

  private buildSelectQuery(
    selections = this.state.selections,
    numericCollections?: ReadonlyMap<string, CollectionDefinition>,
  ): {
    query: Knex.QueryBuilder;
    resultMap: ResultMap;
  } {
    this.assertPortablePagination();

    const client = this.getClient();
    const tableScope: TableScope = {
      ...this.createTableScope(),
      numericCollections,
      aggregates: selectionAggregates(this.state.selections),
    };
    const query = this.buildFilteredQuery(client, tableScope);
    const resultMap = applySelections(query, selections, {
      client,
      naming: this.naming,
      getClient: this.getClient,
      clause: 'where',
      tableScope,
    });

    const configureAggregateResults =
      getDatabaseDriverRuntime(client)?.query?.configureAggregateResults;
    if (configureAggregateResults) {
      const aliases = new Set(
        this.state.selections.flatMap((item) => {
          if (item.type !== 'selection' || typeof item.selection === 'string')
            return [];
          const node = getExpressionNode(item.selection);
          return node.type === 'aliasedExpression' &&
            (node.expression.type === 'aggregate' ||
              (node.expression.type === 'subquery' &&
                node.expression.query.aggregateResult()))
            ? [mapIdentifier(node.alias, this.naming)]
            : [];
        }),
      );
      configureAggregateResults({ query, aliases });
    }
    if (this.state.distinct) {
      query.distinct();
    }
    for (const column of this.state.groupBy) {
      query.groupBy(mapReference(column, this.naming, tableScope));
    }
    for (const expression of this.state.having) {
      applyExpressionNode(query, expression, {
        client,
        naming: this.naming,
        getClient: this.getClient,
        clause: 'having',
        tableScope,
      });
    }
    for (const item of this.state.orderBy) {
      const aggregate = this.state.selections.find(
        (entry) =>
          entry.type === 'selection' &&
          typeof entry.selection !== 'string' &&
          'alias' in entry.selection &&
          entry.selection.alias === item.column,
      );
      let ordering: string | Knex.Raw = mapReference(
        item.column,
        this.naming,
        tableScope,
      );
      if (
        aggregate?.type === 'selection' &&
        typeof aggregate.selection !== 'string'
      ) {
        const node = getExpressionNode(aggregate.selection);
        if (
          node.type === 'aliasedExpression' &&
          node.expression.type === 'aggregate'
        ) {
          ordering = aggregateNodeToRaw(
            {
              client,
              naming: this.naming,
              getClient: this.getClient,
              clause: 'having',
              tableScope,
            },
            node.expression,
          );
          const wrapAggregateOrdering =
            getDatabaseDriverRuntime(client)?.query?.wrapAggregateOrdering;
          if (wrapAggregateOrdering && typeof ordering !== 'string') {
            ordering = wrapAggregateOrdering({
              client,
              ordering,
              functionName: node.expression.fn,
            });
          }
        }
      }
      const decimalSelection = selections.find(
        (entry) =>
          entry.type === 'selection' &&
          typeof entry.selection !== 'string' &&
          entry.selection.alias === item.column,
      );
      if (
        decimalSelection?.type === 'selection' &&
        typeof decimalSelection.selection !== 'string'
      ) {
        const node = getExpressionNode(decimalSelection.selection);
        if (
          node.type === 'aliasedExpression' &&
          node.expression.type === 'decimalResult'
        )
          ordering = expressionNodeToRaw(
            {
              client,
              naming: this.naming,
              getClient: this.getClient,
              clause: 'having',
              tableScope,
            },
            node.expression.expression,
          );
      }
      if (this.state.distinct && decimalSelection) {
        // DISTINCT requires the numeric ORDER BY expression in SELECT too.
        // This is determined by an existing result value, so it does not
        // change distinctness; remove the helper before returning records.
        const hidden = (resultMap.hidden ??= new Set<string>());
        let alias = `__nb_decimal_order_${hidden.size}`;
        while (resultMap.explicit.has(alias) || hidden.has(alias)) alias += '_';
        hidden.add(alias);
        query.select(client.raw('? as ??', [ordering, alias]));
      }
      query.orderBy(ordering, item.direction);
    }
    if (this.state.limit !== undefined) {
      query.limit(this.state.limit);
    }
    if (this.state.offset !== undefined) {
      query.offset(this.state.offset);
    }
    return { query, resultMap };
  }

  private buildFilteredQuery(
    client: Knex,
    tableScope: TableScope,
  ): Knex.QueryBuilder {
    const query = client(mapTableSourceExpression(this.tableName, this.naming));
    for (const join of this.state.joins) {
      applyJoin(query, join, {
        client,
        naming: this.naming,
        getClient: this.getClient,
        clause: 'where',
        tableScope,
      });
    }
    for (const expression of this.state.where) {
      applyExpressionNode(query, expression, {
        client,
        naming: this.naming,
        getClient: this.getClient,
        clause: 'where',
        tableScope,
      });
    }
    return query;
  }

  private createExpressionBuilder(): ExpressionBuilder {
    return createExpressionBuilder(this.getClient, this.naming);
  }

  private createTableScope(): TableScope {
    return createTableScope(
      [this.tableName, ...this.state.joins.map((join) => join.table)],
      this.naming,
    );
  }

  private assertPortablePagination(): void {
    if (this.state.offset !== undefined && this.state.orderBy.length === 0) {
      throw new Error('offset() requires orderBy() for portable pagination.');
    }
  }
}

class KnexInsertQuery<
  TRecord extends Row = Row,
> implements InsertQuery<TRecord> {
  constructor(
    private readonly getClient: () => Knex,
    private readonly naming: NamingStrategy,
    private readonly tableName: string,
    private readonly data?: TRecord | readonly TRecord[],
    private readonly lookup?: CollectionLookup,
  ) {}

  values(data: TRecord | readonly TRecord[]): InsertQuery<TRecord> {
    return new KnexInsertQuery(
      this.getClient,
      this.naming,
      this.tableName,
      data,
      this.lookup,
    );
  }

  async execute(): Promise<InsertResult> {
    const data = this.requireValues();
    const collection = await this.lookup?.(
      parseAliasedIdentifier(this.tableName).identifier,
    );
    const fields = writeFieldsOf(collection);
    const fallback =
      Array.isArray(data) &&
      collection &&
      getDatabaseDriverRuntime(this.getClient())?.query?.insertManyFallback?.(
        collection,
      );
    if (fallback) {
      for (const item of data) await this.buildQuery(item, fields);
      return { insertedCount: data.length };
    }
    const result = await this.buildQuery(data, fields);
    return normalizeInsertResult(result, data);
  }

  compile(): CompiledQuery {
    const compiled = this.buildQuery(this.requireValues()).toSQL();
    return {
      sql: compiled.sql,
      parameters: compiled.bindings ?? [],
    };
  }

  private buildQuery(
    data: TRecord | readonly TRecord[],
    fields: WriteFields = emptyWriteFields,
  ): Knex.QueryBuilder {
    return this.getClient()(
      mapTableSourceExpression(this.tableName, this.naming),
    ).insert(mapData(data, this.naming, fields, this.getClient()) as any);
  }

  private requireValues(): TRecord | readonly TRecord[] {
    if (this.data === undefined) {
      throw new Error('insertInto().values() is required before execute().');
    }
    return this.data;
  }
}

class KnexUpdateQuery<
  TRecord extends Row = Row,
> implements UpdateQuery<TRecord> {
  constructor(
    private readonly getClient: () => Knex,
    private readonly naming: NamingStrategy,
    private readonly tableName: string,
    private readonly data?: Partial<TRecord>,
    private readonly state: MutationState = emptyMutationState(),
    private readonly lookup?: CollectionLookup,
  ) {}

  set(data: Partial<TRecord>): UpdateQuery<TRecord> {
    return new KnexUpdateQuery(
      this.getClient,
      this.naming,
      this.tableName,
      data,
      this.state,
      this.lookup,
    );
  }

  where(
    lhsOrExpression:
      ReferenceExpression | Expression<unknown> | ExpressionFactory<SqlBool>,
    op?: ComparisonOperator,
    rhs?: OperandValueExpressionOrList,
  ): UpdateQuery<TRecord> {
    return this.clone({
      where: [
        ...this.state.where,
        resolveConditionArguments(
          arguments,
          lhsOrExpression,
          op,
          rhs,
          this.createExpressionBuilder(),
        ),
      ],
    });
  }

  whereRef(
    lhs: ReferenceExpression,
    op: ComparisonOperator,
    rhs: ReferenceExpression,
  ): UpdateQuery<TRecord> {
    return this.clone({
      where: [
        ...this.state.where,
        binaryExpressionNode(
          lhs,
          op,
          createExpression({ type: 'ref', reference: rhs }),
        ),
      ],
    });
  }

  clearWhere(): UpdateQuery<TRecord> {
    return this.clone({ where: [] });
  }

  allowAllRows(): UpdateQuery<TRecord> {
    return this.clone({ allowAllRows: true });
  }

  async execute(): Promise<UpdateResult> {
    const collection = await mutationCollection(this.lookup, this.tableName);
    const result = await this.buildQuery(
      writeFieldsOf(collection?.definition),
      collection?.scope,
    );
    return normalizeUpdateResult(result);
  }

  compile(): CompiledQuery {
    const compiled = this.buildQuery().toSQL();
    return {
      sql: compiled.sql,
      parameters: compiled.bindings ?? [],
    };
  }

  private clone(patch: Partial<MutationState>): KnexUpdateQuery<TRecord> {
    return new KnexUpdateQuery(
      this.getClient,
      this.naming,
      this.tableName,
      this.data,
      {
        where: patch.where ?? this.state.where,
        allowAllRows: patch.allowAllRows ?? this.state.allowAllRows,
      },
      this.lookup,
    );
  }

  private buildQuery(
    fields: WriteFields = emptyWriteFields,
    collections?: ReadonlyMap<string, CollectionDefinition>,
  ): Knex.QueryBuilder {
    const client = this.getClient();
    const tableScope: TableScope = {
      ...createTableScope([this.tableName], this.naming),
      numericCollections: collections,
    };
    const data = this.requireSetData();
    this.assertWhereSafety('updateTable().execute()');
    const query = client(
      mapTableSourceExpression(this.tableName, this.naming),
    ).update(mapData(data, this.naming, fields, this.getClient()) as any);
    applyWhereExpressions(query, this.state.where, {
      client,
      naming: this.naming,
      getClient: this.getClient,
      clause: 'where',
      tableScope,
    });
    return query;
  }

  private requireSetData(): Partial<TRecord> {
    if (this.data === undefined) {
      throw new Error('updateTable().set() is required before execute().');
    }
    return this.data;
  }

  private assertWhereSafety(method: string): void {
    if (!this.state.allowAllRows && this.state.where.length === 0) {
      throw new Error(`${method} requires where() or allowAllRows().`);
    }
  }

  private createExpressionBuilder(): ExpressionBuilder {
    return createExpressionBuilder(this.getClient, this.naming);
  }
}

class KnexDeleteQuery<
  TRecord extends Row = Row,
> implements DeleteQuery<TRecord> {
  constructor(
    private readonly getClient: () => Knex,
    private readonly naming: NamingStrategy,
    private readonly tableName: string,
    private readonly state: MutationState = emptyMutationState(),
    private readonly lookup?: CollectionLookup,
  ) {}

  where(
    lhsOrExpression:
      ReferenceExpression | Expression<unknown> | ExpressionFactory<SqlBool>,
    op?: ComparisonOperator,
    rhs?: OperandValueExpressionOrList,
  ): DeleteQuery<TRecord> {
    return this.clone({
      where: [
        ...this.state.where,
        resolveConditionArguments(
          arguments,
          lhsOrExpression,
          op,
          rhs,
          this.createExpressionBuilder(),
        ),
      ],
    });
  }

  whereRef(
    lhs: ReferenceExpression,
    op: ComparisonOperator,
    rhs: ReferenceExpression,
  ): DeleteQuery<TRecord> {
    return this.clone({
      where: [
        ...this.state.where,
        binaryExpressionNode(
          lhs,
          op,
          createExpression({ type: 'ref', reference: rhs }),
        ),
      ],
    });
  }

  clearWhere(): DeleteQuery<TRecord> {
    return this.clone({ where: [] });
  }

  allowAllRows(): DeleteQuery<TRecord> {
    return this.clone({ allowAllRows: true });
  }

  async execute(): Promise<DeleteResult> {
    const collection = await mutationCollection(this.lookup, this.tableName);
    const result = await this.buildQuery(collection?.scope);
    return normalizeDeleteResult(result);
  }

  compile(): CompiledQuery {
    const compiled = this.buildQuery().toSQL();
    return {
      sql: compiled.sql,
      parameters: compiled.bindings ?? [],
    };
  }

  private clone(patch: Partial<MutationState>): KnexDeleteQuery<TRecord> {
    return new KnexDeleteQuery(
      this.getClient,
      this.naming,
      this.tableName,
      {
        where: patch.where ?? this.state.where,
        allowAllRows: patch.allowAllRows ?? this.state.allowAllRows,
      },
      this.lookup,
    );
  }

  private buildQuery(
    collections?: ReadonlyMap<string, CollectionDefinition>,
  ): Knex.QueryBuilder {
    const client = this.getClient();
    const tableScope: TableScope = {
      ...createTableScope([this.tableName], this.naming),
      numericCollections: collections,
    };
    this.assertWhereSafety('deleteFrom().execute()');
    const query = client(
      mapTableSourceExpression(this.tableName, this.naming),
    ).delete();
    applyWhereExpressions(query, this.state.where, {
      client,
      naming: this.naming,
      getClient: this.getClient,
      clause: 'where',
      tableScope,
    });
    return query;
  }

  private assertWhereSafety(method: string): void {
    if (!this.state.allowAllRows && this.state.where.length === 0) {
      throw new Error(`${method} requires where() or allowAllRows().`);
    }
  }

  private createExpressionBuilder(): ExpressionBuilder {
    return createExpressionBuilder(this.getClient, this.naming);
  }
}

class KnexSubqueryBuilder<
  TResult extends Row = Row,
> implements SubqueryBuilder<TResult> {
  constructor(
    private readonly getClient: () => Knex,
    private readonly naming: NamingStrategy,
    private readonly tableName: string,
    private readonly state: SelectState = emptySelectState(),
  ) {}

  select(
    input:
      SelectionExpression | readonly SelectionExpression[] | SelectionFactory,
  ): SubqueryBuilder<TResult> {
    return this.clone({
      selections: [
        ...this.state.selections,
        ...normalizeSelectionInput(input, this.createExpressionBuilder()).map(
          (selection) => ({
            type: 'selection' as const,
            selection,
          }),
        ),
      ],
    });
  }

  selectAll(table?: string): SubqueryBuilder<TResult> {
    return this.clone({
      selections: [...this.state.selections, { type: 'all', table }],
    });
  }

  distinct(): SubqueryBuilder<TResult> {
    return this.clone({ distinct: true });
  }

  where(
    lhsOrExpression:
      ReferenceExpression | Expression<unknown> | ExpressionFactory<SqlBool>,
    op?: ComparisonOperator,
    rhs?: OperandValueExpressionOrList,
  ): SubqueryBuilder<TResult> {
    return this.clone({
      where: [
        ...this.state.where,
        resolveConditionArguments(
          arguments,
          lhsOrExpression,
          op,
          rhs,
          this.createExpressionBuilder(),
        ),
      ],
    });
  }

  whereRef(
    lhs: ReferenceExpression,
    op: ComparisonOperator,
    rhs: ReferenceExpression,
  ): SubqueryBuilder<TResult> {
    return this.clone({
      where: [
        ...this.state.where,
        binaryExpressionNode(
          lhs,
          op,
          createExpression({ type: 'ref', reference: rhs }),
        ),
      ],
    });
  }

  orderBy(
    column: string,
    direction: OrderDirection = 'asc',
  ): SubqueryBuilder<TResult> {
    return this.clone({
      orderBy: [...this.state.orderBy, { column, direction }],
    });
  }

  limit(count: number): SubqueryBuilder<TResult> {
    return this.clone({ limit: count });
  }

  offset(count: number): SubqueryBuilder<TResult> {
    return this.clone({ offset: count });
  }

  as<TAlias extends string>(alias: TAlias): AliasedExpression<TResult, TAlias> {
    return createAliasedExpression<TResult, TAlias>(
      {
        type: 'subquery',
        query: this,
      },
      alias,
    );
  }

  async collectNumericCollections(
    lookup: CollectionLookup,
    collections: Map<string, CollectionDefinition>,
  ): Promise<void> {
    await collectNumericCollections(
      this.state,
      this.tableName,
      lookup,
      collections,
    );
  }

  async hasDecimalResult(
    lookup?: CollectionLookup,
    outerTables: string[] = [],
  ): Promise<boolean> {
    const first = this.state.selections[0];
    if (first?.type !== 'selection') return false;
    return selectionIsDecimal(
      first.selection,
      [
        this.tableName,
        ...this.state.joins.map((join) => join.table),
        ...outerTables,
      ],
      lookup,
    );
  }

  async resultDecoder(
    lookup?: CollectionLookup,
  ): Promise<(value: unknown) => unknown> {
    const decode = await prepareAggregateDecoder(
      this.state.selections,
      [this.tableName, ...this.state.joins.map((join) => join.table)],
      lookup,
    );
    const first = this.state.selections[0];
    const selection = first?.type === 'selection' ? first.selection : undefined;
    if (selection && typeof selection !== 'string') {
      const node = getExpressionNode(selection);
      if (node.type === 'aliasedExpression')
        return (value) => decode({ [node.alias]: value })[node.alias];
    }
    return (value) => value;
  }

  resultSource(parent: TableScope): FieldDefinition | undefined {
    const scope = createTableScope(
      [this.tableName, ...this.state.joins.map((join) => join.table)],
      this.naming,
      parent,
    );
    const first = this.state.selections[0];
    if (first?.type !== 'selection') return undefined;
    if (typeof first.selection === 'string') {
      const reference = parseAliasedIdentifier(first.selection).identifier;
      return numericSource(reference, scope) ?? scalarSource(reference, scope);
    }
    if (typeof first.selection === 'string') return undefined;
    let node = getExpressionNode(first.selection);
    if (node.type === 'aliasedExpression') node = node.expression;
    if (node.type === 'subquery') return node.query.resultSource(scope);
    return node.type === 'aggregate' && node.operand?.type === 'ref'
      ? numericSource(node.operand.reference, scope)
      : undefined;
  }

  aggregateResult(): boolean {
    const first = this.state.selections[0];
    if (first?.type !== 'selection' || typeof first.selection === 'string')
      return false;
    let node = getExpressionNode(first.selection);
    if (node.type === 'aliasedExpression') node = node.expression;
    return (
      node.type === 'aggregate' ||
      (node.type === 'subquery' && node.query.aggregateResult())
    );
  }

  numericResult(): boolean {
    const first = this.state.selections[0];
    if (first?.type !== 'selection' || typeof first.selection === 'string')
      return false;
    let node = getExpressionNode(first.selection);
    if (node.type === 'aliasedExpression') node = node.expression;
    return (
      node.type === 'aggregate' &&
      ['count', 'countAll', 'sum', 'avg'].includes(node.fn)
    );
  }

  buildQuery(
    client = this.getClient(),
    parentScope?: TableScope,
  ): Knex.QueryBuilder {
    if (this.state.offset !== undefined && this.state.orderBy.length === 0) {
      throw new Error('offset() requires orderBy() for portable pagination.');
    }

    const tableScope = createTableScope(
      [this.tableName, ...this.state.joins.map((join) => join.table)],
      this.naming,
      parentScope,
    );
    const query = client(mapTableSourceExpression(this.tableName, this.naming));
    applySelections(query, this.state.selections, {
      client,
      naming: this.naming,
      getClient: this.getClient,
      clause: 'where',
      subquery: true,
      tableScope,
    });
    if (this.state.distinct) {
      query.distinct();
    }
    applyWhereExpressions(query, this.state.where, {
      client,
      naming: this.naming,
      getClient: this.getClient,
      clause: 'where',
      subquery: true,
      tableScope,
    });
    for (const item of this.state.orderBy) {
      const aggregate = this.state.selections.find(
        (entry) =>
          entry.type === 'selection' &&
          typeof entry.selection !== 'string' &&
          'alias' in entry.selection &&
          entry.selection.alias === item.column,
      );
      let ordering: string | Knex.Raw = mapReference(
        item.column,
        this.naming,
        tableScope,
      );
      if (
        aggregate?.type === 'selection' &&
        typeof aggregate.selection !== 'string'
      ) {
        const node = getExpressionNode(aggregate.selection);
        if (
          node.type === 'aliasedExpression' &&
          node.expression.type === 'aggregate'
        ) {
          ordering = aggregateNodeToRaw(
            {
              client,
              naming: this.naming,
              getClient: this.getClient,
              clause: 'having',
              tableScope,
            },
            node.expression,
          );
          const wrapAggregateOrdering =
            getDatabaseDriverRuntime(client)?.query?.wrapAggregateOrdering;
          if (wrapAggregateOrdering && typeof ordering !== 'string') {
            ordering = wrapAggregateOrdering({
              client,
              ordering,
              functionName: node.expression.fn,
            });
          }
        }
      }
      query.orderBy(ordering, item.direction);
    }
    if (this.state.limit !== undefined) {
      query.limit(this.state.limit);
    }
    if (this.state.offset !== undefined) {
      query.offset(this.state.offset);
    }
    return query;
  }

  private clone(patch: Partial<SelectState>): KnexSubqueryBuilder<TResult> {
    return new KnexSubqueryBuilder<TResult>(
      this.getClient,
      this.naming,
      this.tableName,
      {
        selections: patch.selections ?? this.state.selections,
        distinct: patch.distinct ?? this.state.distinct,
        joins: patch.joins ?? this.state.joins,
        where: patch.where ?? this.state.where,
        groupBy: patch.groupBy ?? this.state.groupBy,
        having: patch.having ?? this.state.having,
        orderBy: patch.orderBy ?? this.state.orderBy,
        limit: Object.prototype.hasOwnProperty.call(patch, 'limit')
          ? patch.limit
          : this.state.limit,
        offset: Object.prototype.hasOwnProperty.call(patch, 'offset')
          ? patch.offset
          : this.state.offset,
      },
    );
  }

  private createExpressionBuilder(): ExpressionBuilder {
    return createExpressionBuilder(this.getClient, this.naming);
  }
}

class KnexJoinBuilder implements JoinBuilder {
  readonly conditions: ExpressionNode[];

  constructor(
    private readonly expressionBuilder: ExpressionBuilder,
    conditions: ExpressionNode[] = [],
  ) {
    this.conditions = conditions;
  }

  on(
    lhsOrExpression:
      ReferenceExpression | Expression<unknown> | ExpressionFactory<SqlBool>,
    op?: ComparisonOperator,
    rhs?: OperandValueExpressionOrList,
  ): JoinBuilder {
    return this.add(
      resolveConditionArguments(
        arguments,
        lhsOrExpression,
        op,
        rhs,
        this.expressionBuilder,
      ),
    );
  }

  onRef(
    lhs: ReferenceExpression,
    op: ComparisonOperator,
    rhs: ReferenceExpression,
  ): JoinBuilder {
    return this.add(
      binaryExpressionNode(
        lhs,
        op,
        createExpression({ type: 'ref', reference: rhs }),
      ),
    );
  }

  private add(expression: ExpressionNode): KnexJoinBuilder {
    return new KnexJoinBuilder(this.expressionBuilder, [
      ...this.conditions,
      expression,
    ]);
  }
}

type AggregateFunctionName =
  'count' | 'countAll' | 'sum' | 'avg' | 'min' | 'max';

type ExpressionNode =
  | {
      type: 'binary';
      lhs: OperandNode;
      op: ComparisonOperator;
      rhs: OperandNode;
    }
  | { type: 'and'; expressions: ExpressionNode[] }
  | { type: 'or'; expressions: ExpressionNode[] }
  | { type: 'not'; expression: ExpressionNode }
  | { type: 'between'; expression: OperandNode; start: unknown; end: unknown }
  | { type: 'exists'; query: KnexSubqueryBuilder }
  | { type: 'ref'; reference: ReferenceExpression }
  | { type: 'val'; value: unknown }
  | {
      type: 'aggregate';
      fn: AggregateFunctionName;
      operand?: OperandNode;
      distinct: boolean;
      table?: string;
    }
  | { type: 'decimalResult'; expression: ExpressionNode }
  | { type: 'parens'; expression: ExpressionNode }
  | { type: 'subquery'; query: KnexSubqueryBuilder }
  | { type: 'aliasedExpression'; expression: ExpressionNode; alias: string };

type OperandNode =
  | { type: 'value'; value: unknown }
  | { type: 'ref'; reference: ReferenceExpression }
  | { type: 'expression'; expression: ExpressionNode }
  | { type: 'subquery'; query: KnexSubqueryBuilder };

interface ExpressionCompileContext {
  client: Knex;
  naming: NamingStrategy;
  getClient: () => Knex;
  clause: 'where' | 'having';
  subquery?: boolean;
  tableScope: TableScope;
}

interface TableScope {
  readonly tables?: readonly string[];
  readonly numericCollections?: ReadonlyMap<string, CollectionDefinition>;
  readonly qualifiers: ReadonlyMap<string, string>;
  readonly parent?: TableScope;
  readonly aggregates?: ReadonlyMap<
    string,
    Extract<ExpressionNode, { type: 'aggregate' }>
  >;
}

interface ResolvedTableSource {
  readonly sql: string;
  readonly logicalQualifier: string;
  readonly sqlQualifier: string;
}

interface ResultMap {
  hidden?: Set<string>;
  explicit: Map<string, string>;
  mapUnmatchedColumns: boolean;
  scalarDecoders?: Map<string, (value: unknown) => unknown>;
}

const expressionNodeSymbol = Symbol('NocoBaseQueryExpressionNode');

interface InternalExpression<T = unknown> extends Expression<T> {
  readonly [expressionNodeSymbol]: ExpressionNode;
}

function createExpression<T = unknown>(node: ExpressionNode): Expression<T> {
  return {
    [expressionNodeSymbol]: node,
  } as InternalExpression<T>;
}

function createAliasedExpression<T = unknown, TAlias extends string = string>(
  expression: ExpressionNode,
  alias: TAlias,
): AliasedExpression<T, TAlias> {
  return {
    [expressionNodeSymbol]: {
      type: 'aliasedExpression',
      expression,
      alias,
    },
    alias,
  } as unknown as AliasedExpression<T, TAlias>;
}

function createAggregateExpression<T = unknown>(
  node: Extract<ExpressionNode, { type: 'aggregate' }>,
): AggregateExpression<T> {
  const expression = createExpression<T>(node) as AggregateExpression<T>;
  expression.as = (alias) =>
    createAliasedExpression<T, typeof alias>(node, alias);
  expression.distinct = () =>
    createAggregateExpression<T>({ ...node, distinct: true });
  return expression;
}

function isExpression(value: unknown): value is InternalExpression {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    expressionNodeSymbol in value
  );
}

function getExpressionNode(expression: Expression<unknown>): ExpressionNode {
  if (!isExpression(expression)) {
    throw new Error('Invalid query expression.');
  }
  return expression[expressionNodeSymbol];
}

function createExpressionBuilder(
  getClient: () => Knex,
  naming: NamingStrategy,
): ExpressionBuilder {
  const builder = ((
    lhs: ReferenceExpression | Expression<unknown>,
    op: ComparisonOperator,
    rhs: OperandValueExpressionOrList,
  ) =>
    createExpression<SqlBool>(
      binaryExpressionNode(lhs, op, rhs),
    )) as ExpressionBuilder;

  Object.defineProperty(builder, 'eb', {
    enumerable: true,
    get: () => builder,
  });

  Object.defineProperty(builder, 'fn', {
    enumerable: true,
    get: () => createFunctionModule(),
  });

  builder.ref = (reference) => createExpression({ type: 'ref', reference });
  builder.val = (value) => createExpression({ type: 'val', value });
  builder.and = (expressions) =>
    createExpression({
      type: 'and',
      expressions: expressionListFromInput(expressions, builder),
    });
  builder.or = (expressions) =>
    createExpression({
      type: 'or',
      expressions: expressionListFromInput(expressions, builder),
    });
  builder.not = (expression) =>
    createExpression({
      type: 'not',
      expression: resolveExpressionInput(expression, builder),
    });
  builder.between = (expression, start, end) =>
    createExpression({
      type: 'between',
      expression: referenceOperandNode(expression),
      start,
      end,
    });
  builder.exists = (query) => {
    if (!(query instanceof KnexSubqueryBuilder)) {
      throw new Error(
        'exists() expects a subquery created by eb.selectFrom().',
      );
    }
    return createExpression({ type: 'exists', query });
  };
  builder.selectFrom = (table) =>
    new KnexSubqueryBuilder(getClient, naming, table);
  builder.parens = (expression) =>
    createExpression({
      type: 'parens',
      expression: resolveExpressionInput(expression, builder),
    });

  return builder;
}

function createFunctionModule(): FunctionModule {
  return {
    count: (column) =>
      createAggregateExpression({
        type: 'aggregate',
        fn: 'count',
        operand: referenceOperandNode(column),
        distinct: false,
      }),
    countAll: (table) =>
      createAggregateExpression({
        type: 'aggregate',
        fn: 'countAll',
        distinct: false,
        table,
      }),
    sum: (column) =>
      createAggregateExpression({
        type: 'aggregate',
        fn: 'sum',
        operand: referenceOperandNode(column),
        distinct: false,
      }),
    avg: (column) =>
      createAggregateExpression({
        type: 'aggregate',
        fn: 'avg',
        operand: referenceOperandNode(column),
        distinct: false,
      }),
    min: (column) =>
      createAggregateExpression({
        type: 'aggregate',
        fn: 'min',
        operand: referenceOperandNode(column),
        distinct: false,
      }),
    max: (column) =>
      createAggregateExpression({
        type: 'aggregate',
        fn: 'max',
        operand: referenceOperandNode(column),
        distinct: false,
      }),
  };
}

function resolveConditionArguments(
  args: IArguments,
  lhsOrExpression:
    ReferenceExpression | Expression<unknown> | ExpressionFactory<SqlBool>,
  op: ComparisonOperator | undefined,
  rhs: OperandValueExpressionOrList | undefined,
  builder: ExpressionBuilder,
): ExpressionNode {
  if (args.length === 1) {
    return resolveExpressionInput(
      lhsOrExpression as Expression<SqlBool> | ExpressionFactory<SqlBool>,
      builder,
    );
  }

  if (args.length !== 3 || op === undefined) {
    throw new Error(
      'where() expects either an expression callback or (lhs, operator, rhs).',
    );
  }

  return binaryExpressionNode(
    lhsOrExpression as ReferenceExpression | Expression<unknown>,
    op,
    rhs,
  );
}

function resolveExpressionInput<T>(
  input: ExpressionInput<T>,
  builder: ExpressionBuilder,
): ExpressionNode {
  if (typeof input === 'function' && !isExpression(input)) {
    return getExpressionNode(input(builder));
  }
  return getExpressionNode(input);
}

function expressionListFromInput(
  expressions: readonly ExpressionInput<SqlBool>[] | Record<string, unknown>,
  builder: ExpressionBuilder,
): ExpressionNode[] {
  if (Array.isArray(expressions)) {
    return expressions.map((expression) =>
      resolveExpressionInput(expression, builder),
    );
  }

  return Object.entries(expressions).map(([field, value]) =>
    binaryExpressionNode(field, '=', value),
  );
}

function binaryExpressionNode(
  lhs: ReferenceExpression | Expression<unknown>,
  op: ComparisonOperator,
  rhs: OperandValueExpressionOrList,
): ExpressionNode {
  return {
    type: 'binary',
    lhs: referenceOperandNode(lhs),
    op: normalizeComparisonOperator(op),
    rhs: operandNode(rhs),
  };
}

function referenceOperandNode(
  value: ReferenceExpression | Expression<unknown>,
): OperandNode {
  if (typeof value === 'string') {
    return { type: 'ref', reference: value };
  }
  return operandNode(value);
}

function operandNode(
  value: OperandValueExpressionOrList | Expression<unknown>,
): OperandNode {
  if (isExpression(value)) {
    const expression = getExpressionNode(value);
    if (expression.type === 'ref') {
      return { type: 'ref', reference: expression.reference };
    }
    if (expression.type === 'val') {
      return { type: 'value', value: expression.value };
    }
    if (expression.type === 'subquery') {
      return { type: 'subquery', query: expression.query };
    }
    if (
      expression.type === 'aliasedExpression' &&
      expression.expression.type === 'subquery'
    ) {
      return { type: 'subquery', query: expression.expression.query };
    }
    return { type: 'expression', expression };
  }

  if (value instanceof KnexSubqueryBuilder) {
    return { type: 'subquery', query: value };
  }

  return { type: 'value', value };
}

function applyWhereExpressions(
  query: Knex.QueryBuilder,
  expressions: readonly ExpressionNode[],
  context: ExpressionCompileContext,
): void {
  for (const expression of expressions) {
    applyExpressionNode(query, expression, context);
  }
}

function applySelections(
  query: Knex.QueryBuilder,
  selections: readonly SelectItem[],
  context: ExpressionCompileContext,
): ResultMap {
  const resultMap: ResultMap = {
    explicit: new Map(),
    mapUnmatchedColumns: selections.length === 0,
    scalarDecoders: new Map(),
  };

  if (selections.length === 0) {
    return resultMap;
  }

  for (const selection of selections) {
    if (selection.type === 'all') {
      resultMap.mapUnmatchedColumns = true;
      addCollectionScalarDecoders(resultMap, context, selection.table);
      const expanded = expandTemporalAllSelection(selection, context);
      if (expanded) {
        for (const fieldSelection of expanded) {
          applySelectionExpression(query, fieldSelection, context, resultMap);
        }
      } else {
        query.select(
          selection.table
            ? `${mapTableQualifier(
                selection.table,
                context.naming,
                context.tableScope,
              )}.*`
            : '*',
        );
      }
      continue;
    }

    applySelectionExpression(query, selection.selection, context, resultMap);
  }

  return resultMap;
}

function applySelectionExpression(
  query: Knex.QueryBuilder,
  selection: SelectionExpression,
  context: ExpressionCompileContext,
  resultMap: ResultMap,
): void {
  if (typeof selection === 'string') {
    const mapped = mapStringSelection(
      selection,
      context.naming,
      context.tableScope,
    );
    if (mapped.mapUnmatchedColumns) {
      resultMap.mapUnmatchedColumns = true;
    }
    if (mapped.result) {
      resultMap.explicit.set(mapped.result.physical, mapped.result.logical);
    }
    if (mapped.result) {
      addScalarDecoder(
        resultMap,
        context,
        mapped.result.physical,
        mapped.result.reference,
      );
    }
    query.select(
      mapped.result
        ? selectionToQueryExpression(mapped, context)
        : (mapped.selection as any),
    );
    return;
  }

  const node = getExpressionNode(selection);
  if (node.type !== 'aliasedExpression') {
    query.select(expressionNodeToRaw(context, node) as any);
    return;
  }

  const logicalAlias = node.alias;
  const physicalAlias = mapIdentifier(logicalAlias, context.naming);
  resultMap.explicit.set(physicalAlias, logicalAlias);
  const source =
    node.expression.type === 'ref'
      ? node.expression.reference
      : node.expression.type === 'subquery'
        ? node.expression.query.resultSource(context.tableScope)
        : undefined;
  addScalarDecoder(
    resultMap,
    context,
    physicalAlias,
    typeof source === 'string' ? source : undefined,
    typeof source === 'string' ? undefined : source,
  );
  query.select(
    expressionNodeToSelectRaw(context, node.expression, physicalAlias) as any,
  );
}

function applyExpressionNode(
  query: Knex.QueryBuilder,
  expression: ExpressionNode,
  context: ExpressionCompileContext,
  bool: 'and' | 'or' = 'and',
): void {
  switch (expression.type) {
    case 'binary':
      applyBinaryExpression(query, expression, context, bool);
      break;
    case 'and':
      applyExpressionGroup(query, expression.expressions, context, bool, 'and');
      break;
    case 'or':
      applyExpressionGroup(query, expression.expressions, context, bool, 'or');
      break;
    case 'not':
      applyNotExpression(query, expression.expression, context, bool);
      break;
    case 'between':
      applyBetweenExpression(query, expression, context, bool, false);
      break;
    case 'exists':
      applyExistsExpression(query, expression, context, bool, false);
      break;
    case 'decimalResult':
    case 'parens':
      applyExpressionGroup(
        query,
        [expression.expression],
        context,
        bool,
        'and',
      );
      break;
    case 'ref':
    case 'val':
    case 'aggregate':
    case 'subquery':
    case 'aliasedExpression':
      throw new Error(
        `Expression "${expression.type}" cannot be used directly as a condition.`,
      );
    default:
      assertNever(expression);
  }
}

function applyExpressionGroup(
  query: Knex.QueryBuilder,
  expressions: readonly ExpressionNode[],
  context: ExpressionCompileContext,
  bool: 'and' | 'or',
  groupBool: 'and' | 'or',
): void {
  if (expressions.length === 0) {
    return;
  }

  const method =
    context.clause === 'having'
      ? bool === 'or'
        ? 'orHaving'
        : 'having'
      : bool === 'or'
        ? 'orWhere'
        : 'where';
  (query as any)[method](function group(this: Knex.QueryBuilder) {
    expressions.forEach((expression, index) => {
      applyExpressionNode(
        this,
        expression,
        context,
        groupBool === 'or' && index > 0 ? 'or' : 'and',
      );
    });
  });
}

function applyNotExpression(
  query: Knex.QueryBuilder,
  expression: ExpressionNode,
  context: ExpressionCompileContext,
  bool: 'and' | 'or',
): void {
  if (expression.type === 'between') {
    applyBetweenExpression(query, expression, context, bool, true);
    return;
  }
  if (expression.type === 'exists') {
    applyExistsExpression(query, expression, context, bool, true);
    return;
  }
  if (expression.type === 'binary') {
    applyBinaryExpression(
      query,
      {
        ...expression,
        op: invertComparisonOperator(expression.op),
      },
      context,
      bool,
    );
    return;
  }

  const method =
    context.clause === 'having'
      ? bool === 'or'
        ? 'orHavingNot'
        : 'havingNot'
      : bool === 'or'
        ? 'orWhereNot'
        : 'whereNot';
  (query as any)[method](function notGroup(this: Knex.QueryBuilder) {
    applyExpressionNode(this, expression, context);
  });
}

function applyBinaryExpression(
  query: Knex.QueryBuilder,
  expression: Extract<ExpressionNode, { type: 'binary' }>,
  context: ExpressionCompileContext,
  bool: 'and' | 'or',
): void {
  const lhs = compileOperand(context, expression.lhs);
  const op = expression.op;
  const rhs = expression.rhs;
  const decimalAggregateKey = getDatabaseDriverRuntime(context.client)?.query
    ?.decimalAggregateKey;
  if (
    decimalAggregateKey &&
    (operandIsDecimalAggregate(expression.lhs, context) ||
      operandIsDecimalAggregate(rhs, context))
  ) {
    const key = (value: Knex.Raw) =>
      decimalAggregateKey({ client: context.client, value });
    const left = key(typeof lhs === 'string' ? context.client.ref(lhs) : lhs);
    if (rhs.type === 'value') {
      const value = Array.isArray(rhs.value)
        ? rhs.value.map((value) => key(context.client.raw('?', [value] as any)))
        : rhs.value === null
          ? null
          : key(context.client.raw('?', [rhs.value] as any));
      callValueComparison(query, context, bool, left, op, value);
    } else {
      const right =
        rhs.type === 'ref'
          ? context.client.ref(
              mapReference(rhs.reference, context.naming, context.tableScope),
            )
          : rhs.type === 'expression'
            ? expressionNodeToRaw(context, rhs.expression)
            : context.client.raw('(?)', [
                rhs.query.buildQuery(context.client, context.tableScope),
              ]);
      callBasicComparison(query, context, bool, left, op, key(right));
    }
    return;
  }

  if (rhs.type === 'ref') {
    callColumnComparison(
      query,
      context,
      bool,
      lhs,
      op,
      mapReference(rhs.reference, context.naming, context.tableScope),
    );
    return;
  }

  if (rhs.type === 'subquery') {
    callSubqueryComparison(
      query,
      context,
      bool,
      lhs,
      op,
      rhs.query.buildQuery(context.client, context.tableScope),
    );
    return;
  }

  if (rhs.type === 'expression') {
    callBasicComparison(
      query,
      context,
      bool,
      lhs,
      op,
      expressionNodeToRaw(context, rhs.expression),
    );
    return;
  }

  callValueComparison(
    query,
    context,
    bool,
    lhs,
    op,
    normalizeQueryComparisonValue(context, expression.lhs, rhs.value, op),
  );
}

/**
 * Bind a value compared with a Field the way a write to that Field binds it, so a comparison matches what the
 * builder stored. Without this a temporal comparison bound the caller's string verbatim: MySQL rejects
 * `next_run_at <= '2026-10-02T03:45:25.880Z'` (`Incorrect datetime value`) although the same value is accepted
 * by `set`, which already encodes it.
 *
 * Only a value the Field could store is encoded. A pattern (`like`), a null test (`is`), a date without a time
 * compared with a `datetime`, or any other string that is not a complete V1 literal is the database's to
 * interpret and is bound as given, as every comparison was before comparisons were encoded at all.
 */
function normalizeQueryComparisonValue(
  context: ExpressionCompileContext,
  operand: OperandNode,
  value: unknown,
  op?: ComparisonOperator,
): unknown {
  if (operand.type !== 'ref') return value;
  if (
    op !== undefined &&
    !ENCODED_COMPARISON_OPERATORS.has(normalizeComparisonOperator(op))
  ) {
    return value;
  }
  const field = scalarSource(operand.reference, context.tableScope);
  if (!field) return value;
  const encode =
    field.type === 'boolean'
      ? (item: unknown) => encodeQueryBoolean(context.client, field, item)
      : isTemporalType(field.type)
        ? (item: unknown) => encodeComparedTemporal(context.client, field, item)
        : undefined;
  if (!encode) return value;
  return Array.isArray(value) ? value.map(encode) : encode(value);
}

/** The operators whose value stands for what the Field stores; a pattern or a null test does not. */
const ENCODED_COMPARISON_OPERATORS: ReadonlySet<ComparisonOperator> =
  new Set<ComparisonOperator>([
    '=',
    '!=',
    '<>',
    '>',
    '>=',
    '<',
    '<=',
    'in',
    'not in',
  ]);

function encodeComparedTemporal(
  client: Knex,
  field: FieldDefinition,
  value: unknown,
): unknown {
  if (typeof value !== 'string')
    return encodeQueryTemporal(client, field, value);
  try {
    return encodeQueryTemporal(client, field, value);
  } catch (error) {
    // Not a complete V1 literal: `'2026-01-01'` against a `datetime`, or `'2026-01-01T10:00'` without seconds. A
    // write refuses such a value; a comparison hands it to the database, which decides what it means.
    if (error instanceof RepositoryError) return value;
    throw error;
  }
}

function applyBetweenExpression(
  query: Knex.QueryBuilder,
  expression: Extract<ExpressionNode, { type: 'between' }>,
  context: ExpressionCompileContext,
  bool: 'and' | 'or',
  not: boolean,
): void {
  let lhs = compileOperand(context, expression.expression);
  let start = expression.start;
  let end = expression.end;
  const decimalAggregateKey = getDatabaseDriverRuntime(context.client)?.query
    ?.decimalAggregateKey;
  if (
    decimalAggregateKey &&
    operandIsDecimalAggregate(expression.expression, context)
  ) {
    lhs = decimalAggregateKey({
      client: context.client,
      value: typeof lhs === 'string' ? context.client.ref(lhs) : lhs,
    });
    start = decimalAggregateKey({
      client: context.client,
      value: start as Knex.Raw,
    });
    end = decimalAggregateKey({
      client: context.client,
      value: end as Knex.Raw,
    });
  } else {
    start = normalizeQueryComparisonValue(
      context,
      expression.expression,
      start,
    );
    end = normalizeQueryComparisonValue(context, expression.expression, end);
  }
  const method =
    context.clause === 'having'
      ? not
        ? 'havingNotBetween'
        : 'havingBetween'
      : not
        ? 'whereNotBetween'
        : 'whereBetween';
  callBooleanMethod(query, bool, method, lhs, [start, end]);
}

function applyExistsExpression(
  query: Knex.QueryBuilder,
  expression: Extract<ExpressionNode, { type: 'exists' }>,
  context: ExpressionCompileContext,
  bool: 'and' | 'or',
  not: boolean,
): void {
  const method =
    context.clause === 'having'
      ? not
        ? 'havingNotExists'
        : 'havingExists'
      : not
        ? 'whereNotExists'
        : 'whereExists';
  callBooleanMethod(
    query,
    bool,
    method,
    expression.query.buildQuery(context.client, context.tableScope),
  );
}

function callSubqueryComparison(
  query: Knex.QueryBuilder,
  context: ExpressionCompileContext,
  bool: 'and' | 'or',
  lhs: string | Knex.Raw,
  op: ComparisonOperator,
  subquery: Knex.QueryBuilder,
): void {
  switch (op) {
    case 'in':
      callBooleanMethod(
        query,
        bool,
        context.clause === 'having' ? 'havingIn' : 'whereIn',
        lhs,
        subquery,
      );
      break;
    case 'not in':
      callBooleanMethod(
        query,
        bool,
        context.clause === 'having' ? 'havingNotIn' : 'whereNotIn',
        lhs,
        subquery,
      );
      break;
    default:
      callBasicComparison(query, context, bool, lhs, op, subquery);
      break;
  }
}

function callValueComparison(
  query: Knex.QueryBuilder,
  context: ExpressionCompileContext,
  bool: 'and' | 'or',
  lhs: string | Knex.Raw,
  op: ComparisonOperator,
  value: unknown,
): void {
  switch (op) {
    case 'in':
      callBooleanMethod(
        query,
        bool,
        context.clause === 'having' ? 'havingIn' : 'whereIn',
        lhs,
        value,
      );
      break;
    case 'not in':
      callBooleanMethod(
        query,
        bool,
        context.clause === 'having' ? 'havingNotIn' : 'whereNotIn',
        lhs,
        value,
      );
      break;
    case 'is':
      if (value === null) {
        callBooleanMethod(
          query,
          bool,
          context.clause === 'having' ? 'havingNull' : 'whereNull',
          lhs,
        );
      } else {
        callBasicComparison(query, context, bool, lhs, '=', value);
      }
      break;
    case 'is not':
      if (value === null) {
        callBooleanMethod(
          query,
          bool,
          context.clause === 'having' ? 'havingNotNull' : 'whereNotNull',
          lhs,
        );
      } else {
        callBasicComparison(query, context, bool, lhs, '!=', value);
      }
      break;
    default:
      callBasicComparison(query, context, bool, lhs, op, value);
      break;
  }
}

function callBasicComparison(
  query: Knex.QueryBuilder,
  context: ExpressionCompileContext,
  bool: 'and' | 'or',
  lhs: string | Knex.Raw,
  op: ComparisonOperator,
  rhs: unknown,
): void {
  const method =
    context.clause === 'having'
      ? bool === 'or'
        ? 'orHaving'
        : 'having'
      : bool === 'or'
        ? 'orWhere'
        : 'where';
  (query as any)[method](lhs, op, rhs);
}

function callColumnComparison(
  query: Knex.QueryBuilder,
  context: ExpressionCompileContext,
  bool: 'and' | 'or',
  lhs: string | Knex.Raw,
  op: ComparisonOperator,
  rhs: string,
): void {
  if (context.clause === 'where' && typeof lhs === 'string') {
    const method = bool === 'or' ? 'orWhereColumn' : 'whereColumn';
    (query as any)[method](lhs, op, rhs);
    return;
  }

  const lhsSql = typeof lhs === 'string' ? '??' : '?';
  const bindings = typeof lhs === 'string' ? [lhs, rhs] : [lhs, rhs];
  const method =
    context.clause === 'having'
      ? bool === 'or'
        ? 'orHavingRaw'
        : 'havingRaw'
      : bool === 'or'
        ? 'orWhereRaw'
        : 'whereRaw';
  (query as any)[method](`${lhsSql} ${op} ??`, bindings);
}

function callBooleanMethod(
  query: Knex.QueryBuilder,
  bool: 'and' | 'or',
  method: string,
  ...args: unknown[]
): void {
  const methodName =
    bool === 'or' ? `or${method[0]?.toUpperCase()}${method.slice(1)}` : method;
  (query as any)[methodName](...args);
}

function applyJoin(
  query: Knex.QueryBuilder,
  join: JoinItem,
  context: ExpressionCompileContext,
): void {
  const table = mapTableSourceExpression(join.table, context.naming);
  if (join.type === 'cross') {
    (query as any).crossJoin(table);
    return;
  }

  const method = `${join.type}Join`;
  (query as any)[method](table, function joinClause(this: Knex.JoinClause) {
    for (const condition of join.conditions) {
      applyJoinExpressionNode(this, condition, context);
    }
  });
}

function applyJoinExpressionNode(
  clause: Knex.JoinClause,
  expression: ExpressionNode,
  context: ExpressionCompileContext,
  bool: 'and' | 'or' = 'and',
): void {
  switch (expression.type) {
    case 'binary':
      applyJoinBinaryExpression(clause, expression, context, bool);
      break;
    case 'and':
      applyJoinExpressionGroup(
        clause,
        expression.expressions,
        context,
        bool,
        'and',
      );
      break;
    case 'or':
      applyJoinExpressionGroup(
        clause,
        expression.expressions,
        context,
        bool,
        'or',
      );
      break;
    case 'not':
      applyJoinNotExpression(clause, expression.expression, context, bool);
      break;
    case 'between':
      applyJoinBetweenExpression(clause, expression, context, bool, false);
      break;
    case 'exists':
      applyJoinExistsExpression(clause, expression, context, bool, false);
      break;
    case 'decimalResult':
    case 'parens':
      applyJoinExpressionGroup(
        clause,
        [expression.expression],
        context,
        bool,
        'and',
      );
      break;
    case 'ref':
    case 'val':
    case 'aggregate':
    case 'subquery':
    case 'aliasedExpression':
      throw new Error(
        `Expression "${expression.type}" cannot be used directly as a join condition.`,
      );
    default:
      assertNever(expression);
  }
}

function applyJoinExpressionGroup(
  clause: Knex.JoinClause,
  expressions: readonly ExpressionNode[],
  context: ExpressionCompileContext,
  bool: 'and' | 'or',
  groupBool: 'and' | 'or',
): void {
  if (expressions.length === 0) {
    return;
  }

  callJoinMethod(clause, bool, 'on', function group(this: Knex.JoinClause) {
    expressions.forEach((expression, index) => {
      applyJoinExpressionNode(
        this,
        expression,
        context,
        groupBool === 'or' && index > 0 ? 'or' : 'and',
      );
    });
  });
}

function applyJoinNotExpression(
  clause: Knex.JoinClause,
  expression: ExpressionNode,
  context: ExpressionCompileContext,
  bool: 'and' | 'or',
): void {
  if (expression.type === 'between') {
    applyJoinBetweenExpression(clause, expression, context, bool, true);
    return;
  }
  if (expression.type === 'exists') {
    applyJoinExistsExpression(clause, expression, context, bool, true);
    return;
  }
  if (expression.type === 'binary') {
    applyJoinBinaryExpression(
      clause,
      {
        ...expression,
        op: invertComparisonOperator(expression.op),
      },
      context,
      bool,
    );
    return;
  }

  callJoinMethod(
    clause,
    bool,
    'on',
    context.client.raw('not (?)', [
      expressionNodeToConditionRaw(context, expression),
    ] as any),
  );
}

function applyJoinBinaryExpression(
  clause: Knex.JoinClause,
  expression: Extract<ExpressionNode, { type: 'binary' }>,
  context: ExpressionCompileContext,
  bool: 'and' | 'or',
): void {
  const lhs = compileOperand(context, expression.lhs);
  const rhs = expression.rhs;
  const op = expression.op;

  if (rhs.type === 'ref') {
    callJoinMethod(
      clause,
      bool,
      'on',
      lhs,
      op,
      mapReference(rhs.reference, context.naming, context.tableScope),
    );
    return;
  }

  if (rhs.type === 'value') {
    applyJoinValueComparison(clause, context, bool, lhs, op, rhs.value);
    return;
  }

  if (rhs.type === 'subquery') {
    callJoinMethod(
      clause,
      bool,
      'on',
      lhs,
      op,
      context.client.raw('(?)', [
        rhs.query.buildQuery(context.client, context.tableScope),
      ] as any),
    );
    return;
  }

  callJoinMethod(
    clause,
    bool,
    'on',
    lhs,
    op,
    expressionNodeToRaw(context, rhs.expression),
  );
}

function applyJoinValueComparison(
  clause: Knex.JoinClause,
  _context: ExpressionCompileContext,
  bool: 'and' | 'or',
  lhs: string | Knex.Raw,
  op: ComparisonOperator,
  value: unknown,
): void {
  switch (op) {
    case 'in':
      callJoinMethod(clause, bool, 'onIn', lhs, value);
      break;
    case 'not in':
      callJoinMethod(clause, bool, 'onNotIn', lhs, value);
      break;
    case 'is':
      if (value === null) {
        callJoinMethod(clause, bool, 'onNull', lhs);
      } else {
        callJoinMethod(clause, bool, 'onVal', lhs, '=', value);
      }
      break;
    case 'is not':
      if (value === null) {
        callJoinMethod(clause, bool, 'onNotNull', lhs);
      } else {
        callJoinMethod(clause, bool, 'onVal', lhs, '!=', value);
      }
      break;
    default:
      callJoinMethod(clause, bool, 'onVal', lhs, op, value);
      break;
  }
}

function applyJoinBetweenExpression(
  clause: Knex.JoinClause,
  expression: Extract<ExpressionNode, { type: 'between' }>,
  context: ExpressionCompileContext,
  bool: 'and' | 'or',
  not: boolean,
): void {
  const lhs = compileOperand(context, expression.expression);
  callJoinMethod(clause, bool, not ? 'onNotBetween' : 'onBetween', lhs, [
    expression.start,
    expression.end,
  ]);
}

function applyJoinExistsExpression(
  clause: Knex.JoinClause,
  expression: Extract<ExpressionNode, { type: 'exists' }>,
  context: ExpressionCompileContext,
  bool: 'and' | 'or',
  not: boolean,
): void {
  callJoinMethod(
    clause,
    bool,
    'on',
    context.client.raw(`${not ? 'not ' : ''}exists (?)`, [
      expression.query.buildQuery(context.client, context.tableScope),
    ] as any),
  );
}

function callJoinMethod(
  clause: Knex.JoinClause,
  bool: 'and' | 'or',
  method: string,
  ...args: unknown[]
): void {
  const methodName =
    bool === 'or' ? `or${method[0]?.toUpperCase()}${method.slice(1)}` : method;
  (clause as any)[methodName](...args);
}

function expressionNodeToConditionRaw(
  context: ExpressionCompileContext,
  expression: ExpressionNode,
): Knex.Raw {
  const query = context.client.queryBuilder();
  applyExpressionNode(query, expression, {
    ...context,
    clause: 'where',
  });
  const compiled = query.toSQL();
  const whereIndex = compiled.sql.toLowerCase().indexOf(' where ');
  if (whereIndex === -1) {
    throw new Error('Unable to compile query expression.');
  }
  return context.client.raw(
    compiled.sql.slice(whereIndex + ' where '.length),
    compiled.bindings as any,
  );
}

function compileOperand(
  context: ExpressionCompileContext,
  operand: OperandNode,
): string | Knex.Raw {
  switch (operand.type) {
    case 'ref': {
      const aggregate =
        context.clause === 'having'
          ? context.tableScope.aggregates?.get(operand.reference)
          : undefined;
      if (aggregate) return aggregateNodeToRaw(context, aggregate);
      return mapReference(
        operand.reference,
        context.naming,
        context.tableScope,
      );
    }
    case 'expression':
      return expressionNodeToRaw(context, operand.expression);
    case 'value':
    case 'subquery':
      throw new Error(
        `Operand "${operand.type}" cannot be used on the left side of a comparison.`,
      );
    default:
      return assertNever(operand);
  }
}

function expressionNodeToRaw(
  context: ExpressionCompileContext,
  expression: ExpressionNode,
): Knex.Raw {
  switch (expression.type) {
    case 'ref':
      return context.client.ref(
        mapReference(expression.reference, context.naming, context.tableScope),
      );
    case 'val':
      return context.client.raw('?', [expression.value] as any);
    case 'aggregate':
      return aggregateNodeToRaw(context, expression);
    case 'subquery':
      return context.client.raw('(?)', [
        expression.query.buildQuery(context.client, context.tableScope),
      ] as any);
    case 'decimalResult':
      return expressionNodeToRaw(context, expression.expression);
    case 'parens':
      return context.client.raw('(?)', [
        expressionNodeToRaw(context, expression.expression),
      ] as any);
    default:
      throw new Error(
        `Expression "${expression.type}" cannot be used as a value operand.`,
      );
  }
}

function expressionNodeToSelectRaw(
  context: ExpressionCompileContext,
  expression: ExpressionNode,
  physicalAlias: string,
): Knex.Raw {
  if (expression.type === 'ref') {
    const field = scalarSource(expression.reference, context.tableScope);
    const reference = mapReference(
      expression.reference,
      context.naming,
      context.tableScope,
    );
    return context.client.raw('? as ??', [
      temporalProjection(context.client, field, reference),
      physicalAlias,
    ]);
  }
  if (expression.type === 'decimalResult') {
    return context.client.raw('? as ??', [
      aggregateProjection(
        context.client,
        expressionNodeToRaw(context, expression.expression),
      ),
      physicalAlias,
    ]);
  }
  if (expression.type === 'aggregate') {
    return aggregateNodeToRaw(context, expression, physicalAlias);
  }
  if (expression.type === 'subquery') {
    const value = context.client.raw('(?)', [
      expression.query.buildQuery(context.client, context.tableScope),
    ]);
    return context.client.raw('? as ??', [
      expression.query.numericResult() && !context.subquery
        ? aggregateProjection(
            context.client,
            value,
            expression.query.resultSource(context.tableScope),
          )
        : value,
      physicalAlias,
    ]);
  }
  return context.client.raw('? as ??', [
    expressionNodeToRaw(context, expression),
    physicalAlias,
  ] as any);
}

function aggregateNodeToRaw(
  context: ExpressionCompileContext,
  expression: Extract<ExpressionNode, { type: 'aggregate' }>,
  physicalAlias?: string,
): Knex.Raw {
  const kind = expression.fn === 'countAll' ? 'count' : expression.fn;
  const operand = expression.operand;
  if (expression.fn !== 'countAll' && operand?.type !== 'ref')
    throw new Error(`${expression.fn}() expects a column reference.`);
  const field =
    operand?.type === 'ref'
      ? mapReference(operand.reference, context.naming, context.tableScope)
      : '*';
  const source =
    operand?.type === 'ref'
      ? numericSource(operand.reference, context.tableScope)
      : undefined;
  const native = aggregateSql(
    context.client,
    kind,
    field,
    expression.distinct,
    source,
  );
  if (!physicalAlias) return native;
  const projected =
    ['count', 'sum', 'avg'].includes(kind) && !context.subquery
      ? aggregateProjection(context.client, native, source)
      : native;
  return context.client.raw('? as ??', [projected, physicalAlias]);
}

function normalizeSelectionInput(
  input:
    SelectionExpression | readonly SelectionExpression[] | SelectionFactory,
  builder: ExpressionBuilder,
): SelectionExpression[] {
  if (typeof input === 'function' && !isExpression(input)) {
    return [...input(builder)];
  }
  if (Array.isArray(input)) {
    return [...input];
  }
  return [input as SelectionExpression];
}

function normalizeStringList(input: string | readonly string[]): string[] {
  return typeof input === 'string' ? [input] : [...input];
}

function mapStringSelection(
  selection: string,
  naming: NamingStrategy,
  tableScope: TableScope,
): {
  selection: unknown;
  result?: { physical: string; logical: string; reference: string };
  mapUnmatchedColumns?: boolean;
} {
  if (selection === '*') {
    return { selection: '*', mapUnmatchedColumns: true };
  }

  if (selection.endsWith('.*')) {
    return {
      selection: `${mapTableQualifier(
        selection.slice(0, -2),
        naming,
        tableScope,
      )}.*`,
      mapUnmatchedColumns: true,
    };
  }

  const parsed = parseAliasedIdentifier(selection);
  const physicalReference = mapReference(parsed.identifier, naming, tableScope);
  const logicalAlias = parsed.alias ?? lastReferenceSegment(parsed.identifier);
  const physicalAlias = mapIdentifier(logicalAlias, naming);

  return {
    selection: { [physicalAlias]: physicalReference },
    result: {
      physical: physicalAlias,
      logical: logicalAlias,
      reference: parsed.identifier,
    },
  };
}

function selectionToQueryExpression(
  mapped: {
    selection: unknown;
    result?: { physical: string; logical: string; reference: string };
  },
  context: ExpressionCompileContext,
): unknown {
  if (!mapped.result) return mapped.selection;
  const field = scalarSource(mapped.result.reference, context.tableScope);
  if (!field || !isTemporalType(field.type)) return mapped.selection;
  return context.client.raw('? as ??', [
    temporalProjection(
      context.client,
      field,
      mapReference(mapped.result.reference, context.naming, context.tableScope),
    ),
    mapped.result.physical,
  ]);
}

function expandTemporalAllSelection(
  selection: Extract<SelectItem, { type: 'all' }>,
  context: ExpressionCompileContext,
): string[] | undefined {
  const requestedTables = selection.table
    ? [selection.table]
    : [...(context.tableScope.tables ?? [])];
  if (requestedTables.length === 0) return undefined;

  const targets = requestedTables.map((table) => {
    const parsed = parseAliasedIdentifier(table);
    return {
      qualifier: parsed.alias ?? parsed.identifier,
      collection: collectionForTable(context.tableScope, table),
    };
  });
  if (
    targets.some((target) => !target.collection) ||
    !targets.some((target) =>
      target.collection?.fields?.some(
        (field) => !('target' in field) && isTemporalType(field.type),
      ),
    )
  )
    return undefined;

  return targets.flatMap(({ qualifier, collection }) =>
    (collection?.fields ?? [])
      .filter((field) => !('target' in field))
      .map((field) => `${qualifier}.${field.name}`),
  );
}

function logicalResultKeyForSelection(selection: string): string {
  const parsed = parseAliasedIdentifier(selection);
  return parsed.alias ?? lastReferenceSegment(parsed.identifier);
}

function resolveTableSource(
  tableExpression: string,
  naming: NamingStrategy,
): ResolvedTableSource {
  const parsed = parseAliasedIdentifier(tableExpression);
  if (parsed.identifier.includes('.')) {
    throw new Error(
      'Query table sources do not support schema-qualified identifiers. Use connection.client() for physical schema access.',
    );
  }
  const physicalTable = naming.collectionToTableName(parsed.identifier);
  const physicalAlias = parsed.alias
    ? mapIdentifier(parsed.alias, naming)
    : undefined;

  return {
    sql: physicalAlias ? `${physicalTable} as ${physicalAlias}` : physicalTable,
    logicalQualifier: parsed.alias ?? parsed.identifier,
    sqlQualifier: physicalAlias ?? physicalTable,
  };
}

function mapTableSourceExpression(
  tableExpression: string,
  naming: NamingStrategy,
): string {
  return resolveTableSource(tableExpression, naming).sql;
}

function createTableScope(
  tableExpressions: readonly string[],
  naming: NamingStrategy,
  parent?: TableScope,
): TableScope {
  const qualifiers = new Map<string, string>();

  for (const expression of tableExpressions) {
    const source = resolveTableSource(expression, naming);
    qualifiers.set(source.logicalQualifier, source.sqlQualifier);
    qualifiers.set(
      mapIdentifier(source.logicalQualifier, naming),
      source.sqlQualifier,
    );
  }

  return {
    qualifiers,
    parent,
    tables: tableExpressions,
    numericCollections: parent?.numericCollections,
  };
}

function resolveTableQualifier(
  qualifier: string,
  scope: TableScope | undefined,
): string | undefined {
  let current = scope;
  while (current) {
    const resolved = current.qualifiers.get(qualifier);
    if (resolved !== undefined) {
      return resolved;
    }
    current = current.parent;
  }
  return undefined;
}

function mapTableQualifier(
  qualifier: string,
  naming: NamingStrategy,
  scope: TableScope,
): string {
  return (
    resolveTableQualifier(qualifier, scope) ?? mapIdentifier(qualifier, naming)
  );
}

function mapReference(
  reference: string,
  naming: NamingStrategy,
  tableScope?: TableScope,
): string {
  if (reference === '*') {
    return reference;
  }

  const parts = reference.split('.');
  const qualifier =
    parts.length > 1 ? resolveTableQualifier(parts[0], tableScope) : undefined;

  return parts
    .map((part, index) => {
      if (part === '*') {
        return part;
      }
      if (index === 0 && qualifier !== undefined) {
        return qualifier;
      }
      return mapIdentifier(part, naming);
    })
    .join('.');
}

function mapIdentifier(identifier: string, naming: NamingStrategy): string {
  return naming.fieldToColumnName(identifier);
}

interface WriteFields {
  readonly json: ReadonlySet<string>;
  readonly boolean: ReadonlyMap<string, FieldDefinition>;
  readonly temporal: ReadonlyMap<string, FieldDefinition>;
}

const emptyWriteFields: WriteFields = {
  json: emptyStringSet,
  boolean: new Map(),
  temporal: new Map(),
};

function mapData(
  data: Row | readonly Row[],
  naming: NamingStrategy,
  fields: WriteFields = emptyWriteFields,
  client?: Knex,
): Row | Row[] {
  if (Array.isArray(data)) {
    return data.map((item) => mapData(item, naming, fields, client) as Row);
  }
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      const booleanField = fields.boolean.get(key);
      const temporalField = fields.temporal.get(key);
      const encoded = booleanField
        ? encodeQueryBoolean(client, booleanField, value)
        : temporalField && client
          ? encodeQueryTemporal(client, temporalField, value)
          : fields.json.has(key) && value !== null
            ? encodeJsonValue(value as JsonValue)
            : value;
      return [mapIdentifier(key, naming), encoded];
    }),
  );
}

function encodeQueryBoolean(
  client: Knex | undefined,
  field: FieldDefinition,
  value: unknown,
): unknown {
  const encodeBoolean = client
    ? getDatabaseDriverRuntime(client)?.repository?.encodeBoolean
    : undefined;
  return encodeBoolean
    ? encodeBoolean(field, value)
    : normalizeBooleanValue(field, value);
}

/**
 * Bind a temporal value the way Repository does, so both writers store the same thing.
 *
 * Strings used to reach the driver untouched, which let `2026-09-06T09:30:00Z` land in a `datetime` column
 * verbatim on SQLite — accepted by the write and then unreadable, since no valid local value carries an offset.
 * Every other dialect took it too and silently dropped the offset. Normalizing here converts it instead, and
 * `temporalBinding` keeps receiving the canonical string each dialect's formatting is written against.
 *
 * A `Knex.Raw`, a column reference or a subquery is SQL the builder composes rather than a value, and returning
 * it untouched is the only correct thing to do with it. Passing one to `temporalBinding` is not: every dialect's
 * strategy starts with `String(value)`, which renders the object as SQL text and then binds that text as a
 * parameter, so `now()` arrives as the literal `'now()'`. MySQL and OceanBase go further and apply
 * `.replace('T', ' ')` to it, which rewrites the first `T` in the SQL itself — `CURRENT_TIMESTAMP(3)` becomes
 * `CURREN _TIMESTAMP(3)`.
 *
 * Primitives other than a string keep reaching `temporalBinding` unvalidated, which is what they did before.
 * A number is the shape legacy rows hold, and rejecting it here is a separate decision from this one.
 */
function encodeQueryTemporal(
  client: Knex,
  field: FieldDefinition,
  value: unknown,
): unknown {
  // Preserve omitted fields for insert defaults and skipped updates.
  if (value === null || value === undefined) return value;
  if (typeof value === 'object' && !(value instanceof Date)) return value;
  const temporalBinding =
    getDatabaseDriverRuntime(client)?.repository?.temporalBinding;
  if (!(value instanceof Date) && typeof value !== 'string') {
    return temporalBinding ? temporalBinding({ client, field, value }) : value;
  }
  const normalized = normalizeTemporalValue(field, value);
  return temporalBinding
    ? temporalBinding({ client, field, value: normalized })
    : normalized;
}

/** The Fields of a Collection a write encodes specially; nothing when the table backs no Collection. */
function writeFieldsOf(
  collection: CollectionDefinition | undefined,
): WriteFields {
  if (!collection) return emptyWriteFields;
  const json = new Set<string>();
  const boolean = new Map<string, FieldDefinition>();
  const temporal = new Map<string, FieldDefinition>();
  for (const field of collection?.fields ?? []) {
    if ('target' in field) continue;
    if (field.type === 'json') json.add(field.name);
    if (field.type === 'boolean') boolean.set(field.name, field);
    if (isTemporalType(field.type)) temporal.set(field.name, field);
  }
  return { json, boolean, temporal };
}

function parseAliasedIdentifier(value: string): {
  identifier: string;
  alias?: string;
} {
  const trimmed = value.trim();
  const asMatch = trimmed.match(/^(.+?)\s+as\s+([A-Za-z_][A-Za-z0-9_]*)$/i);
  if (asMatch) {
    return {
      identifier: asMatch[1].trim(),
      alias: asMatch[2].trim(),
    };
  }

  return { identifier: trimmed };
}

function mapResultRow(
  row: Row,
  resultMap: ResultMap,
  naming: NamingStrategy,
): Row {
  const shouldCamelCaseUnmatched =
    resultMap.mapUnmatchedColumns && isUnderscoredNaming(naming);
  return Object.fromEntries(
    Object.entries(row)
      .filter(([key]) => !resultMap.hidden?.has(key))
      .map(([key, value]) => {
        // A decoder that legitimately returns null must not fall back to the
        // raw value: a JSON column holding the literal `null` decodes to null
        // and would otherwise leak the stored text back to the caller.
        const decode = resultMap.scalarDecoders?.get(key);
        return [
          resultMap.explicit.get(key) ??
            (shouldCamelCaseUnmatched ? camelCase(key) : key),
          decode ? decode(value) : value,
        ];
      }),
  );
}

function addScalarDecoder(
  resultMap: ResultMap,
  context: ExpressionCompileContext,
  physicalKey: string,
  reference: string | undefined,
  source?: FieldDefinition,
): void {
  const field =
    source ??
    (reference
      ? (numericSource(reference, context.tableScope) ??
        scalarSource(reference, context.tableScope))
      : undefined);
  const decoder = getDatabaseDriverRuntime(context.client)?.query
    ?.decodeScalarResult;
  if (!field) return;
  if (field.type === 'json') {
    const jsonResults = getDatabaseDriverRuntime(context.client)?.repository
      ?.jsonResults;
    resultMap.scalarDecoders?.set(physicalKey, (value) =>
      decodeJsonValue(value, jsonResults, field),
    );
    return;
  }
  if (field.type === 'boolean') {
    resultMap.scalarDecoders?.set(physicalKey, (value) =>
      decodeBooleanValue(field, value),
    );
    return;
  }
  if (isTemporalType(field.type)) {
    resultMap.scalarDecoders?.set(physicalKey, (value) =>
      normalizeTemporalResultValue(field, value),
    );
    return;
  }
  if (!decoder) return;
  resultMap.scalarDecoders?.set(physicalKey, (value) =>
    decoder({ field, value }),
  );
}

function addCollectionScalarDecoders(
  resultMap: ResultMap,
  context: ExpressionCompileContext,
  tableName?: string,
): void {
  const collection = collectionForTable(
    context.tableScope,
    tableName ?? context.tableScope.tables?.[0],
  );
  if (!collection) return;
  for (const field of collection.fields ?? []) {
    if ('target' in field) continue;
    addScalarDecoder(
      resultMap,
      context,
      mapIdentifier(field.name, context.naming),
      undefined,
      field,
    );
  }
}

function collectionForTable(
  scope: TableScope,
  tableName: string | undefined,
): CollectionDefinition | undefined {
  if (!tableName) return undefined;
  const parsed = parseAliasedIdentifier(tableName);
  const direct = scope.numericCollections?.get(parsed.identifier);
  if (direct) return direct;
  const matchingTable = scope.tables?.find((table) => {
    const candidate = parseAliasedIdentifier(table);
    return candidate.alias === parsed.identifier;
  });
  return matchingTable
    ? scope.numericCollections?.get(
        parseAliasedIdentifier(matchingTable).identifier,
      )
    : undefined;
}

function scalarSource(
  reference: string,
  scope: TableScope,
): FieldDefinition | undefined {
  const parts = reference.split('.');
  const name = parts.pop();
  const qualifier = parts.join('.');
  for (const table of scope.tables ?? []) {
    const parsed = parseAliasedIdentifier(table);
    if (qualifier && qualifier !== (parsed.alias ?? parsed.identifier))
      continue;
    const collection = scope.numericCollections?.get(parsed.identifier);
    const field = collection?.fields?.find(
      (candidate) => candidate.name === name && !('target' in candidate),
    );
    if (field) return field as FieldDefinition;
    if (qualifier) return undefined;
  }
  return scope.parent ? scalarSource(reference, scope.parent) : undefined;
}

function normalizeRows(rows: unknown): Row[] {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows as Row[];
}

function normalizeComparisonOperator(
  operator: ComparisonOperator,
): ComparisonOperator {
  const normalized = operator.toLowerCase().trim() as ComparisonOperator;
  switch (normalized) {
    case '=':
    case '!=':
    case '<>':
    case '>':
    case '>=':
    case '<':
    case '<=':
    case 'in':
    case 'not in':
    case 'is':
    case 'is not':
    case 'like':
    case 'not like':
      return normalized;
    default:
      throw new Error(
        `Unsupported portable comparison operator "${operator}".`,
      );
  }
}

function invertComparisonOperator(
  operator: ComparisonOperator,
): ComparisonOperator {
  switch (operator) {
    case '=':
      return '!=';
    case '!=':
    case '<>':
      return '=';
    case '>':
      return '<=';
    case '>=':
      return '<';
    case '<':
      return '>=';
    case '<=':
      return '>';
    case 'in':
      return 'not in';
    case 'not in':
      return 'in';
    case 'is':
      return 'is not';
    case 'is not':
      return 'is';
    case 'like':
      return 'not like';
    case 'not like':
      return 'like';
    default:
      return assertNever(operator);
  }
}

function normalizeInsertResult(
  result: unknown,
  data: Row | readonly Row[],
): InsertResult {
  const insertedCount = Array.isArray(data) ? data.length : 1;
  if (Array.isArray(result)) {
    if (result.every(isPlainObject)) {
      return { insertedCount, rows: result };
    }
    return { insertedCount, insertId: result[0] };
  }
  return { insertedCount, insertId: result };
}

function normalizeUpdateResult(result: unknown): UpdateResult {
  if (Array.isArray(result)) {
    if (result.every(isPlainObject)) {
      return { updatedCount: result.length, rows: result };
    }
    return { updatedCount: result.length };
  }
  if (typeof result === 'number') {
    return { updatedCount: result };
  }
  return {};
}

function normalizeDeleteResult(result: unknown): DeleteResult {
  if (Array.isArray(result)) {
    if (result.every(isPlainObject)) {
      return { deletedCount: result.length, rows: result };
    }
    return { deletedCount: result.length };
  }
  if (typeof result === 'number') {
    return { deletedCount: result };
  }
  return {};
}

function isPlainObject(value: unknown): value is Row {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertRightJoinReference(
  reference: ReferenceExpression | undefined,
): ReferenceExpression {
  if (reference === undefined) {
    throw new Error(
      'join() expects either a callback or (table, leftRef, rightRef).',
    );
  }
  return reference;
}

function isUnderscoredNaming(naming: NamingStrategy): boolean {
  return naming.fieldToColumnName('createdAt') === 'created_at';
}

function camelCase(value: string): string {
  return value.replace(/_([a-z0-9])/g, (_, letter: string) =>
    letter.toUpperCase(),
  );
}

function lastReferenceSegment(reference: string): string {
  return reference.split('.').at(-1) ?? reference;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${JSON.stringify(value)}`);
}

function selectionAggregates(
  selections: readonly SelectItem[],
): Map<string, Extract<ExpressionNode, { type: 'aggregate' }>> {
  const result = new Map<
    string,
    Extract<ExpressionNode, { type: 'aggregate' }>
  >();
  for (const item of selections) {
    if (item.type !== 'selection' || typeof item.selection === 'string')
      continue;
    const node = getExpressionNode(item.selection);
    if (
      node.type === 'aliasedExpression' &&
      node.expression.type === 'aggregate'
    )
      result.set(node.alias, node.expression);
  }
  return result;
}

function operandIsDecimalAggregate(
  operand: OperandNode,
  context: ExpressionCompileContext,
): boolean {
  if (operand.type === 'subquery') return operand.query.numericResult();
  const node =
    operand.type === 'ref'
      ? context.tableScope.aggregates?.get(operand.reference)
      : operand.type === 'expression'
        ? operand.expression
        : undefined;
  if (node?.type === 'subquery') return node.query.numericResult();
  return node?.type === 'aggregate' && ['sum', 'avg'].includes(node.fn);
}

async function prepareAggregateDecoder(
  selections: readonly SelectItem[],
  tables: string[],
  lookup?: CollectionLookup,
): Promise<(row: Row) => Row> {
  const decoders = new Map<string, (value: unknown) => unknown>();
  for (const item of selections) {
    if (item.type !== 'selection' || typeof item.selection === 'string')
      continue;
    const node = getExpressionNode(item.selection);
    if (node.type !== 'aliasedExpression') continue;
    if (node.expression.type === 'decimalResult') {
      decoders.set(node.alias, decimalString);
      continue;
    }
    if (node.expression.type === 'subquery') {
      decoders.set(
        node.alias,
        await node.expression.query.resultDecoder(lookup),
      );
      continue;
    }
    if (node.expression.type !== 'aggregate') continue;
    const expression = node.expression;
    let source: FieldDefinition | undefined;
    if (
      lookup &&
      expression.operand?.type === 'ref' &&
      ['min', 'max', 'sum', 'avg'].includes(expression.fn)
    ) {
      const parts = expression.operand.reference.split('.');
      const name = parts.pop()!;
      const qualifier = parts.join('.');
      for (const table of tables) {
        const parsed = parseAliasedIdentifier(table);
        if (qualifier && qualifier !== (parsed.alias ?? parsed.identifier))
          continue;
        const collection = await lookup(parsed.identifier);
        const field = collection?.fields?.find(
          (field) => field.name === name && !('target' in field),
        );
        if (field) {
          source = field as FieldDefinition;
          break;
        }
      }
    }
    const kind = expression.fn === 'countAll' ? 'count' : expression.fn;
    decoders.set(node.alias, (value) => decodeAggregate(kind, value, source));
  }
  if (decoders.size === 0) return (row) => row;
  return (row) => {
    for (const [key, decode] of decoders) {
      if (Object.hasOwn(row, key)) row[key] = decode(row[key]);
    }
    return row;
  };
}

async function decimalField(
  reference: string,
  tables: string[],
  lookup?: CollectionLookup,
): Promise<boolean> {
  if (!lookup) return false;
  const parts = reference.split('.');
  const name = parts.pop();
  const qualifier = parts.join('.');
  for (const table of tables) {
    const parsed = parseAliasedIdentifier(table);
    if (qualifier && qualifier !== (parsed.alias ?? parsed.identifier))
      continue;
    const collection = await lookup(parsed.identifier);
    const field = collection?.fields?.find((field) => field.name === name);
    if (field) return ['bigInt', 'decimal'].includes(field.type);
  }
  return false;
}

async function selectionIsDecimal(
  selection: SelectionExpression,
  tables: string[],
  lookup?: CollectionLookup,
): Promise<boolean> {
  if (typeof selection === 'string')
    return decimalField(
      parseAliasedIdentifier(selection).identifier,
      tables,
      lookup,
    );
  let node = getExpressionNode(selection);
  if (node.type === 'aliasedExpression') node = node.expression;
  if (node.type === 'ref') return decimalField(node.reference, tables, lookup);
  if (
    node.type === 'aggregate' &&
    ['min', 'max'].includes(node.fn) &&
    node.operand?.type === 'ref'
  )
    return decimalField(node.operand.reference, tables, lookup);
  if (node.type === 'subquery')
    return node.query.hasDecimalResult(lookup, tables);
  return false;
}

/** Cast only selected result values; predicates and inner SQL keep numeric types. */
async function prepareDecimalSelections(
  selections: readonly SelectItem[],
  tables: string[],
  lookup?: CollectionLookup,
): Promise<SelectItem[]> {
  if (!lookup) return [...selections];
  const expanded: SelectItem[] = [];
  for (const item of selections.length
    ? selections
    : [{ type: 'all' } as SelectItem]) {
    const star =
      item.type === 'all'
        ? item.table
          ? `${item.table}.*`
          : '*'
        : typeof item.selection === 'string' &&
            (item.selection === '*' || item.selection.endsWith('.*'))
          ? item.selection
          : undefined;
    if (!star) {
      expanded.push(item);
      continue;
    }
    const matching = tables.filter((table) => {
      const parsed = parseAliasedIdentifier(table);
      return (
        star === '*' ||
        star.slice(0, -2) === (parsed.alias ?? parsed.identifier)
      );
    });
    if (matching.length === 0) {
      expanded.push(item);
      continue;
    }
    for (const table of matching) {
      const parsed = parseAliasedIdentifier(table);
      const collection = await lookup(parsed.identifier);
      if (
        !collection?.fields?.some((field) =>
          [
            'integer',
            'increments',
            'bigInt',
            'decimal',
            'float',
            'double',
          ].includes(field.type),
        )
      ) {
        expanded.push({
          type: 'all',
          table: parsed.alias ?? parsed.identifier,
        });
        continue;
      }
      for (const field of collection.fields) {
        if ('target' in field) continue;
        expanded.push({
          type: 'selection',
          selection: `${parsed.alias ?? parsed.identifier}.${field.name}`,
        });
      }
    }
  }
  const result: SelectItem[] = [];
  for (const item of expanded) {
    if (
      item.type !== 'selection' ||
      !(await selectionIsDecimal(item.selection, tables, lookup))
    ) {
      result.push(item);
      continue;
    }
    const node =
      typeof item.selection === 'string'
        ? {
            type: 'aliasedExpression' as const,
            alias: logicalResultKeyForSelection(item.selection),
            expression: {
              type: 'ref' as const,
              reference: parseAliasedIdentifier(item.selection).identifier,
            },
          }
        : getExpressionNode(item.selection);
    if (node.type !== 'aliasedExpression') {
      result.push(item);
      continue;
    }
    result.push({
      type: 'selection',
      selection: createAliasedExpression(
        { type: 'decimalResult', expression: node.expression },
        node.alias,
      ),
    });
  }
  return result;
}

interface MutationCollection {
  readonly definition: CollectionDefinition;
  /** The table scope's Collections, so a where clause resolves the Fields it compares. */
  readonly scope: ReadonlyMap<string, CollectionDefinition>;
}

/**
 * The Collection behind an update or delete, resolved once: its Fields decide how the written values are
 * encoded, and its where clause binds a compared value the way a write to the Field binds it, as a select's does.
 */
async function mutationCollection(
  lookup: CollectionLookup | undefined,
  table: string,
): Promise<MutationCollection | undefined> {
  if (!lookup) return undefined;
  const identifier = parseAliasedIdentifier(table).identifier;
  const definition = await lookup(identifier);
  return definition
    ? { definition, scope: new Map([[identifier, definition]]) }
    : undefined;
}

/** Prepare schema only for adapters needing aggregate input types; PG/MySQL bypass this. */
async function collectNumericCollections(
  state: SelectState,
  table: string,
  lookup: CollectionLookup,
  collections = new Map<string, CollectionDefinition>(),
): Promise<Map<string, CollectionDefinition>> {
  for (const name of [table, ...state.joins.map((join) => join.table)]) {
    const identifier = parseAliasedIdentifier(name).identifier;
    if (!collections.has(identifier)) {
      const collection = await lookup(identifier);
      if (collection) collections.set(identifier, collection);
    }
  }
  const visit = async (node: ExpressionNode | OperandNode): Promise<void> => {
    if (node.type === 'subquery' || node.type === 'exists') {
      await node.query.collectNumericCollections(lookup, collections);
    } else if (node.type === 'binary') {
      await visit(node.lhs);
      await visit(node.rhs);
    } else if (node.type === 'and' || node.type === 'or') {
      for (const expression of node.expressions) await visit(expression);
    } else if (
      node.type === 'not' ||
      node.type === 'parens' ||
      node.type === 'aliasedExpression' ||
      node.type === 'decimalResult' ||
      node.type === 'expression' ||
      node.type === 'between'
    ) {
      await visit(node.expression);
    }
  };
  for (const item of state.selections) {
    if (item.type === 'selection' && typeof item.selection !== 'string')
      await visit(getExpressionNode(item.selection));
  }
  for (const expression of [
    ...state.where,
    ...state.having,
    ...state.joins.flatMap((join) => join.conditions),
  ])
    await visit(expression);
  return collections;
}

function numericSource(
  reference: string,
  scope: TableScope,
): FieldDefinition | undefined {
  const parts = reference.split('.');
  const name = parts.pop();
  const qualifier = parts.join('.');
  for (const table of scope.tables ?? []) {
    const parsed = parseAliasedIdentifier(table);
    if (qualifier && qualifier !== (parsed.alias ?? parsed.identifier))
      continue;
    const collection = scope.numericCollections?.get(parsed.identifier);
    const field = collection?.fields?.find(
      (field) => field.name === name && !('target' in field),
    );
    if (field) return field as FieldDefinition;
    if (qualifier) return undefined;
  }
  return scope.parent ? numericSource(reference, scope.parent) : undefined;
}

function memoizedCollectionLookup(
  lookup?: CollectionLookup,
): CollectionLookup | undefined {
  if (!lookup) return undefined;
  const cache = new Map<string, ReturnType<CollectionLookup>>();
  return (name) => {
    let value = cache.get(name);
    if (!value) {
      value = lookup(name);
      cache.set(name, value);
    }
    return value;
  };
}
