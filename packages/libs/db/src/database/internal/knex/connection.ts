import type { Knex } from 'knex';
import { CollectionBuilder } from '../../../collection/builder/builder.js';
import { CollectionRegistry } from '../../../collection/registry/registry.js';
import { RegistryMetadataDocumentValidator } from '../../../collection/registry/metadata-validator.js';
import type { ConnectionCollections } from '../../../collection/registry/types.js';
import { CollectionMetadataService } from '../../../metadata/service.js';
import { DatabaseCollectionMetadataStore } from '../../../metadata/internal/database-document-store.js';
import { TransactionCollectionMetadataStore } from '../../../metadata/internal/transaction-document-store.js';
import type { CollectionMetadataStore } from '../../../metadata/document-store.js';
import type {
  CollectionMetadataInvalidation,
  CollectionMetadataInvalidator,
} from '../../../metadata/service.js';
import { DefaultNamingStrategy } from '../../../naming/default-strategy.js';
import { KnexQueryAdapter } from '../../../query/internal/knex/adapter.js';
import type { QueryAdapter } from '../../../query/types.js';
import { KnexRepositoryExecutionAdapter } from '../../../repository/internal/knex-execution-adapter.js';
import { DefaultRepository } from '../../../repository/repository.js';
import type {
  Repository,
  RepositoryRecord,
} from '../../../repository/types.js';
import { bindPolicies } from './policy-bound-connection.js';
import { RepositoryListenerConnection } from './listener-connection.js';
import { RepositoryError } from '../../../repository/errors.js';
import type {
  ExplainRepositoryEventsOptions,
  RepositoryEventErrorContext,
  RepositoryEventsExplanation,
  RepositoryMutationListeners,
  RepositoryMutationSubscriptionOptions,
} from '../../../repository/events/types.js';
import type {
  RepositoryEventsBinding,
  RepositoryOperationParent,
} from '../../../repository/internal/events/delivery.js';
import { RepositoryMutationRegistry } from '../../../repository/internal/events/registry.js';
import { explainStrategy } from '../../../repository/internal/events/strategy.js';
import { registerUnobservedRepositories } from '../../../repository/internal/events/unobserved.js';
import type {
  NormalizedRepositoryPolicy,
  RepositoryPolicy,
} from '../../../repository/policy/types.js';
import { KnexSchemaAdapter } from '../../../schema/internal/knex/adapter.js';
import type {
  DatabaseCapabilities,
  SchemaAdapter,
} from '../../../schema/adapter.js';
import type { SchemaInspector } from '../../../schema/inspector/types.js';
import { resolveDatabaseCapabilities } from '../../capabilities.js';
import { isNocoBaseInternalTable } from '../internal-tables.js';
import {
  attachDatabaseDriverRuntime,
  createDefaultDatabaseDriverRuntime,
  type DatabaseDriverRuntime,
} from '../../runtime.js';
import type {
  ConnectionConfig,
  DatabaseDialect,
  DatabaseDriver,
  DatabaseDriverDefinition,
  SchemaManagementMode,
} from '../../config.js';
import type {
  DatabaseConnection,
  ScopedDatabaseConnection,
} from '../../connection.js';
import { SchemaManagementSchemaAdapter } from '../../schema-management.js';
import {
  runAfterCommitNow,
  TransactionCallbacks,
  type AfterCommitCallback,
  type AfterRollbackCallback,
  type TransactionCallbackPhase,
} from '../transaction-callbacks.js';
import { createKnexClient } from './client.js';
import {
  resolveKnexConnectionConfig,
  type KnexConnectionConfig,
} from './config.js';

/** How deep `inTransaction` listener writes may nest unless the connection says otherwise. */
const defaultRepositoryEventMaxDepth = 8;

/** Which events a Repository handed out by a connection takes part in. */
export interface RepositoryEventScope {
  /** The event whose `inTransaction` listener is making this write. */
  readonly parent?: RepositoryOperationParent;
  /** False for a migration or seed task's Repository: nothing is recorded or delivered. */
  readonly observed?: boolean;
}

export class KnexDatabaseConnection implements DatabaseConnection {
  readonly driver: DatabaseDriver;
  readonly dialect: DatabaseDialect;
  readonly schemaManagement: SchemaManagementMode;
  readonly capabilities: DatabaseCapabilities;
  readonly runtime: DatabaseDriverRuntime;
  readonly schema: SchemaAdapter;
  readonly schemaInspector: SchemaInspector;
  readonly builder: CollectionBuilder;
  readonly collections: ConnectionCollections;
  readonly collectionMetadata: CollectionMetadataService;
  readonly query: QueryAdapter;

