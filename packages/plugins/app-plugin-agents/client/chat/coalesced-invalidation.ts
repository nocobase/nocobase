import {
  createRealtimeRefresh,
  refreshRealtimeQueries,
} from '@nocobase/app-client';
import type { QueryClient, QueryKey } from '@tanstack/react-query';

export const CHAT_INVALIDATION_MS = 150;

/** Coalesce bursts and retain a trailing read for changes received during a snapshot. */
export function coalescedInvalidation(
  client: QueryClient,
  delay = CHAT_INVALIDATION_MS,
) {
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
    add(queryKey: QueryKey) {
      keys.set(JSON.stringify(queryKey), queryKey);
      scheduled.request();
    },
    stop: scheduled.close,
  };
}
