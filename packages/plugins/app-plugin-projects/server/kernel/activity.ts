/**
 * The activity log: one row per change to an issue, written in the caller's transaction so the activity exists
 * exactly when the change does. The issue timeline reads it.
 *
 * How the person acted, when not by hand in the browser, is kept in the details as `via` (`cli`, `api_key`, `agent`) and
 * `trace` (`ActorTrace`: the agent, its run and conversation, the plan); the timeline reads them as `Activity.via`.
 *
 * Thin stand-in: NocoBase has no activity stream of its own yet. The action names and their details are the contract
 * the timeline reads, and stay when the store is replaced.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { ActivityVia } from '../../shared/plans.js';
import type { Actor, ActorTrace } from './actor.js';
import type { IdSource } from './ids.js';

export const ACTIVITIES = 'pmActivities';

export interface ActivityInput {
  readonly issueId: string;
  readonly actor: Actor;
  readonly action: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface ActivityRecorder {
  record(conn: DatabaseConnection, input: ActivityInput): Promise<void>;
}

export function createActivityRecorder(ids: IdSource): ActivityRecorder {
  return {
    async record(conn, { issueId, actor, action, details }) {
      const trace = {
        ...(actor.via === undefined ? {} : { via: actor.via }),
        ...(actor.trace ? { trace: actor.trace } : {}),
      };
      await conn.repository(ACTIVITIES).createOne({
        values: {
          id: ids.next(),
          issueId,
          actorType: actor.type,
          actorId: actor.id,
          action,
          details: { ...details, ...trace },
          createdAt: new Date(),
        },
      });
    },
  };
}

export interface ActivityRecord {
  readonly id: string;
  readonly issueId: string;
  readonly actorType: Actor['type'];
  readonly actorId: string | null;
  readonly action: string;
  readonly details: Readonly<Record<string, unknown>> | null;
  readonly createdAt: string;
}

/**
 * A page of an issue's activities, newest first, continuing strictly after `cursor` (the `createdAt` and `id` of the
 * last row of the previous page). Asks for one row more than `limit` to tell whether another page follows.
 */
export async function readActivities(
  conn: DatabaseConnection,
  issueId: string,
  limit: number,
  cursor?: Pick<ActivityRecord, 'createdAt' | 'id'>,
): Promise<ActivityRecord[]> {
  return conn.repository<ActivityRecord>(ACTIVITIES).findMany({
    filter: { issueId },
    ...(cursor ? { cursor } : {}),
    sort: (sort) => [sort.field('createdAt').desc(), sort.field('id').desc()],
    limit: limit + 1,
  });
}

/** The kind whose principals act for people through `via: 'agent'` (`ActorTrace.agentId`). */
export const AGENT_VIA_KIND = 'agent';

/**
 * Splits an activity's stored details into what the change was (`details`) and how the person made it (`via`), naming
 * the agent with `agentName`.
 */
export function splitVia(
  stored: Readonly<Record<string, unknown>> | null,
  agentName: (agentId: string) => string | null,
): {
  readonly details: Readonly<Record<string, unknown>>;
  readonly via: ActivityVia | null;
} {
  const { via, trace, ...details } = stored ?? {};
  const t = (trace && typeof trace === 'object' ? trace : {}) as ActorTrace;
  const ids = {
    ...(t.runId ? { runId: t.runId } : {}),
    ...(t.conversationId ? { conversationId: t.conversationId } : {}),
    ...(t.planId ? { planId: t.planId } : {}),
  };
  if (via === 'agent' && t.agentId)
    return {
      details,
      via: {
        type: 'agent',
        agentId: t.agentId,
        agentName: agentName(t.agentId),
        ...ids,
      },
    };
  if (t.planId) return { details, via: { type: 'plan', ...ids } };
  if (via === 'cli' || via === 'api_key')
    return { details, via: { type: via } };
  return { details, via: null };
}

/** The agents named in activities' traces, for one name lookup. */
export function tracedAgents(
  rows: readonly Pick<ActivityRecord, 'details'>[],
): { readonly type: string; readonly id: string }[] {
  return rows.flatMap((row) => {
    const trace = row.details?.trace as ActorTrace | undefined;
    return trace?.agentId ? [{ type: AGENT_VIA_KIND, id: trace.agentId }] : [];
  });
}
