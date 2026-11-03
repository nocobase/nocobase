# Driver and runtime extension: signatures

Implement dialect descriptors and runtime strategies, inspect capabilities, or perform explicit physical-row upserts. These are low-level extension contracts, not the usual application CRUD entry points.

[Chapter](../driver-extension.md) · [Contents](../README.md) · [All exports](../exports.md)

Signatures below are extracted from declaration output. Generic parameters, overloads, optional properties and JSDoc describe the declared contract. Type-only exports cannot be imported as runtime constructors. Supporting contracts are reachable from signatures but are not package-entry exports; do not deep-import them. Private members are omitted; protected hooks are shown only for exported runtime classes.

| Declaration                                                             | Access               |
| ----------------------------------------------------------------------- | -------------------- |
| [DatabaseCapabilities](#databasecapabilities)                           | `@nocobase/db` type  |
| [DatabaseDriverDefinition](#databasedriverdefinition)                   | `@nocobase/db` type  |
| [DatabaseDriverFactory](#databasedriverfactory)                         | `@nocobase/db` type  |
| [DatabaseDriverRegistration](#databasedriverregistration)               | `@nocobase/db` type  |
| [DatabaseDriverRuntime](#databasedriverruntime)                         | `@nocobase/db` type  |
| [DatabaseDriverRuntimeContext](#databasedriverruntimecontext)           | `@nocobase/db` type  |
| [DatabaseDriverRuntimeFactory](#databasedriverruntimefactory)           | `@nocobase/db` type  |
| [DatabaseNumericRuntimeStrategy](#databasenumericruntimestrategy)       | `@nocobase/db` type  |
| [DatabaseQueryRuntimeStrategy](#databasequeryruntimestrategy)           | `@nocobase/db` type  |
| [DatabaseRepositoryRuntimeStrategy](#databaserepositoryruntimestrategy) | `@nocobase/db` type  |
| [DatabaseSchemaRuntimeStrategy](#databaseschemaruntimestrategy)         | `@nocobase/db` type  |
| [RuntimeNumericAggregate](#runtimenumericaggregate)                     | Supporting contract  |
| [SchemaAdapter](#schemaadapter)                                         | Supporting contract  |
| [UnsupportedCapabilityError](#unsupportedcapabilityerror)               | `@nocobase/db` value |
| [UpsertPhysicalRowOptions](#upsertphysicalrowoptions)                   | `@nocobase/db` type  |
| [resolveDatabaseDriver](#resolvedatabasedriver)                         | `@nocobase/db` value |
| [upsertPhysicalRow](#upsertphysicalrow)                                 | `@nocobase/db` value |

## DatabaseCapabilities

[Source](../../../src/schema/adapter.ts)

Import: `import type { DatabaseCapabilities } from '@nocobase/db'`.

```ts
export interface DatabaseCapabilities {
  schemas: boolean;
  views: boolean;
  replaceView: boolean;
  materializedViews: boolean;
  refreshMaterializedViews: boolean;
  foreignKeys: boolean;
  deferrableConstraints: boolean;
  partialIndexes: boolean;
  nativeTypes: boolean;
  comments: boolean;
}
```

## DatabaseDriverDefinition

[Source](../../../src/database/config.ts)

Import: `import type { DatabaseDriverDefinition } from '@nocobase/db'`.

A Dialect package's public driver descriptor. Core owns orchestration while the descriptor owns native-driver, Knex, SQL, value, Inspector, and application-composition behavior for one Dialect. The hooks are methods rather than function properties on purpose: TypeScript checks method parameters bivariantly, which is what lets a driver narrowed to its own connection type sit in the heterogeneous `drivers` map. What that gives up is a pairing the runtime enforces anyway — `resolveConnectionDriver` finds a driver by the connection's own dialect, so a driver is only ever handed a config of the dialect it declares. `TConfig` is the connection shape this driver reads. A dialect package names its own, and its hooks then receive that shape instead of one it has to assert its way out of — which is what every contributed dialect had to do, `dameng` through `source as unknown as DamengConnectionConfig`. The default is any connection, which is what the core call sites hold.

```ts
/**
 * A Dialect package's public driver descriptor. Core owns orchestration while
 * the descriptor owns native-driver, Knex, SQL, value, Inspector, and
 * application-composition behavior for one Dialect.
 *
 * The hooks are methods rather than function properties on purpose: TypeScript
 * checks method parameters bivariantly, which is what lets a driver narrowed to
 * its own connection type sit in the heterogeneous `drivers` map. What that
 * gives up is a pairing the runtime enforces anyway — `resolveConnectionDriver`
 * finds a driver by the connection's own dialect, so a driver is only ever
 * handed a config of the dialect it declares.
 *
 * `TConfig` is the connection shape this driver reads. A dialect package names
 * its own, and its hooks then receive that shape instead of one it has to
 * assert its way out of — which is what every contributed dialect had to do,
 * `dameng` through `source as unknown as DamengConnectionConfig`. The default
 * is any connection, which is what the core call sites hold.
 */
export interface DatabaseDriverDefinition<
  TDialect extends string = string,
  TConfig extends AnyConnectionConfig = AnyConnectionConfig,
> {
  readonly dialect: TDialect;
  readonly packageName?: string;
  /** Native driver package name owned by the dialect package. */
  readonly nativeDriver?: string;
  readonly knexClient?: string;
  /** Resolves the base Knex dialect class without core dialect knowledge. */
  readonly resolveKnexClient?: () => typeof Knex.Client;
  /** Capabilities supplied by the dialect package for this connection. */
  readonly capabilities?: Partial<DatabaseCapabilities>;
  /** Creates the runtime strategy object used by the core adapters. */
  readonly createRuntime?: DatabaseDriverRuntimeFactory;
  createKnexClient?(
    config: TConfig,
    baseClient?: typeof Knex.Client,
  ): string | typeof Knex.Client;
  resolveConnection?(config: TConfig): {
    connection: unknown;
    searchPath?: string[];
    useNullAsDefault?: boolean;
  };
  createSchemaInspector?(context: {
    connectionName: string;
    config: TConfig;
    resolveClient: () => Promise<Knex>;
  }): SchemaInspector;
  /**
   * Applies application-level defaults and path normalization owned by the
   * dialect package. The core database manager only consumes the resulting
   * connection and never needs to know dialect-specific defaults.
   */
  normalizeConnection?(
    config: TConfig,
    context: {
      resolveStoragePath?: (filename: string) => string;
    },
  ): TConfig;
  /**
   * Returns a stable identity for managed-database ownership checks. Drivers
   * may return `undefined` for connections that do not have a local target
   * (for example an in-memory database).
   */
  resolveOwnershipTarget?(config: TConfig): readonly unknown[] | undefined;
  /**
   * Clears the objects owned by a managed connection while preserving the
   * database and its target schema. Used by the explicit destructive
   * migration reset command.
   */
  resetManagedSchema?(context: {
    connectionName: string;
    config: TConfig;
    resolveClient: () => Promise<Knex>;
  }): void | Promise<void>;
  /**
   * Prepares any local storage required before a connection is opened.
   * Application hosts provide the filesystem operation; drivers own the
   * decision about whether it is needed.
   */
  prepareStorage?(
    config: TConfig,
    context: {
      ensureDirectory: (directory: string) => Promise<void>;
    },
  ): void | Promise<void>;
  /**
   * Whether the local storage a connection opens exists already. Opening a
   * connection to missing storage creates it, so a caller that must change
   * nothing, such as a dry run, asks first and treats missing storage as an
   * empty database. Drivers without local storage omit it.
   */
  hasStorage?(config: TConfig): boolean | Promise<boolean>;
  configurePool?(config: TConfig, pool: Knex.PoolConfig): Knex.PoolConfig;
}
```

Related declarations: [AnyConnectionConfig](./connection.md#anyconnectionconfig), [DatabaseCapabilities](./drivers.md#databasecapabilities), [DatabaseDriverRuntimeFactory](./drivers.md#databasedriverruntimefactory), [SchemaInspector](./schema.md#schemainspector).

## DatabaseDriverFactory

[Source](../../../src/database/config.ts)

Import: `import type { DatabaseDriverFactory } from '@nocobase/db'`.

Factory exported by a dialect package. A factory returns a connection config with the package's driver already attached, while its `.driver` property is the descriptor used by declarative registrations.

```ts
/**
 * Factory exported by a dialect package.  A factory returns a connection
 * config with the package's driver already attached, while its `.driver`
 * property is the descriptor used by declarative registrations.
 */
export interface DatabaseDriverFactory<
  TDialect extends string = string,
  TOptions extends object = object,
  TConfig extends AnyConnectionConfig = AnyConnectionConfig,
> {
  (options?: TOptions): TConfig & {
    dialect: TDialect;
    databaseDriver: DatabaseDriverDefinition<TDialect, TConfig>;
  };
  readonly dialect: TDialect;
  readonly driver: DatabaseDriverDefinition<TDialect, TConfig>;
}
```

Related declarations: [AnyConnectionConfig](./connection.md#anyconnectionconfig), [DatabaseDriverDefinition](./drivers.md#databasedriverdefinition).

## DatabaseDriverRegistration

[Source](../../../src/database/config.ts)

Import: `import type { DatabaseDriverRegistration } from '@nocobase/db'`.

```ts
export type DatabaseDriverRegistration<
  TDialect extends string = string,
  TConfig extends AnyConnectionConfig = AnyConnectionConfig,
> =
  | DatabaseDriverDefinition<TDialect, TConfig>
  | DatabaseDriverFactory<TDialect, object, TConfig>;
```

Related declarations: [AnyConnectionConfig](./connection.md#anyconnectionconfig), [DatabaseDriverDefinition](./drivers.md#databasedriverdefinition), [DatabaseDriverFactory](./drivers.md#databasedriverfactory).

## DatabaseDriverRuntime

[Source](../../../src/database/runtime.ts)

Import: `import type { DatabaseDriverRuntime } from '@nocobase/db'`.

Runtime strategy container supplied by a dialect package. The strategy groups are intentionally optional and structurally extensible. Individual migration stages can add narrowly scoped hooks without forcing every dialect package to implement unrelated behavior.

```ts
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
```

Related declarations: [DatabaseCapabilities](./drivers.md#databasecapabilities), [DatabaseNumericRuntimeStrategy](./drivers.md#databasenumericruntimestrategy), [DatabaseQueryRuntimeStrategy](./drivers.md#databasequeryruntimestrategy), [DatabaseRepositoryRuntimeStrategy](./drivers.md#databaserepositoryruntimestrategy), [DatabaseSchemaRuntimeStrategy](./drivers.md#databaseschemaruntimestrategy).

## DatabaseDriverRuntimeContext

[Source](../../../src/database/runtime.ts)

Import: `import type { DatabaseDriverRuntimeContext } from '@nocobase/db'`.

The resolved runtime context handed to a dialect package. A dialect owns the behavior that varies between database engines. The context deliberately exposes the resolved Knex connection rather than making dialect packages rediscover connection state from the raw config.

```ts
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
```

Related declarations: [ConnectionConfig](./connection.md#connectionconfig), [DatabaseCapabilities](./drivers.md#databasecapabilities), [KnexConnectionConfig](./testing.md#knexconnectionconfig).

## DatabaseDriverRuntimeFactory

[Source](../../../src/database/runtime.ts)

Import: `import type { DatabaseDriverRuntimeFactory } from '@nocobase/db'`.

```ts
export type DatabaseDriverRuntimeFactory = (
  context: DatabaseDriverRuntimeContext,
) => DatabaseDriverRuntime;
```

Related declarations: [DatabaseDriverRuntime](./drivers.md#databasedriverruntime), [DatabaseDriverRuntimeContext](./drivers.md#databasedriverruntimecontext).

## DatabaseNumericRuntimeStrategy

[Source](../../../src/database/runtime.ts)

Import: `import type { DatabaseNumericRuntimeStrategy } from '@nocobase/db'`.

```ts
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
```

Related declarations: [FieldDefinition](./builder.md#fielddefinition), [RuntimeNumericAggregate](./drivers.md#runtimenumericaggregate).

## DatabaseQueryRuntimeStrategy

[Source](../../../src/database/runtime.ts)

Import: `import type { DatabaseQueryRuntimeStrategy } from '@nocobase/db'`.

```ts
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
```

Related declarations: [CollectionDefinition](./builder.md#collectiondefinition), [FieldDefinition](./builder.md#fielddefinition).

## DatabaseRepositoryRuntimeStrategy

[Source](../../../src/database/runtime.ts)

Import: `import type { DatabaseRepositoryRuntimeStrategy } from '@nocobase/db'`.

```ts
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
  }) => {
    handled: boolean;
    node?: FilterConditionNode;
  };
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
```

Related declarations: [AnyFieldDefinition](./builder.md#anyfielddefinition), [CollectionDefinition](./builder.md#collectiondefinition), [FieldDefinition](./builder.md#fielddefinition), [FilterConditionNode](./inputs.md#filterconditionnode), [FilterValue](./inputs.md#filtervalue), [JsonResultForm](./values.md#jsonresultform), [RepositoryRecord](./inputs.md#repositoryrecord).

## DatabaseSchemaRuntimeStrategy

[Source](../../../src/database/runtime.ts)

Import: `import type { DatabaseSchemaRuntimeStrategy } from '@nocobase/db'`.

```ts
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
  /**
   * The default a column is created or altered with, as an expression, in place of its `defaultValue`.
   *
   * Return one where the engine rejects the literal form, as MySQL does on a TEXT column, which takes a default only
   * as `default ('…')`. `undefined` keeps the literal default.
   *
   * Knex's MySQL column compiler drops any default, this expression included, from a column it built as `text()` or
   * `binary()`, because MySQL before 8.0.13 accepted none there. A dialect returning an expression for such a column
   * therefore also names the column's type through `columnType`: a column built through `specificType` keeps its
   * default. The MySQL dialect decides both from one place, `textDefaultType`, so the two answers cannot drift.
   */
  readonly columnDefault?: (context: {
    client: Knex;
    column: ColumnSchemaDefinition;
    altering: boolean;
  }) => Knex.Raw | undefined;
  readonly configureForeignKey?: (context: {
    foreign: any;
    constraint: PhysicalConstraintDefinition & {
      type: 'foreignKey';
    };
  }) => void;
  readonly buildPredicate?: (context: {
    client: Knex;
    predicate: FilterExpression;
  }) => Knex.QueryBuilder | undefined;
  readonly [key: string]: unknown;
}
```

Related declarations: [ColumnSchemaDefinition](./builder.md#columnschemadefinition), [FilterExpression](./builder.md#filterexpression), [PhysicalConstraintDefinition](./builder.md#physicalconstraintdefinition), [SchemaOperation](./builder.md#schemaoperation).

## RuntimeNumericAggregate

[Source](../../../src/database/runtime.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export type RuntimeNumericAggregate = 'count' | 'sum' | 'avg' | 'min' | 'max';
```

## SchemaAdapter

[Source](../../../src/schema/adapter.ts)

Access: supporting contract reached through a public signature; no package-entry import.

```ts
export interface SchemaAdapter {
  dialect?: string;
  capabilities?: DatabaseCapabilities;
  assertExecutable?(operations: SchemaOperation[]): void;
  execute(operations: SchemaOperation[]): Promise<void>;
  compile?(operations: SchemaOperation[]): Promise<string[]>;
}
```

Related declarations: [DatabaseCapabilities](./drivers.md#databasecapabilities), [SchemaOperation](./builder.md#schemaoperation).

## UnsupportedCapabilityError

[Source](../../../src/schema/capabilities.ts)

Import: `import { UnsupportedCapabilityError } from '@nocobase/db'`.

```ts
export declare class UnsupportedCapabilityError extends Error {
  readonly warnings: BuilderWarning[];
  constructor(warnings: BuilderWarning[]);
}
```

Related declarations: [BuilderWarning](./builder.md#builderwarning).

## UpsertPhysicalRowOptions

[Source](../../../src/database/upsert-physical-row.ts)

Import: `import type { UpsertPhysicalRowOptions } from '@nocobase/db'`.

```ts
export interface UpsertPhysicalRowOptions {
  /** Exact physical table name; connection naming and Collection metadata are not applied. */
  readonly table: string;
  /** Non-null columns backed by a primary key or unique constraint. */
  readonly key: Readonly<Row>;
  /** Raw database values for a new row, excluding key columns. */
  readonly create: Readonly<Row>;
  /** Raw database values to replace on an existing row, excluding key columns. */
  readonly update: Readonly<Row>;
}
```

Related declarations: [Row](./query.md#row).

## resolveDatabaseDriver

[Source](../../../src/database/resolve-driver.ts)

Import: `import { resolveDatabaseDriver } from '@nocobase/db'`.

Validate explicitly supplied drivers without loading packages.

```ts
/** Validate explicitly supplied drivers without loading packages. */
export declare function resolveDatabaseDriver(
  connection: ConnectionConfig,
  drivers?: Record<string, DatabaseDriverRegistration>,
  name?: string,
): DatabaseDriverDefinition | undefined;
```

Related declarations: [ConnectionConfig](./connection.md#connectionconfig), [DatabaseDriverDefinition](./drivers.md#databasedriverdefinition), [DatabaseDriverRegistration](./drivers.md#databasedriverregistration).

## upsertPhysicalRow

[Source](../../../src/database/upsert-physical-row.ts)

Import: `import { upsertPhysicalRow } from '@nocobase/db'`.

Upsert internal physical storage without registering a Collection. Values are already encoded for storage; use Repository for Collection-level conversion. The row lock lasts until the owning transaction completes. Deadlocks are retried up to five times only when this operation owns the transaction; callers supplying a transaction must retry their entire unit of work.

```ts
/**
 * Upsert internal physical storage without registering a Collection. Values are
 * already encoded for storage; use Repository for Collection-level conversion.
 * The row lock lasts until the owning transaction completes. Deadlocks are
 * retried up to five times only when this operation owns the transaction;
 * callers supplying a transaction must retry their entire unit of work.
 */
export declare function upsertPhysicalRow(
  connection: DatabaseConnection,
  options: UpsertPhysicalRowOptions,
): Promise<void>;
```

Related declarations: [DatabaseConnection](./connection.md#databaseconnection), [UpsertPhysicalRowOptions](./drivers.md#upsertphysicalrowoptions).
