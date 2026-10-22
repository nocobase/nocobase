import type { NormalizedRepositoryPolicy } from '../repository/policy/types.js';
import type {
  RepositoryRecord,
  ScopedRepository,
} from '../repository/types.js';

/**
 * Repository access limited to an explicit policy map, created by connection.restrict().
 *
 * This is not a DatabaseConnection: it exposes no raw client, query builder,
 * schema management, connection lifecycle, or mutation subscriptions.
 * Relations follow the originating repository's policy; a target collection's
 * entry is reused only through an explicit read policy ref().
 */
export interface RestrictedDatabase<TCollection extends string = string> {
  /**
   * Access a collection covered by this restricted database, or throw POLICY_REQUIRED.
   * Records are partial because policy field allowlists can omit properties.
   */
  repository<
    TRecord extends object = RepositoryRecord,
    TCreate extends object = Partial<TRecord>,
    TUpdate extends object = Partial<TRecord>,
  >(
    collection: TCollection,
  ): ScopedRepository<Partial<TRecord>, TCreate, TUpdate>;

  /** Run a transaction or savepoint with the same policy bindings. */
  transaction<T>(
    fn: (database: RestrictedDatabase<TCollection>) => Promise<T>,
  ): Promise<T>;

  /** Uses the underlying connection's outermost-commit callback semantics. */
  afterCommit(callback: () => void | Promise<void>): void;

  /** Uses the underlying connection's transaction/savepoint rollback semantics. */
  afterRollback(callback: (error: unknown) => void | Promise<void>): void;

  /** A detached snapshot of the policies in force, by collection name. */
  explainPolicies(): Readonly<Record<TCollection, NormalizedRepositoryPolicy>>;
}
