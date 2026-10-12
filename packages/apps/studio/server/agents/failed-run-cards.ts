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
      const runId = card.data?.runId;
      if (typeof runId !== 'string') continue;
      let run;
      try {
        run = await agents.runs.detail(runId);
      } catch (error) {
        if (error instanceof ProtocolError && error.code === 'RUN_NOT_FOUND') {
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
      if (run.retriedRunId) {
        const next = await agents.runs.detail(run.retriedRunId);
        const input = next.inputs.find(
          (input) =>
            input.type === 'retry' &&
            (input.payload as { retryOfRunId?: unknown } | null)
              ?.retryOfRunId === run.id,
        );
        const source = (input?.payload as { source?: unknown } | null)?.source;
        await inbox.resolve({
          ...runFailedDecision(run.id),
          outcome: 'retried',
          data: {
            retriedRunId: next.id,
            retriedByUserId: next.actorUserId,
            retriedByName: input?.actor.name ?? next.actorUserId,
            retrySource: typeof source === 'string' ? source : 'unknown',
          },
        });
        continue;
      }
      const issue = await projects.issueContext.contextFor(
        projects.tx.read(),
        run.subject.id,
      );
      if (
        !issue ||
        ['done', 'closed'].includes(issue.status.category) ||
        issue.status.key === 'in_review'
      ) {
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
