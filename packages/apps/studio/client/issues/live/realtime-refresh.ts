/**
 * Refresh Studio's issue projections along with the projects plugin's live issue cache. An announcement naming issues
 * (`PmChangeEvent.issueIds`, or the runs on them, `StudioIssueRunsEvent`) refreshes only what is shown of those issues;
 * anything else refreshes every projection. What the viewer follows is read again only for an announcement naming
 * nothing and on reconnect: only an issue leaving their sight changes it besides their own following and unfollowing.
 * The grouped task lists keep themselves current (`../groups/live.ts`), mounted here once for the whole app.
 *
 * Studio's pages read through Refine's query client, which the projects plugin's provider does not refresh, so the
 * issues' own reads are refreshed here.
 */
import {
  realtimeClientToken,
  useService,
  type RealtimeClient,
} from '@nocobase/app-client';
import {
  announcedIssueIds,
  changedIssueSegments,
  isIssueRead,
} from '@nocobase/app-plugin-projects/client/kit';
import { PM_REALTIME_TOPIC } from '@nocobase/app-plugin-projects/shared/realtime';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useTaskGroupsLive } from '../groups/api.js';
import { STUDIO_INBOX_TOPIC } from '../../../shared/inbox.js';
import {
  STUDIO_ISSUE_RUNS_TOPIC,
  type StudioIssueRunsEvent,
} from '../../../shared/issue-runs.js';
import { followingKeys } from './following.js';

/** Studio's reads of one issue, keyed `[...prefix, issueId, ...]`. */
const ISSUE_PROJECTIONS = [
  ['studio', 'issueProgress'],
  ['studio', 'issue-runs'],
  ['studio', 'commentRunLimit'],
  ['studio', 'ownerHandoff'],
] as const;

type RefreshClient = Pick<QueryClient, 'invalidateQueries' | 'getQueryCache'>;

export function useStudioIssueRefresh(): void {
  const realtime = useService(realtimeClientToken);
  const client = useQueryClient();
  useTaskGroupsLive();
  useEffect(() => subscribeIssueRefresh(realtime, client), [realtime, client]);
}

/** Refreshes what is shown of the named issues. */
export function refreshIssues(
  client: Pick<QueryClient, 'invalidateQueries' | 'getQueryCache'>,
  issueIds: ReadonlySet<string>,
): void {
  const segments = changedIssueSegments(client, issueIds);
  void client.invalidateQueries({
    queryKey: ['pm', 'issue'],
    predicate: (query) => isIssueRead(query.queryKey, segments),
  });
  for (const queryKey of ISSUE_PROJECTIONS)
    void client.invalidateQueries({
      queryKey,
      predicate: (query) =>
        typeof query.queryKey[2] === 'string' &&
        segments.has(query.queryKey[2]),
    });
}

export function subscribeIssueRefresh(
  realtime: Pick<RealtimeClient, 'onOpen' | 'subscribe'>,
  client: RefreshClient,
): () => void {
  /** Everything shown of every issue; with `following`, what the viewer follows too. */
  const refresh = (following: boolean) => {
    for (const queryKey of [
      // Refine owns the page cache; the projects provider refreshes a separate client.
      ['pm', 'issue'],
      ...ISSUE_PROJECTIONS,
    ])
      void client.invalidateQueries({ queryKey: [...queryKey] });
    if (following)
      void client.invalidateQueries({
        queryKey: followingKeys.following,
        exact: true,
      });
  };
  const stops = [
    realtime.onOpen(() => refresh(true)),
    realtime.subscribe<unknown>(PM_REALTIME_TOPIC, ({ payload }) => {
      if (
        typeof payload !== 'object' ||
        payload === null ||
        !('domain' in payload) ||
        payload.domain !== 'issues'
      )
        return;
      const named = announcedIssueIds(payload);
      if (named) refreshIssues(client, named);
      else refresh(true);
    }),
    realtime.subscribe(STUDIO_INBOX_TOPIC, () => refresh(false)),
    realtime.subscribe<StudioIssueRunsEvent>(
      STUDIO_ISSUE_RUNS_TOPIC,
      (event) => {
        const ids = event?.payload?.issueIds;
        if (Array.isArray(ids)) refreshIssues(client, new Set(ids));
      },
    ),
  ];
  return () => {
    for (const stop of stops) stop?.();
  };
}
