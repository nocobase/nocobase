import {
  hashKey,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query';

const active: WeakMap<
  QueryClient,
  Map<string, AbortController>
> = new WeakMap();

/** Keeps navigation independent from explicit invalidation and owner disposal. */
export function trackChoiceDiscovery(
  client: QueryClient,
  queryKey: QueryKey,
): { readonly controller: AbortController; readonly release: () => void } {
  const requests = active.get(client) ?? new Map<string, AbortController>();
  active.set(client, requests);
  const hash =
    client.getQueryCache().find({ queryKey })?.queryHash ?? hashKey(queryKey);
  const controller = new AbortController();
  requests.set(hash, controller);
  return {
    controller,
    release: () => {
      if (requests.get(hash) === controller) requests.delete(hash);
    },
  };
}

/** Cancels waiting and HTTP, never the bridge's already queued work. */
export function cancelChoiceDiscoveries(
  client: QueryClient,
  queryKey?: QueryKey,
): Promise<void> {
  const requests = active.get(client);
  const controllers = queryKey
    ? client
        .getQueryCache()
        .findAll({ queryKey })
        .flatMap((query) => {
          const controller = requests?.get(query.queryHash);
          return controller ? [controller] : [];
        })
    : [...(requests?.values() ?? [])];
  const settled = client.cancelQueries({
    queryKey: queryKey ?? ['agentSessions', 'discovery'],
  });
  for (const controller of controllers) controller.abort();
  return settled;
}
