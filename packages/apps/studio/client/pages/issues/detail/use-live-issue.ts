/**
 * One refresh coordinator per open issue page. The agents plugin polls known open runs but cannot discover a new
 * subject run. Until it offers subject announcements, poll even an idle page and briefly speed up after the issue's
 * existing actions invalidate its detail. This also works when the realtime connection still has a stale identity.
 */
import type { SubjectRun } from '@nocobase/app-plugin-agents/client/runs';
import { usePmApi } from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import {
  hashKey,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { useIssueRuns } from '../../../agents/use-issue-runs.js';

const IDLE_POLL_MS = 5000;
const WAKE_POLL_MS = 2000;
const WAKE_WINDOW_MS = 30_000;

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
          if (document.visibilityState !== 'hidden')
            setRefreshSignal((signal) => signal + 1);
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
  }, [client, detailHash]);

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
    void client.refetchQueries({ queryKey: detailKey, exact: true });
  }, [openRuns, client, detailKey]);

  return runs;
}
