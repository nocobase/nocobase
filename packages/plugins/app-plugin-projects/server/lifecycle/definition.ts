/**
 * A lifecycle definition: the states a record can be in and who may move it from one to another. It is plain JSON, so
 * it can be stored, compared and edited; `compile` turns it into a machine the application asks, and `move` is the one
 * way a record changes state.
 *
 * The vocabulary follows statecharts (states, transitions, guards, entry actions), but a record's state lives in its
 * own row and every check is asynchronous, so nothing here keeps a running instance in memory.
 */

/** A rule the application registered (`registry.ts`), by name, with its settings. */
export interface LifecycleRuleRef {
  readonly type: string;
  readonly config?: Readonly<Record<string, unknown>>;
}

export interface LifecycleState {
  /** Stable, `^[a-z][a-z0-9_]{1,31}$`; records store it. */
  readonly key: string;
  readonly name: string;
  /** What the application reads to reason about a state (for example "is it finished"), never the key. */
  readonly category: string;
  readonly color?: string;
  /** Provided by the application and not removable; its key and category are fixed. */
  readonly builtIn?: boolean;
  /**
   * State rules: each may guard entering or leaving the state and act once a record entered it (a checklist does all
   * three). Run in this order.
   */
  readonly rules?: readonly LifecycleRuleRef[];
}

/** `*` stands for any state. */
export const ANY_STATE = '*';

export interface LifecycleTransition {
  readonly from: string;
  readonly to: string;
  /** Who may take it: the keys of the actors the schema allows. */
  readonly actors: readonly string[];
  /** A registered "who may" rule over the record, on top of `actors`: the issue's owner only, for example. */
  readonly who?: LifecycleRuleRef;
  /** The move waits until one of the people these registered approver names resolve to approves it. */
  readonly approval?: LifecycleApproval;
  /**
   * An event transition: taken only when the application moves the record with this event (`MoveRequest.event`),
   * never by an ordinary move. Its ends are concrete states, and it has no "who may" rule and no approval.
   */
  readonly on?: string;
}

export interface LifecycleApproval {
  readonly approvers: readonly string[];
}

export interface LifecycleDefinition {
  readonly states: readonly LifecycleState[];
  readonly transitions: readonly LifecycleTransition[];
}

/** What a definition may contain: the application's categories, actors and colours, and size limits. */
export interface LifecycleSchema {
  readonly categories: readonly string[];
  readonly actors: readonly string[];
  /** When given, every state names one of these. */
  readonly colors?: readonly string[];
  /** The events a transition may name on `on`; without them a definition has no event transitions. */
  readonly events?: readonly string[];
  readonly limits?: Partial<LifecycleLimits>;
}

export interface LifecycleLimits {
  readonly states: number;
  readonly transitions: number;
  readonly nameLength: number;
  readonly rulesPerState: number;
}

export const DEFAULT_LIMITS: LifecycleLimits = {
  states: 40,
  transitions: 400,
  nameLength: 64,
  rulesPerState: 10,
};

export const STATE_KEY_PATTERN: RegExp = /^[a-z][a-z0-9_]{1,31}$/u;
