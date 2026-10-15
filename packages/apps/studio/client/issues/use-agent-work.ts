/**
 * Which of the issues a view shows an agent is working on now (`POST /api/agentBoard/issueWork`), one query per view.
 * It reads again when an announcement names a shown issue (the projects plugin's changes, the runs on issues), or names
 * none; a burst of them once, never while the page is hidden (`../agents/board/coalesce.ts`). It polls every
 * `ISSUE_AGENT_WORK_POLL_MS` as a fallback.
 */
import {
  realtimeClientToken,
  useApiClient,
  useService,
  type RealtimeClient,
} from '@nocobase/app-client';
import type { IssueListItem } from '@nocobase/app-plugin-projects/shared/issues';
import { announcedIssueIds } from '@nocobase/app-plugin-projects/client/kit';
import { PM_REALTIME_TOPIC } from '@nocobase/app-plugin-projects/shared/realtime';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  ISSUE_AGENT_WORK_BATCH,
  type IssueAgentWork,
} from '../../shared/issue-agent-work.js';
import {
  STUDIO_ISSUE_RUNS_TOPIC,
  type StudioIssueRunsEvent,
} from '../../shared/issue-runs.js';
import {
  coalescedRefresh,
  type CoalescedRefresh,
} from '../agents/board/coalesce.js';

export const ISSUE_AGENT_WORK_POLL_MS = 60_000;
/** How long a burst of announcements is gathered before the work is read again. */
export const ISSUE_AGENT_WORK_COALESCE_MS = 1_000;
export const issueWorkKeys = ['studio', 'issue-agent-work'] as const;

/** Reads the work again when an announcement names a shown issue, or names none. */
export function subscribeIssueWorkRefresh(
  realtime: Pick<RealtimeClient, 'subscribe' | 'onOpen'>,
  shown: () => ReadonlySet<string>,
  refresh: CoalescedRefresh,
): () => void {
  const concerns = (named: ReadonlySet<string> | null) =>
    !named || [...shown()].some((id) => named.has(id));
  const stops = [
    realtime.subscribe<unknown>(PM_REALTIME_TOPIC, (event) => {
      if (concerns(announcedIssueIds(event?.payload))) refresh.request();
    }),
    realtime.subscribe<StudioIssueRunsEvent>(
      STUDIO_ISSUE_RUNS_TOPIC,
      (event) => {
        const ids = event?.payload?.issueIds;
        if (concerns(Array.isArray(ids) ? new Set(ids) : null))
          refresh.request();
      },
    ),
    realtime.onOpen(refresh.request),
  ];
  return () => {
    refresh.stop();
    for (const stop of stops) stop?.();
  };
}

/** One query per view, including every loaded page, partitioned into bounded requests. */
export function useIssueAgentWork(
  issues: readonly Pick<IssueListItem, 'id' | 'executor'>[],
  scope: string,
): ReadonlyMap<string, string> {
  const api = useApiClient();
  const realtime = useService(realtimeClientToken);
  const client = useQueryClient();
  const [visible, setVisible] = useState(
    () => document.visibilityState !== 'hidden',
  );
  const executors = new Map(
    issues
      .filter((issue) => issue.executor?.type === 'agent')
      .map((issue) => [issue.id, issue.executor!.id]),
  );
  const pairs = [...executors].sort(([a], [b]) => a.localeCompare(b));
  const identity = JSON.stringify(pairs);
  // The issues an announcement has to name to concern this view, read by the subscription below.
  const shownRef = useRef<ReadonlySet<string>>(new Set());
  useEffect(() => {
    shownRef.current = new Set(
      (JSON.parse(identity) as [string, string][]).map(([id]) => id),
    );
  }, [identity]);

  useEffect(() => {
    const visibility = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', visibility);
    const stop = subscribeIssueWorkRefresh(
      realtime,
      () => shownRef.current,
      coalescedRefresh(client, issueWorkKeys, ISSUE_AGENT_WORK_COALESCE_MS),
    );
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      stop();
    };
  }, [realtime, client]);

  const query = useQuery({
    queryKey: [...issueWorkKeys, scope, identity],
    enabled: visible && pairs.length > 0,
    queryFn: async ({ signal }) => {
      const statuses: IssueAgentWork[] = [];
      for (
        let offset = 0;
        offset < pairs.length;
        offset += ISSUE_AGENT_WORK_BATCH
      ) {
        const result = await api.request<{ data: IssueAgentWork[] }>({
          path: 'agentBoard/issueWork',
          method: 'POST',
          json: {
            issueIds: pairs
              .slice(offset, offset + ISSUE_AGENT_WORK_BATCH)
              .map(([id]) => id),
          },
          signal,
        });
        statuses.push(...result.data);
      }
      return statuses;
    },
    // A failed refresh must hide stale work immediately, before another retry.
    retry: false,
    refetchInterval: visible ? ISSUE_AGENT_WORK_POLL_MS : false,
    refetchIntervalInBackground: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
  });
  return new Map(
    (query.isError ? [] : (query.data ?? []))
      .filter(
        (status) =>
          status.working && executors.get(status.issueId) === status.agentId,
      )
      .map((status) => [status.issueId, status.agentId]),
  );
}
