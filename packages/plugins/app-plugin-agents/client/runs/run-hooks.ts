/**
 * The headless parts of a subject's runs, for the application that presents them (for example, with the UI Library's
 * `agent-run-history`): a run with its live transcript, stopping and retrying a run, the brief it was given, and cleaning the
 * subject's working directory. Every hook reads and writes this plugin's shared cache, whichever cache is above it.
 */
import type { RunEvent } from '@nocobase/agent-protocol';
import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { RunBrief } from '../../shared/briefs.js';
import { runTopic, type RunChanged } from '../../shared/realtime.js';
import type { Run, RunDetail } from '../../shared/runs.js';
import { agentsKeys } from '../api/keys.js';
import { useAgentsApi } from '../hooks/use-agents-api.js';
import { useRealtimeTopic } from '../hooks/use-realtime-topic.js';
import { useTriggerLabel } from '../hooks/use-vocabulary.js';
import { isOpen } from '../lib/runs.js';
import { agentsQueryClient } from '../query.js';
import { EVENT_POLL_MS, useRunEvents } from './use-run-events.js';

function isRunChanged(payload: unknown): payload is RunChanged {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    typeof (payload as { kind?: unknown }).kind === 'string'
  );
}

export interface RunWithTranscript {
  readonly run: UseQueryResult<RunDetail>;
  /** What started the run, in the viewer's words: the subject's name for the trigger, else this plugin's. */
  readonly trigger: string | null;
  /** The events so far, oldest first; `undefined` until the first page arrives. */
  readonly events: readonly RunEvent[] | undefined;
  /** The last fetch failed. */
  readonly failed: boolean;
}

/**
 * One run and its transcript, fetched after the last `seq` seen when the run's realtime topic announces events, and
 * polled while the run is open.
 */
export function useRunWithTranscript(runId: string): RunWithTranscript {
  const api = useAgentsApi();
  const client = agentsQueryClient();
  const run = useQuery(
    {
      queryKey: agentsKeys.run(runId),
      queryFn: () => api.run(runId),
      refetchInterval: (query) =>
        query.state.data && isOpen(query.state.data) ? EVENT_POLL_MS : false,
    },
    client,
  );
  const open = run.data ? isOpen(run.data) : true;
  const events = useRunEvents(api, runId, open);
  useRealtimeTopic(runTopic(runId), (payload) => {
    if (!isRunChanged(payload) || payload.kind === 'run.events')
      events.fetchMore();
    if (!isRunChanged(payload) || payload.kind !== 'run.events') {
      void client.invalidateQueries({ queryKey: agentsKeys.run(runId) });
      void client.invalidateQueries({ queryKey: ['agents', 'runs'] });
    }
  });
  const triggerLabel = useTriggerLabel();
  const trigger = run.data ? runTrigger(run.data.inputs) : null;
  return {
    run,
    trigger:
      run.data && trigger ? triggerLabel(run.data.subject.kind, trigger) : null,
    events: events.loaded ? events.events : undefined,
    failed: Boolean(events.error),
  };
}

/** What started a run, from its first input (`payload.trigger`). */
function runTrigger(
  inputs: readonly { readonly payload: unknown }[],
): string | null {
  const payload = inputs[0]?.payload;
  if (typeof payload !== 'object' || payload === null) return null;
  const trigger = (payload as { trigger?: unknown }).trigger;
  return typeof trigger === 'string' && trigger ? trigger : null;
}

function refreshRuns(runId: string): void {
  const client = agentsQueryClient();
  void client.invalidateQueries({ queryKey: agentsKeys.run(runId) });
  void client.invalidateQueries({ queryKey: ['agents', 'runs'] });
}

/** Asks a run to stop; what it already changed stays. */
export function useStopRun(): UseMutationResult<Run, unknown, string> {
  const api = useAgentsApi();
  return useMutation(
    {
      mutationFn: (runId: string) => api.cancelRun(runId),
      onSettled: (_data, _error, runId) => refreshRuns(runId),
    },
    agentsQueryClient(),
  );
}

/** Runs a failed or cancelled run again; answers the new run. */
export function useRetryRun(): UseMutationResult<Run, unknown, string> {
  const api = useAgentsApi();
  return useMutation(
    {
      mutationFn: (runId: string) => api.retryRun(runId),
      onSettled: (_data, _error, runId) => refreshRuns(runId),
    },
    agentsQueryClient(),
  );
}

/** The brief a run's latest attempt was given; a 404 before its first claim. */
export function useRunBrief(
  runId: string,
  enabled: boolean,
): UseQueryResult<RunBrief> {
  const api = useAgentsApi();
  return useQuery(
    {
      queryKey: agentsKeys.runBrief(runId),
      queryFn: () => api.runBrief(runId),
      enabled,
    },
    agentsQueryClient(),
  );
}

/**
 * The next run on the subject starts from a fresh checkout, on whichever runner takes it. Work not pushed is lost
 * there, so the application confirms first.
 */
export function useWorkspaceReset(
  subjectKind: string,
  subjectId: string,
): UseMutationResult<void, unknown, void> {
  const api = useAgentsApi();
  return useMutation(
    { mutationFn: () => api.resetWorkspace(subjectKind, subjectId) },
    agentsQueryClient(),
  );
}
