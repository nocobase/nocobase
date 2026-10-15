/**
 * Announces the issues whose agent runs entered the queue or changed status, or whose run requests (such as a personal
 * runner consent) were made or settled, once for a moment: the agents plugin announces a run only to pages following
 * that run, so a page could not learn of new work on its issue without polling.
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
  let named = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const flush = async (): Promise<void> => {
    timer = undefined;
    const ids = [...runIds];
    const issueIds = new Set(named);
    runIds = new Set();
    named = new Set();
    if (ids.length > 0)
      for (const run of await deps
        .conn()
        .repository<{ id: string; subjectKind: string; subjectId: string }>(
          'agRuns',
        )
        .findMany({
          filter: (f) => f.or(ids.map((id) => f.string('id').eq(id))),
        }))
        if (run.subjectKind === ISSUE_SUBJECT)
          issueIds.add(String(run.subjectId));
    if (issueIds.size > 0)
      deps.publish({ kind: 'studio.issue.runs', issueIds: [...issueIds] });
  };

  const stop = deps.events.onAny((event) => {
    if (event.type.startsWith('runRequest.') && 'request' in event) {
      if (event.request.subject.kind !== ISSUE_SUBJECT) return;
      named.add(event.request.subject.id);
    } else if (RUN_EVENTS.has(event.type) && 'runId' in event)
      runIds.add(event.runId);
    else return;
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
