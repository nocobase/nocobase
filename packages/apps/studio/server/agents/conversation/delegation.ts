/**
 * Delegate and report back (`shared/delegations.ts`). When the person executes a plan an agent proposed in their
 * conversation and a row of it hands an issue to an agent (an agent executor on a new or changed issue, a mention, a
 * comment the executing agent hears), the conversation follows that issue and agent (`studioDelegations`), in the
 * plan's transaction (`plan-hooks.ts`).
 *
 * The issue's milestones then come back to the conversation, each once (`studioDelegationEvents`), as news of type
 * `delegation` (an event card in the panel) and as input waking the conversation's agent, so it can summarise them and
 * suggest next steps under the same rules as any turn (`rules.ts`, `quota.ts`):
 *
 * - the delegated agent's run on the issue ends: completed (`finished`, or `needsInput` when it left the issue in
 *   Blocked, `inReview` in review) or failed for good (`failed`);
 * - someone else moves the issue to a finished or closed status (`issueClosed`); the agent's own move is told when its
 *   run ends;
 * - a pull request is linked to the issue while the agent is not working on it (`prOpened`); one linked during a run
 *   is named on the card of the run's end.
 *
 * What the person did themselves, by hand or through this conversation's agent, is not news to them: a status change
 * whose actor is the conversation's owner is ignored. Wakes are limited per conversation (`WAKE_LIMIT` in
 * `WAKE_WINDOW_MS`): past the limit the card is still written, without waking the agent, so a burst of milestones, or
 * an exchange of agents answering each other, cannot loop. The person stops following an issue from its card.
 */
import { randomUUID } from 'node:crypto';

