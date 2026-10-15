/**
 * The plugin's query cache and translations, which its pages bring along since they render inside the application's
 * tree, and the realtime subscription that keeps what they read current.
 */
import { withNamespace } from '@nocobase/i18n/client';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContext, type ComponentType, type ReactElement } from 'react';

import {
  ApplicationCacheContext,
  agentSessionsQueryClient,
} from './query-cache.js';
import { LiveSessions } from './components/live-sessions.js';

export const NAMESPACE = '@nocobase/app-plugin-agent-sessions';

/** `Component` with this plugin's cache, translations and live updates. `client` replaces the cache, for tests. */
export function withAgentSessions<P extends object>(
  Component: ComponentType<P>,
  client?: QueryClient,
): ComponentType<P> {
  const Bound: ComponentType<P> = withNamespace(NAMESPACE, Component as never);
  function WithAgentSessions(props: P): ReactElement {
    const applicationCache = useContext(ApplicationCacheContext);
    return (
      <QueryClientProvider
        client={client ?? applicationCache ?? agentSessionsQueryClient()}
      >
        <LiveSessions />
        <Bound {...props} />
      </QueryClientProvider>
    );
  }
  WithAgentSessions.displayName = `WithAgentSessions(${Component.displayName ?? Component.name})`;
  return WithAgentSessions;
}

export { agentSessionsQueryClient } from './query-cache.js';
