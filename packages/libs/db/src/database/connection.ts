import type { CollectionBuilder } from '../collection/builder/builder.js';
import type { ConnectionCollections } from '../collection/registry/types.js';
import type { CollectionMetadataService } from '../metadata/service.js';
import type { QueryAdapter } from '../query/types.js';
import type { Repository, RepositoryRecord } from '../repository/types.js';
import type {
  ExplainRepositoryEventsOptions,
  RepositoryEventsExplanation,
  RepositoryMutationListeners,
  RepositoryMutationSubscriptionOptions,
} from '../repository/events/types.js';
import type {
  NormalizedRepositoryPolicy,
  RepositoryPolicy,
} from '../repository/policy/types.js';
import type { DatabaseCapabilities, SchemaAdapter } from '../schema/adapter.js';
import type { SchemaInspector } from '../schema/inspector/types.js';
import type { DatabaseDriver, SchemaManagementMode } from './config.js';
import type { DatabaseDriverRuntime } from './runtime.js';

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
  /**
   * Bind a Policy per Collection for one principal.
   *
   * Binding lives here rather than on each Repository because a request
   * usually touches several Collections and takes fresh Repositories inside a
   * transaction; one place to bind is also one place to see what this request
   * was authorized to touch.
   */
  withPolicies<P>(
    policies: Readonly<
      Record<string, RepositoryPolicy | ((principal: P) => RepositoryPolicy)>
    >,
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

/**
 * A Connection carrying Policy bindings. It has no `withPolicies` of its own,
 * so the bindings cannot be replaced by a second call — narrowing them is
 * `narrow` on the Repository, and widening is not on offer.
 */
export interface ScopedDatabaseConnection extends Omit<
  DatabaseConnection,
  'withPolicies' | 'transaction' | 'connect' | 'reconnect'
> {
  /** The Policies in force, by Collection name. */
  explainPolicies(): Readonly<Record<string, NormalizedRepositoryPolicy>>;
  connect(): Promise<ScopedDatabaseConnection>;
  reconnect(): Promise<ScopedDatabaseConnection>;
  transaction<T>(
    fn: (connection: ScopedDatabaseConnection) => Promise<T>,
  ): Promise<T>;
}
