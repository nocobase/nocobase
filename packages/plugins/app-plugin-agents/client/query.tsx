/**
 * This plugin's query cache. Its pages render inside other plugins' trees (such as an application's `/config`, a subject's page), so each
 * exported component brings the cache along rather than relying on whichever `QueryClientProvider` is above it; the
 * cache itself is one per browser tab, so pages share what they fetched.
 */
import { ApiClientError } from '@nocobase/app-client';
import { withNamespace } from '@nocobase/i18n/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentType, ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../shared/access.js';
import { RunnersRefresh } from './components/runners-refresh.js';

/** A refusal (4xx) will not change on a retry; anything else gets one more try. */
function retry(failures: number, error: unknown): boolean {
  if (
    error instanceof ApiClientError &&
    error.status >= 400 &&
    error.status < 500
  )
    return false;
  return failures < 1;
}

let shared: QueryClient | undefined;

/** The cache every exported component shares; a hook used in another plugin's tree passes it to `useQuery`. */
export function agentsQueryClient(): QueryClient {
  shared ??= new QueryClient({
    defaultOptions: {
      queries: { retry, staleTime: 10_000, refetchOnWindowFocus: false },
    },
  });
  return shared;
}

/**
 * `Component` with this plugin's cache and translations. `client` replaces the cache, for tests.
 */
export function withAgents<P extends object>(
  Component: ComponentType<P>,
  client?: QueryClient,
): ComponentType<P> {
  const Bound = withNamespace(ACCESS_NAMESPACE, Component as never);
  function WithAgents(props: P): ReactElement {
    return (
      <QueryClientProvider client={client ?? agentsQueryClient()}>
        <RunnersRefresh />
        <Bound {...props} />
      </QueryClientProvider>
    );
  }
  WithAgents.displayName = `WithAgents(${Component.displayName ?? Component.name})`;
  return WithAgents;
}
