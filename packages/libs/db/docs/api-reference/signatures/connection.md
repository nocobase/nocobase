# Connection: signatures

Configure a connection, obtain its handles, manage its lifecycle and inspect native access. Permission, transaction and event semantics have dedicated chapters.

[Chapter](../connection.md) · [Contents](../README.md) · [All exports](../exports.md)

Signatures below are extracted from declaration output. Generic parameters, overloads, optional properties and JSDoc describe the declared contract. Type-only exports cannot be imported as runtime constructors. Supporting contracts are reachable from signatures but are not package-entry exports; do not deep-import them. Private members are omitted; protected hooks are shown only for exported runtime classes.

| Declaration                                                                       | Access               |
| --------------------------------------------------------------------------------- | -------------------- |
| [AnyConnectionConfig](#anyconnectionconfig)                                       | `@nocobase/db` type  |
| [BaseConnectionConfig](#baseconnectionconfig)                                     | `@nocobase/db` type  |
| [CollectionMetadataStoreConfig](#collectionmetadatastoreconfig)                   | `@nocobase/db` type  |
| [ConnectionConfig](#connectionconfig)                                             | `@nocobase/db` type  |
| [DatabaseConnection](#databaseconnection)                                         | `@nocobase/db` type  |
| [DatabaseDialect](#databasedialect)                                               | `@nocobase/db` type  |
| [DatabaseDriver](#databasedriver)                                                 | `@nocobase/db` type  |
| [DirectoryCollectionMetadataStoreConfig](#directorycollectionmetadatastoreconfig) | `@nocobase/db` type  |
| [SchemaManagementMode](#schemamanagementmode)                                     | `@nocobase/db` type  |
| [SchemaManagementNotAllowedError](#schemamanagementnotallowederror)               | `@nocobase/db` value |

## AnyConnectionConfig

[Source](../../../src/database/config.ts)

Import: `import type { AnyConnectionConfig } from '@nocobase/db'`.

Alias for the dialect-independent connection constraint.

```ts
/** Alias for the dialect-independent connection constraint. */
export type AnyConnectionConfig = ConnectionConfig;
```

Related declarations: [ConnectionConfig](./connection.md#connectionconfig).

## BaseConnectionConfig

[Source](../../../src/database/config.ts)

Import: `import type { BaseConnectionConfig } from '@nocobase/db'`.

```ts
export interface BaseConnectionConfig {
  /** Optional native driver name, checked against the registered descriptor. */
  driver?: string;
  naming?: NamingOptions;
  capabilities?: Partial<DatabaseCapabilities>;
  metadataStore?: CollectionMetadataStore | CollectionMetadataStoreConfig;
  onCollectionMetadataInvalidationError?: (error: unknown) => void;
  /**
   * Receives an error thrown by an `afterCommit` or `afterRollback` callback.
   * Without it the error becomes a `TRANSACTION_CALLBACK_FAILED` process
   * warning. Either way the transaction's outcome is unchanged.
   */
  onTransactionCallbackError?: (
    error: unknown,
    phase: TransactionCallbackPhase,
  ) => void;
  /**
   * Receives an error thrown by a Repository mutation `afterCommit` listener.
   * Without it the error becomes a `REPOSITORY_EVENT_LISTENER_FAILED` process
   * warning. Either way the write it was told about stays committed.
   */
  onRepositoryEventError?: (
    error: unknown,
    context: RepositoryEventErrorContext,
  ) => void;
  /**
   * How deep writes made by `inTransaction` listeners may nest: a write made
   * by a listener of a write made by a listener counts two. Beyond it the
   * write fails with `REPOSITORY_EVENT_RECURSION`. Defaults to 8.
   */
  repositoryEventMaxDepth?: number;
  schemaManagement?: SchemaManagementMode;
  /**
   * Physical tables on this connection that are NocoBase bookkeeping rather
   * than Collections — a migration or seed history or lock table given a
   * custom name. Tables under the `__nocobase_` prefix are recognised without
   * being listed; anything else the application names has to be declared here
   * or `collections.list()` and `scan()` report it as a Collection.
   */
  internalTables?: readonly string[];
  debug?: boolean;
  pool?: Knex.PoolConfig;
  driverOptions?: Record<string, unknown>;
  /** Driver supplied by a dialect factory (for example postgres({...})). */
  databaseDriver?: DatabaseDriverDefinition;
}
```

Related declarations: [CollectionMetadataStore](./metadata.md#collectionmetadatastore), [CollectionMetadataStoreConfig](./connection.md#collectionmetadatastoreconfig), [DatabaseCapabilities](./drivers.md#databasecapabilities), [DatabaseDriverDefinition](./drivers.md#databasedriverdefinition), [NamingOptions](./builder.md#namingoptions), [RepositoryEventErrorContext](./events.md#repositoryeventerrorcontext), [SchemaManagementMode](./connection.md#schemamanagementmode), [TransactionCallbackPhase](./transactions.md#transactioncallbackphase).

## CollectionMetadataStoreConfig

[Source](../../../src/database/config.ts)

Import: `import type { CollectionMetadataStoreConfig } from '@nocobase/db'`.

```ts
export type CollectionMetadataStoreConfig =
  DirectoryCollectionMetadataStoreConfig;
```

Related declarations: [DirectoryCollectionMetadataStoreConfig](./connection.md#directorycollectionmetadatastoreconfig).

## ConnectionConfig

[Source](../../../src/database/config.ts)

Import: `import type { ConnectionConfig } from '@nocobase/db'`.

Any connection, whichever dialect declares it. The constraint every connection-shaped type parameter in this package is written against.

```ts
/**
 * Any connection, whichever dialect declares it. The constraint every
 * connection-shaped type parameter in this package is written against.
 */
export interface ConnectionConfig extends BaseConnectionConfig {
  dialect: string;
}
```

Related declarations: [BaseConnectionConfig](./connection.md#baseconnectionconfig).

## DatabaseConnection

[Source](../../../src/database/connection.ts)

Import: `import type { DatabaseConnection } from '@nocobase/db'`.

```ts
export interface DatabaseConnection {
  name: string;
  driver: DatabaseDriver;
  /** Dialect identifier supplied by the registered driver package. */
  dialect: string;
  schemaManagement: SchemaManagementMode;
  capabilities: DatabaseCapabilities;
  /** Runtime strategies supplied by the registered dialect package. */
  runtime: DatabaseDriverRuntime;
  /** Collection schema and metadata builder. Uses Collection and Field logical names. */
  builder: CollectionBuilder;
  /** Resolved physical Schema plus supplemental Collection metadata. */
  collections: ConnectionCollections;
  /** Supplemental Collection metadata read and update service. */
  collectionMetadata: CollectionMetadataService;
  /** Database-layer query builder. Uses Connection naming but not Collection-level overrides. */
  query: QueryAdapter;
  repository<
    TRecord extends object = RepositoryRecord,
    TCreate extends object = Partial<TRecord>,
    TUpdate extends object = Partial<TRecord>,
  >(
    collection: string,
  ): Repository<TRecord, TCreate, TUpdate>;
  /** Create a RestrictedDatabase for one principal; unlisted collections are denied. */
  restrict<P, const TCollection extends string>(
    policies: DatabasePolicyMap<P, TCollection>,
    principal: P,
  ): RestrictedDatabase<TCollection>;
  /**
   * Bind a Policy per Collection for one principal.
   *
   * Binding lives here rather than on each Repository because a request
   * usually touches several Collections and takes fresh Repositories inside a
   * transaction; one place to bind keeps those Repository policies together.
   *
   * The returned connection retains raw database access and permits unlisted
   * collections. Use restrict() when those capabilities must not be exposed.
   */
  withPolicies<P>(
    policies: DatabasePolicyMap<P>,
    principal: P,
  ): ScopedDatabaseConnection;
  schema: SchemaAdapter;
  /** Read-only physical database schema introspection. Uses physical names. */
  schemaInspector: SchemaInspector;
  /** Escape hatch for the underlying adapter client. Prefer builder/query for portable code. */
  client<T = unknown>(): Promise<T>;
  connect(): Promise<this>;
  disconnect(): Promise<void>;
  reconnect(): Promise<this>;
  /** Destructively clears the objects owned by this managed connection. */
  resetManagedSchema(): Promise<void>;
  transaction<T>(
    fn: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T>;
  /**
   * Run `callback` once the outermost transaction this connection belongs to
   * has committed, after the Collection metadata changes it made are applied.
   *
   * Registered inside a savepoint, the callback waits for the outermost
   * commit and is dropped if the savepoint rolls back. Outside a transaction
   * it starts at once and is not awaited. `transaction()` resolves only after
   * every commit callback has finished. A callback that throws does not change
   * the outcome of the transaction; the error goes to the connection's
   * `onTransactionCallbackError`, or to a `TRANSACTION_CALLBACK_FAILED`
   * process warning.
   *
   * The transaction connection is finished when the callback runs. Write
   * through the root connection or a new transaction instead.
   */
  afterCommit(callback: () => void | Promise<void>): void;
  /**
   * Run `callback` with the error once the transaction or savepoint this
   * connection belongs to has rolled back, including when the commit itself
   * fails. Callbacks registered in a savepoint that was released run when the
   * enclosing transaction rolls back. Ignored outside a transaction.
   */
  afterRollback(callback: (error: unknown) => void | Promise<void>): void;
  /**
   * Observe the rows Repository writes change: every write method, nested
   * relation writes included, reports one event per call.
   *
   * Subscriptions belong to the root connection and are shared with its
   * transactions, so registering through a transaction connection observes
   * the whole connection, not only that transaction. Writes made through
   * `query`, `client()` or a migration or seed task are not observed, nor
   * are rows the database changes by itself, such as a cascading delete.
   * Events are delivered only in the process that made the write.
   *
   * Returns a function that removes the subscription.
   */
  onRepositoryMutation(
    options: RepositoryMutationSubscriptionOptions,
    listeners: RepositoryMutationListeners,
  ): () => void;
  /**
   * How a Repository call on `collection` would run given the subscriptions
   * matching that Collection: whether bulk writes lock rows to learn their
   * keys, which granularity events get, and whether an implicit transaction
   * is opened.
   */
  explainRepositoryEvents(
    options: ExplainRepositoryEventsOptions,
  ): Promise<RepositoryEventsExplanation>;
}
```

Related declarations: [CollectionBuilder](./builder.md#collectionbuilder), [CollectionMetadataService](./metadata.md#collectionmetadataservice), [ConnectionCollections](./collections.md#connectioncollections), [DatabaseCapabilities](./drivers.md#databasecapabilities), [DatabaseDriver](./connection.md#databasedriver), [DatabaseDriverRuntime](./drivers.md#databasedriverruntime), [DatabasePolicyMap](./policies.md#databasepolicymap), [ExplainRepositoryEventsOptions](./events.md#explainrepositoryeventsoptions), [QueryAdapter](./query.md#queryadapter), [Repository](./repository.md#repository), [RepositoryEventsExplanation](./events.md#repositoryeventsexplanation), [RepositoryMutationListeners](./events.md#repositorymutationlisteners), [RepositoryMutationSubscriptionOptions](./events.md#repositorymutationsubscriptionoptions), [RepositoryRecord](./inputs.md#repositoryrecord), [RestrictedDatabase](./policies.md#restricteddatabase), [SchemaAdapter](./drivers.md#schemaadapter), [SchemaInspector](./schema.md#schemainspector), [SchemaManagementMode](./connection.md#schemamanagementmode), [ScopedDatabaseConnection](./policies.md#scopeddatabaseconnection).

## DatabaseDialect

[Source](../../../src/database/config.ts)

Import: `import type { DatabaseDialect } from '@nocobase/db'`.

Dialect identifiers are supplied by driver packages.

```ts
/** Dialect identifiers are supplied by driver packages. */
export type DatabaseDialect = string;
```

## DatabaseDriver

[Source](../../../src/database/config.ts)

Import: `import type { DatabaseDriver } from '@nocobase/db'`.

Native driver identifier supplied by a dialect package.

```ts
/** Native driver identifier supplied by a dialect package. */
export type DatabaseDriver = string;
```

## DirectoryCollectionMetadataStoreConfig

[Source](../../../src/database/config.ts)

Import: `import type { DirectoryCollectionMetadataStoreConfig } from '@nocobase/db'`.

Declarative form of a Collection metadata store, for configuration that cannot carry an instance — a YAML file, or a literal in a test. The Manager resolves it once when the connection is first created.

```ts
/**
 * Declarative form of a Collection metadata store, for configuration that
 * cannot carry an instance — a YAML file, or a literal in a test. The Manager
 * resolves it once when the connection is first created.
 */
export interface DirectoryCollectionMetadataStoreConfig {
  readonly type: 'directory';
  /** Absolute path; a relative path resolves against the process working directory, so resolve it first. */
  readonly directory: string;
}
```

## SchemaManagementMode

[Source](../../../src/database/config.ts)

Import: `import type { SchemaManagementMode } from '@nocobase/db'`.

```ts
export type SchemaManagementMode = 'managed' | 'external';
```

## SchemaManagementNotAllowedError

[Source](../../../src/database/schema-management.ts)

Import: `import { SchemaManagementNotAllowedError } from '@nocobase/db'`.

```ts
export declare class SchemaManagementNotAllowedError extends Error {
  readonly connection: string;
  readonly operation: string;
  readonly code: 'SCHEMA_MANAGEMENT_NOT_ALLOWED';
  constructor(connection: string, operation: string);
}
```
