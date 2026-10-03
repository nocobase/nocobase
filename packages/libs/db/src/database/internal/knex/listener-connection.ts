import type { CollectionBuilder } from '../../../collection/builder/builder.js';
import type { ConnectionCollections } from '../../../collection/registry/types.js';
import type { CollectionMetadataService } from '../../../metadata/service.js';
import type { QueryAdapter } from '../../../query/types.js';
import type {
  ExplainRepositoryEventsOptions,
  RepositoryEventsExplanation,
  RepositoryMutationListeners,
  RepositoryMutationSubscriptionOptions,
} from '../../../repository/events/types.js';
import type { RepositoryOperationParent } from '../../../repository/internal/events/delivery.js';
import type { NormalizedRepositoryPolicy } from '../../../repository/policy/types.js';
import type {
  Repository,
  RepositoryRecord,
} from '../../../repository/types.js';
import type {
  DatabaseCapabilities,
  SchemaAdapter,
} from '../../../schema/adapter.js';
import type { SchemaInspector } from '../../../schema/inspector/types.js';
import type { DatabaseDriver, SchemaManagementMode } from '../../config.js';
import type {
  DatabaseConnection,
  ScopedDatabaseConnection,
} from '../../connection.js';
import type { DatabaseDriverRuntime } from '../../runtime.js';
import type { KnexDatabaseConnection } from './connection.js';
import {
  bindPolicies,
  type PolicyBindableConnection,
} from './policy-bound-connection.js';

/**
 * The transaction connection an `inTransaction` listener receives. It is the
 * transaction connection of the call that emitted the event, except that the
 * Repositories it hands out, directly, through `withPolicies` or in a
 * savepoint, report that call as the parent of their own events. That is how
 * `parentOperationId` and the recursion limit follow a chain of listener
 * writes without ambient state.
 */
export class RepositoryListenerConnection implements PolicyBindableConnection {
  constructor(
    private readonly inner: KnexDatabaseConnection,
    private readonly parent: RepositoryOperationParent,
  ) {}

  get name(): string {
    return this.inner.name;
  }
  get driver(): DatabaseDriver {
    return this.inner.driver;
  }
  get dialect(): string {
    return this.inner.dialect;
  }
  get schemaManagement(): SchemaManagementMode {
    return this.inner.schemaManagement;
  }
  get capabilities(): DatabaseCapabilities {
    return this.inner.capabilities;
  }
  get runtime(): DatabaseDriverRuntime {
    return this.inner.runtime;
  }
  get builder(): CollectionBuilder {
    return this.inner.builder;
  }
  get collections(): ConnectionCollections {
    return this.inner.collections;
  }
  get collectionMetadata(): CollectionMetadataService {
    return this.inner.collectionMetadata;
  }
  get query(): QueryAdapter {
    return this.inner.query;
  }
  get schema(): SchemaAdapter {
    return this.inner.schema;
  }
  get schemaInspector(): SchemaInspector {
    return this.inner.schemaInspector;
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

  createRepository<
    TRecord extends object = RepositoryRecord,
    TCreate extends object = Partial<TRecord>,
    TUpdate extends object = Partial<TRecord>,
  >(
    collection: string,
    policy: NormalizedRepositoryPolicy | undefined,
  ): Repository<TRecord, TCreate, TUpdate> {
    return this.inner.createRepository<TRecord, TCreate, TUpdate>(
      collection,
      policy,
      { parent: this.parent },
    );
  }

  withPolicies<P>(
    policies: Parameters<DatabaseConnection['withPolicies']>[0],
    principal: P,
  ): ScopedDatabaseConnection {
    return bindPolicies(this, policies, principal);
  }

  async client<T = unknown>(): Promise<T> {
    return this.inner.client<T>();
  }

  async connect(): Promise<this> {
    await this.inner.connect();
    return this;
  }

  async disconnect(): Promise<void> {
    return this.inner.disconnect();
  }

  async reconnect(): Promise<this> {
    await this.inner.reconnect();
    return this;
  }

  async resetManagedSchema(): Promise<void> {
    return this.inner.resetManagedSchema();
  }

  async transaction<T>(
    fn: (connection: DatabaseConnection) => Promise<T>,
  ): Promise<T> {
    return this.inner.transaction((connection) =>
      fn(
        new RepositoryListenerConnection(
          connection as KnexDatabaseConnection,
          this.parent,
        ),
      ),
    );
  }

  afterCommit(callback: () => void | Promise<void>): void {
    this.inner.afterCommit(callback);
  }

  afterRollback(callback: (error: unknown) => void | Promise<void>): void {
    this.inner.afterRollback(callback);
  }

  onRepositoryMutation(
    options: RepositoryMutationSubscriptionOptions,
    listeners: RepositoryMutationListeners,
  ): () => void {
    return this.inner.onRepositoryMutation(options, listeners);
  }

  explainRepositoryEvents(
    options: ExplainRepositoryEventsOptions,
  ): Promise<RepositoryEventsExplanation> {
    return this.inner.explainRepositoryEvents(options);
  }
}
