import type { DatabaseConnection } from '../../../database/connection.js';
import type { Repository, RepositoryRecord } from '../../types.js';

type UnobservedRepositoryFactory = (collection: string) => Repository;

/**
 * Connections that can hand out a Repository whose writes are neither
 * recorded nor delivered and never change how a bulk write executes. Kept off
 * the public connection interface, so application code cannot switch events
 * off; migration and seed tasks reach it through their repository accessor.
 */
const factories = new WeakMap<object, UnobservedRepositoryFactory>();

export function registerUnobservedRepositories(
  connection: DatabaseConnection,
  factory: UnobservedRepositoryFactory,
): void {
  factories.set(connection, factory);
}

/** A Repository that emits no events, or an ordinary one where the connection cannot provide that. */
export function unobservedRepository<
  TRecord extends object = RepositoryRecord,
  TCreate extends object = Partial<TRecord>,
  TUpdate extends object = Partial<TRecord>,
>(
  connection: DatabaseConnection,
  collection: string,
): Repository<TRecord, TCreate, TUpdate> {
  const factory = factories.get(connection);
  return factory
    ? (factory(collection) as unknown as Repository<TRecord, TCreate, TUpdate>)
    : connection.repository<TRecord, TCreate, TUpdate>(collection);
}
