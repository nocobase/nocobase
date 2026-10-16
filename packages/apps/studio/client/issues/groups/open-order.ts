/**
 * The order of the list a task's page was opened from (the table's rows, the split view's list), so the page moves
 * through the same tasks with previous and next, J and K. It is what the list showed when the task was opened, kept in
 * memory for that list's address only: a page opened from a link, the board or after a reload has no order and shows no
 * arrows.
 */
import { useSyncExternalStore } from 'react';

interface OpenOrder {
  readonly listPath: string;
  readonly ids: readonly string[];
}

let current: OpenOrder | null = null;
const listeners = new Set<() => void>();

/** Remembers the order of the list at `listPath` as a task is opened from it. */
export function rememberOpenOrder(
  listPath: string,
  ids: readonly string[],
): void {
  current = { listPath, ids };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The ids of the list at `listPath` in its order, when a task was opened from it. */
export function useOpenOrder(listPath: string): readonly string[] | null {
  const order = useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
  return order && order.listPath === listPath ? order.ids : null;
}
