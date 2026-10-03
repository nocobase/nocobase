import type { Knex } from 'knex';
import type { JsonResultForm } from '../json.js';
import type { DatabaseCapabilities } from '../schema/adapter.js';
import type { ConnectionConfig } from './config.js';
import type { KnexConnectionConfig } from './internal/knex/config.js';
import type { FieldDefinition } from '../collection/types.js';
import type {
  ColumnSchemaDefinition,
  FilterExpression,
  PhysicalConstraintDefinition,
  SchemaOperation,
} from '../collection/types.js';
import type {
  AnyFieldDefinition,
  CollectionDefinition,
} from '../collection/types.js';
import type {
  FilterConditionNode,
  FilterValue,
  RepositoryRecord,
} from '../repository/types.js';

export type RuntimeNumericAggregate = 'count' | 'sum' | 'avg' | 'min' | 'max';

/**
 * The resolved runtime context handed to a dialect package.
 *
 * A dialect owns the behavior that varies between database engines.  The
 * context deliberately exposes the resolved Knex connection rather than
 * making dialect packages rediscover connection state from the raw config.
 */
export interface DatabaseDriverRuntimeContext {
  readonly dialect: string;
  readonly sourceConfig: ConnectionConfig;
  readonly config: KnexConnectionConfig;
  readonly capabilities: DatabaseCapabilities;
  readonly getClient: () => Knex;
  readonly resolveClient: () => Promise<Knex>;
}

/**
 * Runtime strategy container supplied by a dialect package.
 *
 * The strategy groups are intentionally optional and structurally extensible.
 * Individual migration stages can add narrowly scoped hooks without forcing
 * every dialect package to implement unrelated behavior.
 */
export interface DatabaseDriverRuntime {
  readonly dialect: string;
  readonly capabilities: DatabaseCapabilities;
  readonly query?: DatabaseQueryRuntimeStrategy;
  readonly repository?: DatabaseRepositoryRuntimeStrategy;
  readonly schema?: DatabaseSchemaRuntimeStrategy;
  readonly numeric?: DatabaseNumericRuntimeStrategy;
}

export interface DatabaseQueryRuntimeStrategy {
  readonly insertManyFallback?: (collection: CollectionDefinition) => boolean;
  readonly configureAggregateResults?: (context: {
    query: Knex.QueryBuilder;
    aliases: ReadonlySet<string>;
  }) => void;
  readonly decodeScalarResult?: (context: {
    field: FieldDefinition;
    value: unknown;
  }) => unknown;
  readonly wrapAggregateOrdering?: (context: {
    client: Knex;
    ordering: Knex.Raw;
    functionName: string;
  }) => Knex.Raw;
  readonly decimalAggregateKey?: (context: {
    client: Knex;
    value: Knex.Raw;
  }) => Knex.Raw;
  readonly [key: string]: unknown;
}

export interface DatabaseRepositoryRuntimeStrategy {
  readonly streamOptions?: (client: Knex) => object;
  readonly decodeStreamRow?: (
    row: RepositoryRecord,
  ) => Promise<RepositoryRecord> | RepositoryRecord;
  /**
   * Decode a raw row returned by a mutation RETURNING clause before repository
   * mapping, selector derivation, or any dialect-specific reload.
   */
  readonly decodeReturnedRow?: (
    row: RepositoryRecord,
  ) => Promise<RepositoryRecord> | RepositoryRecord;
  readonly trimCharResults?: boolean;
  /**
   * How the driver hands back a `json` column.
   *
   * A driver that parses JSON itself returns the decoded value; everything
   * else returns the stored text. The value alone cannot tell the two apart:
   * a JSON string whose content is itself JSON decodes to a string under one
   * assumption and to an object under the other, so the dialect declares
   * which it is rather than letting the decoder guess. Defaults to `'text'`.
   */
  readonly jsonResults?: JsonResultForm;
  readonly groupAggregateOrder?: (context: {
    client: Knex;
    value: string | Knex.Raw;
    aggregate: string | undefined;
  }) => string | Knex.Raw;
  readonly createManyFallback?: (collection: CollectionDefinition) => boolean;
  /**
   * Whether one multi-row `INSERT … RETURNING` hands back every inserted row,
   * decodable the way a single-row RETURNING is. A `createMany` that must
   * report generated keys to a Repository mutation event then stays one
   * statement; without it the rows are inserted one by one.
   */
  readonly insertManyReturning?: boolean;
  readonly emptyInsertValue?: (context: {
    client: Knex;
    collection: CollectionDefinition;
    column: (field: string) => string;
  }) => Record<string, Knex.Raw> | undefined;
  readonly reloadReturnedDecimal?: boolean;
  readonly reloadReturnedExactNumeric?: boolean;
  readonly enumGroupKey?: (context: {
    client: Knex;
    field: string;
  }) => Knex.Raw;
  readonly numericMutation?: (context: {
    client: Knex;
    field: AnyFieldDefinition | undefined;
    name: string;
    operation: string;
    operand: unknown;
  }) => Knex.Raw | undefined;
  readonly compileFilterCondition?: (context: {
    query: Knex.QueryBuilder;
    collection: CollectionDefinition;
    node: FilterConditionNode;
    field: FieldDefinition | undefined;
    name: string;
    client: Knex | undefined;
    boolean: 'and' | 'or';
  }) => { handled: boolean; node?: FilterConditionNode };
  readonly escapeLikePattern?: (value: string) => string;
  /**
   * Escape marker used together with SQL LIKE.  Most engines use `!` in the
   * portable repository compiler; dialects whose native syntax requires a
   * different marker (SQL Server uses `\`) declare it here.
   */
  readonly likeEscapeCharacter?: string;
  readonly bindValue?: (context: {
    client: Knex;
    collection: CollectionDefinition;
    field: FieldDefinition;
    value: FilterValue;
  }) => unknown;
  readonly collectionAliasKeyword?: string;
  readonly limitLockedQuery?: (query: Knex.QueryBuilder, client: Knex) => void;
  readonly relationAggregateProjection?: (context: {
    client: Knex;
    value: Knex.Raw;
    aggregate: string;
  }) => Knex.Raw;
  readonly binaryExpression?: (context: {
    client: Knex;
    field: FieldDefinition | undefined;
    value: unknown;
  }) => Knex.Raw | undefined;
  readonly binaryComparison?: (context: {
    client: Knex;
    field: FieldDefinition | undefined;
    name: string;
    operator: string;
    value: unknown;
  }) => Knex.Raw | undefined;
  readonly encodeBoolean?: (
    field: FieldDefinition,
    value: unknown,
  ) => boolean | number | null;
  readonly encodeBlobNull?: (client: Knex) => Knex.Raw | undefined;
  readonly temporalBinding?: (context: {
    client: Knex;
    field: FieldDefinition;
    value: unknown;
  }) => Knex.Raw | string | null;
  readonly temporalProjection?: (context: {
    client: Knex;
    field: FieldDefinition | undefined;
    reference: string | Knex.Raw;
  }) => Knex.Raw | Knex.Ref<string, Record<string, string>>;
  readonly compileJsonCondition?: (context: {
    client: Knex;
    column: string;
    node: FilterConditionNode;
  }) => Knex.Raw;
  readonly [key: string]: unknown;
}

