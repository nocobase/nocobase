import {
  ApiClientError,
  createRealtimeRefresh,
  refreshRealtimeQueries,
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
import {
  announcedIssueIds,
  changedIssueSegments,
  isIssueRead,
} from '../api/changed-issues.js';
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
    let full = false;
    let pending: PmChangeEvent[] = [];
    const scheduled = createRealtimeRefresh(async (signal) => {
      const all = full;
      const changes = pending;
      full = false;
      pending = [];
      if (all || changes.length === 0) {
        await refreshRealtimeQueries(
          queryClient,
          { queryKey: pmKeys.all },
          signal,
        );
        return;
      }
      const requests: Promise<void>[] = [];
      const invalidate = (queryKey: readonly unknown[]) => {
        requests.push(
          refreshRealtimeQueries(queryClient, { queryKey }, signal),
        );
      };
      if (changes.some((change) => change.domain === 'labels'))
        invalidate(pmKeys.labels);
      if (changes.some((change) => change.domain === 'plans'))
        invalidate(['pm', 'plans']);
      const issues = changes.filter((change) => change.domain === 'issues');
      if (issues.length) {
        invalidate(pmKeys.issues);
        const named = issues.map(announcedIssueIds);
        if (named.some((ids) => !ids)) {
          invalidate(pmKeys.projects);
          invalidate(['pm', 'issue']);
        } else {
          const ids = new Set(named.flatMap((ids) => (ids ? [...ids] : [])));
          const segments = changedIssueSegments(queryClient, ids);
          requests.push(
            refreshRealtimeQueries(
              queryClient,
              {
                queryKey: ['pm', 'issue'],
                predicate: (query) => isIssueRead(query.queryKey, segments),
              },
              signal,
            ),
          );
        }
      }
      await Promise.all(requests);
    });
    const subscription = realtime.watch<unknown>(PM_REALTIME_TOPIC, {
      onReady: () => {
        full = true;
        scheduled.request();
      },
      onEvent: ({ payload }) => {
        if (!isChange(payload)) return;
        if (pending.length < 100) pending.push(payload);
        else {
          full = true;
          pending = [];
        }
        scheduled.request();
      },
    });
    return () => {
      subscription.close();
      scheduled.close();
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
