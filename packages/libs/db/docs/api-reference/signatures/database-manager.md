# DatabaseManager: signatures

Configure named connections, register drivers, create the application manager and resolve its service token.

[Chapter](../database-manager.md) · [Contents](../README.md) · [All exports](../exports.md)

Signatures below are extracted from declaration output. Generic parameters, overloads, optional properties and JSDoc describe the declared contract. Type-only exports cannot be imported as runtime constructors. Supporting contracts are reachable from signatures but are not package-entry exports; do not deep-import them. Private members are omitted; protected hooks are shown only for exported runtime classes.

| Declaration                                                                   | Access               |
| ----------------------------------------------------------------------------- | -------------------- |
| [CollectionMetadataStoreRequiredError](#collectionmetadatastorerequirederror) | `@nocobase/db` value |
| [ConnectionConfigFromDrivers](#connectionconfigfromdrivers)                   | `@nocobase/db` type  |
| [DatabaseConfig](#databaseconfig)                                             | `@nocobase/db` type  |
| [DatabaseConfigFromDrivers](#databaseconfigfromdrivers)                       | `@nocobase/db` type  |
| [DatabaseManager](#databasemanager)                                           | `@nocobase/db` type  |
| [DriverConnectionConfig](#driverconnectionconfig)                             | `@nocobase/db` type  |
| [ExtensibleDatabaseConfig](#extensibledatabaseconfig)                         | `@nocobase/db` type  |
| [ValidatedDriverRegistrations](#validateddriverregistrations)                 | Supporting contract  |
| [createDatabaseManager](#createdatabasemanager)                               | `@nocobase/db` value |
| [databaseManagerToken](#databasemanagertoken)                                 | `@nocobase/db` value |
| [defineDatabase](#definedatabase)                                             | `@nocobase/db` value |

## CollectionMetadataStoreRequiredError

[Source](../../../src/database/manager.ts)

Import: `import { CollectionMetadataStoreRequiredError } from '@nocobase/db'`.

```ts
export declare class CollectionMetadataStoreRequiredError extends Error {
  readonly connection: string;
  readonly code: 'COLLECTION_METADATA_STORE_REQUIRED';
  constructor(connection: string);
}
```

## ConnectionConfigFromDrivers

[Source](../../../src/database/config.ts)

Import: `import type { ConnectionConfigFromDrivers } from '@nocobase/db'`.

Connection shapes accepted by the registered driver factories or descriptors.

```ts
/** Connection shapes accepted by the registered driver factories or descriptors. */
export type ConnectionConfigFromDrivers<
  TDrivers extends Record<string, DatabaseDriverRegistration>,
> = DriverConnectionConfig<
  ValidatedDriverRegistrations<TDrivers>[keyof TDrivers]
>;
```

Related declarations: [DatabaseDriverRegistration](./drivers.md#databasedriverregistration), [DriverConnectionConfig](./database-manager.md#driverconnectionconfig), [ValidatedDriverRegistrations](./database-manager.md#validateddriverregistrations).

## DatabaseConfig

[Source](../../../src/database/config.ts)

Import: `import type { DatabaseConfig } from '@nocobase/db'`.

Core configuration; use a connection type or drivers for dialect-specific checking.

```ts
/** Core configuration; use a connection type or drivers for dialect-specific checking. */
export type DatabaseConfig<
  TConnection extends ConnectionConfig = ConnectionConfig,
> = ExtensibleDatabaseConfig<TConnection>;
```

Related declarations: [ConnectionConfig](./connection.md#connectionconfig), [ExtensibleDatabaseConfig](./database-manager.md#extensibledatabaseconfig).

## DatabaseConfigFromDrivers

[Source](../../../src/database/config.ts)

Import: `import type { DatabaseConfigFromDrivers } from '@nocobase/db'`.

Declarative configuration checked against the application's registered drivers.

```ts
/** Declarative configuration checked against the application's registered drivers. */
export type DatabaseConfigFromDrivers<
  TDrivers extends Record<string, DatabaseDriverRegistration>,
> = Omit<DatabaseConfig<ConnectionConfigFromDrivers<TDrivers>>, 'drivers'> & {
  drivers: ValidatedDriverRegistrations<TDrivers>;
};
```

Related declarations: [ConnectionConfigFromDrivers](./database-manager.md#connectionconfigfromdrivers), [DatabaseConfig](./database-manager.md#databaseconfig), [DatabaseDriverRegistration](./drivers.md#databasedriverregistration), [ValidatedDriverRegistrations](./database-manager.md#validateddriverregistrations).

## DatabaseManager

[Source](../../../src/database/manager.ts)

Import: `import type { DatabaseManager } from '@nocobase/db'`.

Application-level entry to every named connection. Besides `connection()`, the Manager mirrors the four Connection handles that work in logical Collection and Field names — `builder`, `query`, `repository` and `collections` — each taking the connection name as its last parameter and returning the very object the Connection holds. Nothing else is mirrored: `schema`, `schemaInspector` and `collectionMetadata` work in physical names or write supplemental metadata, and stay on the Connection.

```ts
/**
 * Application-level entry to every named connection.
 *
 * Besides `connection()`, the Manager mirrors the four Connection handles that
 * work in logical Collection and Field names — `builder`, `query`,
 * `repository` and `collections` — each taking the connection name as its last
 * parameter and returning the very object the Connection holds. Nothing else is
 * mirrored: `schema`, `schemaInspector` and `collectionMetadata` work in
 * physical names or write supplemental metadata, and stay on the Connection.
 */
export interface DatabaseManager {
  connection(name?: string): DatabaseConnection;
  /** Collection schema and metadata builder. Uses Collection and Field logical names. */
  builder(name?: string): CollectionBuilder;
  /** Database-layer query builder. Does not read Collection metadata or collection table prefixes. */
  query(name?: string): QueryAdapter;
  /**
   * Resolved Collections of one connection, by logical name. Same object as
   * `connection(name).collections`, so its cache is shared with every Builder,
   * Repository and Migration on that connection: `invalidate()` and
   * `refresh()` affect all of them.
   */
  collections(name?: string): ConnectionCollections;
  repository<
    TRecord extends object = RepositoryRecord,
    TCreate extends object = Partial<TRecord>,
    TUpdate extends object = Partial<TRecord>,
  >(
    collection: string,
    connection?: string,
  ): Repository<TRecord, TCreate, TUpdate>;
  createMigrator(options: DatabaseMigratorOptions): Migrator;
  createSeeder(options: DatabaseSeederOptions): Seeder;
  connect(name?: string): Promise<DatabaseConnection>;
  transaction<T>(
    fn: (connection: DatabaseConnection) => Promise<T>,
    name?: string,
  ): Promise<T>;
  disconnect(name?: string): Promise<void>;
  reconnect(name?: string): Promise<DatabaseConnection>;
  destroy(): Promise<void>;
}
```

Related declarations: [CollectionBuilder](./builder.md#collectionbuilder), [ConnectionCollections](./collections.md#connectioncollections), [DatabaseConnection](./connection.md#databaseconnection), [DatabaseMigratorOptions](./migration.md#databasemigratoroptions), [DatabaseSeederOptions](./seed.md#databaseseederoptions), [Migrator](./migration.md#migrator), [QueryAdapter](./query.md#queryadapter), [Repository](./repository.md#repository), [RepositoryRecord](./inputs.md#repositoryrecord), [Seeder](./seed.md#seeder).

## DriverConnectionConfig

[Source](../../../src/database/config.ts)

Import: `import type { DriverConnectionConfig } from '@nocobase/db'`.

Extract the connection shape carried by a driver factory or descriptor.

```ts
/** Extract the connection shape carried by a driver factory or descriptor. */
export type DriverConnectionConfig<TDriver> = TDriver extends {
  readonly driver: infer TDefinition;
}
  ? DriverConnectionConfig<TDefinition>
  : TDriver extends DatabaseDriverDefinition<string, infer TConnection>
    ? TConnection
    : never;
```

Related declarations: [DatabaseDriverDefinition](./drivers.md#databasedriverdefinition).

## ExtensibleDatabaseConfig

[Source](../../../src/database/config.ts)

Import: `import type { ExtensibleDatabaseConfig } from '@nocobase/db'`.

Configuration over connection shapes supplied by dialect packages.

```ts
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
```

Related declarations: [AnyConnectionConfig](./connection.md#anyconnectionconfig), [CollectionMetadataStore](./metadata.md#collectionmetadatastore), [CollectionMetadataStoreConfig](./connection.md#collectionmetadatastoreconfig), [DatabaseDriverRegistration](./drivers.md#databasedriverregistration).

## ValidatedDriverRegistrations

[Source](../../../src/database/config.ts)

Access: supporting contract reached through a public signature; no package-entry import.

Every registration uses the driver's declared dialect, including unused entries.

```ts
/** Every registration uses the driver's declared dialect, including unused entries. */
type ValidatedDriverRegistrations<
  TDrivers extends Record<string, DatabaseDriverRegistration>,
> = {
  [K in keyof TDrivers]: TDrivers[K] & {
    readonly dialect: K;
  };
};
```

Related declarations: [DatabaseDriverRegistration](./drivers.md#databasedriverregistration).

## createDatabaseManager

[Source](../../../src/database/manager.ts)

Import: `import { createDatabaseManager } from '@nocobase/db'`.

```ts
export declare function createDatabaseManager<
  TConnection extends AnyConnectionConfig = ConnectionConfig,
>(config: ExtensibleDatabaseConfig<TConnection>): DatabaseManager;
```

Related declarations: [AnyConnectionConfig](./connection.md#anyconnectionconfig), [ConnectionConfig](./connection.md#connectionconfig), [DatabaseManager](./database-manager.md#databasemanager), [ExtensibleDatabaseConfig](./database-manager.md#extensibledatabaseconfig).

## databaseManagerToken

[Source](../../../src/database/token.ts)

Import: `import { databaseManagerToken } from '@nocobase/db'`.

The application database manager registered in a service container.

```ts
/** The application database manager registered in a service container. */
export declare const databaseManagerToken: ServiceToken<DatabaseManager>;
```

Related declarations: [DatabaseManager](./database-manager.md#databasemanager).

## defineDatabase

[Source](../../../src/database/config.ts)

Import: `import { defineDatabase } from '@nocobase/db'`.

```ts
export declare function defineDatabase<
  T extends ExtensibleDatabaseConfig<AnyConnectionConfig>,
>(config: T): T;
```

Related declarations: [AnyConnectionConfig](./connection.md#anyconnectionconfig), [ExtensibleDatabaseConfig](./database-manager.md#extensibledatabaseconfig).
