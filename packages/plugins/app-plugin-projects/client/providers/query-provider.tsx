import {
  ApiClientError,
  realtimeClientToken,
  useService,
} from '@nocobase/app-client';
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';
import {
  useEffect,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import {
  PM_REALTIME_TOPIC,
  type PmChangeEvent,
} from '../../shared/realtime.js';
import { pmKeys } from '../api/keys.js';

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

function isChange(payload: unknown): payload is PmChangeEvent {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    (payload as { kind?: unknown }).kind === 'pm.changed'
  );
}

/**
 * Refreshes what the pages show when the server announces a change, and everything after a reconnect, since changes
 * made while disconnected were missed.
 */
function RealtimeRefresh(): null {
  const realtime = useService(realtimeClientToken);
  const queryClient = useQueryClient();
  useEffect(() => {
    const refreshAll = () =>
      void queryClient.invalidateQueries({ queryKey: pmKeys.all });
    const unsubscribeOpen = realtime.onOpen(refreshAll);
    const unsubscribeTopic = realtime.subscribe<unknown>(
      PM_REALTIME_TOPIC,
      ({ payload }) => {
        if (!isChange(payload)) return;
        if (payload.domain === 'labels') {
          void queryClient.invalidateQueries({ queryKey: pmKeys.labels });
          return;
        }
        // Plan cards and lists; executing or undoing a plan changes issues too, which the issues' own events announce.
        if (payload.domain === 'plans') {
          void queryClient.invalidateQueries({ queryKey: ['pm', 'plans'] });
          return;
        }
        // A workflow change renames statuses and changes which moves are allowed.
        if (payload.domain === 'workflows')
          for (const queryKey of [pmKeys.workflows, ['pm', 'statuses']])
            void queryClient.invalidateQueries({ queryKey });
        // Issue changes also move project progress.
        for (const queryKey of [
          pmKeys.issues,
          ['pm', 'issue'],
          pmKeys.projects,
        ])
          void queryClient.invalidateQueries({ queryKey });
      },
    );
    return () => {
      unsubscribeTopic?.();
      unsubscribeOpen?.();
    };
  }, [realtime, queryClient]);
  return null;
}

/** This plugin's query cache, kept current by the server's change announcements. */
export function PmQueryProvider({ children }: PropsWithChildren): ReactElement {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry, staleTime: 10_000, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <RealtimeRefresh />
      {children}
    </QueryClientProvider>
  );
}
