import type {
  AnyConnectionConfig,
  ChecksumMismatchPolicy,
  CollectionMetadataStore,
  CollectionMetadataStoreConfig,
  ConnectionConfig,
  ConnectionConfigFromDrivers,
  DatabaseConfigFromDrivers,
  DatabaseDriverRegistration,
  ExtensibleDatabaseConfig,
  MigrationSource,
  SeedSource,
} from '@nocobase/db';

/**
 * A metadata store as an application may configure it: the instance, the
 * declarative form `@nocobase/db` understands, or — the form `config.yml` can
 * carry — the collections directory alone. Relative directories resolve
 * against the application root.
 */
export type AppMetadataStoreConfig =
  string | CollectionMetadataStoreConfig | CollectionMetadataStore;

/**
 * Application configuration over dialect-independent connections by default.
 * Supply a dialect's connection type for explicit checking, or use
 * `AppDatabaseConfigFromDrivers` to infer it from registered drivers.
 */
export interface AppDatabaseConfig<
  TConnection extends AnyConnectionConfig = ConnectionConfig,
> extends Omit<
  ExtensibleDatabaseConfig<TConnection>,
  'connections' | 'metadataStore'
> {
  connections: Record<string, AppDatabaseConnectionConfig<TConnection>>;
  metadataStore?: AppMetadataStoreConfig;
  /** @deprecated Configure tasks on connections instead. Applies to the default connection. */
  migrations?: Partial<AppDatabaseMigrationConfig>;
  /** @deprecated Configure tasks on connections instead. Applies to the default connection. */
  seeds?: Partial<AppDatabaseSeedConfig>;
}

/**
 * Infer accepted dialects and their connection fields from the installed drivers.
 * `defineAppDatabaseConfig` infers this type from a callback's returned drivers.
 * Use this alias when an explicit annotation is needed outside that helper.
 */
export type AppDatabaseConfigFromDrivers<
  TDrivers extends Record<string, DatabaseDriverRegistration>,
> = Omit<
  AppDatabaseConfig<ConnectionConfigFromDrivers<TDrivers>>,
  'drivers'
> & { drivers: DatabaseConfigFromDrivers<TDrivers>['drivers'] };

/**
 * Runtime facts that task planning needs and configuration cannot supply: the
 * application's own package identity, and the migration and seed directories
 * contributed by its server plugins.
 *
 * These are derived from resolved plugins rather than configured, so they are
 * passed alongside the configuration instead of being merged into it — a value
 * inside the `database` namespace can be overwritten from `config.yml`, and
 * silently dropping a plugin's migrations is not a configurable outcome.
 */
export interface AppDatabaseTaskContributions {
  readonly appPackageName: string;
  /** Contributions bound to named App connections, independent of the default connection. */
  readonly connections?: Readonly<
    Record<
      string,
      {
        readonly migrations: readonly MigrationSource[];
        readonly seeds: readonly SeedSource[];
      }
    >
  >;
  readonly migrations: readonly MigrationSource[];
  readonly seeds: readonly SeedSource[];
}

export interface AppDatabaseMigrationConfig {
  directory: string;
  packageName?: string;
  autoRun: boolean;
  sources?: readonly MigrationSource[];
  tableName?: string;
  lockTableName?: string;
  extensions?: readonly string[];
  /**
   * How to react when an executed migration's source no longer hashes to the
   * checksum recorded for it. `warn` (the default) reports the drift and
   * continues; `error` refuses to run until `nocobase db repair` realigns the
   * history. A migration the sources cannot explain at all always fails.
   */
  onChecksumMismatch?: ChecksumMismatchPolicy;
}

export interface AppDatabaseSeedConfig {
  directory: string;
  packageName?: string;
  autoRun: boolean;
  sources?: readonly SeedSource[];
  tableName?: string;
  lockTableName?: string;
  extensions?: readonly string[];
  /**
   * How to react when an executed seed's source no longer hashes to the
   * checksum recorded for it. `warn` (the default) reports the drift and
   * continues; `error` refuses to run until `nocobase db repair` realigns the
   * history.
   */
  onChecksumMismatch?: ChecksumMismatchPolicy;
}

/** `Omit` over a union keeps only the common keys; distribute it so each dialect keeps its own. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export type AppDatabaseConnectionConfig<
  TConnection extends AnyConnectionConfig = ConnectionConfig,
> = DistributiveOmit<TConnection, 'metadataStore'> & {
  migrations?: Partial<AppDatabaseMigrationConfig>;
  seeds?: Partial<AppDatabaseSeedConfig>;
  /**
   * Where supplemental metadata comes from. An `external` connection that
   * sets nothing here or at the top level reads the hand-written
   * `database/<connection>/metadata/<name>.json` files. A string is a
   * directory in that layout, relative to the application root; it may not
   * be a generated `collections/` directory.
   */
  metadataStore?: AppMetadataStoreConfig;
};