  private knexInstance?: Knex;
  private readonly config: KnexConnectionConfig;
  private readonly metadataStore: CollectionMetadataStore;

  constructor(
    readonly name: string,
    private readonly sourceConfig: ConnectionConfig,
    metadataStore?: CollectionMetadataStore,
    knexInstance?: Knex,
    private readonly transactionInvalidations:
      TransactionInvalidationCollector | undefined = undefined,
    private readonly dialectDriver:
      DatabaseDriverDefinition | undefined = undefined,
    private readonly transactionCallbacks:
      TransactionCallbacks | undefined = undefined,
    /** Owned by the root connection and shared with all its transactions. */
    private readonly mutationRegistry: RepositoryMutationRegistry = new RepositoryMutationRegistry(),
    /** The connection this transaction connection was opened from; none on the root. */
    private readonly rootConnection:
      KnexDatabaseConnection | undefined = undefined,
  ) {
    const maxDepth = sourceConfig.repositoryEventMaxDepth;
    if (
      maxDepth !== undefined &&
      (!Number.isInteger(maxDepth) || maxDepth < 0)
    ) {
      throw new TypeError(
        `Connection "${name}" repositoryEventMaxDepth must be a non-negative integer.`,
      );
    }
    this.knexInstance = knexInstance;
    registerUnobservedRepositories(this, (collection) =>
      this.createRepository(collection, undefined, { observed: false }),
    );
    this.config = resolveKnexConnectionConfig(sourceConfig, dialectDriver);
    this.metadataStore =
      metadataStore ??
      new DatabaseCollectionMetadataStore({
        resolveClient: () => this.resolveClient(),
      });
    this.driver = this.config.driver;
    this.dialect = this.config.dialect;
    this.schemaManagement = this.config.schemaManagement;
    this.capabilities = resolveDatabaseCapabilities({
      ...dialectDriver?.capabilities,
      ...this.config.capabilities,
    });
    const runtimeContext = {
      dialect: this.dialect,
      sourceConfig: this.sourceConfig,
      config: this.config,
      capabilities: this.capabilities,
      getClient: () => this.getClient(),
      resolveClient: () => this.resolveClient(),
    };
    this.runtime = dialectDriver?.createRuntime
      ? dialectDriver.createRuntime(runtimeContext)
      : createDefaultDatabaseDriverRuntime(runtimeContext);
    if (this.runtime.dialect !== this.dialect) {
      throw new Error(
        `Database driver runtime for dialect "${this.dialect}" resolved to "${this.runtime.dialect}".`,
      );
    }
    if (this.knexInstance) {
      attachDatabaseDriverRuntime(this.knexInstance, this.runtime);
    }
    if (!dialectDriver?.createSchemaInspector) {
      throw new Error(
        `Database driver for dialect "${this.dialect}" must create a schema inspector.`,
      );
    }
    this.schemaInspector = dialectDriver.createSchemaInspector({
      connectionName: this.name,
      config: this.config,
      resolveClient: () => this.resolveClient(),
    });
    this.schema = new SchemaManagementSchemaAdapter(
      new LazySchemaAdapter(
        () => this.resolveClient(),
        (client) =>
          new KnexSchemaAdapter(client, {
            dialect: this.dialect,
            capabilities: this.capabilities,
            runtime: this.runtime,
          }),
        this.dialect,
        this.capabilities,
      ),
      {
        connectionName: this.name,
        mode: this.schemaManagement,
      },
    );
    this.query = new KnexQueryAdapter(
      () => this.getClient(),
      new DefaultNamingStrategy({
        underscored: this.config.naming?.underscored,
        tablePrefix: this.config.naming?.tablePrefix,
      }),
      (name) => collections.getForQuery(name),
      this.runtime,
    );
    const collections = new CollectionRegistry({
      inspector: this.schemaInspector,
      metadataStore: this.metadataStore,
      naming: this.config.naming,
      isInternalPhysicalCollection: (identity) =>
        isNocoBaseInternalTable(identity.tableName) ||
        (this.config.internalTables?.includes(identity.tableName) ?? false) ||
        (this.metadataStore instanceof DatabaseCollectionMetadataStore &&
          this.metadataStore.isInternalPhysicalCollection(identity)),
    });
    this.collections = collections;
    const invalidator = transactionInvalidations
      ? new TransactionCollectionInvalidator(
          collections,
          transactionInvalidations,
        )
      : collections;
    this.collectionMetadata = new CollectionMetadataService({
      store: this.metadataStore,
      validator: new RegistryMetadataDocumentValidator({
        inspector: this.schemaInspector,
        metadataStore: this.metadataStore,
        collections,
        naming: this.config.naming,
        deferRelationValidation: Boolean(transactionInvalidations),
      }),
      invalidator,
      onInvalidationError: (error) =>
        this.reportCollectionMetadataInvalidationError(error),
    });
    this.builder = new CollectionBuilder({
      schemaAdapter: this.schema,
      collections,
      collectionMetadata: this.collectionMetadata,
      schemaInvalidator: invalidator,
      naming: this.config.naming,
    });
  }

