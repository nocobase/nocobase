/**
 * The decision card for a run that failed for good (no attempt left): the issue's owner and the person who woke the
 * agent are asked what next: retry, give the issue to someone else, or cancel. It goes through the projects plugin's
 * notices (a notice rule), so it reaches the same inbox, only for those who may see the issue.
 *
 * The run ends in the agents plugin's transaction; once it commits, a projects transaction announces it
 * (`work.announced` of kind `agent.notice`) and the rule plans the notice there.
 *
 * The card folds away when its issue moves on: when it enters In review or a finished status (done or closed), every
 * card of the issue still waiting settles as `issueMoved`. If a new run retries the card's run, its card settles as
 * `retried`, wherever that retry was started.
 */
import type {
  NoticeRule,
  Projects,
} from '@nocobase/app-plugin-projects/server/tokens';

import type { Agents } from '@nocobase/app-plugin-agents/server/tokens';
import type { Run } from '@nocobase/app-plugin-agents/shared/runs';
import type { StudioInboxPort, InboxDecisionRef } from '../inbox/port.js';
import {
  ISSUE_SUBJECT as INBOX_ISSUE,
  PROJECTS_SOURCE,
} from '../inbox/projects.js';
import { ISSUE_SUBJECT } from './catalog/triggers.js';
import { agentNameParams } from './agent-name.js';
import { AGENT_KIND } from './tx.js';

/** The key of the announcements this file reads. */
export const NOTICE_KIND = 'agent.notice';

/** The notice type of the card. */
export const RUN_FAILED_FINAL = 'run_failed_final';

/** What a person may decide on the card, in `params.actions`; `failed-runs.ts` carries it out. */
export const RUN_FAILED_ACTIONS = ['retry', 'reassign', 'cancel'] as const;

/** The card's key, which is also its decision's key in the inbox (`../inbox/projects.ts`). */
export function runFailedKey(runId: string): string {
  return `agents:run-failed:${runId}`;
}

/** The card's decision in Studio's inbox: the projects plugin's notices carry their key as the decision's. */
export function runFailedDecision(runId: string): InboxDecisionRef {
  return { source: PROJECTS_SOURCE, decisionKey: runFailedKey(runId) };
}

interface FailedRun {
  readonly type: 'runFailedFinal';
  readonly run: Run;
}

export function runFailedRule(
  agents: Pick<Agents, 'agents'>,
  projects: () => Pick<Projects, 'issueContext'>,
): NoticeRule {
  return async (context) => {
    const { tx, events } = context;
    const notices = [];
    for (const event of events) {
      if (event.type !== 'work.announced' || event.kind !== NOTICE_KIND)
        continue;
      const { run } = event.payload as FailedRun;
      const issue = await projects().issueContext.contextFor(
        tx.conn,
        run.subject.id,
      );
      if (!issue) continue;
      const agent = await agents.agents.find(tx.conn, run.agentId);
      const agentName =
        agent?.name ??
        (await context.nameOf(AGENT_KIND, run.agentId)) ??
        'An agent';
      const reason = run.failureReason ?? 'unknown';
      notices.push({
        key: runFailedKey(run.id),
        kind: 'decision' as const,
        type: RUN_FAILED_FINAL,
        issue: {
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
        },
        userIds: [...new Set([issue.owner.id, run.actorUserId])],
        actor: { type: AGENT_KIND, id: run.agentId, name: agentName },
        slot: 'change' as const,
        params: {
          title: `${agentName} could not finish ${issue.identifier}`,
          body: `The run failed after ${run.attempt} attempt(s) (${reason}). Retry it, give the issue to someone else, or cancel.`,
          identifier: issue.identifier,
          runId: run.id,
          agentId: run.agentId,
          agentName,
          ...agentNameParams(agent?.nameText),
          failureReason: reason,
          attempts: String(run.attempt),
          actions: RUN_FAILED_ACTIONS.join(','),
        },
      });
    }
    return notices;
  };
}

/** After a run on an issue fails for good, announces it in a projects transaction; returns what stops it. */
export function announceFailedRuns(
  agents: Pick<Agents, 'events' | 'runs'>,
  projects: () => Pick<Projects, 'tx'>,
  onError: (error: unknown) => void,
): () => void {
  return agents.events.on('run.changed', (event) => {
    if (event.status !== 'failed') return;
    void (async () => {
      const run = await agents.runs.get(event.runId);
      if (run.subject.kind !== ISSUE_SUBJECT) return;
      await projects().tx.run((tx) => {
        tx.emit({
          type: 'work.announced',
          kind: NOTICE_KIND,
          payload: { type: 'runFailedFinal', run } satisfies FailedRun,
        });
        return Promise.resolve();
      });
    })().catch(onError);
  });
}

/** The status an issue is handed over for review in; a failed run's card is no longer needed there. */
const IN_REVIEW = 'in_review';

/** Settles failed-run cards when an issue moves on or their run is retried; returns what stops it. */
export function settleFailedRunCards(
  agents: Pick<Agents, 'events' | 'runs'>,
  projects: () => Pick<Projects, 'events' | 'issueContext' | 'tx'>,
  port: () => StudioInboxPort | undefined,
  onError: (error: unknown) => void,
): () => void {
  const stopIssueUpdates = projects().events.on('issue.updated', (event) => {
    const status = event.changes.status;
    const inbox = port();
    if (!status || !inbox) return;
    void (async () => {
      if (status.to !== IN_REVIEW) {
        const issue = await projects().issueContext.contextFor(
          projects().tx.read(),
          event.issueId,
        );
        const category = issue?.status.category;
        if (category !== 'done' && category !== 'closed') return;
      }
      await inbox.settle({
        source: PROJECTS_SOURCE,
        subject: { type: INBOX_ISSUE, id: event.issueId },
        types: [RUN_FAILED_FINAL],
        outcome: 'issueMoved',
      });
    })().catch(onError);
  });
  const stopRunChanges = agents.events.on('run.changed', (event) => {
    if (event.status !== 'queued') return;
    void (async () => {
      const run = await agents.runs.get(event.runId);
      if (!run.retryOfRunId || run.subject.kind !== ISSUE_SUBJECT) return;
      const inbox = port();
      if (!inbox) return;
      await inbox.resolve({
        ...runFailedDecision(run.retryOfRunId),
        outcome: 'retried',
      });
    })().catch(onError);
  });
  return () => {
    stopIssueUpdates();
    stopRunChanges();
  };
}
