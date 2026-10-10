/**
 * Who work on an issue comes from, and who answers for it. Every wake of an agent on an issue names both to the agents
 * plugin (`runs.enqueue`): the issue's owner as the responsible, and the source of the chain of work as the person who
 * asked. Work whose source is not the owner is not queued: it becomes a run request the owner confirms or rejects
 * (`run-requests.ts`), so nobody's change runs an agent as somebody else, on their runners.
 *
 * The source of a change is:
 *
 * - the person who made it, also when their conversation's agent made it for them (`via: 'agent'`);
 * - for a change a run made (its actor's `trace.runId`, which a run's requests carry: `run-principal.ts`), the source
 *   of that run's chain: who confirmed the run, else who asked for it. A chain the owner started or confirmed goes on
 *   as theirs; one somebody else started asks the owner again;
 * - for the system's own changes (a sweeper, a merged pull request), and for an agent acting outside a run, the owner.
 *
 * The projects plugin hands work handlers and status rules the original actor of the change (`actor` on the owner,
 * release and sub-issue callbacks, `sourceActor` on a status rule), so a status rule, a finished sub-issue or a
 * released dependency is attributed to whoever caused it rather than to the owner.
 */
import type { ActorRef } from '@nocobase/agent-protocol';
import type { Actor } from '@nocobase/app-plugin-projects/server/tokens';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import type { DatabaseConnection } from '@nocobase/db';

import { findIssue } from '../previews/sources.js';
import { AGENT_KIND } from './tx.js';

export interface WorkSource {
  /** The person the chain of work started with, who must be able to wake the agent. */
  readonly userId: string;
  /** The run whose action caused the work, when a run caused it. */
  readonly causedByRunId?: string;
  /** Who the agent is told acted. */
  readonly ref: ActorRef;
}

/** The system's own change, attributed to the issue's owner. */
export const SYSTEM_REF: ActorRef = {
  kind: 'system',
  id: 'system',
  name: 'Studio',
};

type Row = Record<string, unknown>;

const text = (value: unknown): string | null =>
  typeof value === 'string' && value ? value : null;

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
 * The source of the chain of work run `runId` belongs to: who confirmed it, else who asked for it, else who it acts
 * as (the agents plugin's own rule, `causedByRunId`); null when there is no such run. Read on the change's
 * connection, inside its transaction.
 */
export async function chainSourceOf(
  conn: DatabaseConnection,
  runId: string,
): Promise<string | null> {
  const row = await conn.query
    .selectFrom('agRuns')
    .select(['actorUserId', 'requestedByUserId', 'confirmedByUserId'])
    .where('id', '=', runId)
    .executeTakeFirst<Row>();
  if (!row) return null;
  return (
    text(row.confirmedByUserId) ??
    text(row.requestedByUserId) ??
    text(row.actorUserId)
  );
}

/** The source of a change `actor` made to `issue` (`undefined`: the system's). */
export async function workSourceOf(
  conn: DatabaseConnection,
  actor: Actor | undefined,
  issue: Pick<Issue, 'ownerUserId'>,
): Promise<WorkSource> {
  if (actor?.type === 'user' && actor.id)
    return {
      userId: actor.id,
      ref: { kind: 'user', id: actor.id, name: await userName(conn, actor.id) },
    };
  const runId = actor?.trace?.runId;
  const ref: ActorRef =
    actor?.type === AGENT_KIND && actor.id
      ? { kind: 'agent', id: actor.id, name: 'Agent' }
      : SYSTEM_REF;
  if (runId) {
    const source = await chainSourceOf(conn, runId);
    if (source) return { userId: source, causedByRunId: runId, ref };
  }
  return { userId: issue.ownerUserId, ref };
}

/** The person `userId` as the source of a change. */
export async function personSource(
  conn: DatabaseConnection,
  userId: string,
): Promise<WorkSource> {
  return {
    userId,
    ref: { kind: 'user', id: userId, name: await userName(conn, userId) },
  };
}

/** Who answers for an issue now: its owner; null for a deleted or missing one. */
export async function issueResponsible(
  conn: DatabaseConnection,
  issueId: string,
): Promise<string | null> {
  const issue = await findIssue(conn, issueId);
  if (!issue || issue.deleted) return null;
  return issue.ownerUserId;
}
