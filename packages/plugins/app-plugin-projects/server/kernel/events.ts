/**
 * The domain event bus. Every write announces what happened as an event; realtime pushes, notifications and other
 * reactions are listeners, so a service never calls them directly.
 *
 * The bus knows no event: each domain declares its own by augmenting `DomainEventMap` next to the code that emits
 * them, for example in `domains/issues/issue.events.ts`:
 *
 * ```ts
 * declare module '../../kernel/events.js' {
 *   interface DomainEventMap {
 *     'issue.changed': { readonly issueId: string };
 *   }
 * }
 * ```
 *
 * Events are emitted inside a transaction (`tx.ts`) and reach listeners only after it commits. Delivery is in-process
 * and best effort: a failing listener is logged and skipped, and nothing survives a restart or reaches another
 * instance.
 *
 * Thin stand-in: NocoBase has no change events of its own yet. Replace the bus when it does; event names and payloads
 * are the contract listeners depend on, so they stay.
 */

// Augmented by each domain; empty here on purpose.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DomainEventMap {}

export type DomainEventType = Extract<keyof DomainEventMap, string>;

export type DomainEvent<T extends DomainEventType = DomainEventType> = {
  [K in T]: { readonly type: K } & DomainEventMap[K];
}[T];

export type DomainEventListener<T extends DomainEventType = DomainEventType> = (
  event: DomainEvent<T>,
) => void | Promise<void>;

export interface DomainEventBus {
  emit(event: DomainEvent): void;
  /** Listens to one event type; returns what stops listening. */
  on<T extends DomainEventType>(
    type: T,
    listener: DomainEventListener<T>,
  ): () => void;
  /** Listens to every event; returns what stops listening. */
  onAny(listener: DomainEventListener): () => void;
}

export interface DomainEventBusOptions {
  readonly onListenerError?: (error: unknown, event: DomainEvent) => void;
}

export function createDomainEventBus(
  options: DomainEventBusOptions = {},
): DomainEventBus {
  const byType = new Map<string, Set<DomainEventListener>>();
  const any = new Set<DomainEventListener>();

  const deliver = (listener: DomainEventListener, event: DomainEvent) => {
    try {
      const result = listener(event);
      if (result instanceof Promise)
        result.catch((error: unknown) =>
          options.onListenerError?.(error, event),
        );
    } catch (error) {
      options.onListenerError?.(error, event);
    }
  };

  const subscribe = (
    set: Set<DomainEventListener>,
    listener: DomainEventListener,
  ) => {
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  };

  return {
    emit(event) {
      // Widened: with no domain loaded, `DomainEvent` is `never`.
      const { type } = event as { readonly type: string };
      for (const listener of byType.get(type) ?? []) deliver(listener, event);
      for (const listener of any) deliver(listener, event);
    },
    on(type, listener) {
      let set = byType.get(type);
      if (!set) {
        set = new Set();
        byType.set(type, set);
      }
      return subscribe(set, listener as DomainEventListener);
    },
    onAny(listener) {
      return subscribe(any, listener);
    },
  };
}
