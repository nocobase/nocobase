import {
  realtimeClientToken,
  useApiClient,
  useService,
} from '@nocobase/app-client';
import { RUNNERS_TOPIC } from '@nocobase/app-plugin-agents/shared/realtime';
import type { IssueListItem } from '@nocobase/app-plugin-projects/shared/issues';
import { announcedIssueIds } from '@nocobase/app-plugin-projects/client/kit';
import { PM_REALTIME_TOPIC } from '@nocobase/app-plugin-projects/shared/realtime';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  ISSUE_AGENT_WORK_BATCH,
  type IssueAgentWork,
} from '../../shared/issue-agent-work.js';

export const ISSUE_AGENT_WORK_POLL_MS = 10_000;
const workKeys = ['studio', 'issue-agent-work'] as const;

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
    let timer: number | undefined;
    const refresh = () => {
      if (document.visibilityState === 'hidden') return;
      window.clearTimeout(timer);
      timer = window.setTimeout(
        () => void client.invalidateQueries({ queryKey: workKeys }),
        300,
      );
    };
    const visibility = () => {
      setVisible(document.visibilityState !== 'hidden');
      refresh();
    };
    document.addEventListener('visibilitychange', visibility);
    const stops = [
      realtime.subscribe<unknown>(PM_REALTIME_TOPIC, (event) => {
        const named = announcedIssueIds(event?.payload);
        if (named && ![...shownRef.current].some((id) => named.has(id))) return;
        refresh();
      }),
      realtime.subscribe<unknown>(RUNNERS_TOPIC, refresh),
      realtime.onOpen(refresh),
    ];
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', visibility);
      for (const stop of stops) stop?.();
    };
  }, [realtime, client]);

  const query = useQuery({
    queryKey: [...workKeys, scope, identity],
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
