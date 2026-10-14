/**
 * One refresh coordinator per open issue page. Changes to the issue and new runs on it are announced
 * (`issues/live/realtime-refresh.ts`); the agents plugin polls known open runs. An idle page still reads the issue
 * again slowly as a fallback, for a realtime connection that missed an announcement or still has a stale identity,
 * and briefly speeds up after the issue's existing actions invalidate its detail.
 */
import type { SubjectRun } from '@nocobase/app-plugin-agents/client/runs';
import { pmKeys, usePmApi } from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import {
  hashKey,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useIssueRuns } from '../../../agents/use-issue-runs.js';

/** How often an idle page reads the issue and its runs again, as a fallback to the announcements. */
export const IDLE_POLL_MS = 60_000;
/** How often, and for how long, after the issue's own actions, so work they start shows up at once. */
export const WAKE_POLL_MS = 3000;
export const WAKE_WINDOW_MS = 15_000;

export function useLiveIssue(
  detail: IssueDetail,
  issueId: string,
  detailKey: QueryKey,
  /** Bumped by the page when something it knows of starts a run, such as continuing a suppressed stage action. */
  externalSignal = 0,
): readonly SubjectRun[] {
  const api = usePmApi();
  const client = useQueryClient();
  const detailHash = hashKey(detailKey);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const wakeUntilRef = useRef(0);
  const runs = useIssueRuns(detail, `${refreshSignal}:${externalSignal}`);
  const refreshThreads = useCallback(() => {
    // Older pages use the entity id even when the URL and detail query use the issue identifier.
    // Refresh only loaded pages, and keep slow requests alive just like the runs query.
    void client.refetchQueries(
      { queryKey: [...pmKeys.issue(detail.id), 'threads'], type: 'active' },
      { cancelRefetch: false },
    );
  }, [client, detail.id]);

  // Comments and status changes can come from another person or a rule, even while no run is open.
  useQuery({
    queryKey: detailKey,
    queryFn: () => api.issue(issueId),
    refetchInterval: IDLE_POLL_MS,
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (): void => {
      timer = setTimeout(
        () => {
          if (document.visibilityState !== 'hidden') {
            setRefreshSignal((signal) => signal + 1);
            refreshThreads();
          }
          schedule();
        },
        Date.now() < wakeUntilRef.current ? WAKE_POLL_MS : IDLE_POLL_MS,
      );
    };
    schedule();
    // Comments, properties, approvals and design decisions already invalidate this exact detail query.
    // Listen here instead of making each presenter know about the agents plugin's separate query cache.
    const unsubscribe = client.getQueryCache().subscribe((event) => {
      if (
        event.type !== 'updated' ||
        event.action.type !== 'invalidate' ||
        event.query.queryHash !== detailHash
      )
        return;
      wakeUntilRef.current = Date.now() + WAKE_WINDOW_MS;
      setRefreshSignal((signal) => signal + 1);
      clearTimeout(timer);
      schedule();
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [client, detailHash, refreshThreads]);

  const runIds = runs.map((run) => run.id).join(',');
  useEffect(() => {
    // Once the new run is visible, its own observer handles fast polling.
    wakeUntilRef.current = 0;
  }, [runIds]);

  const openRuns = runs
    .filter((run) => run.open)
    .map((run) => run.id)
    .join(',');
  const seenOpenRunsRef = useRef(openRuns);
  useEffect(() => {
    if (seenOpenRunsRef.current === openRuns) return;
    seenOpenRunsRef.current = openRuns;
    // Refetch directly so discovering or finishing a run does not start another wake window.
    void client.refetchQueries(
      { queryKey: detailKey, exact: true },
      { cancelRefetch: false },
    );
    refreshThreads();
  }, [openRuns, client, detailKey, refreshThreads]);

  return runs;
}
