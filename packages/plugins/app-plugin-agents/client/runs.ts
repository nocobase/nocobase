/**
 * The headless parts of a subject's runs, for the application's page that shows the subject (the assembling application presents them with
 * the UI Library's `agent-run-history`): the runs themselves (`useSubjectRuns`), the agents' names, one run with its live
 * transcript, stopping and retrying a run, its brief, and cleaning the subject's working directory. Every hook reads
 * this plugin's shared cache, whichever cache is above it.
 */
export {
  useAgentNames,
  useSubjectRuns,
  type SubjectRun,
} from './runs/subject-runs.js';
export {
  useRetryRun,
  useRunBrief,
  useRunWithTranscript,
  useStopRun,
  useWorkspaceReset,
  type RunWithTranscript,
} from './runs/run-hooks.js';

/** A run's transcript fetched incrementally (`fetchMore` after each `runTopic(runId)` announcement), for a chat UI's live steps. */
export { useRunEvents, type RunEventsState } from './runs/use-run-events.js';
export { useRealtimeTopic } from './hooks/use-realtime-topic.js';
export { useAgentsApi } from './hooks/use-agents-api.js';
export type { AgentsApi } from './api/client.js';
