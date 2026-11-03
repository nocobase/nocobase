# Testing entry point: signatures

Import these values and types from @nocobase/db/testing. They support dialect tests and database provisioning; runtime application code normally uses the root entry.

[Chapter](../testing.md) · [Contents](../README.md) · [All exports](../exports.md)

Signatures below are extracted from declaration output. Generic parameters, overloads, optional properties and JSDoc describe the declared contract. Type-only exports cannot be imported as runtime constructors. Supporting contracts are reachable from signatures but are not package-entry exports; do not deep-import them. Private members are omitted; protected hooks are shown only for exported runtime classes.

| Declaration                                                             | Access                       |
| ----------------------------------------------------------------------- | ---------------------------- |
| [CollectionRenameAtomicityError](#collectionrenameatomicityerror)       | `@nocobase/db/testing` value |
| [DatabaseCollectionMetadataStore](#databasecollectionmetadatastore)     | `@nocobase/db/testing` value |
| [DefaultFilterBuilder](#defaultfilterbuilder)                           | `@nocobase/db/testing` value |
| [KnexClientName](#knexclientname)                                       | Supporting contract          |
| [KnexConnectionConfig](#knexconnectionconfig)                           | `@nocobase/db/testing` type  |
| [ProvisionedTestDatabase](#provisionedtestdatabase)                     | `@nocobase/db/testing` type  |
| [SqlTestDatabaseProvisionerOptions](#sqltestdatabaseprovisioneroptions) | `@nocobase/db/testing` type  |
| [SqlTestDatabaseStatements](#sqltestdatabasestatements)                 | `@nocobase/db/testing` type  |
| [TestDatabaseCloneOptions](#testdatabasecloneoptions)                   | `@nocobase/db/testing` type  |
| [TestDatabaseEnvironment](#testdatabaseenvironment)                     | `@nocobase/db/testing` type  |
| [TestDatabaseListOptions](#testdatabaselistoptions)                     | `@nocobase/db/testing` type  |
| [TestDatabaseProvisionOptions](#testdatabaseprovisionoptions)           | `@nocobase/db/testing` type  |
| [TestDatabaseProvisioner](#testdatabaseprovisioner)                     | `@nocobase/db/testing` type  |
| [attachDatabaseDriverRuntime](#attachdatabasedriverruntime)             | `@nocobase/db/testing` value |
| [compileJsonCondition](#compilejsoncondition)                           | `@nocobase/db/testing` value |
| [createKnexClient](#createknexclient)                                   | `@nocobase/db/testing` value |
| [createSqlTestDatabaseProvisioner](#createsqltestdatabaseprovisioner)   | `@nocobase/db/testing` value |
| [resolveDatabaseCapabilities](#resolvedatabasecapabilities)             | `@nocobase/db/testing` value |
| [resolveKnexConnectionConfig](#resolveknexconnectionconfig)             | `@nocobase/db/testing` value |
| [temporalBinding](#temporalbinding)                                     | `@nocobase/db/testing` value |
| [temporalProjection](#temporalprojection)                               | `@nocobase/db/testing` value |
| [validateJsonCondition](#validatejsoncondition)                         | `@nocobase/db/testing` value |

## CollectionRenameAtomicityError

[Source](../../../src/collection/builder/builder.ts)

Import: `import { CollectionRenameAtomicityError } from '@nocobase/db/testing'`.

```ts
export declare class CollectionRenameAtomicityError extends Error {
  readonly from: string;
  readonly to: string;
  readonly code: 'COLLECTION_RENAME_ATOMICITY_REQUIRED';
  constructor(from: string, to: string);
}
```

## DatabaseCollectionMetadataStore

[Source](../../../src/metadata/internal/database-document-store.ts)

Import: `import { DatabaseCollectionMetadataStore } from '@nocobase/db/testing'`.

```ts
export declare class DatabaseCollectionMetadataStore implements CollectionMetadataStore {
  readonly capabilities: CollectionMetadataStoreCapabilities;
  get tableName(): string;
  isInternalPhysicalCollection(identity: {
    readonly tableName: string;
    readonly schema: string;
  }): boolean;
  constructor(
    options: DatabaseCollectionMetadataStoreOptions,
    namingCache?: NamingSnapshotCache,
  );
  withClient(
    resolveClient: () => Promise<Knex>,
  ): DatabaseCollectionMetadataStore;
  prepareTransaction(): Promise<
    (client: Knex.Transaction) => DatabaseCollectionMetadataStore
  >;
  initialize(): Promise<void>;
  reinitialize(): Promise<void>;
  get(name: string): Promise<StoredCollectionMetadata | undefined>;
  list(
    options?: ListCollectionMetadataOptions,
  ): Promise<CollectionMetadataPage>;
  put(
    input: CollectionMetadataDocument,
    options: PutCollectionMetadataOptions,
  ): Promise<StoredCollectionMetadata>;
  delete(name: string, options: DeleteCollectionMetadataOptions): Promise<void>;
}
```

Related declarations: [CollectionMetadataDocument](./metadata.md#collectionmetadatadocument), [CollectionMetadataPage](./metadata.md#collectionmetadatapage), [CollectionMetadataStore](./metadata.md#collectionmetadatastore), [CollectionMetadataStoreCapabilities](./metadata.md#collectionmetadatastorecapabilities), [DatabaseCollectionMetadataStoreOptions](./metadata.md#databasecollectionmetadatastoreoptions), [DeleteCollectionMetadataOptions](./metadata.md#deletecollectionmetadataoptions), [ListCollectionMetadataOptions](./metadata.md#listcollectionmetadataoptions), [NamingSnapshotCache](./metadata.md#namingsnapshotcache), [PutCollectionMetadataOptions](./metadata.md#putcollectionmetadataoptions), [StoredCollectionMetadata](./metadata.md#storedcollectionmetadata).

## DefaultFilterBuilder

[Source](../../../../repository-input/src/filter-builder.ts)

Import: `import { DefaultFilterBuilder } from '@nocobase/db/testing'`.

```ts
export declare class DefaultFilterBuilder<
  TRecord extends object = RepositoryRecord,
> implements FilterBuilder<TRecord> {
  and(items: readonly FilterNode[]): FilterGroupNode;
  or(items: readonly FilterNode[]): FilterGroupNode;
  variable(path: string): FilterVariable;
  string(path: string | RepositoryPath): StringFilterOperators;
  text(path: string | RepositoryPath): TextFilterOperators;
  number(path: string | RepositoryPath): NumberFilterOperators;
  date(path: string | RepositoryPath): DateFilterOperators;
  time(path: string | RepositoryPath): TimeFilterOperators;
  boolean(path: string | RepositoryPath): BooleanFilterOperators;
  json(path: string | RepositoryPath): JsonFilterOperators;
  relation<TTarget extends object = RepositoryRecord>(
    path: string | RepositoryPath,
  ): RelationFilterOperators<TTarget>;
}
```

Related declarations: [BooleanFilterOperators](./inputs.md#booleanfilteroperators), [DateFilterOperators](./inputs.md#datefilteroperators), [FilterBuilder](./inputs.md#filterbuilder), [FilterGroupNode](./inputs.md#filtergroupnode), [FilterNode](./inputs.md#filternode), [FilterVariable](./inputs.md#filtervariable), [JsonFilterOperators](./inputs.md#jsonfilteroperators), [NumberFilterOperators](./inputs.md#numberfilteroperators), [RelationFilterOperators](./inputs.md#relationfilteroperators), [RepositoryPath](./inputs.md#repositorypath), [RepositoryRecord](./inputs.md#repositoryrecord), [StringFilterOperators](./inputs.md#stringfilteroperators), [TextFilterOperators](./inputs.md#textfilteroperators), [TimeFilterOperators](./inputs.md#timefilteroperators).

## KnexClientName

[Source](../../../src/database/internal/knex/config.ts)

Access: supporting contract reached through a public signature; no package-entry import.

The core package deliberately treats the Knex client name as opaque. A dialect package owns the mapping from its native driver to this name.

```ts
/**
 * The core package deliberately treats the Knex client name as opaque. A
 * dialect package owns the mapping from its native driver to this name.
 */
export type KnexClientName = string;
```

## KnexConnectionConfig

[Source](../../../src/database/internal/knex/config.ts)

Import: `import type { KnexConnectionConfig } from '@nocobase/db/testing'`.

```ts
export interface KnexConnectionConfig extends BaseConnectionConfig {
  dialect: DatabaseDialect;
  driver: string;
  schemaManagement: SchemaManagementMode;
  knexClient: KnexClientName;
  connection: unknown;
  useNullAsDefault?: boolean;
  searchPath?: string[];
}
```

Related declarations: [BaseConnectionConfig](./connection.md#baseconnectionconfig), [DatabaseDialect](./connection.md#databasedialect), [KnexClientName](./testing.md#knexclientname), [SchemaManagementMode](./connection.md#schemamanagementmode).

## ProvisionedTestDatabase

[Source](../../../src/database/test-provisioner.ts)

Import: `import type { ProvisionedTestDatabase } from '@nocobase/db/testing'`.

```ts
export interface ProvisionedTestDatabase {
  /** Connection configuration for the isolated database, as a dialect factory returns it. */
  readonly connection: AnyConnectionConfig;
  /** Removes the isolated database or schema and releases the administrative connection. */
  drop(): Promise<void>;
}
```

Related declarations: [AnyConnectionConfig](./connection.md#anyconnectionconfig).

## SqlTestDatabaseProvisionerOptions

[Source](../../../src/database/test-provisioner.ts)

Import: `import type { SqlTestDatabaseProvisionerOptions } from '@nocobase/db/testing'`.

```ts
export interface SqlTestDatabaseProvisionerOptions {
  readonly dialect: string;
  readonly capabilities: Partial<DatabaseCapabilities>;
  /** The server itself, for the statements that create, list and drop isolated databases. */
  readonly admin: (env: TestDatabaseEnvironment) => AnyConnectionConfig;
  /** The isolated database named, for the tests that run on it. */
  readonly connection: (
    env: TestDatabaseEnvironment,
    name: string,
  ) => AnyConnectionConfig;
  readonly statements: SqlTestDatabaseStatements;
  /**
   * The identifier the server keeps an isolated database under, for a server
   * that folds unquoted names to upper case and whose clients log in by the
   * folded name. Defaults to the name itself.
   */
  readonly identifier?: (name: string) => string;
}
```

Related declarations: [AnyConnectionConfig](./connection.md#anyconnectionconfig), [DatabaseCapabilities](./drivers.md#databasecapabilities), [SqlTestDatabaseStatements](./testing.md#sqltestdatabasestatements), [TestDatabaseEnvironment](./testing.md#testdatabaseenvironment).

## SqlTestDatabaseStatements

[Source](../../../src/database/test-provisioner.ts)

Import: `import type { SqlTestDatabaseStatements } from '@nocobase/db/testing'`.

The statements a server dialect isolates test databases with. Every `??` and `?` in them stands for the database's identifier, bound as an identifier or a value respectively; a step that takes several statements lists them in order.

```ts
/**
 * The statements a server dialect isolates test databases with. Every `??`
 * and `?` in them stands for the database's identifier, bound as an
 * identifier or a value respectively; a step that takes several statements
 * lists them in order.
 */
export interface SqlTestDatabaseStatements {
  readonly create: string | readonly string[];
  readonly drop: string | readonly string[];
  /**
   * Lists every database or schema on the server as rows with a `name`
   * column, spelled as the test names them: in lower case where the server
   * folds identifiers to upper case.
   */
  readonly list: string;
}
```

## TestDatabaseCloneOptions

[Source](../../../src/database/test-provisioner.ts)

Import: `import type { TestDatabaseCloneOptions } from '@nocobase/db/testing'`.

```ts
export interface TestDatabaseCloneOptions extends TestDatabaseProvisionOptions {
  /** The isolated database to copy, provisioned earlier and no longer open. */
  readonly source: string;
}
```

Related declarations: [TestDatabaseProvisionOptions](./testing.md#testdatabaseprovisionoptions).

## TestDatabaseEnvironment

[Source](../../../src/database/test-provisioner.ts)

Import: `import type { TestDatabaseEnvironment } from '@nocobase/db/testing'`.

Environment variables a provisioner reads its server address and credentials from.

```ts
/** Environment variables a provisioner reads its server address and credentials from. */
export type TestDatabaseEnvironment = Readonly<
  Record<string, string | undefined>
>;
```

## TestDatabaseListOptions

[Source](../../../src/database/test-provisioner.ts)

Import: `import type { TestDatabaseListOptions } from '@nocobase/db/testing'`.

```ts
export interface TestDatabaseListOptions {
  /** Only names starting with this prefix are returned. */
  readonly prefix: string;
  readonly env: TestDatabaseEnvironment;
}
```

Related declarations: [TestDatabaseEnvironment](./testing.md#testdatabaseenvironment).

## TestDatabaseProvisionOptions

[Source](../../../src/database/test-provisioner.ts)

Import: `import type { TestDatabaseProvisionOptions } from '@nocobase/db/testing'`.

```ts
export interface TestDatabaseProvisionOptions {
  /**
   * Identifier of the isolated database or schema to create: lower-case
   * letters, digits and underscores, short enough for every dialect.
   */
  readonly name: string;
  readonly env: TestDatabaseEnvironment;
}
```

Related declarations: [TestDatabaseEnvironment](./testing.md#testdatabaseenvironment).

## TestDatabaseProvisioner

[Source](../../../src/database/test-provisioner.ts)

Import: `import type { TestDatabaseProvisioner } from '@nocobase/db/testing'`.

Creates isolated databases for tests that must not depend on one dialect. Each dialect package exports one from its `./testing` entry, and `@nocobase/db-testing` selects it by dialect name. Everything specific to the database — the server address, credentials, and the statements that create and drop the isolated database — stays in the dialect package.

```ts
/**
 * Creates isolated databases for tests that must not depend on one dialect.
 *
 * Each dialect package exports one from its `./testing` entry, and
 * `@nocobase/db-testing` selects it by dialect name. Everything specific to
 * the database — the server address, credentials, and the statements that
 * create and drop the isolated database — stays in the dialect package.
 */
export interface TestDatabaseProvisioner {
  readonly dialect: string;
  /**
   * The capabilities the dialect's driver declares, as on its definition.
   * Lets a test decide what to skip before any database exists.
   */
  readonly capabilities: Partial<DatabaseCapabilities>;
  provision(
    options: TestDatabaseProvisionOptions,
  ): Promise<ProvisionedTestDatabase>;
  /**
   * Isolated databases or schemas the server currently holds, so a run can
   * remove those an interrupted run left behind. Absent where nothing
   * outlives the process, as with an in-memory database.
   */
  listProvisioned?(options: TestDatabaseListOptions): Promise<string[]>;
  /** Removes one isolated database or schema named by `listProvisioned`. */
  dropProvisioned?(options: TestDatabaseProvisionOptions): Promise<void>;
  /**
   * Provisions `name` as a copy of `source`, schema and rows, so a test can start from a database migrated once
   * instead of migrating its own. Absent where the dialect cannot copy a database cheaply.
   */
  clone?(options: TestDatabaseCloneOptions): Promise<ProvisionedTestDatabase>;
}
```

Related declarations: [DatabaseCapabilities](./drivers.md#databasecapabilities), [ProvisionedTestDatabase](./testing.md#provisionedtestdatabase), [TestDatabaseCloneOptions](./testing.md#testdatabasecloneoptions), [TestDatabaseListOptions](./testing.md#testdatabaselistoptions), [TestDatabaseProvisionOptions](./testing.md#testdatabaseprovisionoptions).

## attachDatabaseDriverRuntime

[Source](../../../src/database/runtime.ts)

Import: `import { attachDatabaseDriverRuntime } from '@nocobase/db/testing'`.

```ts
export declare function attachDatabaseDriverRuntime(
  client: Knex,
  runtime: DatabaseDriverRuntime,
): void;
```

Related declarations: [DatabaseDriverRuntime](./drivers.md#databasedriverruntime).

## compileJsonCondition

[Source](../../../src/repository/json-filter.ts)

Import: `import { compileJsonCondition } from '@nocobase/db/testing'`.

JSON equality is structural, with ordered arrays and unordered object keys.

```ts
/** JSON equality is structural, with ordered arrays and unordered object keys. */
export declare function compileJsonCondition(
  client: Knex,
  column: string,
  node: FilterConditionNode,
): Knex.Raw;
```

Related declarations: [FilterConditionNode](./inputs.md#filterconditionnode).

## createKnexClient

[Source](../../../src/database/internal/knex/client.ts)

Import: `import { createKnexClient } from '@nocobase/db/testing'`.

```ts
export declare function createKnexClient(config: KnexConnectionConfig): Knex;
```

Related declarations: [KnexConnectionConfig](./testing.md#knexconnectionconfig).

## createSqlTestDatabaseProvisioner

[Source](../../../src/database/test-provisioner.ts)

Import: `import { createSqlTestDatabaseProvisioner } from '@nocobase/db/testing'`.

A provisioner for a server dialect that isolates each test database with one statement each to create, drop and list them, so that a dialect package declares only those statements and its connection options. Every statement runs on an administrative connection opened for it and closed afterwards, so a test holds no connection beyond its own.

```ts
/**
 * A provisioner for a server dialect that isolates each test database with
 * one statement each to create, drop and list them, so that a dialect
 * package declares only those statements and its connection options.
 * Every statement runs on an administrative connection opened for it and
 * closed afterwards, so a test holds no connection beyond its own.
 */
export declare function createSqlTestDatabaseProvisioner(
  options: SqlTestDatabaseProvisionerOptions,
): TestDatabaseProvisioner;
```

Related declarations: [SqlTestDatabaseProvisionerOptions](./testing.md#sqltestdatabaseprovisioneroptions), [TestDatabaseProvisioner](./testing.md#testdatabaseprovisioner).

## resolveDatabaseCapabilities

[Source](../../../src/database/capabilities.ts)

Import: `import { resolveDatabaseCapabilities } from '@nocobase/db/testing'`.

```ts
export declare function resolveDatabaseCapabilities(
  overrides?: Partial<DatabaseCapabilities>,
): DatabaseCapabilities;
```

Related declarations: [DatabaseCapabilities](./drivers.md#databasecapabilities).

## resolveKnexConnectionConfig

[Source](../../../src/database/internal/knex/config.ts)

Import: `import { resolveKnexConnectionConfig } from '@nocobase/db/testing'`.

```ts
export declare function resolveKnexConnectionConfig<
  TConfig extends ConnectionConfig,
>(
  config: TConfig,
  dialectDriver?: DatabaseDriverDefinition,
): KnexConnectionConfig;
```

Related declarations: [ConnectionConfig](./connection.md#connectionconfig), [DatabaseDriverDefinition](./drivers.md#databasedriverdefinition), [KnexConnectionConfig](./testing.md#knexconnectionconfig).

## temporalBinding

[Source](../../../src/repository/internal/temporal-sql.ts)

Import: `import { temporalBinding } from '@nocobase/db/testing'`.

```ts
export declare function temporalBinding(
  client: TemporalSqlClient,
  field: FieldDefinition,
  value: unknown,
): Knex.Raw | string | null;
```

Related declarations: [FieldDefinition](./builder.md#fielddefinition), [TemporalSqlClient](./values.md#temporalsqlclient).

## temporalProjection

[Source](../../../src/repository/internal/temporal-sql.ts)

Import: `import { temporalProjection } from '@nocobase/db/testing'`.

Format at the database boundary so driver Date parsing cannot apply a host zone.

```ts
/** Format at the database boundary so driver Date parsing cannot apply a host zone. */
export declare function temporalProjection(
  client: Knex,
  field: FieldDefinition | undefined,
  reference: string | Knex.Raw,
): Knex.Raw | Knex.Ref<string, Record<string, string>>;
```

Related declarations: [FieldDefinition](./builder.md#fielddefinition).

## validateJsonCondition

[Source](../../../src/repository/json-filter.ts)

Import: `import { validateJsonCondition } from '@nocobase/db/testing'`.

```ts
export declare function validateJsonCondition(
  node: FilterConditionNode,
  path: readonly (string | number)[],
): void;
```

Related declarations: [FilterConditionNode](./inputs.md#filterconditionnode).
