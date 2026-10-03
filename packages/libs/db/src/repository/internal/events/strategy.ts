import type { CollectionDefinition } from '../../../collection/types.js';
import type { DatabaseDriverRuntime } from '../../../database/runtime.js';
import type {
  RepositoryEventsExplanation,
  RepositoryEventStrategy,
  RepositoryMutationOperation,
} from '../../events/types.js';
import type { RepositoryMutationSubscription } from './registry.js';

/**
 * Fields that identify every row of a Collection, or nothing when a row may
 * have none: a keyless Collection, or one whose identifying unique key allows
 * null. A bulk write on such a Collection cannot report keys. The fields are
 * the ones bulk writes lock rows by: the primary key, else the first unique
 * key.
 */
export function eventIdentityFields(
  collection: CollectionDefinition,
): readonly string[] | undefined {
  const constraints = collection.constraints ?? [];
  const primary = constraints.find((candidate) => candidate.type === 'primary');
  if (primary?.type === 'primary' && primary.fields.length > 0) {
    return primary.fields;
  }
  const unique = constraints.find((candidate) => candidate.type === 'unique');
  if (unique?.type !== 'unique' || unique.predicate) return undefined;
  if (unique.fields.length === 0) return undefined;
  const nonNull = unique.fields.every((name) =>
    (collection.fields ?? []).some(
      (field) =>
        field.name === name && !('target' in field) && field.nullable === false,
    ),
  );
  return nonNull ? unique.fields : undefined;
}

/**
 * How a bulk write executes for these subscriptions. Keys are needed when a
 * subscription asks for them and the Collection can supply them; otherwise
 * the write keeps its single statement and reports a count.
 */
export function bulkStrategy(
  collection: CollectionDefinition,
  subscriptions: readonly RepositoryMutationSubscription[],
  operation: 'createMany' | 'updateMany' | 'deleteMany',
  runtime: DatabaseDriverRuntime | undefined,
): Exclude<RepositoryEventStrategy, 'unchanged'> {
  if (
    !subscriptions.some((subscription) => subscription.keys) ||
    !eventIdentityFields(collection)
  ) {
    return 'single-statement';
  }
  if (operation !== 'createMany') return 'lock-then-write-by-key';
  // A dialect that cannot insert this Collection in one statement at all
  // cannot do so with RETURNING either.
  if (runtime?.repository?.createManyFallback?.(collection)) {
    return 'insert-per-row';
  }
  return runtime?.repository?.insertManyReturning
    ? 'insert-returning'
    : 'insert-per-row';
}

/** What a call on the root Collection does, judged from the subscriptions matching it. */
export function explainStrategy(
  collection: CollectionDefinition,
  operation: RepositoryMutationOperation,
  subscriptions: readonly RepositoryMutationSubscription[],
  runtime: DatabaseDriverRuntime | undefined,
): RepositoryEventsExplanation {
  const bulk =
    operation === 'createMany' ||
    operation === 'updateMany' ||
    operation === 'deleteMany';
  const described = subscriptions.map((subscription) => ({
    ...(subscription.id === undefined ? {} : { id: subscription.id }),
    keys: subscription.keys,
    values: subscription.values,
    phases: [
      ...(subscription.listeners.inTransaction
        ? (['inTransaction'] as const)
        : []),
      ...(subscription.listeners.afterCommit ? (['afterCommit'] as const) : []),
    ],
  }));
  if (subscriptions.length === 0) {
    return {
      subscriptions: [],
      strategy: 'unchanged',
      granularity: 'none',
      implicitTransaction: !bulk,
    };
  }
  if (!bulk) {
    return {
      subscriptions: described,
      strategy: 'unchanged',
      granularity: 'rows',
      implicitTransaction: true,
    };
  }
  const strategy = bulkStrategy(collection, subscriptions, operation, runtime);
  if (strategy === 'single-statement') {
    return {
      subscriptions: described,
      strategy,
      granularity: 'count',
      implicitTransaction: subscriptions.some(
        (subscription) => subscription.listeners.inTransaction,
      ),
    };
  }
  return {
    subscriptions: described,
    strategy,
    granularity: 'rows',
    implicitTransaction: true,
  };
}
