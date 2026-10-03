import type { CollectionBuilder } from '../../../collection/builder/builder.js';
import type { ConnectionCollections } from '../../../collection/registry/types.js';
import type { CollectionMetadataService } from '../../../metadata/service.js';
import type { QueryAdapter } from '../../../query/types.js';
import type {
  NormalizedRepositoryPolicy,
  RepositoryPolicy,
} from '../../../repository/policy/types.js';
import { normalizeRepositoryPolicy } from '../../../repository/policy/normalize.js';
import { expandPolicyRefs } from '../../../repository/policy/refs.js';
import type {
  ExplainRepositoryEventsOptions,
  RepositoryEventsExplanation,
  RepositoryMutationListeners,
  RepositoryMutationSubscriptionOptions,
} from '../../../repository/events/types.js';
import type {
  Repository,
  RepositoryRecord,
} from '../../../repository/types.js';
import type {
  DatabaseCapabilities,
  SchemaAdapter,
} from '../../../schema/adapter.js';
import type { SchemaInspector } from '../../../schema/inspector/types.js';
import type {
  DatabaseConnection,
  ScopedDatabaseConnection,
} from '../../connection.js';
import type { DatabaseDriver, SchemaManagementMode } from '../../config.js';
import type { DatabaseDriverRuntime } from '../../runtime.js';

/** What a policy-bound connection needs from the connection underneath it. */
export interface PolicyBindableConnection extends DatabaseConnection {
  createRepository<
    TRecord extends object = RepositoryRecord,
    TCreate extends object = Partial<TRecord>,
    TUpdate extends object = Partial<TRecord>,
  >(
    collection: string,
    policy: NormalizedRepositoryPolicy | undefined,
  ): Repository<TRecord, TCreate, TUpdate>;
}

/**
 * A connection that hands out policy-bound repositories.
 *
 * It delegates to the connection it was derived from rather than building a
 * second one. That is not only tidier: a second connection would carry its own
 * empty collection registry, so every request that bound a policy would
 * re-introspect the schema, and it would open its own pool the first time it
 * was used because the original had not connected yet. Delegating keeps one
 * connection, one registry cache and one pool, and leaves transactions to the
 * connection that knows how to run them.
 */
export class PolicyBoundConnection implements ScopedDatabaseConnection {
  constructor(
    private readonly inner: PolicyBindableConnection,
    private readonly policies: Readonly<
      Record<string, NormalizedRepositoryPolicy>
    >,
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

  /**
   * A collection the map does not cover returns an unbound Repository, which
   * is why this cannot promise a ScopedRepository. Tightening that is what
   * `requireScope` on the Collection is for.
   */
  repository<
    TRecord extends object = RepositoryRecord,
    TCreate extends object = Partial<TRecord>,
    TUpdate extends object = Partial<TRecord>,
  >(collection: string): Repository<TRecord, TCreate, TUpdate> {
    return this.inner.createRepository<TRecord, TCreate, TUpdate>(
      collection,
      this.policies[collection],
    );
  }

  /** The policies this connection binds, by collection name. */
  explainPolicies(): Readonly<Record<string, NormalizedRepositoryPolicy>> {
    return this.policies;
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

  afterCommit(callback: () => void | Promise<void>): void {
    this.inner.afterCommit(callback);
  }

  afterRollback(callback: (error: unknown) => void | Promise<void>): void {
    this.inner.afterRollback(callback);
  }

  /** Registers on the connection underneath; bindings do not narrow what is observed. */
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

  /**
   * Transactions run on the connection underneath, so everything it sets up
   * for one — the deferred invalidation collector above all — stays in place.
   * The bindings ride along into the transaction.
   */
  async transaction<T>(
    fn: (connection: ScopedDatabaseConnection) => Promise<T>,
  ): Promise<T> {
    return this.inner.transaction((connection) =>
      fn(
        new PolicyBoundConnection(
          connection as PolicyBindableConnection,
          this.policies,
        ),
      ),
    );
  }
}

/** Bind normalized Policies, per Collection, to a connection for one principal. */
export function bindPolicies<P>(
  connection: PolicyBindableConnection,
  policies: Readonly<
    Record<string, RepositoryPolicy | ((principal: P) => RepositoryPolicy)>
  >,
  principal: P,
): ScopedDatabaseConnection {
  const normalized = Object.fromEntries(
    Object.entries(policies).map(([collection, policy]) => [
      collection,
      normalizeRepositoryPolicy(
        typeof policy === 'function' ? policy(principal) : policy,
      ),
    ]),
  );
  return new PolicyBoundConnection(connection, expandPolicyRefs(normalized));
}
