import type {
  RepositoryMutationListeners,
  RepositoryMutationSubscriptionOptions,
} from '../../events/types.js';

export interface RepositoryMutationSubscription {
  readonly id: string | undefined;
  /** Registration order; listeners of one phase run in this order. */
  readonly sequence: number;
  readonly collections: ReadonlySet<string>;
  readonly keys: boolean;
  readonly values: boolean;
  readonly listeners: RepositoryMutationListeners;
}

/**
 * The subscriptions of one root connection. Its transaction connections share
 * it, so a subscription registered anywhere observes the whole connection.
 */
export class RepositoryMutationRegistry {
  private subscriptions: readonly RepositoryMutationSubscription[] = [];
  private sequence = 0;

  /** Checked before anything else, so a connection nobody observes pays nothing. */
  get empty(): boolean {
    return this.subscriptions.length === 0;
  }

  subscribe(
    options: RepositoryMutationSubscriptionOptions,
    listeners: RepositoryMutationListeners,
  ): () => void {
    if (
      !Array.isArray(options.collections) ||
      options.collections.length === 0
    ) {
      throw new TypeError(
        'onRepositoryMutation() needs at least one Collection in `collections`.',
      );
    }
    if (options.collections.some((name) => typeof name !== 'string' || !name)) {
      throw new TypeError(
        'onRepositoryMutation() `collections` must be non-empty Collection names.',
      );
    }
    if (
      typeof listeners.inTransaction !== 'function' &&
      typeof listeners.afterCommit !== 'function'
    ) {
      throw new TypeError(
        'onRepositoryMutation() needs an `inTransaction` or `afterCommit` listener.',
      );
    }
    const subscription: RepositoryMutationSubscription = {
      id: options.id,
      sequence: (this.sequence += 1),
      collections: new Set(options.collections),
      keys: options.keys ?? true,
      values: options.values ?? false,
      listeners: {
        inTransaction: listeners.inTransaction,
        afterCommit: listeners.afterCommit,
      },
    };
    // Replaced rather than mutated, so a delivery that is iterating keeps the
    // list it started with.
    this.subscriptions = [...this.subscriptions, subscription];
    return () => {
      this.subscriptions = this.subscriptions.filter(
        (candidate) => candidate !== subscription,
      );
    };
  }

  /** Subscriptions observing any of `collections`, in registration order. */
  matching(
    collections: ReadonlySet<string>,
  ): readonly RepositoryMutationSubscription[] {
    return this.subscriptions.filter((subscription) =>
      matchesAny(subscription, collections),
    );
  }
}

export function matchesAny(
  subscription: RepositoryMutationSubscription,
  collections: ReadonlySet<string>,
): boolean {
  for (const name of subscription.collections) {
    if (collections.has(name)) return true;
  }
  return false;
}
