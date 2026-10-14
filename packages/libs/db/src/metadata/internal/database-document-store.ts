import { createHash, randomUUID } from 'node:crypto';
import type { Knex } from 'knex';
import type {
  CollectionMetadataStore,
  CollectionMetadataPage,
  CollectionMetadataStoreCapabilities,
  DeleteCollectionMetadataOptions,
  ListCollectionMetadataOptions,
  PutCollectionMetadataOptions,
} from '../document-store.js';
import {
  CollectionMetadataConflictError,
  CollectionMetadataStoreOptionsError,
} from '../document-store-errors.js';
import {
  cloneStoredCollectionMetadata,
  createCollectionMetadataPage,
  resolveCollectionMetadataListOptions,
  validateCollectionMetadataStoreName,
  validateDeleteCollectionMetadataOptions,
  validatePutCollectionMetadataOptions,
} from '../document-store-helpers.js';
import type {
  CollectionMetadataDocument,
  StoredCollectionMetadata,
} from '../document.js';
import { validateCollectionMetadataDocument } from '../validation.js';
import {
  listMetadataNamingSnapshot,
  registerMetadataNamingSnapshot,
  type CollectionMetadataNamingSnapshot,
} from './naming-snapshot.js';

interface NamingSnapshotCache {
  generation: number;
  readonly snapshots: Map<string, CollectionMetadataNamingSnapshot>;
}

export const DEFAULT_COLLECTION_METADATA_TABLE =
  '__nocobase_collection_metadata';

export interface DatabaseCollectionMetadataStoreOptions {
  readonly resolveClient: () => Promise<Knex>;
  readonly tableName?: string;
  readonly schema?: string;
}

interface CollectionMetadataRow {
  readonly name: string;
  readonly document: unknown;
  readonly revision: number | string;
}

export class DatabaseCollectionMetadataStore implements CollectionMetadataStore {
  readonly capabilities: CollectionMetadataStoreCapabilities = Object.freeze({
    writable: true,
    optimisticConcurrency: true,
  });

  private initializationPromise?: Promise<void>;
  private initialized = false;
  private cacheInitialized = false;

  private readonly versionTableName: string;

  get tableName(): string {
    return this.options.tableName ?? DEFAULT_COLLECTION_METADATA_TABLE;
  }

  isInternalPhysicalCollection(identity: {
    readonly tableName: string;
    readonly schema: string;
  }): boolean {
    return (
      (identity.tableName === this.tableName ||
        identity.tableName === this.versionTableName) &&
      (this.options.schema === undefined ||
        identity.schema === this.options.schema)
    );
  }

  constructor(
    private readonly options: DatabaseCollectionMetadataStoreOptions,
    private readonly namingCache: NamingSnapshotCache = {
      generation: 0,
      snapshots: new Map(),
    },
  ) {
    const hash = createHash('sha256')
      .update(this.tableName)
      .digest('hex')
      .slice(0, 8);
    this.versionTableName = `${this.tableName.slice(0, 45)}_cache_${hash}`;
    registerMetadataNamingSnapshot(this, {
      read: () => this.readNamingSnapshot(),
      invalidate: () => this.invalidateNamingSnapshots(),
    });
  }

  withClient(
    resolveClient: () => Promise<Knex>,
  ): DatabaseCollectionMetadataStore {
    const store = new DatabaseCollectionMetadataStore(
      {
        ...this.options,
        resolveClient,
      },
      this.namingCache,
    );
    // Only inherit completed initialization, never a query bound to a parent
    // client that may be waiting for the connection this transaction owns.
    if (this.initialized) {
      store.initialized = true;
      store.cacheInitialized = this.cacheInitialized;
      store.initializationPromise = Promise.resolve();
    }
    return store;
  }

  async initialize(): Promise<void> {
    if (!this.initializationPromise) {
      const initializing = this.createTables().then(() => {
        this.initialized = true;
      });
      this.initializationPromise = initializing.catch((error: unknown) => {
        this.initializationPromise = undefined;
        throw error;
      });
    }
    await this.initializationPromise;
  }

  async reinitialize(): Promise<void> {
    this.initializationPromise = undefined;
    this.initialized = false;
    this.cacheInitialized = false;
    this.invalidateNamingSnapshots();
    await this.initialize();
  }

  async get(name: string): Promise<StoredCollectionMetadata | undefined> {
    validateCollectionMetadataStoreName(name);
    await this.initialize();
    const knex = await this.options.resolveClient();
    const row = (await this.table(knex)
      .select(['name', 'document', 'revision'])
      .where({ name })
      .first()) as CollectionMetadataRow | undefined;
    return row ? this.fromRow(row) : undefined;
  }

  async list(
    options: ListCollectionMetadataOptions = {},
  ): Promise<CollectionMetadataPage> {
    const { limit, after } = resolveCollectionMetadataListOptions(options);
    await this.initialize();
    const knex = await this.options.resolveClient();
    let query = this.table(knex)
      .select(['name', 'document', 'revision'])
      .orderBy('name', 'asc')
      .limit(limit + 1);
    if (after) query = query.where('name', '>', after);
    const rows = (await query) as CollectionMetadataRow[];
    return createCollectionMetadataPage(
      rows.map((row) => this.fromRow(row)),
      limit,
    );
  }

