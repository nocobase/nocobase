import { randomUUID } from 'node:crypto';
import type { Knex } from 'knex';
import type { DatabaseConnection } from '../../../database/connection.js';
import type { TransactionCallbacks } from '../../../database/internal/transaction-callbacks.js';
import { RepositoryError } from '../../errors.js';
import type {
  RepositoryEventErrorContext,
  RepositoryEventMetaBag,
  RepositoryMutationCount,
  RepositoryMutationEvent,
  RepositoryMutationOperation,
  RepositoryMutationRows,
  RowChange,
} from '../../events/types.js';
import {
  matchesAny,
  type RepositoryMutationRegistry,
  type RepositoryMutationSubscription,
} from './registry.js';

/** The event whose `inTransaction` listener made a write. */
export interface RepositoryOperationParent {
  readonly operationId: string;
  readonly depth: number;
}

/**
 * What an execution adapter needs from the connection it was created on to
 * deliver events. Absent on a connection that must stay silent, such as the
 * one a migration or seed task writes through.
 */
export interface RepositoryEventsBinding {
  readonly registry: RepositoryMutationRegistry;
  readonly connectionName: string;
  /** Layer-1 scope of the transaction the connection belongs to; none on a root connection. */
  readonly callbacks: TransactionCallbacks | undefined;
  readonly parent: RepositoryOperationParent | undefined;
  readonly maxDepth: number;
  /**
   * Open an implicit transaction through the connection, so the listeners of
   * a call made without one still receive a transaction connection and
   * `afterCommit` delivery goes through layer 1.
   */
  transaction<T>(
    execute: (
      binding: RepositoryEventsBinding,
      client: Knex.Transaction,
    ) => Promise<T>,
  ): Promise<T>;
  /** The connection an `inTransaction` listener of `parent` receives. */
  listenerConnection(parent: RepositoryOperationParent): DatabaseConnection;
  /**
   * The root connection an `afterCommit` listener receives, whose writes
   * descend from `parent`: the batch it was handed.
   */
  afterCommitConnection(parent: RepositoryOperationParent): DatabaseConnection;
  reportError(error: unknown, context: RepositoryEventErrorContext): void;
}

/** One Repository call that matched at least one subscription. */
export interface RepositoryMutationCall {
  readonly binding: RepositoryEventsBinding;
  readonly operation: RepositoryMutationOperation;
  readonly collection: string;
  readonly scope: 'transaction' | 'connection';
  readonly subscriptions: readonly RepositoryMutationSubscription[];
  readonly meta: RepositoryEventMetaBag;
  readonly operationId: string;
  readonly depth: number;
}

const emptyMeta: RepositoryEventMetaBag = Object.freeze({});

/**
 * Start a call. A write made by an `inTransaction` listener is one level
 * deeper than the call that triggered it; past the connection's limit the
 * write is refused before it runs, so a listener that keeps writing to what
 * it observes fails instead of looping.
 */
export function beginRepositoryMutationCall(
  binding: RepositoryEventsBinding,
  operation: RepositoryMutationOperation,
  collection: string,
  scope: 'transaction' | 'connection',
  subscriptions: readonly RepositoryMutationSubscription[],
  meta: RepositoryEventMetaBag | undefined,
): RepositoryMutationCall {
  const depth = binding.parent ? binding.parent.depth + 1 : 0;
  if (depth > binding.maxDepth) {
    throw new RepositoryError(
      'REPOSITORY_EVENT_RECURSION',
      `Repository event listeners nested writes deeper than ${binding.maxDepth} levels.`,
      {
        collection,
        details: {
          operation,
          maxDepth: binding.maxDepth,
          parentOperationId: binding.parent?.operationId,
        },
      },
    );
  }
  return {
    binding,
    operation,
    collection,
    scope,
    subscriptions,
    meta: meta ?? emptyMeta,
    operationId: randomUUID(),
    depth,
  };
}

/**
 * Emit the event of a finished call: reserve its place in the `afterCommit`
 * batch, run the `inTransaction` listeners in registration order, and give
 * up the place if one throws. A call that wrote nothing emits nothing.
 */
