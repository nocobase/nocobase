/** Reconcile failed-run decisions with committed runs, including cards left by older releases. */
import { ProtocolError } from '@nocobase/agent-protocol';
import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import type { StudioInbox } from '../inbox/service.js';
import { ISSUE_SUBJECT } from './catalog/triggers.js';
import { RUN_FAILED_FINAL, runFailedDecision } from './notices.js';
import { PROJECTS_SOURCE } from '../inbox/projects.js';

export async function reconcileFailedRunCards(
  agents: Pick<Agents, 'runs'>,
  projects: Pick<Projects, 'issueContext' | 'tx'>,
  inbox: Pick<StudioInbox, 'openDecisions' | 'resolve'>,
  issueId?: string,
  onError: (error: unknown, decisionKey: string) => void = (
    error,
    decisionKey,
  ) =>
    console.error(
      'Studio could not reconcile a failed-run card.',
      decisionKey,
      error,
    ),
): Promise<void> {
  let afterKey = '';
  for (;;) {
    const cards = await inbox.openDecisions(
      PROJECTS_SOURCE,
      RUN_FAILED_FINAL,
      afterKey,
      issueId ? { type: 'issue', id: issueId } : undefined,
    );
    if (cards.length === 0) return;
    for (const card of cards) {
      afterKey = card.decisionKey;
      try {
        const runId = card.data?.runId;
        if (typeof runId !== 'string') continue;
        let run;
        try {
          run = await agents.runs.get(runId);
        } catch (error) {
          if (
            error instanceof ProtocolError &&
            error.code === 'RUN_NOT_FOUND'
          ) {
            await inbox.resolve({
              source: PROJECTS_SOURCE,
              decisionKey: card.decisionKey,
              outcome: 'stale',
            });
            continue;
          }
          throw error;
        }
        if (
          run.subject.kind !== ISSUE_SUBJECT ||
          card.subject?.type !== 'issue' ||
          card.subject.id !== run.subject.id ||
          card.decisionKey !== runFailedDecision(run.id).decisionKey
        )
          continue;
        const retry = await agents.runs.retryInfo(run.id);
        if (retry) {
          await inbox.resolve({
            ...runFailedDecision(run.id),
            outcome: 'retried',
            data: {
              retriedRunId: retry.runId,
              retriedByUserId: retry.actorUserId,
              retriedByName: retry.actorName,
              retrySource: retry.source,
            },
          });
          continue;
        }
        const issue = await projects.issueContext.contextFor(
          projects.tx.read(),
          run.subject.id,
        );
        // Status changes settle existing cards through issue.updated. A new
        // failure after that transition must remain visible, including reviews.
        if (!issue) {
          await inbox.resolve({
            ...runFailedDecision(run.id),
            outcome: 'issueMoved',
          });
          continue;
        }
        if (
          typeof card.data?.executorType === 'string' &&
          typeof card.data.executorId === 'string' &&
          (card.data.executorType !== (issue.executor?.type ?? '') ||
            card.data.executorId !== (issue.executor?.id ?? ''))
        ) {
          await inbox.resolve({
            ...runFailedDecision(run.id),
            outcome: 'issueReassigned',
          });
          continue;
        }
        // The newest run of this exact issue/agent pair suffices, regardless of who
        // woke it or which thread it belongs to. Never settle another agent's card.
        const [newest] = await agents.runs.list({
          subjectKind: ISSUE_SUBJECT,
          subjectId: run.subject.id,
          agentId: run.agentId,
          limit: 1,
        });
        if (
          newest &&
          (newest.createdAt > run.createdAt ||
            (newest.createdAt === run.createdAt && newest.id > run.id))
        )
          await inbox.resolve({
            ...runFailedDecision(run.id),
            outcome: 'newRun',
            data: { replacementRunId: newest.id },
          });
      } catch (error) {
        onError(error, card.decisionKey);
      }
    }
  }
}

/** New work settles old cards after commit; sending a delayed card also reconciles it. */
export function watchFailedRunCards(
  agents: Pick<Agents, 'runs' | 'events'>,
  projects: Pick<Projects, 'issueContext' | 'tx'>,
  inbox: Pick<StudioInbox, 'openDecisions' | 'resolve'>,
  onError: (error: unknown) => void,
): () => Promise<void> {
  let pending = Promise.resolve();
  const release = agents.events.on('run.changed', (event) => {
    if (event.status !== 'queued') return;
    pending = pending
      .then(async () => {
        const run = await agents.runs.get(event.runId);
        if (run.subject.kind === ISSUE_SUBJECT)
          await reconcileFailedRunCards(
            agents,
            projects,
            inbox,
            run.subject.id,
          );
      })
      .catch(onError);
  });
  return async () => {
    release();
    await pending;
  };
}
