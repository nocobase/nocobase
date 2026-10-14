import { QueryClientProvider } from '@tanstack/react-query';
import {
  useEffect,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import {
  ApplicationCacheContext,
  createAgentSessionsCache,
} from './query-cache.js';
import { cancelChoiceDiscoveries } from './discovery-requests.js';
import { LiveSessions } from './components/live-sessions.js';

function OwnerCache({
  owner,
  children,
}: PropsWithChildren<{ readonly owner: string | null }>): ReactElement {
  const [client] = useState(createAgentSessionsCache);
  useEffect(
    () => () => {
      void cancelChoiceDiscoveries(client);
      client.clear();
    },
    [client],
  );
  return (
    <ApplicationCacheContext.Provider value={client}>
      <QueryClientProvider client={client}>
        {owner && <LiveSessions />}
        {children}
      </QueryClientProvider>
    </ApplicationCacheContext.Provider>
  );
}

/** Retains live invalidation and memory state across routes; changing owner discards the entire cache. */
export function AgentSessionsProvider({
  owner,
  children,
}: PropsWithChildren<{ readonly owner: string | null }>): ReactElement {
  return (
    <OwnerCache key={JSON.stringify(owner)} owner={owner}>
      {children}
    </OwnerCache>
  );
}