  async connect(): Promise<this> {
    this.getClient();
    await (this.collections as CollectionRegistry).initialize();
    return this;
  }

  async client<T = unknown>(): Promise<T> {
    return this.resolveClient() as T;
  }

  repository<
    TRecord extends object = RepositoryRecord,
    TCreate extends object = Partial<TRecord>,
    TUpdate extends object = Partial<TRecord>,
  >(collection: string): Repository<TRecord, TCreate, TUpdate> {
    return this.createRepository<TRecord, TCreate, TUpdate>(
      collection,
      undefined,
    );
  }

  /**
   * Build a Repository with a pre-normalized Policy already attached. Used by
   * {@link PolicyBoundConnection} so binding does not have to re-normalize on
   * every call.
   */
  createRepository<
    TRecord extends object = RepositoryRecord,
    TCreate extends object = Partial<TRecord>,
    TUpdate extends object = Partial<TRecord>,
  >(
    collection: string,
    policy: NormalizedRepositoryPolicy | undefined,
    events: RepositoryEventScope = {},
  ): Repository<TRecord, TCreate, TUpdate> {
    return new DefaultRepository<TRecord, TCreate, TUpdate>({
      collection,
      collections: this.collections,
      policy,
      adapter: new KnexRepositoryExecutionAdapter(
        () => this.getClient(),
        (name) => this.collections.get(name),
        this.runtime,
        events.observed === false
          ? undefined
          : this.repositoryEvents(events.parent),
      ),
    });
  }

  onRepositoryMutation(
    options: RepositoryMutationSubscriptionOptions,
    listeners: RepositoryMutationListeners,
  ): () => void {
    return this.mutationRegistry.subscribe(options, listeners);
  }

  async explainRepositoryEvents(
    options: ExplainRepositoryEventsOptions,
  ): Promise<RepositoryEventsExplanation> {
    const collection = await this.collections.get(options.collection);
    if (!collection) {
      throw new RepositoryError(
        'COLLECTION_NOT_FOUND',
        `Collection "${options.collection}" was not found.`,
        { collection: options.collection },
      );
    }
    return explainStrategy(
      collection,
      options.operation,
      this.mutationRegistry.matching(new Set([collection.name!])),
      this.runtime,
    );
  }

  /**
   * What the execution adapter of a Repository on this connection needs to
   * deliver events. Its implicit transactions go through `transaction()`, so
   * listeners get a transaction connection and delivery rides on layer 1.
   */
  private repositoryEvents(
    parent: RepositoryOperationParent | undefined,
  ): RepositoryEventsBinding {
    return {
      registry: this.mutationRegistry,
      connectionName: this.name,
      callbacks: this.transactionCallbacks,
      parent,
      maxDepth:
        this.sourceConfig.repositoryEventMaxDepth ??
        defaultRepositoryEventMaxDepth,
      transaction: (execute) =>
        this.transaction((connection) => {
          const transaction = connection as KnexDatabaseConnection;
          return execute(
            transaction.repositoryEvents(parent),
            transaction.getClient() as Knex.Transaction,
          );
        }),
      listenerConnection: (operation) =>
        new RepositoryListenerConnection(this, operation),
      afterCommitConnection: (operation) =>
        new RepositoryListenerConnection(
          this.rootConnection ?? this,
          operation,
        ),
      reportError: (error, context) =>
        this.reportRepositoryEventError(error, context),
    };
  }

  withPolicies<P>(
    policies: Readonly<
      Record<string, RepositoryPolicy | ((principal: P) => RepositoryPolicy)>
    >,
    principal: P,
  ): ScopedDatabaseConnection {
    return bindPolicies(this, policies, principal);
  }

