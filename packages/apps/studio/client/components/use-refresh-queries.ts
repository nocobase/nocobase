import {
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query';

/**
 * Refetches the page's active queries in `client` (the nearest one by default): all of them, or those under `keys`
 * (prefixes) when given. Resolves once they all settled, so `RefreshButton` spins until the page shows fresh data.
 */
export function useRefreshQueries(
  keys?: readonly QueryKey[],
  client?: QueryClient,
): () => Promise<void> {
  const nearest = useQueryClient();
  const queryClient = client ?? nearest;
  return async () => {
    await Promise.all(
      (keys ?? [undefined]).map((queryKey) =>
        queryClient.refetchQueries({
          ...(queryKey ? { queryKey } : {}),
          type: 'active',
        }),
      ),
    );
  };
}