  async put(
    input: CollectionMetadataDocument,
    options: PutCollectionMetadataOptions,
  ): Promise<StoredCollectionMetadata> {
    validatePutCollectionMetadataOptions(options);
    if (
      options.expectedRevision !== null &&
      !validDatabaseUpdateRevision(options.expectedRevision)
    ) {
      throw new CollectionMetadataStoreOptionsError(
        'Database Collection Metadata Store put() expectedRevision must be a positive safe integer smaller than Number.MAX_SAFE_INTEGER, or null.',
      );
    }
    const document = validateCollectionMetadataDocument(input);
    await this.initialize();
    return this.write(async (knex) => {
      // The version row serializes metadata writers, including insertions.
      // Check before INSERT so a duplicate does not abort a supplied transaction.
      const actual = await this.actualRevision(knex, document.name);
      if (actual !== options.expectedRevision) {
        throw new CollectionMetadataConflictError(
          document.name,
          options.expectedRevision,
          actual,
        );
      }
      if (options.expectedRevision === null) {
        await this.table(knex).insert({
          name: document.name,
          document: JSON.stringify(document),
          revision: 1,
          created_at: new Date(),
          updated_at: new Date(),
        });
        return cloneStoredCollectionMetadata({ document, revision: 1 });
      }
      const nextRevision = options.expectedRevision + 1;
      const updated = await this.table(knex)
        .where({ name: document.name, revision: options.expectedRevision })
        .update({
          document: JSON.stringify(document),
          revision: nextRevision,
          updated_at: new Date(),
        });
      if (Number(updated) !== 1) {
        throw new CollectionMetadataConflictError(
          document.name,
          options.expectedRevision,
          await this.actualRevision(knex, document.name),
        );
      }
      return cloneStoredCollectionMetadata({
        document,
        revision: nextRevision,
      });
    });
  }

  async delete(
    name: string,
    options: DeleteCollectionMetadataOptions,
  ): Promise<void> {
    validateCollectionMetadataStoreName(name);
    validateDeleteCollectionMetadataOptions(options);
    if (!validDatabaseRevision(options.expectedRevision)) {
      throw new CollectionMetadataStoreOptionsError(
        'Database Collection Metadata Store delete() expectedRevision must be a positive safe integer.',
      );
    }
    await this.initialize();
    await this.write(async (knex) => {
      const deleted = await this.table(knex)
        .where({ name, revision: options.expectedRevision })
        .delete();
      if (Number(deleted) !== 1) {
        throw new CollectionMetadataConflictError(
          name,
          options.expectedRevision,
          await this.actualRevision(knex, name),
        );
      }
    });
  }

  private async write<T>(operation: (client: Knex) => Promise<T>): Promise<T> {
    if (!this.cacheInitialized) {
      throw new CollectionMetadataStoreOptionsError(
        'Initialize the database Collection Metadata Store before opening a transaction that writes metadata.',
      );
    }
    const client = await this.options.resolveClient();
    const execute = async (knex: Knex): Promise<T> => {
      // Lock writers and give concurrent reads in this transaction a temporary
      // token. Their snapshots must not describe the final committed version.
      await this.changeVersion(knex);
      const result = await operation(knex);
      // A fresh token after the document write prevents a concurrently loaded
      // intermediate snapshot from being reused after the write completes.
      await this.changeVersion(knex);
      return result;
    };
    return (client as Knex.Transaction).isTransaction
      ? execute(client)
      : client.transaction(execute);
  }

  private async changeVersion(knex: Knex): Promise<void> {
    const updated = await this.table(knex, this.versionTableName)
      .where({ id: 1 })
      .update({ version: randomUUID() });
    if (Number(updated) !== 1)
      throw new Error('Collection Metadata cache version is missing.');
  }

  private invalidateNamingSnapshots(): void {
    this.namingCache.generation += 1;
    this.namingCache.snapshots.clear();
  }

  private async readNamingSnapshot(): Promise<CollectionMetadataNamingSnapshot> {
    await this.initialize();
    if (!this.cacheInitialized) return listMetadataNamingSnapshot(this);
    const client = await this.options.resolveClient();
    let snapshot: CollectionMetadataNamingSnapshot = [];
    // Do not publish a snapshot assembled across different committed versions.
    // Under sustained writes, retain the existing uncached listing behavior.
    for (let attempt = 0; attempt < 3; attempt++) {
      const generation = this.namingCache.generation;
      const version = await this.readVersion(client);
      const cached = this.namingCache.snapshots.get(version);
      if (cached) return cached;
      snapshot = await listMetadataNamingSnapshot(this);
      if (
        version === (await this.readVersion(client)) &&
        generation === this.namingCache.generation
      ) {
        this.namingCache.snapshots.set(version, snapshot);
        // Keep both sides of one concurrent edit without retaining every
        // transaction's uncommitted or rolled-back version indefinitely.
        if (this.namingCache.snapshots.size > 2) {
          const oldest = this.namingCache.snapshots.keys().next().value;
          if (oldest !== undefined) this.namingCache.snapshots.delete(oldest);
        }
        return snapshot;
      }
    }
    return snapshot;
  }

