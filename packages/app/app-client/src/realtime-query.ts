import type { QueryClient, QueryFilters } from '@tanstack/react-query';

/** Invalidates matching snapshots and reads active queries after any pre-event request settles. */
export async function refreshRealtimeQueries(
  client: QueryClient,
  filters: QueryFilters = {},
  signal?: AbortSignal,
): Promise<void> {
  if (signal?.aborted) return;
  const cache = client.getQueryCache();
  const results = await Promise.allSettled(
    cache.findAll(filters).map(async (query) => {
      const previous = query.promise;
      const fetching = query.state.fetchStatus !== 'idle';
      query.invalidate();
      // A successful old request clears invalidation, including during initial loading.
      if (fetching && previous)
        await untilAborted(
          previous.catch(() => undefined),
          signal,
        );
      if (signal?.aborted || cache.get(query.queryHash) !== query) return;
      query.invalidate();
      if (!query.isActive() || query.isDisabled()) return;
      try {
        await untilAborted(
          client.refetchQueries(
            { queryKey: query.queryKey, exact: true },
            { cancelRefetch: false, throwOnError: true },
          ),
          signal,
        );
      } catch (error) {
        query.invalidate();
        throw error;
      }
    }),
  );
  const failure = results.find((result) => result.status === 'rejected');
  if (failure?.status === 'rejected') throw failure.reason;
}

/** Stop our follow-up on disposal without cancelling another observer's request. */
function untilAborted(
  promise: Promise<unknown>,
  signal?: AbortSignal,
): Promise<unknown> {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const abort = (): void => {
      signal.removeEventListener('abort', abort);
      resolve(undefined);
    };
    if (signal.aborted) {
      abort();
      return;
    }
    signal.addEventListener('abort', abort, { once: true });
    void promise.then(
      (value) => {
        signal.removeEventListener('abort', abort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', abort);
        reject(
          error instanceof Error
            ? error
            : new Error('Realtime query refresh failed.', { cause: error }),
        );
      },
    );
  });
}