import type { ActorRef } from '@nocobase/agent-protocol';
import type {
  Projects,
  ProjectsTx,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { PlanDecided } from '@nocobase/app-plugin-projects/shared/plans';
import type { DatabaseConnection } from '@nocobase/db';

import type { Agents, Tx } from '@nocobase/app-plugin-agents/server/tokens';
import type { Run } from '@nocobase/app-plugin-agents/shared/runs';
import {
  DELEGATION_EXCERPT_MAX,
  DELEGATION_NEWS,
  DELEGATION_TRIGGER,
  type Delegation,
  type DelegationEvent,
  type DelegationNewsParams,
  type DelegationPatch,
} from '../../../shared/delegations.js';
import type { PullRequestEvents } from '../../git/events.js';
import { findPullRequestById, pullRequestsOfIssue } from '../../git/store.js';
import { studioError } from '../../http/errors.js';
import { agentNameParams } from '../agent-name.js';
import { BLOCKED_STATUS } from '../blocked.js';
import { ISSUE_SUBJECT } from '../catalog/triggers.js';
import { AGENT_KIND } from '../tx.js';

/** How many milestones may wake a conversation's agent in `WAKE_WINDOW_MS`. */
export const WAKE_LIMIT = 3;
export const WAKE_WINDOW_MS = 10 * 60_000;

/** The status an agent hands an issue over for review in. */
const IN_REVIEW_STATUS = 'in_review';

const LINKS = 'studioDelegations';
const EVENTS = 'studioDelegationEvents';

/** Wakes that hand no work over: the agent was never going to work on the issue. */
const NOT_HANDED: ReadonlySet<string> = new Set(['denied', 'unavailable']);

type Row = Record<string, unknown>;

const iso = (value: unknown): string => new Date(value as string).toISOString();

function linkOf(row: Row): Delegation {
  return {
    id: String(row.id),
    conversationId: String(row.conversationId),
    issueId: String(row.issueId),
    agentId: String(row.agentId),
    userId: String(row.userId),
    followed: Boolean(row.followed),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

/** A pull request as a card names it. */
export interface DelegationPullRequest {
  readonly id: string;
  readonly number: number;
  readonly url: string;
  readonly title: string;
}

/** Studio's pull requests, when assembled (`../../git`). */
export interface DelegationPullRequests {
  /** Hears a pull request being linked to an issue; returns what stops it. */
  onLinked(
    listener: (event: {
      readonly pullRequestId: string;
      readonly issueId: string;
    }) => Promise<void>,
  ): () => void;
  find(
    conn: DatabaseConnection,
    id: string,
  ): Promise<DelegationPullRequest | null>;
  /** The newest pull request linked to the issue. */
  newestOf(
    conn: DatabaseConnection,
    issueId: string,
  ): Promise<DelegationPullRequest | null>;
}

/** Studio's pull requests (`../../git`) as delegations follow them; `events` is resolved when listening starts. */
export function gitPullRequests(
  events: () => PullRequestEvents | undefined,
): DelegationPullRequests {
  const ref = (pr: DelegationPullRequest): DelegationPullRequest => ({
    id: pr.id,
    number: pr.number,
    url: pr.url,
    title: pr.title,
  });
  return {
    onLinked(listener) {
      return (
        events()?.on(async (event) => {
          if (event.type === 'linked') await listener(event);
        }) ?? (() => undefined)
      );
    },
    async find(conn, id) {
      const pr = await findPullRequestById(conn, id);
      return pr ? ref(pr) : null;
    },
    async newestOf(conn, issueId) {
      const newest = (await pullRequestsOfIssue(conn, issueId)).at(-1);
      return newest ? ref(newest.pr) : null;
    },
  };
}

/** A milestone of an issue, for the delegations following it. */
interface Milestone {
  readonly issueId: string;
  /** Only the delegations to this agent; every agent's when absent. */
  readonly agentId?: string;
  /** Unique per delegation: the milestone is told once. */
  readonly key: string;
  readonly event: DelegationEvent;
  readonly excerpt?: string | null;
  readonly status?: string;
  /** The pull request to name; the issue's newest when undefined. */
  readonly pullRequest?: DelegationPullRequest | null;
  /** The person who caused it: not news to a conversation they own. */
  readonly byUserId?: string | null;
}

export interface Delegations {
  /** In a decided plan's transaction: follows each issue its executed rows handed to an agent. */
  onPlanDecided(
    tx: ProjectsTx,
    decided: PlanDecided,
    conversationId: string,
  ): Promise<void>;
  list(userId: string, conversationId: string): Promise<Delegation[]>;
  get(userId: string, id: string): Promise<Delegation>;
  update(
    userId: string,
    id: string,
    patch: DelegationPatch,
  ): Promise<Delegation>;
  /** Hears runs, issues and pull requests; returns what stops it. */
  listen(): () => void;
  /** Resolves once the milestones heard so far were reported (for tests and shutdown). */
  settled(): Promise<void>;
}

export interface DelegationDeps {
  readonly agents: Pick<
    Agents,
    'tx' | 'events' | 'runs' | 'agents' | 'conversations' | 'clock'
  >;
  readonly projects: () => Pick<
    Projects,
    'events' | 'issueContext' | 'commentQueries'
  >;
  readonly pullRequests?: () => DelegationPullRequests | undefined;
  readonly wakeLimit?: number;
  readonly wakeWindowMs?: number;
  readonly onError?: (error: unknown) => void;
}

function excerptOf(text: string | null | undefined): string | null {
  const flat = (text ?? '').replace(/\s+/gu, ' ').trim();
  if (!flat) return null;
  const chars = [...flat];
  return chars.length > DELEGATION_EXCERPT_MAX
    ? `${chars.slice(0, DELEGATION_EXCERPT_MAX - 1).join('')}…`
    : flat;
}

const EVENT_WORDS: Readonly<Record<DelegationEvent, string>> = {
  finished: 'finished its work',
  needsInput: 'needs input',
  inReview: 'asks for review',
  failed: 'could not finish',
  issueClosed: 'was finished or closed',
  prOpened: 'has a pull request',
};

/** The card's English line. */
export function delegationTitle(params: DelegationNewsParams): string {
  const who =
    params.event === 'issueClosed' || params.event === 'prOpened'
      ? params.identifier
      : `${params.identifier} · ${params.agentName}`;
  const pr = params.prNumber ? `, PR #${params.prNumber}` : '';
  return `${who} ${EVENT_WORDS[params.event]}${params.excerpt ? `: ${params.excerpt}` : ''}${pr}`;
}

/** The input waking the conversation's agent: what happened, and what to do with it. */
export function renderDelegationInput(params: DelegationNewsParams): string {
  const lines = [
    `News about work handed over from this conversation: ${params.identifier} (${params.issueTitle}), given to ${params.agentName}.`,
  ];
  switch (params.event) {
    case 'finished':
      lines.push(`${params.agentName} finished its run on it.`);
      break;
    case 'needsInput':
      lines.push(
        `${params.agentName} stopped and moved it to Blocked: it needs an answer.`,
      );
      break;
    case 'inReview':
      lines.push(
        `${params.agentName} finished its run and handed it over for review.`,
      );
      break;
    case 'failed':
      lines.push(`${params.agentName}'s run failed for good.`);
      break;
    case 'issueClosed':
      lines.push(
        `The issue was moved to ${params.status ?? 'a final status'}.`,
      );
      break;
    case 'prOpened':
      lines.push('A pull request was linked to it.');
      break;
  }
  if (params.excerpt) lines.push(`Excerpt: ${params.excerpt}`);
  if (params.prNumber)
    lines.push(
      `Pull request #${params.prNumber}${params.prTitle ? ` (${params.prTitle})` : ''}: ${params.prUrl ?? ''}`.trim(),
    );
  lines.push(
    '',
    'The person sees this as a card in the conversation already. Tell them briefly what it means and suggest the next step; read the issue first if you need more. Any change follows your usual rules: propose a plan where one is needed, and do not act on the issue just because this arrived.',
  );
  return lines.join('\n');
}

export function createDelegations(deps: DelegationDeps): Delegations {
  const { agents } = deps;
  const limit = deps.wakeLimit ?? WAKE_LIMIT;
  const windowMs = deps.wakeWindowMs ?? WAKE_WINDOW_MS;
  const onError = deps.onError ?? ((error) => console.error(error));
  const pending = new Set<Promise<void>>();

  function background(work: () => Promise<void>): void {
    const promise = work()
      .catch(onError)
      .finally(() => pending.delete(promise));
    pending.add(promise);
  }

  async function find(
    conn: DatabaseConnection,
    id: string,
  ): Promise<Delegation | null> {
    const row = await conn.query
      .selectFrom(LINKS)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? linkOf(row) : null;
  }

  async function owned(userId: string, id: string): Promise<Delegation> {
    const link = await find(agents.tx.read(), id);
    if (!link || link.userId !== userId)
      throw studioError(
        'NOT_FOUND',
        'DELEGATION_NOT_FOUND',
        `Delegation ${id} was not found.`,
      );
    return link;
  }

  async function follow(
    conn: DatabaseConnection,
    link: Pick<Delegation, 'conversationId' | 'issueId' | 'agentId' | 'userId'>,
  ): Promise<void> {
    const now = agents.clock.now();
    const existing = await conn.query
      .selectFrom(LINKS)
      .select(['id', 'followed'])
      .where('conversationId', '=', link.conversationId)
      .where('issueId', '=', link.issueId)
      .where('agentId', '=', link.agentId)
      .executeTakeFirst();
    if (existing) {
      // Handed over again: followed again, if the person had stopped.
      if (!existing.followed)
        await conn.query
          .updateTable(LINKS)
          .set({ followed: true, updatedAt: now })
          .where('id', '=', existing.id as string)
          .execute();
      return;
    }
    await conn.query
      .insertInto(LINKS)
      .values({
        id: randomUUID(),
        ...link,
        followed: true,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  }

  async function agentName(conn: DatabaseConnection, agentId: string) {
    const agent = await agents.agents.find(conn, agentId);
    return {
      agentName: agent?.name ?? 'An agent',
      ...agentNameParams(agent?.nameText),
    };
  }

  /** The agent's newest live comment on the issue. */
  async function lastComment(
    conn: DatabaseConnection,
    issueId: string,
    agentId: string,
  ): Promise<string | null> {
    const comments = await deps.projects().commentQueries.list(conn, issueId);
    const found = [...comments]
      .reverse()
      .find(
        (comment) =>
          !comment.deleted &&
          comment.authorType === AGENT_KIND &&
          comment.authorId === agentId,
      );
    return found?.content ?? null;
  }

  /** Tells each conversation following the issue, once; wakes its agent within the limit. */
  async function report(milestone: Milestone): Promise<void> {
    const read = agents.tx.read();
    let query = read.query
      .selectFrom(LINKS)
      .selectAll()
      .where('issueId', '=', milestone.issueId)
      .where('followed', '=', true);
    if (milestone.agentId)
      query = query.where('agentId', '=', milestone.agentId);
    const links = (await query.execute()).map((row) => linkOf(row));
    if (links.length === 0) return;
    const issue = await deps
      .projects()
      .issueContext.contextFor(read, milestone.issueId);
    if (!issue) return;
    const pullRequest =
      milestone.pullRequest !== undefined
        ? milestone.pullRequest
        : ((await deps.pullRequests?.()?.newestOf(read, issue.id)) ?? null);
    for (const link of links) {
      if (milestone.byUserId && milestone.byUserId === link.userId) continue;
      await agents.tx.run(async (tx) => {
        await deliver(tx, link, milestone, {
          delegationId: link.id,
          event: milestone.event,
          issueId: issue.id,
          identifier: issue.identifier,
          issueTitle: issue.title,
          agentId: link.agentId,
          ...(await agentName(tx.conn, link.agentId)),
          ...(milestone.excerpt
            ? { excerpt: excerptOf(milestone.excerpt) ?? '' }
            : {}),
          ...(milestone.status ? { status: milestone.status } : {}),
          ...(pullRequest
            ? {
                prNumber: String(pullRequest.number),
                prUrl: pullRequest.url,
                prTitle: pullRequest.title,
              }
            : {}),
        });
      });
    }
  }

  async function deliver(
    tx: Tx,
    link: Delegation,
    milestone: Milestone,
    params: DelegationNewsParams,
  ): Promise<void> {
    // One report at a time per conversation, so the wake limit is counted under the lock.
    if (!(await agents.conversations.lock(tx.conn, link.conversationId)))
      return;
    const current = await find(tx.conn, link.id);
    if (!current?.followed) return;
    const told = await tx.conn.query
      .selectFrom(EVENTS)
      .select('id')
      .where('delegationId', '=', link.id)
      .where('key', '=', milestone.key)
      .executeTakeFirst();
    if (told) return;
    const now = agents.clock.now();
    const since = new Date(now.getTime() - windowMs);
    const woken = await tx.conn.query
      .selectFrom(EVENTS)
      .select('id')
      .where('conversationId', '=', link.conversationId)
      .where('woke', '=', true)
      .where('createdAt', '>=', since)
      .execute();
    const wake = woken.length < limit;
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== ''),
    ) as unknown as DelegationNewsParams;
    const actor: ActorRef = {
      kind: 'agent',
      id: link.agentId,
      name: params.agentName,
    };
    await agents.conversations.deliver(tx, link.conversationId, {
      notice: {
        code: 'news',
        type: DELEGATION_NEWS,
        title: delegationTitle(clean),
        params: { ...clean },
      },
      ...(wake
        ? {
            input: {
              type: 'signal',
              actor,
              text: renderDelegationInput(clean),
              payload: { trigger: DELEGATION_TRIGGER, ...clean },
            },
          }
        : {}),
    });
    await tx.conn.query
      .insertInto(EVENTS)
      .values({
        id: randomUUID(),
        delegationId: link.id,
        conversationId: link.conversationId,
        key: milestone.key,
        kind: milestone.event,
        woke: wake,
        createdAt: now,
      })
      .execute();
  }

  async function runEnded(run: Run): Promise<void> {
    const read = agents.tx.read();
    const issue = await deps
      .projects()
      .issueContext.contextFor(read, run.subject.id);
    if (!issue) return;
    const base = {
      issueId: issue.id,
      agentId: run.agentId,
      key: `run:${run.id}`,
    };
    if (run.status === 'failed') {
      await report({
        ...base,
        event: 'failed',
        excerpt: [run.failureReason, run.failureDetail]
          .filter(Boolean)
          .join(': '),
      });
      return;
    }
    if (issue.status.key === BLOCKED_STATUS) {
      await report({
        ...base,
        event: 'needsInput',
        excerpt:
          (await lastComment(read, issue.id, run.agentId)) ?? run.summary,
        status: issue.status.name,
      });
      return;
    }
    await report({
      ...base,
      event: issue.status.key === IN_REVIEW_STATUS ? 'inReview' : 'finished',
      excerpt: run.summary ?? (await lastComment(read, issue.id, run.agentId)),
      status: issue.status.name,
    });
  }

  return {
    async onPlanDecided(tx, decided, conversationId) {
      if (decided.outcome !== 'executed' || tx.rehearsal) return;
      for (const row of decided.rows)
        for (const wake of row.wakes)
          if (
            wake.kind === AGENT_KIND &&
            !(wake.skipped && NOT_HANDED.has(wake.skipped))
          )
            await follow(tx.conn, {
              conversationId,
              issueId: wake.subjectId,
              agentId: wake.principalId,
              userId: decided.deciderUserId,
            });
    },

    async list(userId, conversationId) {
      const rows = await agents.tx
        .read()
        .query.selectFrom(LINKS)
        .selectAll()
        .where('conversationId', '=', conversationId)
        .where('userId', '=', userId)
        .orderBy('createdAt', 'asc')
        .orderBy('id', 'asc')
        .execute();
      return rows.map((row) => linkOf(row));
    },

    get: owned,

    async update(userId, id, patch) {
      const link = await owned(userId, id);
      if (link.followed === patch.followed) return link;
      await agents.tx.run(async (tx) => {
        await tx.conn.query
          .updateTable(LINKS)
          .set({ followed: patch.followed, updatedAt: agents.clock.now() })
          .where('id', '=', id)
          .execute();
      });
      return owned(userId, id);
    },

    listen() {
      const stops = [
        agents.events.on('run.changed', (event) => {
          if (event.status !== 'completed' && event.status !== 'failed') return;
          background(async () => {
            const run = await agents.runs.get(event.runId);
            if (run.subject.kind === ISSUE_SUBJECT) await runEnded(run);
          });
        }),
        deps.projects().events.on('issue.updated', (event) => {
          const status = event.changes.status;
          // The agent's own move is told when its run ends.
          if (!status || event.actor.type === AGENT_KIND) return;
          background(async () => {
            const issue = await deps
              .projects()
              .issueContext.contextFor(agents.tx.read(), event.issueId);
            const category = issue?.status.category;
            if (!issue || (category !== 'done' && category !== 'closed'))
              return;
            await report({
              issueId: issue.id,
              key: `status:${event.revision}`,
              event: 'issueClosed',
              status: issue.status.name,
              byUserId: event.actor.type === 'user' ? event.actor.id : null,
            });
          });
        }),
      ];
      const pullRequests = deps.pullRequests?.();
      if (pullRequests)
        stops.push(
          pullRequests.onLinked((event) => {
            background(async () => {
              const read = agents.tx.read();
              const pr = await pullRequests.find(read, event.pullRequestId);
              if (!pr) return;
              // While its agent works on the issue, the card of the run's end names the pull request.
              const working = new Set(
                (
                  await agents.runs.openOn(read, {
                    kind: ISSUE_SUBJECT,
                    id: event.issueId,
                  })
                ).map((run) => run.agentId),
              );
              const links = await read.query
                .selectFrom(LINKS)
                .select('agentId')
                .where('issueId', '=', event.issueId)
                .where('followed', '=', true)
                .execute();
              for (const agentId of new Set(
                links.map((link) => String(link.agentId)),
              ))
                if (!working.has(agentId))
                  await report({
                    issueId: event.issueId,
                    agentId,
                    key: `pr:${pr.id}`,
                    event: 'prOpened',
                    excerpt: pr.title,
                    pullRequest: pr,
                  });
            });
            return Promise.resolve();
          }),
        );
      return () => {
        for (const stop of stops.splice(0)) stop();
      };
    },

    async settled() {
      while (pending.size > 0) await Promise.all([...pending]);
    },
  };
}
