import type { Knex } from 'knex';

import type { NamingOptions } from '../collection/types.js';
import type { CollectionMetadataStore } from '../metadata/document-store.js';
import type { DatabaseCapabilities } from '../schema/adapter.js';
import type { SchemaInspector } from '../schema/inspector/types.js';
import type { TransactionCallbackPhase } from './internal/transaction-callbacks.js';
import type { RepositoryEventErrorContext } from '../repository/events/types.js';
import type { DatabaseDriverRuntimeFactory } from './runtime.js';

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

export type CollectionMetadataStoreConfig =
  DirectoryCollectionMetadataStoreConfig;

/**
 * Any connection, whichever dialect declares it. The constraint every
 * connection-shaped type parameter in this package is written against.
 */
export interface ConnectionConfig extends BaseConnectionConfig {
  dialect: string;
}

/** Alias for the dialect-independent connection constraint. */
export type AnyConnectionConfig = ConnectionConfig;

/** Configuration over connection shapes supplied by dialect packages. */
export interface ExtensibleDatabaseConfig<
  TConnection extends AnyConnectionConfig = AnyConnectionConfig,
> {
  default?: string;
  /** Explicit driver factories or descriptors used by the synchronous manager. */
  drivers?: Record<string, DatabaseDriverRegistration>;
  connections: Record<string, TConnection>;
  metadataStore?: CollectionMetadataStore | CollectionMetadataStoreConfig;
}

/** Core configuration; use a connection type or drivers for dialect-specific checking. */
export type DatabaseConfig<
  TConnection extends ConnectionConfig = ConnectionConfig,
> = ExtensibleDatabaseConfig<TConnection>;

/** Extract the connection shape carried by a driver factory or descriptor. */
export type DriverConnectionConfig<TDriver> = TDriver extends {
  readonly driver: infer TDefinition;
}
  ? DriverConnectionConfig<TDefinition>
  : TDriver extends DatabaseDriverDefinition<string, infer TConnection>
    ? TConnection
    : never;

/** Every registration uses the driver's declared dialect, including unused entries. */
type ValidatedDriverRegistrations<
  TDrivers extends Record<string, DatabaseDriverRegistration>,
> = {
  [K in keyof TDrivers]: TDrivers[K] & { readonly dialect: K };
};

/** Connection shapes accepted by the registered driver factories or descriptors. */
export type ConnectionConfigFromDrivers<
  TDrivers extends Record<string, DatabaseDriverRegistration>,
> = DriverConnectionConfig<
  ValidatedDriverRegistrations<TDrivers>[keyof TDrivers]
>;

/** Declarative configuration checked against the application's registered drivers. */
export type DatabaseConfigFromDrivers<
  TDrivers extends Record<string, DatabaseDriverRegistration>,
> = Omit<DatabaseConfig<ConnectionConfigFromDrivers<TDrivers>>, 'drivers'> & {
  drivers: ValidatedDriverRegistrations<TDrivers>;
};

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

export type DatabaseDriverRegistration<
  TDialect extends string = string,
  TConfig extends AnyConnectionConfig = AnyConnectionConfig,
> =
  | DatabaseDriverDefinition<TDialect, TConfig>
  | DatabaseDriverFactory<TDialect, object, TConfig>;

/** Dialect identifiers are supplied by driver packages. */
export type DatabaseDialect = string;

export type SchemaManagementMode = 'managed' | 'external';

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

/** Native driver identifier supplied by a dialect package. */
export type DatabaseDriver = string;

export function defineDatabase<
  T extends ExtensibleDatabaseConfig<AnyConnectionConfig>,
>(config: T): T {
  return config;
}
