import { useApiClient } from '@nocobase/app-client';
import type { ModelService } from '@nocobase/app-plugin-agents/shared/models';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

/** An identity-local catalog, revalidated on open/focus rather than on route changes. */
export function useModelCatalog(open: boolean) {
  const api = useApiClient();
  const [client] = useState(() => new QueryClient());
  const query = useQuery(
    {
      queryKey: ['examplesChatModels'],
      queryFn: ({ signal }) =>
        api.request<{ data: ModelService[] }>({
          path: 'agents/models',
          query: { kind: 'chat' },
          signal,
        }),
      enabled: open,
      retry: false,
      staleTime: 0,
      refetchOnWindowFocus: false,
    },
    client,
  );
  const { refetch } = query;
  useEffect(() => {
    if (!open) return;
    const refresh = () => {
      void refetch();
    };
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      void client.cancelQueries();
    };
  }, [open, client, refetch]);
  useEffect(() => () => client.clear(), [client]);

  const services = query.data?.data ?? [];
  const phase =
    query.isFetching || query.isPending
      ? 'loading'
      : query.isError
        ? 'error'
        : 'ready';
  const canSend =
    open &&
    phase === 'ready' &&
    services.some((service) =>
      service.models.some((model) => model.kind === 'chat'),
    );
  return {
    phase,
    services,
    error: query.error,
    canSend,
    refresh: () => {
      void refetch();
    },
  };
}
