/**
 * What issue changes start for agents (`IssueWorkHandler`), in the transaction of the change. Everything that wakes an
 * agent becomes input of a run (`runs.enqueue`): it joins the run already working on the issue while that run can
 * still take input, else the run waiting for a runner, else starts a run.
 *
 * The issue's owner answers for the work on it. Every wake names them as the responsible and the source of the change
 * as the person who asked (`work-source.ts`): work the owner caused, or a chain of work they started or confirmed,
 * runs as them at once; anyone else's becomes a run request the owner confirms or rejects, or the person who asked
 * runs as themselves (`run-requests.ts`). A comment in the middle of the owner's run reaches it only once confirmed.
 *
 * - Given an issue to execute: work starts, as the person who gave it (or the owner when the system did), unless they
 *   asked not to start now, or the issue is dormant: in backlog, finished or closed (`skipped: 'dormant'`). Taken off
 *   an issue: its queued work is withdrawn and work in progress is asked to stop.
 * - A person's comment (not a note) wakes the agents it mentions, the agent whose comment it answers, and the agent
 *   executing the issue. A comment in the middle of a run reaches the run as input.
 * - A person moving the issue's status tells a run that has not ended, unless the status's workflow stage already
 *   started work there (`stage-rules.ts`); finishing or closing the issue withdraws queued work instead. Moving it out
 *   of backlog to a status that is not finished starts the executing agent's work (`statusChange`).
 * - A new owner: queued work the previous owner woke is withdrawn and does not start again as the new owner's; what it
 *   had not handled yet becomes run requests the new owner confirms. Pending requests are handed to the new owner in
 *   the same transaction. Runs already working go on.
 * - Moved to another project (`project-move.ts`): work starts in the new project's working directories
 *   (`projectChanged`). A run claimed before the move works in the previous project's, so it is told to end and asked
 *   to stop (left to end on its own when its agent moved the issue), and the new run starts once it has ended
 *   (`onRunFinished`). Queued work claims in the new project's working directories anyway, and learns of the move.
 * - Released (nothing holds it, or every sub-issue finished): the executing agent is woken for whoever finished what
 *   held it, unless the issue is dormant.
 * - Held (a `blockedBy` added that is not finished): its queued work is withdrawn (`onBlocked`); held runs go on.
 *
 * An issue that waits for unfinished issues (the projects plugin's `subtasks.blockersOf`) starts nothing, whatever woke
 * it (`skipped: 'blocked'`): the release wakes its agent once nothing holds it. The projects plugin records the skips
 * and withdrawals on the issue's activity.
 *
 * Runs of more urgent issues are claimed first: the issue's priority becomes the run's (`runPriorityOf`).
 *
 * Someone who may not wake the agent starts nothing (`skipped: 'denied'`); the change itself is not refused here: the
 * kind refuses an executor or a mention the person may not give (`kind.ts`). Nothing here calls a model or the
 * network.
 */
import { randomUUID } from 'node:crypto';

