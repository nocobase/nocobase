/** Refresh Studio's issue projections along with the projects plugin's live issue cache. */
import {
  realtimeClientToken,
  useService,
  type RealtimeClient,
} from '@nocobase/app-client';
import { PM_REALTIME_TOPIC } from '@nocobase/app-plugin-projects/shared/realtime';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { STUDIO_INBOX_TOPIC } from '../../../shared/inbox.js';

export function useStudioIssueRefresh(): void {
  const realtime = useService(realtimeClientToken);
  const client = useQueryClient();
  useEffect(() => subscribeIssueRefresh(realtime, client), [realtime, client]);
}

export function subscribeIssueRefresh(
  realtime: Pick<RealtimeClient, 'onOpen' | 'subscribe'>,
  client: Pick<QueryClient, 'invalidateQueries'>,
): () => void {
  const refresh = () => {
    for (const queryKey of [
      // Refine owns the page cache; the projects provider refreshes a separate client.
      ['pm', 'issue'],
      ['studio', 'issueProgress'],
      ['studio', 'issue-runs'],
      ['studio', 'commentRunLimit'],
      ['studio', 'ownerHandoff'],
      ['pm', 'issues', 'followUps'],
    ])
      void client.invalidateQueries({ queryKey });
  };
  const stops = [
    realtime.onOpen(refresh),
    realtime.subscribe<unknown>(PM_REALTIME_TOPIC, ({ payload }) => {
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'domain' in payload &&
        payload.domain === 'issues'
      )
        refresh();
    }),
    realtime.subscribe(STUDIO_INBOX_TOPIC, refresh),
  ];
  return () => {
    for (const stop of stops) stop?.();
  };
}
