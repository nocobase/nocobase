/**
 * What issue changes start for agents (`IssueWorkHandler`), in the transaction of the change. Everything that wakes an
 * agent becomes input of a run (`runs.enqueue`): it joins the run already working on the issue while that run can
 * still take input, else the run waiting for a runner, else starts a run.
 *
 * An issue's executing agent is its project manager (`manager/`), which hands each step of the work to an agent by
 * mentioning it in a comment; a person may also execute an issue, and then no agent works on it unless mentioned.
 *
 * - Given an issue to execute: work starts, as the person who gave it (or the owner when the system did), unless they
 *   asked not to start now, or the issue is dormant: in backlog, finished or closed (`skipped: 'dormant'`). Taken off
 *   an issue: its queued work is withdrawn and work in progress is asked to stop.
 * - A person's comment (not a note) wakes the agents it mentions, the agent whose comment it answers, and the agent
 *   executing the issue. An agent's comment wakes the agents it mentions, never itself and never the agent whose
 *   comment it answers; mentioning no agent, it wakes the executing agent (the coordinator) unless it mentions a person
 *   or is the executor's own. It acts for the person its run acts for (the owner when no run wrote it); at most the
 *   project manager's `commentRunLimit` runs within `COMMENT_RUN_WINDOW_HOURS` hours, after which it starts nothing
 *   (`skipped: 'limited'`) and the owner is told and may continue it (`comment-run-limit.ts`). A person's comment that
 *   reaches agents restarts that count. A run an agent's comment started always answers in that comment's thread when it
 *   completes without commenting or fails for good (`run-report.ts`), which wakes the executing agent in turn. A comment
 *   in the middle of a run reaches the run as input.
 * - A person moving the issue into In progress starts the executing agent's work (`started` from backlog or a finished
 *   status, else `statusChange`), unless they asked not to start now; moving it elsewhere tells a run that has not
 *   ended. Finishing or closing the issue withdraws queued work instead.
 * - A new owner: queued work the previous owner woke is withdrawn, and starts again as the new owner's.
 * - Moved to another project (`project-move.ts`): work starts in the new project's working directories
 *   (`projectChanged`). A run claimed before the move works in the previous project's, so it is told to end and asked
 *   to stop (left to end on its own when its agent moved the issue), and the new run starts once it has ended
 *   (`onRunFinished`). Queued work claims in the new project's working directories anyway, and learns of the move.
 * - Released (nothing holds it, or every sub-issue finished): the executing agent is woken, unless the issue is dormant.
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

import { jsonObject } from './values.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
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
import {
  BACKLOG_STATUS,
  IN_PROGRESS_STATUS,
  statusCategory,
} from '@nocobase/app-plugin-projects/shared/statuses';
import type { DatabaseConnection } from '@nocobase/db';

import type {
  Agents,
  SubjectBinding,
} from '@nocobase/app-plugin-agents/server/tokens';
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
import {
  COMMENT_GUARD,
  COMMENT_RUNS_NOTICE_KIND,
  commentGuardId,
  commentGuards,
  recentCommentRunCount,
  type HeldCommentWake,
} from './comment-guard.js';
import { readManagerSettings } from './manager/settings.js';
import { COMMENT_RUN_WINDOW_HOURS } from '../../shared/project-manager.js';
import { AGENT_KIND, agentsTx } from './tx.js';

interface Wake {
  readonly agentId: string;
  readonly issue: Issue;
  readonly actorUserId: string;
  readonly triggerType: string;
  readonly freshSession?: boolean;
  readonly input: {
    readonly type: RunInputType;
    readonly actor: ActorRef;
    readonly text: string;
    readonly payload?: unknown;
  };
}

/** A person's display name, or their id. */
export async function userName(
  conn: DatabaseConnection,
  id: string,
): Promise<string> {
  const user = await conn
    .repository<{ id: string; name: string | null; username: string | null }>(
      'user',
    )
    .findOne({ filter: { id } });
  return user?.name ?? user?.username ?? id;
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

/** The work handler, and "Start" on an issue its agent executes. */
export interface AgentWork extends IssueWorkHandler {
  /**
   * Starts the agent executing `issue` for `actor` (trigger `started`): unless the issue is dormant, waits for
   * unfinished issues, or the actor may not wake the agent (`skipped`).
   */
  startNow(tx: ProjectsTx, issue: Issue, actor: Actor): Promise<RunAttempt>;
  /**
   * Wakes the agents a comment the limit held back would have woken, for `userId`, the person who continued it
   * (`continuedFrom`, the guard's token); the limit is not checked, and the run is not counted.
   */
  resumeComment(
    tx: ProjectsTx,
    issue: Issue,
    held: HeldCommentWake,
    userId: string,
    continuedFrom: string,
  ): Promise<RunAttempt[]>;
  /** The end of a run on an issue: one told its issue moved to another project is followed by a run there. */
  readonly onRunFinished: NonNullable<
    NonNullable<SubjectBinding['sink']>['onRunFinished']
  >;
}

export function createAgentWork(deps: {
  readonly agents: Pick<Agents, 'runs' | 'agents'>;
  readonly projects: () => Pick<Projects, 'subtasks' | 'issueContext'>;
}): AgentWork {
  const { runs } = deps.agents;
  const subjectOf = (issue: Issue) => ({ kind: ISSUE_SUBJECT, id: issue.id });

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
    if (!deps.agents.agents.mayInvoke(agent, request.actorUserId))
      return { ...attempt, started: false, skipped: 'denied' };
    // Held by unfinished issues: the release wakes the agent once nothing holds it.
    const blockers = await deps
      .projects()
      .subtasks.blockersOf(tx.conn, request.issue);
    if (blockers.length > 0)
      return { ...attempt, started: false, skipped: 'blocked' };
    // A plan's rehearsal: report the run it would start, queue nothing.
    if (tx.rehearsal) return { ...attempt, started: true };
    const result = await runs.enqueue(
      {
        agentId: agent.id,
        subject: subjectOf(request.issue),
        actorUserId: request.actorUserId,
        ownerUserId: request.issue.ownerUserId,
        priority: runPriorityOf(request.issue.priority),
        freshSession: request.freshSession,
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
    // Mark only the creating input, in this transaction. An appended mention must never adopt an existing run.
    if (
      result.outcome === 'created' &&
      request.agentId !== PROJECT_MANAGER_ID &&
      request.triggerType === 'mention' &&
      request.input.actor.kind === 'agent' &&
      request.input.actor.id === PROJECT_MANAGER_ID
    ) {
      const inputs = tx.conn.repository<{
        id: string;
        runId: string;
        payload: unknown;
      }>('agRunInputs');
      const input = await inputs.findOne({
        filter: { id: result.inputId, runId: result.runId },
      });
      if (!input) throw new Error('The creating input is missing.');
      const payload = jsonObject(input.payload);
      await inputs.updateMany({
        filter: { id: result.inputId, runId: result.runId },
        values: {
          payload: {
            ...payload,
            managerDelegation: {
              commentId: payload.commentId,
              actorUserId: request.actorUserId,
              delegatedBy: PROJECT_MANAGER_ID,
              inputId: result.inputId,
            },
          },
        },
      });
    }
    // A request waiting for confirmation has no run. Studio does not yet supply a responsible person;
    // keep this guard until execution request handling is integrated.
    if (result.runId === null) {
      console.warn(
        `Work for ${request.issue.identifier} became run request ${result.requestId} instead of a run.`,
      );
      return { ...attempt, started: false };
    }
    return { ...attempt, started: true, runId: result.runId };
  }

  /** Who a change acts for: the person who made it, or the issue's owner for the system's and agents' changes. */
  async function actorOf(
    tx: ProjectsTx,
    actor: Actor,
    issue: Issue,
  ): Promise<{ readonly userId: string; readonly ref: ActorRef }> {
    if (actor.type === 'user' && actor.id)
      return {
        userId: actor.id,
        ref: {
          kind: 'user',
          id: actor.id,
          name: await userName(tx.conn, actor.id),
        },
      };
    return {
      userId: issue.ownerUserId,
      ref: {
        kind: actor.type === AGENT_KIND ? 'agent' : 'system',
        id: actor.id ?? 'system',
        name: actor.type === AGENT_KIND ? 'Agent' : 'Studio',
      },
    };
  }

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

  const dormant = (issue: Issue): boolean =>
    isDormant(issue.statusKey, statusCategory(issue.statusKey));

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

  /** Wakes each agent `held` names with the comment, for `userId`. */
  async function wakeComment(
    tx: ProjectsTx,
    issue: Issue,
    held: Omit<HeldCommentWake, 'limit'>,
    userId: string,
    extra: Readonly<Record<string, unknown>>,
  ): Promise<RunAttempt[]> {
    const attempts: RunAttempt[] = [];
    for (const { agentId, triggerType } of held.targets)
      attempts.push(
        // The project manager works only while the issue is open.
        agentId === PROJECT_MANAGER_ID && dormant(issue)
          ? skipped(agentId, issue, triggerType, 'dormant')
          : await wake(tx, {
              agentId,
              issue,
              actorUserId: userId,
              triggerType,
              input: {
                type: 'comment',
                actor: held.actor,
                text: held.content,
                payload: {
                  commentId: held.commentId,
                  parentId: held.parentId,
                  ...extra,
                },
              },
            }),
      );
    return attempts;
  }

  /**
   * Whether agents' comments started as many runs on `issue` as the project manager's settings allow; then `held`
   * waits for a person to continue it, and the owner is told.
   */
  async function commentLimited(
    tx: ProjectsTx,
    issue: Issue,
    held: Omit<HeldCommentWake, 'limit'>,
  ): Promise<boolean> {
    const { commentRunLimit: limit } = await readManagerSettings(tx.conn);
    const count = await recentCommentRunCount(
      tx.conn,
      issue.id,
      COMMENT_RUN_WINDOW_HOURS,
    );
    if (count < limit) return false;
    if (tx.rehearsal) return true;
    const id = commentGuardId(issue.id);
    const token = randomUUID();
    const existing = await commentGuards(tx.conn).findOne({ filter: { id } });
    const previous = existing?.pendingToken
      ? (existing.ruleConfig as unknown as HeldCommentWake | null)
      : null;
    const ruleConfig = {
      ...held,
      limit,
      ...(previous
        ? {
            pendingWakes: [
              ...(previous.pendingWakes ?? [previous]),
              { ...held, limit },
            ],
          }
        : {}),
    };
    await commentGuards(tx.conn).upsertOne({
      filter: { id },
      create: {
        id,
        issueId: issue.id,
        statusKey: COMMENT_GUARD,
        resetAt: null,
        pendingToken: token,
        agentId: null,
        fromStatus: null,
        ruleConfig,
      },
      update: { pendingToken: token, ruleConfig },
    });
    tx.emit({
      type: 'work.announced',
      kind: COMMENT_RUNS_NOTICE_KIND,
      payload: {
        issue: {
          id: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          ownerUserId: issue.ownerUserId,
        },
        agentName: held.actor.name,
        limit,
        windowHours: COMMENT_RUN_WINDOW_HOURS,
        continueToken: token,
        at: new Date().toISOString(),
      },
    });
    return true;
  }

  /** A person's own comment: agents' comments get a fresh count, and a held one no longer waits. */
  async function resetCommentCount(tx: ProjectsTx, issue: Issue) {
    if (tx.rehearsal) return;
    const id = commentGuardId(issue.id);
    const resetAt = new Date().toISOString();
    await commentGuards(tx.conn).upsertOne({
      filter: { id },
      create: {
        id,
        issueId: issue.id,
        statusKey: COMMENT_GUARD,
        resetAt,
        pendingToken: null,
        agentId: null,
        fromStatus: null,
        ruleConfig: null,
      },
      update: { resetAt },
    });
  }

  /** Queue an assignment or a start; the subject's admission policy decides whether it may be claimed now. */
  async function assigned(
    tx: ProjectsTx,
    issue: Issue,
    agentId: string,
    who: { readonly userId: string; readonly ref: ActorRef },
    triggerType: 'assigned' | 'started' = 'assigned',
  ): Promise<RunAttempt> {
    // In backlog, or finished: the work starts when the issue leaves backlog.
    if (dormant(issue)) return skipped(agentId, issue, triggerType, 'dormant');
    return wake(tx, {
      agentId,
      issue,
      actorUserId: who.userId,
      triggerType,
      input: {
        type: 'signal',
        actor: who.ref,
        text:
          triggerType === 'started'
            ? `${who.ref.name} started ${issue.identifier} (${issue.title}).`
            : `${who.ref.name} gave you ${issue.identifier} (${issue.title}) to work on.`,
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
    who: { readonly userId: string; readonly ref: ActorRef },
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
    return wake(tx, {
      agentId,
      issue,
      actorUserId: move.byUserId,
      triggerType: PROJECT_CHANGED,
      input: {
        type: 'signal',
        actor: move.by,
        text: movedText(issue.identifier, move),
        payload: {
          fromProject: move.from?.id ?? null,
          toProject: move.to?.id ?? null,
        },
      },
    });
  }

  return {
    async onRunFinished(tx, run) {
      if (run.subject.kind !== ISSUE_SUBJECT) return;
      // Admission cancellations never restart old work; acknowledged project moves still do.
      if (
        run.status === 'cancelled' &&
        (run.failureDetail?.startsWith('dormant') ||
          run.failureDetail?.startsWith('subjectMissing'))
      )
        return;
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
      if (!agent || !deps.agents.agents.mayInvoke(agent, move.byUserId)) return;
      await runs.enqueue(
        {
          agentId: agent.id,
          subject: run.subject,
          actorUserId: move.byUserId,
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

    async startNow(tx, issue, actor) {
      const agentId = agentOf(issue);
      if (!agentId) throw new Error('No agent executes the issue.');
      return assigned(
        tx,
        issue,
        agentId,
        await actorOf(tx, actor, issue),
        'started',
      );
    },

    async onIssueChanged(tx, change) {
      const { before, after } = change;
      const from = agentOf(before);
      const to = agentOf(after);
      const who = await actorOf(tx, change.actor, after);
      if (from && from !== to)
        await stop(
          tx,
          after,
          from,
          change.actor.type === 'user' ? who.userId : null,
        );
      if (to && to !== from) {
        if (!change.start) return [skipped(to, after, 'assigned', 'deferred')];
        return [await assigned(tx, after, to, who)];
      }
      // Moved to another project: the status change, if any, goes with the new run's start.
      if (
        to &&
        before &&
        before.projectId !== after.projectId &&
        !dormant(after)
      )
        return moved(tx, { ...change, before }, to, who);
      if (
        !to ||
        !before ||
        before.statusKey === after.statusKey ||
        change.actor.type === AGENT_KIND
      )
        return [];
      const category = statusCategory(after.statusKey);
      if (category === 'done' || category === 'closed') {
        await runs.withdrawQueued(
          { subject: subjectOf(after), agentId: to, byUserId: who.userId },
          agentsTx(tx),
        );
        return [];
      }
      // Into In progress: the work the agent was given starts (again) now, unless the person asked not to start it.
      const started = after.statusKey === IN_PROGRESS_STATUS;
      const fromDormant = isDormant(
        before.statusKey,
        statusCategory(before.statusKey),
      );
      if (started && !change.start)
        return [
          skipped(
            to,
            after,
            fromDormant ? 'started' : 'statusChange',
            'deferred',
          ),
        ];
      const open = await runs.openOn(tx.conn, subjectOf(after), to);
      if (open.length === 0 && !started) return [];
      return [
        await wake(tx, {
          agentId: to,
          issue: after,
          actorUserId: who.userId,
          triggerType: started && fromDormant ? 'started' : 'statusChange',
          input: {
            type: 'statusChange',
            actor: who.ref,
            text: `${who.ref.name} moved ${after.identifier} from ${before.statusKey} to ${after.statusKey}.`,
            payload: { from: before.statusKey, to: after.statusKey },
          },
        }),
      ];
    },

    async onCommentCreated(tx, change) {
      const { comment, issue, parent } = change;
      const authorId = change.actor.id;
      if (!authorId) return [];
      const byAgent = change.actor.type === AGENT_KIND;
      if (!byAgent && change.actor.type !== 'user') return [];
      // A person by hand, not through an agent, as the stage loop guard counts them.
      if (!byAgent && change.actor.via !== 'agent')
        await resetCommentCount(tx, issue);
      const targets = new Map<string, string>();
      for (const ref of change.mentions)
        if (ref.kind === AGENT_KIND && !targets.has(ref.id))
          targets.set(ref.id, 'mention');
      const executing = agentOf(issue);
      if (byAgent) {
        // An agent's comment wakes whom it names; naming nobody, the executor coordinates, unless a person is addressed.
        const named = targets.size > 0;
        targets.delete(authorId);
        if (
          !named &&
          executing &&
          executing !== authorId &&
          !change.mentions.some((ref) => ref.kind === 'user')
        )
          targets.set(executing, 'comment');
      } else {
        if (parent?.authorType === AGENT_KIND && parent.authorId)
          if (!targets.has(parent.authorId))
            targets.set(parent.authorId, 'reply');
        if (executing && !targets.has(executing))
          targets.set(executing, 'comment');
      }
      if (targets.size === 0) return [];
      const held = {
        commentId: comment.id,
        parentId: comment.parentId,
        content: comment.content,
        actor: {
          kind: byAgent ? 'agent' : 'user',
          id: authorId,
          name:
            comment.authorName ??
            (byAgent ? 'Agent' : await userName(tx.conn, authorId)),
        } satisfies ActorRef,
        targets: [...targets].map(([agentId, triggerType]) => ({
          agentId,
          triggerType,
        })),
      };
      if (!byAgent) return wakeComment(tx, issue, held, authorId, {});
      if (await commentLimited(tx, issue, held))
        return held.targets.map((target) =>
          skipped(target.agentId, issue, target.triggerType, 'limited'),
        );
      // Runs act for a person: the one the agent's run acts for, else the owner.
      return wakeComment(tx, issue, held, change.userId ?? issue.ownerUserId, {
        byAgent: true,
      });
    },

    // A person's continuation is not counted, as a person's stage move is not.
    async resumeComment(tx, issue, held, userId, continuedFrom) {
      const attempts: RunAttempt[] = [];
      for (const input of held.pendingWakes ?? [held])
        attempts.push(
          ...(await wakeComment(tx, issue, input, userId, { continuedFrom })),
        );
      return attempts;
    },

    async onOwnerChanged(tx, { issue, from, to }) {
      const withdrawn = await runs.withdrawQueued(
        { subject: subjectOf(issue), actorUserId: from, byUserId: null },
        agentsTx(tx),
      );
      const attempts: RunAttempt[] = [];
      for (const agentId of new Set(withdrawn.map((run) => run.agentId)))
        attempts.push(
          await wake(tx, {
            agentId,
            issue,
            actorUserId: to,
            triggerType: 'ownerChanged',
            input: {
              type: 'signal',
              actor: {
                kind: 'user',
                id: to,
                name: await userName(tx.conn, to),
              },
              text: `${issue.identifier} has a new owner; the work continues for them.`,
              payload: { from, to },
            },
          }),
        );
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

    async onUnblocked(tx, { issue, releasedBy }) {
      const agentId = agentOf(issue);
      if (!agentId) return [];
      if (dormant(issue))
        return [skipped(agentId, issue, 'unblocked', 'dormant')];
      return [
        await wake(tx, {
          agentId,
          issue,
          actorUserId: issue.ownerUserId,
          triggerType: 'unblocked',
          input: {
            type: 'signal',
            actor: { kind: 'system', id: 'system', name: 'Studio' },
            text: `${issue.identifier} is no longer blocked: ${releasedBy.identifier} (${releasedBy.title}) is finished.`,
            payload: { releasedBy: releasedBy.id },
          },
        }),
      ];
    },

    async onSubtasksFinished(tx, { parent, stage, childIssueIds }) {
      const agentId = agentOf(parent);
      if (!agentId) return [];
      if (dormant(parent))
        return [skipped(agentId, parent, 'subtasksFinished', 'dormant')];
      return [
        await wake(tx, {
          agentId,
          issue: parent,
          actorUserId: parent.ownerUserId,
          triggerType: 'subtasksFinished',
          input: {
            type: 'signal',
            actor: { kind: 'system', id: 'system', name: 'Studio' },
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
