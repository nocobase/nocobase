/**
 * Refresh Studio's issue projections along with the projects plugin's live issue cache. An announcement naming issues
 * (`PmChangeEvent.issueIds`) refreshes only what is shown of those issues, and My follow-ups only when it lists one of
 * them; anything else refreshes every projection.
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

import type { FollowUpsView } from '../../../shared/follow-ups.js';
import { STUDIO_INBOX_TOPIC } from '../../../shared/inbox.js';
import {
  STUDIO_ISSUE_RUNS_TOPIC,
  type StudioIssueRunsEvent,
} from '../../../shared/issue-runs.js';

/** Studio's reads of one issue, keyed `[...prefix, issueId, ...]`. */
const ISSUE_PROJECTIONS = [
  ['studio', 'issueProgress'],
  ['studio', 'issue-runs'],
  ['studio', 'commentRunLimit'],
  ['studio', 'ownerHandoff'],
] as const;

const FOLLOW_UPS = ['pm', 'issues', 'followUps'] as const;

export function useStudioIssueRefresh(): void {
  const realtime = useService(realtimeClientToken);
  const client = useQueryClient();
  useEffect(() => subscribeIssueRefresh(realtime, client), [realtime, client]);
}

/** Whether My follow-ups shows one of `issueIds`, or has nothing loaded to tell. */
function followUpsShow(
  view: FollowUpsView | undefined,
  issueIds: ReadonlySet<string>,
): boolean {
  if (!view) return true;
  return (
    view.issues.some((issue) => issueIds.has(issue.id)) ||
    view.following.some((id) => issueIds.has(id))
  );
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
  void client.invalidateQueries({
    queryKey: FOLLOW_UPS,
    predicate: (query) =>
      followUpsShow(query.state.data as FollowUpsView | undefined, issueIds),
  });
}

/** Refreshes what depends on the runs of the named issues: their runs, what they wait for, My follow-ups. */
export function refreshIssueRuns(
  client: Pick<QueryClient, 'invalidateQueries'>,
  issueIds: ReadonlySet<string>,
): void {
  for (const queryKey of [
    ['studio', 'issue-runs'],
    ['studio', 'issueProgress'],
    ['studio', 'commentRunLimit'],
  ])
    void client.invalidateQueries({
      queryKey,
      predicate: (query) =>
        typeof query.queryKey[2] === 'string' &&
        issueIds.has(query.queryKey[2]),
    });
  void client.invalidateQueries({
    queryKey: FOLLOW_UPS,
    predicate: (query) =>
      followUpsShow(query.state.data as FollowUpsView | undefined, issueIds),
  });
}

export function subscribeIssueRefresh(
  realtime: Pick<RealtimeClient, 'onOpen' | 'subscribe'>,
  client: Pick<QueryClient, 'invalidateQueries' | 'getQueryCache'>,
): () => void {
  const refresh = () => {
    for (const queryKey of [
      // Refine owns the page cache; the projects provider refreshes a separate client.
      ['pm', 'issue'],
      ...ISSUE_PROJECTIONS,
      FOLLOW_UPS,
    ])
      void client.invalidateQueries({ queryKey: [...queryKey] });
  };
  const stops = [
    realtime.onOpen(refresh),
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
      else refresh();
    }),
    realtime.subscribe(STUDIO_INBOX_TOPIC, refresh),
    realtime.subscribe<StudioIssueRunsEvent>(
      STUDIO_ISSUE_RUNS_TOPIC,
      (event) => {
        const ids = event?.payload?.issueIds;
        if (Array.isArray(ids)) refreshIssueRuns(client, new Set(ids));
      },
    ),
  ];
  return () => {
    for (const stop of stops) stop?.();
  };
}
