/**
 * Announces the issues whose agent runs entered the queue or changed status, once for the runs of a moment: the agents
 * plugin announces a run only to pages following that run, so a page could not learn of a new run on its issue without
 * polling.
 */
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { DatabaseConnection } from '@nocobase/db';

import type { StudioIssueRunsEvent } from '../../shared/issue-runs.js';
import { ISSUE_SUBJECT } from './catalog/triggers.js';

/** How long run changes are gathered before they are announced. */
export const ISSUE_RUNS_ANNOUNCE_DELAY_MS = 250;

const RUN_EVENTS: ReadonlySet<string> = new Set([
  'run.queued',
  'run.changed',
  'run.requeued',
]);

export function announceIssueRuns(deps: {
  readonly events: Pick<Agents['events'], 'onAny'>;
  readonly conn: () => DatabaseConnection;
  readonly publish: (event: StudioIssueRunsEvent) => void;
  readonly onError?: (error: unknown) => void;
  readonly delayMs?: number;
}): () => void {
  let runIds = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = async (): Promise<void> => {
    timer = undefined;
    const ids = [...runIds];
    runIds = new Set();
    if (ids.length === 0) return;
    const runs = await deps
      .conn()
      .repository<{ id: string; subjectKind: string; subjectId: string }>(
        'agRuns',
      )
      .findMany({
        filter: (f) => f.or(ids.map((id) => f.string('id').eq(id))),
      });
    const issueIds = [
      ...new Set(
        runs
          .filter((run) => run.subjectKind === ISSUE_SUBJECT)
          .map((run) => String(run.subjectId)),
      ),
    ];
    if (issueIds.length > 0)
      deps.publish({ kind: 'studio.issue.runs', issueIds });
  };

  const stop = deps.events.onAny((event) => {
    if (!RUN_EVENTS.has(event.type) || !('runId' in event)) return;
    runIds.add(event.runId);
    if (!timer) {
      timer = setTimeout(() => {
        flush().catch((error: unknown) => deps.onError?.(error));
      }, deps.delayMs ?? ISSUE_RUNS_ANNOUNCE_DELAY_MS);
      timer.unref?.();
    }
  });
  return () => {
    stop();
    if (timer) clearTimeout(timer);
    timer = undefined;
  };
}
