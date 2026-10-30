import {
  createRealtimeRefresh,
  refreshRealtimeQueries,
} from '@nocobase/app-client';
import type { QueryClient, QueryKey } from '@tanstack/react-query';

export const CHAT_INVALIDATION_MS = 150;

interface CoalescedInvalidation {
  readonly add: (key: QueryKey, exact?: boolean) => void;
  readonly stop: () => void;
}

/** Coalesce bursts and retain a trailing read for changes received during a snapshot. */
export function coalescedInvalidation(
  client: QueryClient,
  delay: number = CHAT_INVALIDATION_MS,
): CoalescedInvalidation {
  const keys = new Map<string, { queryKey: QueryKey; exact: boolean }>();
  const scheduled = createRealtimeRefresh(
    async (signal) => {
      const due = [...keys.values()];
      keys.clear();
      await Promise.all(
        due
          .filter(
            ({ queryKey: key, exact }) =>
              !due.some(
                (other) =>
                  !other.exact &&
                  (other.queryKey.length < key.length ||
                    (exact && other.queryKey.length === key.length)) &&
                  other.queryKey.every((part, index) => part === key[index]),
              ),
          )
          .map(({ queryKey, exact }) =>
            refreshRealtimeQueries(client, { queryKey, exact }, signal),
          ),
      );
    },
    { delayMs: delay },
  );
  return {
    add(queryKey: QueryKey, exact = false): void {
      keys.set(JSON.stringify([queryKey, exact]), { queryKey, exact });
      scheduled.request();
    },
    stop: scheduled.close,
  };
}
