import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Knex } from 'knex';
import { InMemoryCollectionMetadataStore } from '@nocobase/db';
import type {
  CollectionBuilder,
  DatabaseConnection,
  DatabaseManager,
} from '@nocobase/db';
import type { DatabaseIntegrationProfile } from './integration-profile.js';

/**
 * The smallest context a shared database contract needs.
 * Dialect packages add their connection and cleanup details in the adapter.
 */
export interface DatabaseContractContext {
  database: DatabaseManager;
  table(name: string): string;
  identifier(name: string): string;
  cleanup(): Promise<void>;
  createTable(name: string): Promise<void>;
  insert(table: string, values: Record<string, unknown>): Promise<void>;
  select(table: string): Promise<Array<Record<string, unknown>>>;
}

export type DatabaseContractFactory<TContext extends DatabaseContractContext> =
  () => TContext | Promise<TContext>;

/**
 * Runtime context supplied by one dialect package to shared integration
 * contracts. The context deliberately exposes portable database operations
 * and leaves connection setup, catalog inspection, and cleanup to the
 * dialect-owned adapter.
 */
export interface DatabaseIntegrationContext extends DatabaseContractContext {
  connection: DatabaseConnection;
  db: Knex;
  builder: CollectionBuilder;
  metadataStore: InMemoryCollectionMetadataStore;
  prefix: string;
  indexName(collection: string, columns: string[]): string;
  profile: DatabaseIntegrationProfile;
}

export interface DatabaseDialectIntegrationSpec {
  readonly name: string;
  readonly dialect: string;
  readonly driver?: string;
  readonly profile: DatabaseIntegrationProfile;
  readonly [key: string]: unknown;
}

export interface DatabaseDialectIntegrationContext extends DatabaseIntegrationContext {
  spec: DatabaseDialectIntegrationSpec;
  profile: DatabaseIntegrationProfile;
}

export interface DatabaseDialectIntegrationAdapter extends DatabaseIntegrationAdapter<DatabaseDialectIntegrationContext> {
  readonly spec: DatabaseDialectIntegrationSpec;
  listIndexes(
    context: DatabaseDialectIntegrationContext,
    tableName: string,
  ): Promise<Array<Record<string, unknown>>>;
  listForeignKeys(
    context: DatabaseDialectIntegrationContext,
    tableName: string,
  ): Promise<Array<Record<string, unknown>>>;
  listColumns(
    context: DatabaseDialectIntegrationContext,
    tableName: string,
  ): Promise<Array<Record<string, unknown>>>;
  listObjects(
    context: DatabaseDialectIntegrationContext,
    objectType: 'table' | 'view',
  ): Promise<string[]>;
  quoteIdentifier(identifier: string): string;
  cleanupObjects?(context: DatabaseDialectIntegrationContext): Promise<void>;
}

export interface DatabaseDialectIntegrationAdapterOptions extends Omit<
  DatabaseIntegrationAdapterOptions,
  'profile' | 'setup' | 'cleanup'
> {
  readonly spec: DatabaseDialectIntegrationSpec;
  readonly setup?: (
    context: DatabaseDialectIntegrationContext,
  ) => Promise<void>;
  readonly cleanup?: (
    context: DatabaseDialectIntegrationContext,
  ) => Promise<void>;
  readonly listIndexes: DatabaseDialectIntegrationAdapter['listIndexes'];
  readonly listForeignKeys: DatabaseDialectIntegrationAdapter['listForeignKeys'];
  readonly listColumns: DatabaseDialectIntegrationAdapter['listColumns'];
  readonly listObjects: DatabaseDialectIntegrationAdapter['listObjects'];
  readonly quoteIdentifier: (identifier: string) => string;
}

export interface DatabaseIntegrationAdapter<
  TContext extends DatabaseIntegrationContext = DatabaseIntegrationContext,
> {
  readonly name: string;
  createContext(): TContext;
  setupContext?(context: TContext): Promise<void>;
  cleanupContext?(context: TContext): Promise<void>;
}

