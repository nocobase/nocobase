import { RepositoryError } from '../../repository/errors.js';
import { detachPolicy } from '../../repository/policy/enforce.js';
import { normalizeRepositoryPolicy } from '../../repository/policy/normalize.js';
import { expandPolicyRefs } from '../../repository/policy/refs.js';
import type { NormalizedRepositoryPolicy } from '../../repository/policy/types.js';
import type {
  RepositoryRecord,
  ScopedRepository,
} from '../../repository/types.js';
import type { DatabaseConnection } from '../connection.js';
import type { RestrictedDatabase } from '../restricted-database.js';
import type { DatabasePolicyMap } from '../policy-map.js';

export function createRestrictedDatabase<P, TCollection extends string>(
  connection: DatabaseConnection,
  policies: DatabasePolicyMap<P, TCollection>,
  principal: P,
): RestrictedDatabase<TCollection> {
  if (
    typeof policies !== 'object' ||
    policies === null ||
    (Object.getPrototypeOf(policies) !== Object.prototype &&
      Object.getPrototypeOf(policies) !== null)
  ) {
    throw new RepositoryError('INVALID_POLICY', 'Expected a plain policy map.');
  }
  const normalized = Object.fromEntries(
    Object.entries(policies).map(([collection, policy]) => [
      collection,
      normalizeRepositoryPolicy(
        typeof policy === 'function' ? policy(principal) : policy,
      ),
    ]),
  );
  return restrictedDatabaseFromPolicies(
    connection,
    expandPolicyRefs(normalized),
  );
}

function restrictedDatabaseFromPolicies<TCollection extends string>(
  connection: DatabaseConnection,
  policies: Readonly<Record<string, NormalizedRepositoryPolicy>>,
): RestrictedDatabase<TCollection> {
  // Keep capabilities in closures, not TypeScript-private object properties.
  return Object.freeze({
    repository<
      TRecord extends object = RepositoryRecord,
      TCreate extends object = Partial<TRecord>,
      TUpdate extends object = Partial<TRecord>,
    >(
      collection: TCollection,
    ): ScopedRepository<Partial<TRecord>, TCreate, TUpdate> {
      if (!Object.hasOwn(policies, collection)) {
        throw new RepositoryError(
          'POLICY_REQUIRED',
          `Collection "${collection}" has no policy in this restricted database.`,
          { collection },
        );
      }
      return restrictRepository(
        connection
          .repository<TRecord, TCreate, TUpdate>(collection)
          .withPolicy(policies[collection]),
      );
    },
    transaction<T>(
      fn: (database: RestrictedDatabase<TCollection>) => Promise<T>,
    ): Promise<T> {
      return connection.transaction((transaction) =>
        fn(restrictedDatabaseFromPolicies<TCollection>(transaction, policies)),
      );
    },
    afterCommit(callback: () => void | Promise<void>): void {
      connection.afterCommit(callback);
    },
    afterRollback(callback: (error: unknown) => void | Promise<void>): void {
      connection.afterRollback(callback);
    },
    explainPolicies(): Readonly<
      Record<TCollection, NormalizedRepositoryPolicy>
    > {
      return Object.freeze(
        Object.fromEntries(
          Object.entries(policies).map(([name, policy]) => [
            name,
            detachPolicy(policy),
          ]),
        ),
      ) as Readonly<Record<TCollection, NormalizedRepositoryPolicy>>;
    },
  });
}

function restrictRepository<
  TRecord extends object,
  TCreate extends object,
  TUpdate extends object,
>(
  repository: ScopedRepository<TRecord, TCreate, TUpdate>,
): ScopedRepository<TRecord, TCreate, TUpdate> {
  // The concrete repository also holds its execution adapter. Never hand that
  // object out, including after narrow(), or callers could recover raw access.
  const facade: ScopedRepository<TRecord, TCreate, TUpdate> = {
    findMany: repository.findMany.bind(repository),
    findOne: repository.findOne.bind(repository),
    count: repository.count.bind(repository),
    exists: repository.exists.bind(repository),
    aggregate: repository.aggregate.bind(repository),
    groupBy: repository.groupBy.bind(repository),
    describeMutation: repository.describeMutation.bind(repository),
    validateMutation: repository.validateMutation.bind(repository),
    createOne: repository.createOne.bind(repository),
    createMany: repository.createMany.bind(repository),
    updateOne: repository.updateOne.bind(repository),
    upsertOne: repository.upsertOne.bind(repository),
    updateMany: repository.updateMany.bind(repository),
    deleteOne: repository.deleteOne.bind(repository),
    deleteMany: repository.deleteMany.bind(repository),
    narrow: (patch) => restrictRepository(repository.narrow(patch)),
    explainPolicy: () => repository.explainPolicy(),
  };
  return Object.freeze(facade);
}
