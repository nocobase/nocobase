import { ApiClientError } from '@nocobase/app-client';
import {
  useAgentsApi,
  type SubjectRun,
} from '@nocobase/app-plugin-agents/client/runs';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

const OPEN = new Set(['queued', 'dispatched', 'running']);
const NONE: readonly SubjectRun[] = [];
const refreshSeen = new WeakMap<
  QueryClient,
  Map<string, { revision: number; signal?: number }>
>();
const issueRunsKey = (id: string) => ['studio', 'issue-runs', id] as const;

/** Refresh the application cache after mutations handled by the agents plugin. */
export function useRefreshIssueRuns() {
  const client = useQueryClient();
  return (issueId?: string) =>
    client.invalidateQueries({
      queryKey: issueId ? issueRunsKey(issueId) : ['studio', 'issue-runs'],
    });
}

/** One query shared by the panel, live summary, activity and issue polling. */
export function useIssueRunsState(issue: IssueDetail, refreshSignal?: number) {
  const api = useAgentsApi();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: issueRunsKey(issue.id),
    queryFn: async () => {
      try {
        return await api.runs({ subjectKind: 'issue', subjectId: issue.id });
      } catch (error) {
        // Remove denied records from the shared cache so later transient errors cannot resurrect them.
        if (
          error instanceof ApiClientError &&
          [401, 403, 404].includes(error.status)
        ) {
          client.setQueryData(issueRunsKey(issue.id), []);
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 5000,
    refetchInterval: (current) =>
      current.state.error instanceof ApiClientError &&
      [401, 403, 404].includes(current.state.error.status)
        ? false
        : current.state.data?.some((run) => OPEN.has(run.status))
          ? 2000
          : false,
  });
  useEffect(() => {
    let seen = refreshSeen.get(client);
    if (!seen) {
      seen = new Map();
      refreshSeen.set(client, seen);
    }
    const previous = seen.get(issue.id);
    const changed =
      !previous ||
      previous.revision !== issue.revision ||
      (refreshSignal !== undefined && previous.signal !== refreshSignal);
    seen.set(issue.id, {
      revision: issue.revision,
      signal: refreshSignal ?? previous?.signal,
    });
    if (changed)
      void client.invalidateQueries({ queryKey: issueRunsKey(issue.id) });
  }, [client, issue.id, issue.revision, refreshSignal]);
  const status =
    query.error instanceof ApiClientError ? query.error.status : undefined;
  const restricted = status !== undefined && [401, 403, 404].includes(status);
  const runs = useMemo(
    () =>
      restricted
        ? NONE
        : (query.data?.map((run) => ({ ...run, open: OPEN.has(run.status) })) ??
          NONE),
    [query.data, restricted],
  );
  return {
    runs,
    error: query.error,
    status,
    restricted,
    loading: query.isPending,
    refreshing: query.isFetching,
    retry: query.refetch,
  };
}

/** The agents' runs on an issue, newest first and current. */
export function useIssueRuns(
  issue: IssueDetail,
  refreshSignal?: number,
): readonly SubjectRun[] {
  return useIssueRunsState(issue, refreshSignal).runs;
}