export interface DatabaseIntegrationAdapterOptions {
  readonly name: string;
  readonly profile: DatabaseIntegrationProfile;
  readonly createDatabase: (
    prefix: string,
    metadataStore: InMemoryCollectionMetadataStore,
  ) => DatabaseManager;
  readonly setup?: (context: DatabaseIntegrationContext) => Promise<void>;
  readonly cleanup?: (context: DatabaseIntegrationContext) => Promise<void>;
}

/**
 * Builds the common lifecycle for a dialect package's integration adapter.
 * The dialect still supplies the manager configuration and any physical
 * cleanup required by its database.
 */
export function createDatabaseIntegrationAdapter(
  options: DatabaseIntegrationAdapterOptions,
): DatabaseIntegrationAdapter {
  return {
    name: options.name,
    createContext: () => {
      const context = {
        database: undefined as unknown as DatabaseManager,
        connection: undefined as unknown as DatabaseConnection,
        db: undefined as unknown as Knex,
        builder: undefined as unknown as CollectionBuilder,
        metadataStore: undefined as unknown as InMemoryCollectionMetadataStore,
        prefix: '',
        profile: options.profile,
        table: (name: string) => context.identifier(name),
        identifier: (name: string) =>
          truncateIdentifier(`${context.prefix}_${snakeCase(name)}`),
        indexName: (collection: string, columns: string[]) =>
          truncateIdentifier(
            `idx_${context.identifier(collection)}_${columns.join('_')}`,
          ),
        createTable: async (name: string) => {
          await context.db.schema.createTable(name, (tableBuilder) => {
            tableBuilder.increments('id');
            tableBuilder.string('name');
          });
        },
        insert: async (table: string, values: Record<string, unknown>) => {
          await context.db(table).insert(values);
        },
        select: (table: string) => context.db(table).select(),
        cleanup: async () => undefined,
      } as DatabaseIntegrationContext;
      return context;
    },
    setupContext: async (context) => {
      context.prefix = createTestPrefix();
      context.metadataStore = new InMemoryCollectionMetadataStore();
      context.database = options.createDatabase(
        context.prefix,
        context.metadataStore,
      );
      context.connection = context.database.connection();
      context.builder = context.connection.builder;
      context.db = await context.connection.client<Knex>();
      await options.setup?.(context);
    },
    cleanupContext: async (context) => {
      try {
        await options.cleanup?.(context);
      } finally {
        await context.database.destroy();
      }
    },
  };
}

export function createDatabaseDialectIntegrationAdapter(
  options: DatabaseDialectIntegrationAdapterOptions,
): DatabaseDialectIntegrationAdapter {
  const base = createDatabaseIntegrationAdapter({
    name: options.name,
    profile: options.spec.profile,
    createDatabase: options.createDatabase,
    setup: options.setup as DatabaseIntegrationAdapterOptions['setup'],
    cleanup: options.cleanup as DatabaseIntegrationAdapterOptions['cleanup'],
  });
  return {
    ...base,
    spec: options.spec,
    createContext: () => {
      const context = base.createContext() as DatabaseDialectIntegrationContext;
      Object.assign(context, {
        spec: options.spec,
        profile: options.spec.profile,
      });
      return context;
    },
    listIndexes: options.listIndexes,
    listForeignKeys: options.listForeignKeys,
    listColumns: options.listColumns,
    listObjects: options.listObjects,
    quoteIdentifier: options.quoteIdentifier,
    cleanupObjects: options.cleanup,
  };
}

export type { DatabaseDialectTestAdapter } from './contracts.js';
export type { DatabaseIntegrationProfile } from './integration-profile.js';
export { asDatabaseContractAdapter } from './contracts.js';
export {
  runDatabaseIntegration,
  type DatabaseIntegrationRunnerOptions,
} from './integration-runner.js';

export interface DatabaseContractSuiteOptions<
  TContext extends DatabaseContractContext,
> {
  createContext: DatabaseContractFactory<TContext>;
  title?: string;
}

/**
 * Define a reusable contract without importing a concrete dialect.
 *
 * The callback receives a factory rather than a live context so the caller can
 * decide how Vitest lifecycle hooks, connection pooling, and cleanup should be
 * managed by its dialect adapter.
 */