import type { ActorRef, RunInputType } from '@nocobase/agent-protocol';
import type {
  Actor,
  IssueWorkHandler,
  Projects,
  ProjectsTx,
  RunAttempt,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { Priority } from '@nocobase/app-plugin-projects/shared/common';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { BACKLOG_STATUS } from '@nocobase/app-plugin-projects/shared/workflows';
import type { DatabaseConnection } from '@nocobase/db';

import type {
  Agents,
  SubjectBinding,
} from '@nocobase/app-plugin-agents/server/tokens';
import { systemViewer } from '../previews/sources.js';
import { EXECUTOR_WAITS_ACTIVITY } from '../../shared/design.js';
import { ISSUE_SUBJECT } from './catalog/triggers.js';
import {
  describeMove,
  moveOf,
  movedText,
  PROJECT_CHANGED,
  stopPayload,
  stopText,
  type ProjectMove,
} from './project-move.js';
import { currentStage } from './stage-rules.js';
import { jsonObject } from './values.js';
import { AGENT_KIND, agentsTx } from './tx.js';
import {
  personSource,
  userName,
  workSourceOf,
  type WorkSource,
} from './work-source.js';

export { userName } from './work-source.js';

interface Wake {
  readonly agentId: string;
  readonly issue: Issue;
  /** Who the work comes from; the issue's owner answers for it. */
  readonly source: WorkSource;
  readonly triggerType: string;
  readonly input: {
    readonly type: RunInputType;
    readonly actor: ActorRef;
    readonly text: string;
    readonly payload?: unknown;
  };
}

/**
 * A run's claim order by its issue's priority: lower is claimed first, so urgent issues go first. An issue without a
 * priority claims as everything else the agents plugin queues (0, a conversation's).
 */
export const ISSUE_RUN_PRIORITY: Readonly<Record<Priority, number>> = {
  urgent: -4,
  high: -3,
  medium: -2,
  low: -1,
  none: 0,
};

export function runPriorityOf(priority: Priority): number {
  return ISSUE_RUN_PRIORITY[priority] ?? 0;
}

/** Where work does not start: backlog, and a finished or closed status. */
export function isDormant(statusKey: string, category: string | null): boolean {
  return (
    statusKey === BACKLOG_STATUS || category === 'done' || category === 'closed'
  );
}

const agentOf = (issue: Issue | null): string | null =>
  issue?.executor?.type === AGENT_KIND ? issue.executor.id : null;

/** The work handler, and the "Start" an issue's agent executes, as given an issue with "Start now" answered. */
export interface AgentWork extends IssueWorkHandler {
  /**
   * Starts the agent executing `issue` as the work it was given (trigger `assigned`), for `actor`: unless the issue is
   * dormant, waits for unfinished issues, or the actor may not wake the agent (`skipped`).
   */
  startNow(tx: ProjectsTx, issue: Issue, actor: Actor): Promise<RunAttempt>;
  /**
   * The stage of the status `issue` is in, when the workflow hands that status to an agent without assigning it (Design
   * first's Analysis, a review): that agent is woken with the stage's instruction, for `actor`, whatever the executor.
   * For an issue that entered its status by no move (created there), or whose stage waited for unfinished issues and
   * no agent executor's release resumed it. Null when the status is the executor's own or runs no agent.
   */
  startHandedOverStage(
    tx: ProjectsTx,
    issue: Issue,
    actor: Actor,
    triggerType: string,
  ): Promise<RunAttempt | null>;
  /** The end of a run on an issue: one told its issue moved to another project is followed by a run there. */
  readonly onRunFinished: NonNullable<
    NonNullable<SubjectBinding['sink']>['onRunFinished']
  >;
}

export function createAgentWork(deps: {
  readonly agents: Pick<Agents, 'runs' | 'agents'>;
  readonly projects: () => Pick<
    Projects,
    'workflows' | 'subtasks' | 'issueContext'
  >;
}): AgentWork {
  const { runs } = deps.agents;
  const subjectOf = (issue: Issue) => ({ kind: ISSUE_SUBJECT, id: issue.id });

  /**
   * Wakes the agent for the work: queued as the owner when the owner is its source, else a run request the owner
   * confirms (`started: false`, no run). The source must be able to wake the agent, and so must the owner, who
   * answers for it.
   */
  async function wake(tx: ProjectsTx, request: Wake): Promise<RunAttempt> {
    const attempt = {
      kind: AGENT_KIND,
      principalId: request.agentId,
      subjectId: request.issue.id,
      triggerType: request.triggerType,
    };
    const agent = await deps.agents.agents.findWorkable(
      tx.conn,
      request.agentId,
    );
    if (!agent) return { ...attempt, started: false, skipped: 'unavailable' };
    const { source, issue } = request;
    const responsible = issue.ownerUserId;
    if (
      !deps.agents.agents.mayInvoke(agent, source.userId) ||
      !deps.agents.agents.mayInvoke(agent, responsible)
    )
      return { ...attempt, started: false, skipped: 'denied' };
    // Held by unfinished issues: the release wakes the agent once nothing holds it.
    const blockers = await deps.projects().subtasks.blockersOf(tx.conn, issue);
    if (blockers.length > 0)
      return { ...attempt, started: false, skipped: 'blocked' };
    // A plan's rehearsal: report the run it would start, queue nothing; someone else's work only asks the owner.
    if (tx.rehearsal)
      return { ...attempt, started: source.userId === responsible };
    const result = await runs.enqueue(
      {
        agentId: agent.id,
        subject: subjectOf(issue),
        actorUserId: source.userId,
        responsibleUserId: responsible,
        ...(source.causedByRunId
          ? { causedByRunId: source.causedByRunId }
          : { requestedByUserId: source.userId }),
        ownerUserId: responsible,
        priority: runPriorityOf(issue.priority),
        input: {
          ...request.input,
          payload: {
            trigger: request.triggerType,
            ...(request.input.payload &&
            typeof request.input.payload === 'object'
              ? request.input.payload
              : {}),
          },
        },
      },
      agentsTx(tx),
    );
    // Waiting for the owner: a run request, with its card in their inbox (`run-requests.ts`).
    if (result.outcome === 'pending') return { ...attempt, started: false };
    return { ...attempt, started: true, runId: result.runId };
  }

  /** Who a change comes from (`work-source.ts`). */
  const sourceOf = (tx: ProjectsTx, actor: Actor | undefined, issue: Issue) =>
    workSourceOf(tx.conn, actor, issue);

  /** Withdraws queued work of `agentId` and asks its work in progress to stop. */
  async function stop(
    tx: ProjectsTx,
    issue: Issue,
    agentId: string,
    byUserId: string | null,
  ): Promise<void> {
    if (tx.rehearsal) return;
    await runs.withdrawQueued(
      { subject: subjectOf(issue), agentId, byUserId },
      agentsTx(tx),
    );
    for (const run of await runs.openOn(tx.conn, subjectOf(issue), agentId))
      if (run.status !== 'queued')
        await runs.cancel(run.id, byUserId ?? issue.ownerUserId, agentsTx(tx));
  }

  async function categoryOf(
    conn: DatabaseConnection,
    issue: Issue,
  ): Promise<string | null> {
    const catalog = await deps
      .projects()
      .workflows.catalogs.forProject(conn, issue.projectId);
    return catalog.category(issue.statusKey);
  }

  async function dormant(conn: DatabaseConnection, issue: Issue) {
    return isDormant(issue.statusKey, await categoryOf(conn, issue));
  }

  /**
   * The stage of the status the issue is in, for `agentId`: the agent whose stage it is (`agentId`, or the agent a rule
   * hands the status to without making it the executor) and, as a wake's payload, the stage instruction.
   */
  async function stageOf(
    tx: ProjectsTx,
    issue: Issue,
    agentId: string,
  ): Promise<{
    readonly agentId: string;
    readonly payload: {
      readonly status: string;
      readonly instruction?: string;
    };
  } | null> {
    const stage = await currentStage(
      deps.projects(),
      tx.conn,
      issue,
      agentId,
    ).catch(() => null);
    return stage
      ? {
          agentId: stage.agentId,
          payload: {
            status: issue.statusKey,
            ...(stage.instruction ? { instruction: stage.instruction } : {}),
          },
        }
      : null;
  }

  /** The stage of the status the issue is in when it is `agentId`'s own: its payload, or null. */
  async function ownStageOf(tx: ProjectsTx, issue: Issue, agentId: string) {
    const stage = await stageOf(tx, issue, agentId);
    return stage?.agentId === agentId ? stage.payload : null;
  }

  /**
   * One line on the issue's activity: `agentId` became the executor in a status whose stage is another agent's, so its
   * work starts once the issue enters a status of its own (In progress). Studio writes it to the projects plugin's
   * activity log, which the issue timeline reads (`client/issues/detail/activity-row.tsx`).
   */
  async function recordWaiting(
    tx: ProjectsTx,
    issue: Issue,
    agentId: string,
    actor: Actor,
  ): Promise<void> {
    if (tx.rehearsal) return;
    const agent = await deps.agents.agents.findWorkable(tx.conn, agentId);
    await tx.conn.repository('pmActivities').createOne({
      values: {
        id: randomUUID(),
        issueId: issue.id,
        actorType: actor.type,
        actorId: actor.id,
        action: EXECUTOR_WAITS_ACTIVITY,
        details: {
          agentId,
          name: agent?.name ?? agentId,
          status: issue.statusKey,
        },
        createdAt: new Date(),
      },
    });
    tx.emit({ type: 'issue.changed', issueId: issue.id });
  }

  /** Wakes `stage`'s agent for the stage of the status `issue` is in, as `who`'s. */
  function startStage(
    tx: ProjectsTx,
    issue: Issue,
    stage: { readonly agentId: string; readonly payload: object },
    who: WorkSource,
    triggerType: string,
  ): Promise<RunAttempt> {
    return wake(tx, {
      agentId: stage.agentId,
      issue,
      source: who,
      triggerType,
      input: {
        type: 'signal',
        actor: who.ref,
        text: `${who.ref.name} started ${issue.identifier} (${issue.title}) in ${issue.statusKey}, a stage of yours.`,
        payload: stage.payload,
      },
    });
  }

  const skipped = (
    agentId: string,
    issue: Issue,
    triggerType: string,
    reason: RunAttempt['skipped'],
  ): RunAttempt => ({
    kind: AGENT_KIND,
    principalId: agentId,
    subjectId: issue.id,
    triggerType,
    started: false,
    ...(reason ? { skipped: reason } : {}),
  });

  /**
   * The work `agentId` was given on `issue` starts, as `who`'s, for `actor`: at once in a status of its own or one
   * that runs no agent (Todo), with the stage's instruction when it has one. In a status whose stage is another agent's
   * (Analysis, Proposal review, UI review, In review), the executor is only recorded: neither it nor that stage's agent
   * is woken, and it starts with its stage's instruction once the issue enters In progress (`runAgent` there).
   */
  async function assigned(
    tx: ProjectsTx,
    issue: Issue,
    agentId: string,
    who: WorkSource,
    actor: Actor,
  ): Promise<RunAttempt> {
    // In backlog, or finished: the work starts when the issue leaves backlog.
    if (await dormant(tx.conn, issue))
      return skipped(agentId, issue, 'assigned', 'dormant');
    const stage = await stageOf(tx, issue, agentId);
    if (stage && stage.agentId !== agentId) {
      await recordWaiting(tx, issue, agentId, actor);
      return skipped(agentId, issue, 'assigned', 'deferred');
    }
    return wake(tx, {
      agentId,
      issue,
      source: who,
      triggerType: 'assigned',
      input: {
        type: 'signal',
        actor: who.ref,
        text: `${who.ref.name} gave you ${issue.identifier} (${issue.title}) to work on.`,
        ...(stage ? { payload: stage.payload } : {}),
      },
    });
  }

  /**
   * `after` moved to another project, executed by `agentId` all along: work starts in its new project's working
   * directories now, or, while a run claimed in the previous project's holds the issue, once that run has ended.
   */
  async function moved(
    tx: ProjectsTx,
    change: {
      readonly before: Issue;
      readonly after: Issue;
      readonly actor: Actor;
      readonly start: boolean;
    },
    agentId: string,
    who: WorkSource,
  ): Promise<RunAttempt[]> {
    const { before, after } = change;
    const held = (await runs.openOn(tx.conn, subjectOf(after), agentId)).filter(
      (run) => run.status !== 'queued',
    );
    if (held.length === 0 && !change.start)
      return [skipped(agentId, after, PROJECT_CHANGED, 'deferred')];
    const move = await describeMove(
      tx.conn,
      after.identifier,
      before.projectId,
      after.projectId,
      who,
    );
    if (held.length === 0) return [await restart(tx, after, agentId, move)];
    if (tx.rehearsal) return [];
    // The agent that moved its own issue ends its run itself, with its comment saying where the work stands.
    const self =
      change.actor.type === AGENT_KIND && change.actor.id === agentId;
    for (const run of held) {
      await runs.addInput(
        run.id,
        {
          type: 'signal',
          actor: who.ref,
          text: stopText(after.identifier, move, self),
          payload: stopPayload(move, run.id),
        },
        agentsTx(tx),
      );
      if (!self) await runs.cancel(run.id, who.userId, agentsTx(tx));
    }
    return [];
  }

  /** Starts `agentId`'s work on `issue` in its project's working directories, told of `move`. */
  async function restart(
    tx: ProjectsTx,
    issue: Issue,
    agentId: string,
    move: ProjectMove,
  ): Promise<RunAttempt> {
    const stage = await ownStageOf(tx, issue, agentId);
    return wake(tx, {
      agentId,
      issue,
      source: { userId: move.byUserId, ref: move.by },
      triggerType: PROJECT_CHANGED,
      input: {
        type: 'signal',
        actor: move.by,
        text: movedText(issue.identifier, move),
        payload: {
          fromProject: move.from?.id ?? null,
          toProject: move.to?.id ?? null,
          ...(stage ?? {}),
        },
      },
    });
  }

  return {
    async onRunFinished(tx, run) {
      if (run.subject.kind !== ISSUE_SUBJECT) return;
      const marks = (
        await runs.inputsSince(tx.conn, run.subject, new Date(run.createdAt))
      ).flatMap((input) => {
        const move =
          input.agentId === run.agentId ? moveOf(input.payload, run.id) : null;
        return move ? [move] : [];
      });
      if (marks.length === 0) return;
      const conn = tx.conn;
      const issue = await deps
        .projects()
        .issueContext.contextFor(conn, run.subject.id, { kind: AGENT_KIND });
      if (!issue || issue.executor?.type !== AGENT_KIND) return;
      if (issue.executor.id !== run.agentId) return;
      if (isDormant(issue.status.key, issue.status.category)) return;
      // Moved more than once while the run held it: the move to where the issue is now.
      const move = marks
        .filter((item) => (item.to?.id ?? null) === (issue.project?.id ?? null))
        .at(-1);
      if (!move) return;
      const agent = await deps.agents.agents.findWorkable(conn, run.agentId);
      if (
        !agent ||
        !deps.agents.agents.mayInvoke(agent, move.byUserId) ||
        !deps.agents.agents.mayInvoke(agent, issue.owner.id)
      )
        return;
      // As any wake: someone other than the owner who moved it asks the owner first.
      await runs.enqueue(
        {
          agentId: agent.id,
          subject: run.subject,
          actorUserId: move.byUserId,
          responsibleUserId: issue.owner.id,
          requestedByUserId: move.byUserId,
          ownerUserId: issue.owner.id,
          priority: runPriorityOf(issue.priority as Priority),
          input: {
            type: 'signal',
            actor: move.by,
            text: movedText(issue.identifier, move),
            payload: {
              trigger: PROJECT_CHANGED,
              fromProject: move.from?.id ?? null,
              toProject: move.to?.id ?? null,
            },
          },
        },
        tx,
      );
    },

    async startHandedOverStage(tx, issue, actor, triggerType) {
      if (await dormant(tx.conn, issue)) return null;
      const executor = agentOf(issue);
      const stage = await stageOf(tx, issue, executor ?? '');
      // No stage, or the executor's own: its assignment or release woke it already.
      if (!stage?.agentId || stage.agentId === executor) return null;
      return startStage(
        tx,
        issue,
        stage,
        await sourceOf(tx, actor, issue),
        triggerType,
      );
    },

    async startNow(tx, issue, actor) {
      const agentId = agentOf(issue);
      if (!agentId) throw new Error('No agent executes the issue.');
      return assigned(
        tx,
        issue,
        agentId,
        await sourceOf(tx, actor, issue),
        actor,
      );
    },

    async onIssueChanged(tx, change) {
      const { before, after } = change;
      const from = agentOf(before);
      const to = agentOf(after);
      const who = await sourceOf(tx, change.actor, after);
      // A new owner: the requests waiting for the previous one are theirs now, in this transaction, so the previous
      // owner can no longer confirm them; also when the new owner may not keep the agent and it is taken off.
      if (before && before.ownerUserId !== after.ownerUserId && !tx.rehearsal)
        await runs.requests.reassign(
          {
            subject: subjectOf(after),
            toUserId: after.ownerUserId,
            byUserId: change.actor.type === 'user' ? change.actor.id : null,
            note: `${after.identifier} has a new owner.`,
          },
          agentsTx(tx),
        );
      if (from && from !== to)
        await stop(
          tx,
          after,
          from,
          change.actor.type === 'user' ? who.userId : null,
        );
      if (to && to !== from) {
        if (!change.start) return [skipped(to, after, 'assigned', 'deferred')];
        return [await assigned(tx, after, to, who, change.actor)];
      }
      // Moved to another project: the status change, if any, goes with the new run's start.
      if (
        to &&
        before &&
        before.projectId !== after.projectId &&
        !(await dormant(tx.conn, after))
      )
        return moved(tx, { ...change, before }, to, who);
      if (
        !to ||
        !before ||
        before.statusKey === after.statusKey ||
        change.actor.type === AGENT_KIND
      )
        return [];
      const category = await categoryOf(tx.conn, after);
      if (category === 'done' || category === 'closed') {
        await runs.withdrawQueued(
          { subject: subjectOf(after), agentId: to, byUserId: who.userId },
          agentsTx(tx),
        );
        return [];
      }
      // Out of backlog: the work the agent was given starts now, unless the person asked not to start it.
      const leftBacklog =
        before.statusKey === BACKLOG_STATUS &&
        !isDormant(after.statusKey, category);
      if (leftBacklog && !change.start)
        return [skipped(to, after, 'statusChange', 'deferred')];
      const open = await runs.openOn(tx.conn, subjectOf(after), to);
      if (open.length === 0 && !leftBacklog) return [];
      // A workflow stage that started work for this status told the agent already, with its instruction.
      for (const run of open)
        for (const input of await runs.pendingInputs(tx.conn, run.id)) {
          const payload = jsonObject(input.payload);
          if (
            payload.trigger === 'stageEntered' &&
            payload.to === after.statusKey
          )
            return [];
        }
      const stage = leftBacklog ? await stageOf(tx, after, to) : null;
      // A status the workflow hands to another agent: entering it started that agent's stage, and the executor waits.
      if (stage && stage.agentId !== to)
        return [skipped(to, after, 'statusChange', 'deferred')];
      return [
        await wake(tx, {
          agentId: to,
          issue: after,
          source: who,
          triggerType: 'statusChange',
          input: {
            type: 'statusChange',
            actor: who.ref,
            text: `${who.ref.name} moved ${after.identifier} from ${before.statusKey} to ${after.statusKey}.`,
            payload: {
              from: before.statusKey,
              to: after.statusKey,
              ...(stage ? { instruction: stage.payload.instruction } : {}),
            },
          },
        }),
      ];
    },

    async onCommentCreated(tx, change) {
      const { comment, issue, parent } = change;
      if (!change.actor.id) return [];
      const targets = new Map<string, string>();
      for (const ref of change.mentions)
        if (ref.kind === AGENT_KIND && !targets.has(ref.id))
          targets.set(ref.id, 'mention');
      if (parent?.authorType === AGENT_KIND && parent.authorId)
        if (!targets.has(parent.authorId))
          targets.set(parent.authorId, 'reply');
      const executing = agentOf(issue);
      if (executing && !targets.has(executing))
        targets.set(executing, 'comment');
      // Only a person comments here (the projects plugin wakes nobody for anything else's comments).
      const source: WorkSource = {
        userId: change.actor.id,
        ref: {
          kind: 'user',
          id: change.actor.id,
          name:
            comment.authorName ?? (await userName(tx.conn, change.actor.id)),
        },
      };
      const attempts: RunAttempt[] = [];
      for (const [agentId, triggerType] of targets)
        attempts.push(
          await wake(tx, {
            agentId,
            issue,
            source,
            triggerType,
            input: {
              type: 'comment',
              actor: source.ref,
              text: comment.content,
              payload: { commentId: comment.id, parentId: comment.parentId },
            },
          }),
        );
      return attempts;
    },

    /**
     * The issue was given to someone else. The previous owner's queued work does not run as the new owner's: it is
     * withdrawn, and each input it had not handled is asked of the new owner as it was asked (a run request, unless
     * the new owner asked it themselves). The requests waiting for the previous owner are handed to the new one, in
     * this transaction, so the previous owner can no longer confirm them. Runs already working go on.
     */
    async onOwnerChanged(tx, { issue, from, to, actor }) {
      if (tx.rehearsal) return [];
      const unit = agentsTx(tx);
      const by = actor?.type === 'user' && actor.id ? actor.id : null;
      const withdrawn = await runs.withdrawQueued(
        {
          subject: subjectOf(issue),
          actorUserId: from,
          byUserId: by,
          detail: `${issue.identifier} has a new owner; what the run had not handled is asked of them.`,
        },
        unit,
      );
      const attempts: RunAttempt[] = [];
      for (const run of withdrawn) {
        const inputs = await runs.pendingInputs(tx.conn, run.id);
        if (inputs.length === 0) continue;
        // Asked again by whoever the withdrawn work came from: the previous owner, or the person they confirmed it for.
        const source = await personSource(
          tx.conn,
          run.requestedByUserId || run.actorUserId,
        );
        for (const input of inputs) {
          const payload = jsonObject(input.payload);
          attempts.push(
            await wake(tx, {
              agentId: run.agentId,
              issue,
              source,
              triggerType:
                typeof payload.trigger === 'string'
                  ? payload.trigger
                  : 'ownerChanged',
              input: {
                type: input.type,
                actor: input.actor,
                text: input.text,
                payload: {
                  ...payload,
                  ownerChanged: { from, to, withdrawnRunId: run.id },
                },
              },
            }),
          );
        }
      }
      return attempts;
    },

    async onBlocked(tx, { issue }) {
      if (tx.rehearsal) return [];
      const withdrawn = await runs.withdrawQueued(
        {
          subject: subjectOf(issue),
          byUserId: null,
          detail: `${issue.identifier} is waiting for unfinished issues.`,
        },
        agentsTx(tx),
      );
      return withdrawn.map((run) => ({
        kind: AGENT_KIND,
        principalId: run.agentId,
        subjectId: issue.id,
        runId: run.id,
        reason: 'blocked' as const,
      }));
    },

    /** Released by whoever finished (or deleted, or unlinked) what held it: their work, which the owner confirms. */
    async onUnblocked(tx, { issue, releasedBy, actor }) {
      const agentId = agentOf(issue);
      if (!agentId) return [];
      if (await dormant(tx.conn, issue))
        return [skipped(agentId, issue, 'unblocked', 'dormant')];
      // In a status the workflow hands to another agent, that agent's stage resumes.
      const stage = await stageOf(tx, issue, agentId);
      const source = await sourceOf(tx, actor, issue);
      return [
        await wake(tx, {
          agentId: stage?.agentId ?? agentId,
          issue,
          source,
          triggerType: 'unblocked',
          input: {
            type: 'signal',
            actor: source.ref,
            text: `${issue.identifier} is no longer blocked: ${releasedBy.identifier} (${releasedBy.title}) is finished.`,
            payload: { releasedBy: releasedBy.id, ...stage?.payload },
          },
        }),
      ];
    },

    /** Woken by whoever finished the last sub-issue: their work, which the parent's owner confirms. */
    async onSubtasksFinished(tx, { parent, stage, childIssueIds, actor }) {
      const agentId = agentOf(parent);
      if (!agentId) return [];
      const source = await sourceOf(tx, actor, parent);
      return [
        await wake(tx, {
          agentId,
          issue: parent,
          source,
          triggerType: 'subtasksFinished',
          input: {
            type: 'signal',
            actor: source.ref,
            text:
              stage === null
                ? `Every sub-issue of ${parent.identifier} is finished.`
                : `Every sub-issue of stage ${stage} of ${parent.identifier} is finished.`,
            payload: { stage, childIssueIds },
          },
        }),
      ];
    },
  };
}

/**
 * Starts the stage a status hands to an agent (`AgentWork.startHandedOverStage`) where no status rule or agent executor
 * does: once an issue is created, since it enters its status by no move (an issue put in Analysis, with or without an
 * executor, gets its design), and once nothing holds an issue whose executor is not an agent, since the projects plugin
 * tells only an agent executor's kind (`onUnblocked`). Returns what stops it.
 */
export function startHandedOverStages(
  projects: Pick<Projects, 'events' | 'issueQueries' | 'tx'>,
  work: Pick<AgentWork, 'startHandedOverStage'>,
  onError: (error: unknown) => void,
): () => void {
  const start = (
    issueId: string,
    actor: { readonly type: Actor['type']; readonly id: string | null },
    triggerType: string,
  ) => {
    void projects.issueQueries
      .detail(systemViewer(), issueId)
      .then((issue) =>
        projects.tx.run((tx) =>
          work.startHandedOverStage(
            tx,
            issue,
            { type: actor.type, id: actor.id },
            triggerType,
          ),
        ),
      )
      .catch(onError);
  };
  const stops = [
    projects.events.on('issue.created', (event) => {
      start(event.issueId, event.actor, 'created');
    }),
    projects.events.on('issue.dependencyReleased', (event) => {
      if (event.executor?.type === AGENT_KIND) return;
      start(event.issueId, event.actor, 'unblocked');
    }),
  ];
  return () => {
    for (const stop of stops) stop();
  };
}
