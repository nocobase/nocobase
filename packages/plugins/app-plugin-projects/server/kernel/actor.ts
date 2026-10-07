/**
 * Who performs an operation: a principal of some kind (`kernel/kinds.ts`): a signed-in user, the system itself (a
 * sweeper, a rule), or a kind another plugin registered. What a user may do is a separate question, answered by
 * `access/viewer.ts`.
 */
import { SYSTEM_KIND } from '../../shared/kinds.js';

/** A kind's key (`shared/kinds.ts`). */
export type ActorType = string;

/**
 * How a user reached the API when it was not the browser by hand: `cli` for the CLI's user mode, `api_key` for any
 * other API-key client, `agent` when an agent acted for the person (a conversation's direct write) or proposed the plan
 * they executed (`trace`). Recorded for traceability and shown on the timeline; never used to decide permissions.
 */
export type ActorVia = 'cli' | 'api_key' | 'agent';

/**
 * What a change made through an agent or a plan records beside the person (`ActivityVia` in `shared/plans.ts`). The
 * ids are opaque to this plugin: it only looks the agent's display name up through the kinds registry (kind `agent`).
 * A plan nobody's agent proposed carries only `planId`.
 */
export interface ActorTrace {
  readonly agentId?: string;
  readonly runId?: string;
  readonly conversationId?: string;
  readonly planId?: string;
}

export interface Actor {
  readonly type: ActorType;
  readonly id: string | null;
  readonly via?: ActorVia;
  /** With `via: 'agent'`, or for a plan: see `ActorTrace`. */
  readonly trace?: ActorTrace;
}

export const SYSTEM_ACTOR: Actor = { type: SYSTEM_KIND, id: null };