export function defineDatabaseContractSuite<
  TContext extends DatabaseContractContext,
>(
  options: DatabaseContractSuiteOptions<TContext>,
  define?: (createContext: DatabaseContractFactory<TContext>) => void,
): void {
  const defineContract =
    define ?? ((factory) => defaultDatabaseContract(factory, options.title));
  defineContract(options.createContext);
}

/**
 * Register an integration contract against a dialect-owned adapter.
 *
 * The adapter owns all connection details and physical cleanup. A shared
 * contract only receives a ready context and never selects a dialect.
 */
export function defineDatabaseIntegrationSuite<
  TContext extends DatabaseIntegrationContext,
>(
  adapter: DatabaseIntegrationAdapter<TContext>,
  define: (context: TContext) => void,
  title = 'database integration contract',
): void {
  describe(`${title} [${adapter.name}]`, () => {
    const context = adapter.createContext();

    beforeEach(async () => {
      await adapter.setupContext?.(context);
    });

    afterEach(async () => {
      if (adapter.cleanupContext) await adapter.cleanupContext(context);
      else await context.cleanup();
    });

    defineContextSuite(define, () => context);
  });
}

/**
 * Creates the small lifecycle wrapper used by the dialect packages' adapter
 * implementations. The returned factory keeps the shared context shape
 * independent from any particular native driver.
 */
export function createIntegrationContext(
  input: DatabaseIntegrationContext,
): DatabaseIntegrationContext {
  return input;
}

export async function dropPortableIntegrationObjects(
  context: DatabaseIntegrationContext,
  names: readonly string[],
): Promise<void> {
  for (const name of [...names].reverse()) {
    const identifier = context.table(name);
    try {
      await context.db.schema.dropViewIfExists(identifier);
    } catch {
      // Some Knex clients do not implement dropViewIfExists consistently.
    }
    try {
      await context.db.schema.dropTableIfExists(identifier);
    } catch {
      // Cleanup must not hide the test failure that caused it to run.
    }
  }
}

export function createTestPrefix(): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `cbt_${process.pid}_${random}`;
}

export function snakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

export function truncateIdentifier(identifier: string, maxLength = 63): string {
  if (identifier.length <= maxLength) return identifier;
  let hash = 0x811c9dc5;
  for (let index = 0; index < identifier.length; index += 1) {
    hash ^= identifier.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  const suffix = (hash >>> 0).toString(36);
  return `${identifier.slice(0, maxLength - suffix.length - 1)}_${suffix}`;
}

function defineContextSuite<TContext>(
  define: (context: TContext) => void,
  getContext: () => TContext,
): void {
  define(getContext());
}

export { definePortableIntegrationContracts } from './integration-contracts.js';
export {
  parseDatabaseIntegrationArguments,
  type DatabaseIntegrationTestArguments,
} from './integration-arguments.js';
export { loadDatabaseIntegrationTests } from './integration-loader.js';
export { describeTestDatabaseProvisioner } from './test-provisioner-contract.js';
export {
  describeIntegrationDatabases,
  expectForeignKeyViolation,
  expectUniqueViolation,
  getColumnType,
  getDatabaseIntegrationAdapter,
  installDatabaseIntegrationAdapter,
  listColumns,
  listForeignKeys,
  listIndexes,
  useIntegrationDatabase,
} from './integration.js';
export type {
  IntegrationDatabaseSpec,
  IntegrationTestContext,
} from './integration.js';

function defaultDatabaseContract<TContext extends DatabaseContractContext>(
  createContext: DatabaseContractFactory<TContext>,
  title = 'database contract',
): void {
  describe(title, () => {
    let context: TContext;

    beforeEach(async () => {
      context = await createContext();
    });

    afterEach(async () => {
      await context.cleanup();
    });

    it('creates a table and reads inserted rows', async () => {
      const table = context.table('contract_items');
      await context.createTable('contract_items');
      await context.insert(table, { name: 'first' });
      await expect(context.select(table)).resolves.toEqual([
        expect.objectContaining({ name: 'first' }),
      ]);
    });
  });
}