  private async readVersion(knex: Knex): Promise<string> {
    const row = (await this.table(knex, this.versionTableName)
      .select('version')
      .where({ id: 1 })
      .first()) as { version: string } | undefined;
    if (!row) throw new Error('Collection Metadata cache version is missing.');
    return row.version;
  }

  private async createTables(): Promise<void> {
    validateCollectionMetadataStoreName(this.tableName);
    if (this.options.schema !== undefined) {
      validateCollectionMetadataStoreName(this.options.schema);
    }
    const knex = await this.options.resolveClient();
    if ((knex as Knex.Transaction).isTransaction) {
      // DDL can implicitly commit the caller's work. An already-open
      // transaction may read legacy metadata without upgrading its tables.
      if (!(await this.schema(knex).hasTable(this.tableName))) {
        throw new CollectionMetadataStoreOptionsError(
          'Initialize the database Collection Metadata Store before opening a transaction.',
        );
      }
      this.cacheInitialized =
        (await this.schema(knex).hasTable(this.versionTableName)) &&
        Boolean(
          await this.table(knex, this.versionTableName)
            .where({ id: 1 })
            .first(),
        );
      return;
    }
    await this.createTable();
    const tableName = this.versionTableName;
    if (!(await this.schema(knex).hasTable(tableName))) {
      try {
        await this.schema(knex).createTable(tableName, (table) => {
          table.integer('id').primary();
          table.string('version', 36).notNullable();
        });
      } catch (error) {
        if (!(await this.schema(knex).hasTable(tableName))) throw error;
      }
    }
    if (!(await this.table(knex, tableName).where({ id: 1 }).first())) {
      try {
        // Isolate a concurrent initializer's duplicate INSERT from the
        // subsequent existence check on PostgreSQL.
        await knex.transaction(async (transaction) => {
          await this.table(transaction, tableName).insert({
            id: 1,
            version: randomUUID(),
          });
        });
      } catch (error) {
        if (!(await this.table(knex, tableName).where({ id: 1 }).first()))
          throw error;
      }
    }
    this.cacheInitialized = true;
  }

  private async createTable(): Promise<void> {
    const knex = await this.options.resolveClient();
    const tableName = this.tableName;
    if (await this.schema(knex).hasTable(tableName)) return;
    try {
      await this.schema(knex).createTable(tableName, (table) => {
        table.string('name', 191).primary();
        table.text('document').notNullable();
        table.bigInteger('revision').notNullable();
        table.dateTime('created_at').notNullable();
        table.dateTime('updated_at').notNullable();
      });
    } catch (error) {
      if (!(await this.schema(knex).hasTable(tableName))) throw error;
    }
  }

  private table(
    knex: Knex,
    tableName: string = this.tableName,
  ): Knex.QueryBuilder {
    return this.options.schema
      ? knex.withSchema(this.options.schema).table(tableName)
      : knex(tableName);
  }

  private schema(knex: Knex): Knex.SchemaBuilder {
    return this.options.schema
      ? knex.schema.withSchema(this.options.schema)
      : knex.schema;
  }

  private async actualRevision(
    knex: Knex,
    name: string,
  ): Promise<number | null> {
    const row = (await this.table(knex)
      .select('revision')
      .where({ name })
      .first()) as Pick<CollectionMetadataRow, 'revision'> | undefined;
    return row ? parseDatabaseRevision(name, row.revision) : null;
  }

  private fromRow(row: CollectionMetadataRow): StoredCollectionMetadata {
    const parsed =
      typeof row.document === 'string'
        ? (JSON.parse(row.document) as unknown)
        : row.document;
    const document = validateCollectionMetadataDocument(parsed);
    if (document.name !== row.name) {
      throw new Error(
        `Collection Metadata row name "${row.name}" does not match document name "${document.name}".`,
      );
    }
    const revision = parseDatabaseRevision(row.name, row.revision);
    return { document, revision };
  }
}

function validDatabaseRevision(revision: unknown): revision is number {
  return (
    typeof revision === 'number' &&
    Number.isSafeInteger(revision) &&
    revision > 0
  );
}

function validDatabaseUpdateRevision(revision: unknown): revision is number {
  return validDatabaseRevision(revision) && revision < Number.MAX_SAFE_INTEGER;
}

function parseDatabaseRevision(name: string, input: string | number): number {
  const revision = Number(input);
  if (!validDatabaseRevision(revision)) {
    throw new Error(
      `Collection Metadata row "${name}" has invalid revision "${String(input)}".`,
    );
  }
  return revision;
}
