/**
 * The runs on one subject, newest first, as every run view of a page reads them: one query, refetched while any run is
 * open and when the page says it learned of new work (`refreshSignal`), so the panel, the live badge and the activity
 * rows agree.
 */
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import type { Run } from '../../shared/runs.js';
import type { AgentsApi } from '../api/client.js';
import { agentsKeys } from '../api/keys.js';
import { useAgentsApi } from '../hooks/use-agents-api.js';
import { useAgentText } from '../hooks/use-vocabulary.js';
import { isOpen } from '../lib/runs.js';
import { agentsQueryClient } from '../query.js';
import { EVENT_POLL_MS } from './use-run-events.js';

function subjectRunsOptions(
  api: AgentsApi,
  subjectKind: string,
  subjectId: string,
) {
  return {
    queryKey: agentsKeys.runs(subjectKind, subjectId),
    queryFn: () => api.runs({ subjectKind, subjectId }),
    refetchInterval: (query: { state: { data?: Run[] } }) =>
      query.state.data?.some(isOpen) ? EVENT_POLL_MS : false,
  } as const;
}

function useRefresh(
  client: QueryClient,
  subjectKind: string,
  subjectId: string,
  refreshSignal: unknown,
): void {
  useEffect(() => {
    if (refreshSignal === undefined) return;
    void client.invalidateQueries({
      queryKey: agentsKeys.runs(subjectKind, subjectId),
    });
  }, [refreshSignal, client, subjectKind, subjectId]);
}

/** A run with whether it may still change. */
export type SubjectRun = Run & { readonly open: boolean };

const NONE: readonly SubjectRun[] = [];

/**
 * For the application's page of a subject: the subject's runs from this plugin's shared cache, whichever cache is above; empty until loaded, or when the viewer may not read them.
 */
export function useSubjectRuns(
  subjectKind: string,
  subjectId: string,
  refreshSignal?: unknown,
): readonly SubjectRun[] {
  const api = useAgentsApi();
  const client = agentsQueryClient();
  useRefresh(client, subjectKind, subjectId, refreshSignal);
  const runs = useQuery(
    subjectRunsOptions(api, subjectKind, subjectId),
    client,
  );
  return useMemo(
    () => runs.data?.map((run) => ({ ...run, open: isOpen(run) })) ?? NONE,
    [runs.data],
  );
}

/** The agents' names in the viewer's language, for people who may read agents; anyone else sees runs without one. */
export function useAgentNames(): (agentId: string) => string | null {
  const api = useAgentsApi();
  const agents = useQuery(
    {
      queryKey: agentsKeys.agents,
      queryFn: () => api.agents(true),
      retry: false,
      staleTime: 60_000,
    },
    agentsQueryClient(),
  );
  const text = useAgentText();
  return (agentId) => {
    const agent = agents.data?.find((item) => item.id === agentId);
    return agent ? text.name(agent) : null;
  };
}
