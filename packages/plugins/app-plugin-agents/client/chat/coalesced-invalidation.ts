import type { QueryClient, QueryKey } from '@tanstack/react-query';

/** How long announcements gather before the queries they name are read again. */
export const CHAT_INVALIDATION_MS = 150;

interface CoalescedInvalidation {
  /** The query is stale: read it again, once for the announcements that arrive meanwhile. */
  readonly add: (queryKey: QueryKey) => void;
  readonly stop: () => void;
}

/**
 * A run announces its conversation many times in a moment (the message, its state, its title); each announcement
 * marking the same lists and details stale would read them again every time. Gathered for `delay`, they are read once.
 */
export function coalescedInvalidation(
  client: Pick<QueryClient, 'invalidateQueries'>,
  delay: number = CHAT_INVALIDATION_MS,
): CoalescedInvalidation {
  const keys = new Map<string, QueryKey>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    add(queryKey) {
      keys.set(JSON.stringify(queryKey), queryKey);
      timer ??= setTimeout(() => {
        timer = undefined;
        const due = [...keys.values()];
        keys.clear();
        for (const key of due) void client.invalidateQueries({ queryKey: key });
      }, delay);
    },
    stop() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      keys.clear();
    },
  };
}