  async disconnect(): Promise<void> {
    this.collections.invalidate();
    const client = this.knexInstance;
    if (!client) {
      return;
    }
    this.knexInstance = undefined;
    await client.destroy();
  }

  async reconnect(): Promise<this> {
    await this.disconnect();
    await this.connect();
    return this;
  }

  async resetManagedSchema(): Promise<void> {
    if (this.schemaManagement === 'external') {
      throw new Error(
        `Connection "${this.name}" uses external schema management and cannot be reset.`,
      );
    }
    if (!this.dialectDriver?.resetManagedSchema) {
      throw new Error(
        `Database driver for dialect "${this.dialect}" does not support managed schema reset.`,
      );
    }
    await this.dialectDriver.resetManagedSchema({
      connectionName: this.name,
      config: this.sourceConfig,
      resolveClient: () => this.resolveClient(),
    });
    if (this.metadataStore instanceof DatabaseCollectionMetadataStore) {
      await this.metadataStore.reinitialize();
    } else {
      await this.metadataStore.initialize();
    }
    this.collections.invalidate();
  }

  afterCommit(callback: AfterCommitCallback): void {
    if (this.transactionCallbacks) {
      this.transactionCallbacks.afterCommit(callback);
      return;
    }
    runAfterCommitNow(callback, (error, phase) =>
      this.reportTransactionCallbackError(error, phase),
    );
  }

  afterRollback(callback: AfterRollbackCallback): void {
    this.transactionCallbacks?.afterRollback(callback);
  }

  async transaction<T>(
    fn: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    const client = await this.resolveClient();
    let stagedMetadata: TransactionCollectionMetadataStore | undefined;
    const invalidations = new TransactionInvalidationCollector();
    // A transaction opened on a transaction connection is a savepoint; its
    // callbacks are scoped to it and handed to the enclosing transaction.
    const callbacks = new TransactionCallbacks(this.transactionCallbacks);
    const report = (error: unknown, phase: TransactionCallbackPhase): void =>
      this.reportTransactionCallbackError(error, phase);
    let result: T;
    try {
      result = await client.transaction(async (trx) => {
        const metadataStore =
          this.metadataStore instanceof DatabaseCollectionMetadataStore
            ? this.metadataStore.withClient(async () => trx)
            : (stagedMetadata = new TransactionCollectionMetadataStore(
                this.metadataStore,
              ));
        const connection = new KnexDatabaseConnection(
          this.name,
          this.sourceConfig,
          metadataStore,
          trx,
          invalidations,
          this.dialectDriver,
          callbacks,
          this.mutationRegistry,
          this.rootConnection ?? this,
        );
        const transactionResult = await fn(connection);
        await invalidations.validateRelations(connection.collections);
        await stagedMetadata?.commit();
        return transactionResult;
      });
    } catch (error) {
      await stagedMetadata?.rollbackCommitted();
      invalidations.clear();
      await callbacks.rollback(error, report);
      throw error;
    }
    // A savepoint's metadata changes are only durable once the enclosing
    // transaction commits, so the enclosing transaction has to publish them to
    // the root Registry as well, not just this transaction's own.
    this.transactionInvalidations?.absorb(invalidations);
    invalidations.apply(this.collections as CollectionRegistry);
    if (callbacks.parent) {
      callbacks.release();
    } else {
      // After the invalidations, so a callback reads the committed schema.
      await callbacks.commit(report);
    }
    return result;
  }

  private getClient(): Knex {
    if (!this.knexInstance) {
      this.knexInstance = createKnexClient(this.config);
      attachDatabaseDriverRuntime(this.knexInstance, this.runtime);
    }
    return this.knexInstance;
  }

  private async resolveClient(): Promise<Knex> {
    return this.getClient();
  }

  private reportTransactionCallbackError(
    error: unknown,
    phase: TransactionCallbackPhase,
  ): void {
    const handler = this.sourceConfig.onTransactionCallbackError;
    if (handler) {
      try {
        handler(error, phase);
        return;
      } catch (handlerError) {
        // A failing handler must not undo the guarantee it reports on: the
        // transaction outcome stays as it is and the next callbacks still run.
        emitCodedWarning(
          'TRANSACTION_CALLBACK_FAILED',
          'phase: handler',
          handlerError,
        );
      }
    }
    emitCodedWarning('TRANSACTION_CALLBACK_FAILED', `phase: ${phase}`, error);
  }

