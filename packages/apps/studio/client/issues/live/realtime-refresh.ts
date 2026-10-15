/**
 * Refresh Studio's issue projections along with the projects plugin's live issue cache. An announcement naming issues
 * (`PmChangeEvent.issueIds`, or the runs on them, `StudioIssueRunsEvent`) refreshes only what is shown of those issues;
 * anything else refreshes every projection. My follow-ups reads only the rows of the named issues and merges them in
 * (`mergeFollowUpRows`), a burst of announcements at once, and reads the whole overview when the list itself changed.
 * What the viewer follows is read again only for an announcement naming nothing and on reconnect: only an issue leaving
 * their sight changes it besides their own following and unfollowing. The grouped task lists keep themselves current
 * (`../groups/live.ts`), mounted here once for the whole app.
 *
 * Studio's pages read through Refine's query client, which the projects plugin's provider does not refresh, so the
 * issues' own reads are refreshed here.
 */
import {
  realtimeClientToken,
  useApiClient,
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

import type {
  FollowUpIssue,
  FollowUpsView,
} from '../../../shared/follow-ups.js';
import { readFollowUpRows } from '../../follow-ups/api.js';
import { followUpsKeys, mergeFollowUpRows } from '../../follow-ups/model.js';
import { useTaskGroupsLive } from '../groups/api.js';
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

const FOLLOW_UPS = followUpsKeys.overview;

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

/** How long a burst of announcements is gathered before My follow-ups reads what they named. */
export const FOLLOW_UPS_DELAY_MS = 500;

/** Reads the follow-ups rows of the named issues (`readFollowUpRows`). */
export type FollowUpRowsReader = (
  issueIds: readonly string[],
) => Promise<readonly FollowUpIssue[]>;

type RefreshClient = Pick<
  QueryClient,
  'invalidateQueries' | 'getQueryCache' | 'setQueryData'
>;

export function useStudioIssueRefresh(): void {
  const realtime = useService(realtimeClientToken);
  const api = useApiClient();
  const client = useQueryClient();
  useTaskGroupsLive();
  useEffect(
    () =>
      subscribeIssueRefresh(realtime, client, (issueIds) =>
        readFollowUpRows(api, issueIds),
      ),
    [realtime, client, api],
  );
}

/**
 * Keeps My follow-ups current. `issues` gathers the named issues of a burst and then reads only their rows; `all` reads
 * the whole overview, once for a burst. Nothing is read while no page shows the overview: it is only marked stale.
 */
export function followUpsRefresh(
  client: RefreshClient,
  readRows: FollowUpRowsReader,
  delay: number = FOLLOW_UPS_DELAY_MS,
): {
  readonly issues: (issueIds: ReadonlySet<string>) => void;
  readonly all: () => void;
  readonly stop: () => void;
} {
  const named = new Set<string>();
  let whole = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  // One read of rows at a time, so an older answer never lands after a newer one.
  let busy = false;
  const readAll = () =>
    void client.invalidateQueries({ queryKey: [...FOLLOW_UPS], exact: true });

  async function flush(): Promise<void> {
    const issueIds = new Set(named);
    named.clear();
    const all = whole;
    whole = false;
    const query = client.getQueryCache().find({
      queryKey: [...FOLLOW_UPS],
      exact: true,
    });
    const view = query?.state.data as FollowUpsView | undefined;
    const fetching = () => query?.state.fetchStatus === 'fetching';
    if (
      all ||
      !query ||
      !view ||
      // Nothing shows it: marked stale, read when a page shows it again.
      query.getObserversCount() === 0 ||
      // A read under way may have started before the change.
      fetching()
    ) {
      readAll();
      return;
    }
    if (issueIds.size === 0) return;
    let rows: readonly FollowUpIssue[];
    busy = true;
    try {
      rows = await readRows([...issueIds]);
    } catch {
      readAll();
      return;
    } finally {
      busy = false;
    }
    if (stopped) return;
    const current = query.state.data as FollowUpsView | undefined;
    const merged =
      current && !fetching()
        ? mergeFollowUpRows(current, issueIds, rows)
        : null;
    if (merged) client.setQueryData([...FOLLOW_UPS], merged);
    else readAll();
  }

  const schedule = () => {
    if (stopped || timer !== undefined) return;
    timer = setTimeout(() => {
      timer = undefined;
      if (busy) schedule();
      else void flush();
    }, delay);
  };
  return {
    issues(issueIds) {
      for (const id of issueIds) named.add(id);
      schedule();
    },
    all() {
      whole = true;
      schedule();
    },
    stop() {
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    },
  };
}

/** Refreshes what is shown of the named issues; My follow-ups through `followUps`, or by reading it whole. */
export function refreshIssues(
  client: Pick<QueryClient, 'invalidateQueries' | 'getQueryCache'>,
  issueIds: ReadonlySet<string>,
  followUps?: Pick<ReturnType<typeof followUpsRefresh>, 'issues'>,
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
  if (followUps) followUps.issues(issueIds);
  else
    void client.invalidateQueries({
      queryKey: FOLLOW_UPS,
      exact: true,
      predicate: (query) =>
        followUpsShow(query.state.data as FollowUpsView | undefined, issueIds),
    });
}

export function subscribeIssueRefresh(
  realtime: Pick<RealtimeClient, 'onOpen' | 'subscribe'>,
  client: RefreshClient,
  readFollowUps?: FollowUpRowsReader,
): () => void {
  // Without a reader of rows, My follow-ups is read whole when it shows a named issue.
  const followUps = readFollowUps
    ? followUpsRefresh(client, readFollowUps)
    : undefined;
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
        queryKey: followUpsKeys.following,
        exact: true,
      });
    if (followUps) followUps.all();
    else
      void client.invalidateQueries({ queryKey: [...FOLLOW_UPS], exact: true });
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
      if (named) refreshIssues(client, named, followUps);
      else refresh(true);
    }),
    realtime.subscribe(STUDIO_INBOX_TOPIC, () => refresh(false)),
    realtime.subscribe<StudioIssueRunsEvent>(
      STUDIO_ISSUE_RUNS_TOPIC,
      (event) => {
        const ids = event?.payload?.issueIds;
        if (Array.isArray(ids)) refreshIssues(client, new Set(ids), followUps);
      },
    ),
  ];
  return () => {
    followUps?.stop();
    for (const stop of stops) stop?.();
  };
}
