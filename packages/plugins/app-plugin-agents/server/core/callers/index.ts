/**
 * Who calls the application's API from outside its pages — a person on the CLI (a session or an API key) or an
 * agent's run (its run token) — and the business actions each holds now. The application that assembles the plugin
 * sets the gate (`CallerGate.set`); the command manifest offers a caller only the commands whose action it holds, and
 * the application bounds a run's requests by the same answer.
 *
 * A run holds the actions of the person who woke the agent that the agent is configured with; a person holds their
 * own, kept to the scope of the API key they call with. Without a gate, a caller holds only the plugin's own
 * universal actions: `AGENTS_VIEW_ACTION`, and `RUN_SELF_ACTION` for a run.
 *
 * A consultation's run (`Run.parentRunId`, an agent another one asked a question) only reads: of what its gate allows,
 * it keeps the reading actions (`isReadingAction`) and those the gate marks as safe for it (`ActionGate.consultable`,
 * such as proposing a plan the person confirms).
 */
import type { KeyScope } from '@nocobase/authorization/core';

import type { Agent } from '../../../shared/agents.js';
import type { RunTokenIdentity } from '../runs/index.js';

export type CallerKind = 'run' | 'user';

/** Held by every run: the routes about the run itself (`run self`, `run context`, naming its conversation). */
export const RUN_SELF_ACTION = 'agents.runs/self';

/** Held by every caller: seeing which agents one may give work to (`agent list`). */
export const AGENTS_VIEW_ACTION = 'agents.agents/view';

/** Who calls. */
export interface CallerIdentity {
  readonly kind: CallerKind;
  /** The person whose permissions bound the caller: the caller, or for a run the person who woke the agent. */
  readonly userId: string;
  readonly displayName: string;
  /** For a run. */
  readonly run?: RunTokenIdentity;
  readonly agent?: Agent;
  /**
   * The scope of the API key a person called with, when it has one (or the key is a service account's). The gate
   * must narrow what it allows by it; a run never carries one.
   */
  readonly keyScope?: KeyScope;
}

export interface ActionGate {
  /** The business actions `identity` may perform now. */
  allowed(identity: CallerIdentity): Promise<ReadonlySet<string>>;
  /**
   * Whether a consultation's run, which only reads, keeps an action that is not a reading one (`isReadingAction`):
   * proposing something the person confirms, say. None when absent.
   */
  consultable?(action: string): boolean;
}

/** Whether an action only reads: its verb is `view`, `read` or `read-…` (`pm.issues/view`, `rel.apps/read-logs`). */
export function isReadingAction(action: string): boolean {
  const verb = action.slice(action.lastIndexOf('/') + 1);
  return verb === 'view' || verb === 'read' || verb.startsWith('read-');
}

/** Whether the caller is a consultation's run, which only reads. */
export function isConsultation(identity: CallerIdentity): boolean {
  return identity.kind === 'run' && Boolean(identity.run?.run.parentRunId);
}

export interface CallerGate {
  /** Sets who may do what; returns what removes it. */
  set(gate: ActionGate): () => void;
  /** The business actions `identity` holds now: the gate's, and the plugin's universal ones. */
  allowed(identity: CallerIdentity): Promise<ReadonlySet<string>>;
  /**
   * What `identity` could do were it not a consultation kept to reading: the reach of a plan a consulted agent proposes,
   * which the person confirms. The same as `allowed` for every other caller.
   */
  reach(identity: CallerIdentity): Promise<ReadonlySet<string>>;
}

export function createCallerGate(): CallerGate {
  let current: ActionGate | undefined;
  const universal = (identity: CallerIdentity, held: Set<string>) => {
    held.add(AGENTS_VIEW_ACTION);
    if (identity.kind === 'run') held.add(RUN_SELF_ACTION);
    return held;
  };
  return {
    set(gate) {
      current = gate;
      return () => {
        if (current === gate) current = undefined;
      };
    },
    async allowed(identity) {
      const gate = current;
      let held = new Set(gate ? await gate.allowed(identity) : []);
      if (isConsultation(identity))
        held = new Set(
          [...held].filter(
            (action) =>
              isReadingAction(action) || gate?.consultable?.(action) === true,
          ),
        );
      return universal(identity, held);
    },
    async reach(identity) {
      return universal(
        identity,
        new Set(current ? await current.allowed(identity) : []),
      );
    },
  };
}