export interface DatabaseSchemaRuntimeStrategy {
  readonly assertExecutable?: (operations: readonly SchemaOperation[]) => void;
  readonly normalizeOperation?: (
    operation: SchemaOperation,
    client: Knex,
  ) => Promise<SchemaOperation> | SchemaOperation;
  readonly dropIndexOperation?: (error: unknown) => boolean;
  readonly columnType?: (context: {
    column: ColumnSchemaDefinition;
    tablePrimaryKey: boolean;
    /**
     * True while the column is being redefined by an ALTER rather than
     * created. A type whose definition carries a constraint has to omit it
     * here, because the constraint the original definition created is still
     * in place and the engine may refuse a second one.
     */
    altering: boolean;
  }) => string | undefined;
  /**
   * Whether a JSON default has to reach Knex as encoded text rather than as
   * the value.
   *
   * Knex serializes a JSON default only for a column it built as `json()`.
   * MySQL depends on receiving the value, because an object or an array is
   * what makes it compile the expression form `default ('{"a":1}')` that the
   * engine requires. A dialect that builds the column as something else —
   * because JSON has no distinct type, or because the constraint attached to
   * that type cannot be repeated on an ALTER — loses that handling and gets
   * `[object Object]` unless it asks for the text instead.
   *
   * Defaults to passing the value through.
   */
  readonly encodeJsonDefault?: (context: { altering: boolean }) => boolean;
  readonly configureForeignKey?: (context: {
    foreign: any;
    constraint: PhysicalConstraintDefinition & { type: 'foreignKey' };
  }) => void;
  readonly buildPredicate?: (context: {
    client: Knex;
    predicate: FilterExpression;
  }) => Knex.QueryBuilder | undefined;
  readonly [key: string]: unknown;
}

export interface DatabaseNumericRuntimeStrategy {
  readonly aggregateSql?: (context: {
    client: Knex;
    kind: RuntimeNumericAggregate;
    field: string;
    distinct: boolean;
    source?: FieldDefinition;
  }) => Knex.Raw;
  readonly hasNativeResults?: boolean;
  readonly aggregateProjection?: (context: {
    client: Knex;
    expression: Knex.Raw;
    source?: FieldDefinition;
  }) => Knex.Raw;
}

export type DatabaseDriverRuntimeFactory = (
  context: DatabaseDriverRuntimeContext,
) => DatabaseDriverRuntime;

export function createDefaultDatabaseDriverRuntime(
  context: DatabaseDriverRuntimeContext,
): DatabaseDriverRuntime {
  return {
    dialect: context.dialect,
    capabilities: context.capabilities,
  };
}

const runtimeByClient = new WeakMap<object, DatabaseDriverRuntime>();

export function attachDatabaseDriverRuntime(
  client: Knex,
  runtime: DatabaseDriverRuntime,
): void {
  runtimeByClient.set(client, runtime);
  // Knex query builders expose their internal Client instance as
  // `query.client`, while the public database handle is the callable Knex
  // function.  Keep both identities associated with the dialect runtime so
  // value binding strategies also apply inside `where()` callbacks and
  // unique-selector reloads.
  const internalClient = (client as Knex & { client?: object }).client;
  if (internalClient) {
    runtimeByClient.set(internalClient, runtime);
    const config = (internalClient as { config?: object }).config;
    if (config) runtimeByClient.set(config, runtime);
  }
}

export function getDatabaseDriverRuntime(
  client: Knex,
): DatabaseDriverRuntime | undefined {
  return runtimeByClient.get(client);
}