export async function emitRepositoryMutation(
  call: RepositoryMutationCall,
  payload: RepositoryMutationRows | RepositoryMutationCount,
): Promise<void> {
  if (payload.granularity === 'rows' && payload.changes.length === 0) return;
  if (payload.granularity === 'count' && payload.count === 0) return;
  // The call targeted its root Collection even when every row it wrote was a
  // nested one, so a subscription on the root hears about it too.
  const touched =
    payload.granularity === 'rows'
      ? new Set([
          call.collection,
          ...payload.changes.map((change) => change.collection),
        ])
      : new Set([call.collection]);
  const delivered = call.subscriptions.filter((subscription) =>
    matchesAny(subscription, touched),
  );
  if (delivered.length === 0) return;
  const event: RepositoryMutationEvent = {
    operationId: call.operationId,
    ...(call.binding.parent
      ? { parentOperationId: call.binding.parent.operationId }
      : {}),
    connection: call.binding.connectionName,
    collection: call.collection,
    operation: call.operation,
    scope: call.scope,
    meta: call.meta,
    ...payload,
  };
  const views = new EventViews(event);
  const afterCommit = delivered.filter(
    (subscription) => subscription.listeners.afterCommit,
  );
  const entry: BatchEntry = {
    event: views,
    subscriptions: afterCommit,
    depth: call.depth,
  };
  const callbacks = call.binding.callbacks;
  const slot =
    afterCommit.length > 0 && callbacks
      ? reserve(callbacks, entry, call.binding)
      : undefined;
  try {
    const connection = delivered.some(
      (subscription) => subscription.listeners.inTransaction,
    )
      ? call.binding.listenerConnection({
          operationId: call.operationId,
          depth: call.depth,
        })
      : undefined;
    for (const subscription of delivered) {
      await subscription.listeners.inTransaction?.(
        views.for(subscription),
        connection!,
      );
    }
  } catch (error) {
    slot?.cancel();
    throw error;
  }
  if (afterCommit.length > 0 && !callbacks) {
    // A single autocommitted statement: it is already durable.
    await deliver([entry], call.binding);
  }
}

/** The event as each subscription sees it: written values only when asked for. */
class EventViews {
  private withoutValues?: RepositoryMutationEvent;

  constructor(readonly event: RepositoryMutationEvent) {}

  for(subscription: RepositoryMutationSubscription): RepositoryMutationEvent {
    if (subscription.values || this.event.granularity !== 'rows') {
      return this.event;
    }
    if (!this.event.changes.some((change) => change.values !== undefined)) {
      return this.event;
    }
    this.withoutValues ??= {
      ...this.event,
      changes: this.event.changes.map(withoutValues),
    };
    return this.withoutValues;
  }
}

function withoutValues(change: RowChange): RowChange {
  if (change.values === undefined) return change;
  return {
    collection: change.collection,
    kind: change.kind,
    key: change.key,
    ...(change.fields ? { fields: change.fields } : {}),
  };
}

interface BatchEntry {
  readonly event: EventViews;
  readonly subscriptions: readonly RepositoryMutationSubscription[];
  /** How deep in listener writes the call was; its afterCommit writes go one deeper. */
  readonly depth: number;
}

/**
 * Pending `afterCommit` deliveries, one batch per outermost transaction. The
 * batch hangs off the outermost layer-1 scope and is delivered by one commit
 * callback, so a listener receives every event of the transaction at once.
 * An entry made inside a savepoint also registers a rollback callback on the
 * savepoint's scope, which takes it out if the savepoint rolls back.
 */
const pendingBatches = new WeakMap<TransactionCallbacks, BatchEntry[]>();

function reserve(
  callbacks: TransactionCallbacks,
  entry: BatchEntry,
  binding: RepositoryEventsBinding,
): { cancel(): void } {
  let root = callbacks;
  while (root.parent) root = root.parent;
  let batch = pendingBatches.get(root);
  if (!batch) {
    const entries: BatchEntry[] = [];
    batch = entries;
    pendingBatches.set(root, entries);
    root.afterCommit(async () => {
      pendingBatches.delete(root);
      await deliver(entries, binding);
    });
    root.afterRollback(() => {
      pendingBatches.delete(root);
    });
  }
  const entries = batch;
  entries.push(entry);
  const cancel = (): void => {
    const index = entries.indexOf(entry);
    if (index >= 0) entries.splice(index, 1);
  };
  if (callbacks !== root) callbacks.afterRollback(cancel);
  return { cancel };
}

async function deliver(
  entries: readonly BatchEntry[],
  binding: RepositoryEventsBinding,
): Promise<void> {
  const order: RepositoryMutationSubscription[] = [];
  const batches = new Map<
    RepositoryMutationSubscription,
    { events: RepositoryMutationEvent[]; depth: number }
  >();
  for (const entry of entries) {
    for (const subscription of entry.subscriptions) {
      let batch = batches.get(subscription);
      if (!batch) {
        batch = { events: [], depth: 0 };
        batches.set(subscription, batch);
        order.push(subscription);
      }
      batch.events.push(entry.event.for(subscription));
      batch.depth = Math.max(batch.depth, entry.depth);
    }
  }
  order.sort((left, right) => left.sequence - right.sequence);
  for (const subscription of order) {
    const { events: received, depth } = batches.get(subscription)!;
    // Writes the listener makes descend from the batch: the last event is
    // their parent and the deepest one sets their depth, so a listener that
    // keeps writing what it observes meets the limit instead of looping.
    const connection = binding.afterCommitConnection({
      operationId: received[received.length - 1].operationId,
      depth,
    });
    try {
      await subscription.listeners.afterCommit?.(received, connection);
    } catch (error) {
      binding.reportError(error, {
        ...(subscription.id === undefined
          ? {}
          : { subscriptionId: subscription.id }),
        operationIds: received.map((event) => event.operationId),
      });
    }
  }
}
