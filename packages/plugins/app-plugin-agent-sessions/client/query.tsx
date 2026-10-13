/**
 * The plugin's query cache and translations, which its pages bring along since they render inside the application's
 * tree, and the realtime subscription that keeps what they read current.
 */
import { ApiClientError } from '@nocobase/app-client';
import { withNamespace } from '@nocobase/i18n/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentType, ReactElement } from 'react';

import { LiveSessions } from './components/live-sessions.js';

export const NAMESPACE = '@nocobase/app-plugin-agent-sessions';

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

export function agentSessionsQueryClient(): QueryClient {
  shared ??= new QueryClient({
    defaultOptions: {
      queries: { retry, staleTime: 5_000, refetchOnWindowFocus: false },
    },
  });
  return shared;
}

/** `Component` with this plugin's cache, translations and live updates. `client` replaces the cache, for tests. */
export function withAgentSessions<P extends object>(
  Component: ComponentType<P>,
  client?: QueryClient,
): ComponentType<P> {
  const Bound: ComponentType<P> = withNamespace(NAMESPACE, Component as never);
  function WithAgentSessions(props: P): ReactElement {
    return (
      <QueryClientProvider client={client ?? agentSessionsQueryClient()}>
        <LiveSessions />
        <Bound {...props} />
      </QueryClientProvider>
    );
  }
  WithAgentSessions.displayName = `WithAgentSessions(${Component.displayName ?? Component.name})`;
  return WithAgentSessions;
}
