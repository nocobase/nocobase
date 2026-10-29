import {
  createRealtimeRefresh,
  refreshRealtimeQueries,
} from '@nocobase/app-client';
import type { QueryClient, QueryKey } from '@tanstack/react-query';

export const CHAT_INVALIDATION_MS = 150;

interface CoalescedInvalidation {
  readonly add: (key: QueryKey) => void;
  readonly stop: () => void;
}

/** Coalesce bursts and retain a trailing read for changes received during a snapshot. */
export function coalescedInvalidation(
  client: QueryClient,
  delay: number = CHAT_INVALIDATION_MS,
): CoalescedInvalidation {
  const keys = new Map<string, QueryKey>();
  const scheduled = createRealtimeRefresh(
    async (signal) => {
      const due = [...keys.values()];
      keys.clear();
      await Promise.all(
        due
          .filter(
            (key) =>
              !due.some(
                (other) =>
                  other.length < key.length &&
                  other.every((part, index) => part === key[index]),
              ),
          )
          .map((queryKey) =>
            refreshRealtimeQueries(client, { queryKey }, signal),
          ),
      );
    },
    { delayMs: delay },
  );
  return {
    add(queryKey: QueryKey): void {
      keys.set(JSON.stringify(queryKey), queryKey);
      scheduled.request();
    },
    stop: scheduled.close,
  };
}