  private reportRepositoryEventError(
    error: unknown,
    context: RepositoryEventErrorContext,
  ): void {
    if (this.sourceConfig.onRepositoryEventError) {
      try {
        this.sourceConfig.onRepositoryEventError(error, context);
        return;
      } catch (reporterError) {
        // A failing reporter must not turn a committed write into an error;
        // both failures still surface as one warning.
        error = new AggregateError(
          [error, reporterError],
          'onRepositoryEventError threw while reporting a listener failure.',
        );
      }
    }
    emitCodedWarning(
      'REPOSITORY_EVENT_LISTENER_FAILED',
      `subscription: ${context.subscriptionId ?? '(unnamed)'}; operations: ${context.operationIds.join(', ')}`,
      error,
    );
  }

  private reportCollectionMetadataInvalidationError(error: unknown): void {
    if (this.sourceConfig.onCollectionMetadataInvalidationError) {
      this.sourceConfig.onCollectionMetadataInvalidationError(error);
      return;
    }
    emitCodedWarning(
      'COLLECTION_METADATA_INVALIDATION_FAILED',
      undefined,
      error,
    );
  }
}

/**
 * `process.emitWarning` applies `code` and `detail` only to a warning it
 * builds from a string; an Error handed to it is emitted as it is, without
 * them. So the warning is built here, with the failure as its `cause`, and a
 * `warning` listener can read the code it was promised.
 */
function emitCodedWarning(
  code: string,
  detail: string | undefined,
  cause: unknown,
): void {
  const warning = Object.assign(
    new Error(cause instanceof Error ? cause.message : String(cause), {
      cause,
    }),
    { name: 'Warning', code, ...(detail === undefined ? {} : { detail }) },
  );
  process.emitWarning(warning);
}

class TransactionInvalidationCollector {
  private all = false;
  private namingIndex = false;
  private readonly collections = new Set<string>();

  async validateRelations(collections: ConnectionCollections): Promise<void> {
    for (const collection of this.collections) {
      await collections.validateRelations(collection);
    }
  }

  /** Takes over what a released savepoint recorded. */
  absorb(savepoint: TransactionInvalidationCollector): void {
    if (savepoint.all) this.all = true;
    for (const collection of savepoint.collections) {
      this.collections.add(collection);
    }
    this.namingIndex ||= savepoint.namingIndex;
  }

  record(change?: CollectionMetadataInvalidation): void {
    if (!change) {
      this.all = true;
      return;
    }
    for (const collection of change.collections) {
      this.collections.add(collection);
    }
    this.namingIndex ||= change.namingIndex;
  }

  apply(target: CollectionMetadataInvalidator): void {
    if (this.all) {
      target.invalidateAll();
    } else if (this.collections.size > 0 || this.namingIndex) {
      target.invalidate({
        collections: [...this.collections],
        namingIndex: this.namingIndex,
      });
    }
    this.clear();
  }

  clear(): void {
    this.all = false;
    this.namingIndex = false;
    this.collections.clear();
  }
}

class TransactionCollectionInvalidator implements CollectionMetadataInvalidator {
  constructor(
    private readonly local: CollectionMetadataInvalidator,
    private readonly transaction: TransactionInvalidationCollector,
  ) {}

  invalidate(change: CollectionMetadataInvalidation): void {
    this.local.invalidate(change);
    this.transaction.record(change);
  }

  invalidateAll(): void {
    this.local.invalidateAll();
    this.transaction.record();
  }
}

class LazySchemaAdapter implements SchemaAdapter {
  private adapter?: SchemaAdapter;

  constructor(
    private readonly resolveClient: () => Promise<Knex>,
    private readonly createAdapter: (client: Knex) => SchemaAdapter,
    readonly dialect: string,
    readonly capabilities: DatabaseCapabilities,
  ) {}

  async execute(
    operations: Parameters<SchemaAdapter['execute']>[0],
  ): Promise<void> {
    return (await this.resolveAdapter()).execute(operations);
  }

  async compile(
    operations: Parameters<NonNullable<SchemaAdapter['compile']>>[0],
  ): Promise<string[]> {
    const adapter = await this.resolveAdapter();
    return adapter.compile ? adapter.compile(operations) : [];
  }

  private async resolveAdapter(): Promise<SchemaAdapter> {
    if (!this.adapter) {
      this.adapter = this.createAdapter(await this.resolveClient());
    }
    return this.adapter;
  }
}
