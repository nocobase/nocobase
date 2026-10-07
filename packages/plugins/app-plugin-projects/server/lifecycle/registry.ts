/**
 * The rules a definition may name, registered by the application. A definition stays plain data: it names a rule and
 * gives its settings, and the registry holds the code.
 *
 * - State rules guard entering or leaving a state and act once a record entered it.
 * - "Who may" rules decide, from the record, whether an actor may take a transition.
 * - Approvers turn a name (`owner`) into the people who may approve a move of this record.
 *
 * `Subject` is the record being moved and `Context` whatever the application passes through `move` (its transaction,
 * for example), so rules read and write where the move does.
 */
import type { LifecycleMachine } from './machine.js';
import type { LifecycleIssue } from './validate.js';

/** Who moves a record: an actor type the definition names on its transitions, and who exactly when known. */
export interface LifecycleActor {
  readonly type: string;
  readonly id: string | null;
}

export type RuleConfig = Readonly<Record<string, unknown>>;

export interface RuleContext<Subject, Context> {
  readonly subject: Subject;
  readonly from: string;
  readonly to: string;
  readonly actor: LifecycleActor;
  readonly machine: LifecycleMachine;
  readonly context: Context;
  /** The event the move answers, for a move along an event transition. */
  readonly event?: string;
}

/** Why a guard refused a move; `code` reaches the caller as it is. */
export interface GuardFailure {
  readonly code: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

/** What an entry action did; `undefined` counts as applied. `details` travel to the report as they are. */
export type EntryOutcome =
  | {
      readonly status: 'applied';
      readonly details?: Readonly<Record<string, unknown>>;
    }
  | {
      readonly status: 'skipped';
      readonly reason: string;
      readonly details?: Readonly<Record<string, unknown>>;
    };

export interface StateRule<Subject, Context> {
  /** Problems with the settings, at paths relative to them (`items[0].key`). */
  validate?(config: RuleConfig): readonly LifecycleIssue[];
  /** Checked before a record enters a state carrying the rule. */
  canEnter?(
    ctx: RuleContext<Subject, Context>,
    config: RuleConfig,
  ): Promise<GuardFailure | null>;
  /** Checked before a record leaves a state carrying the rule. */
  canLeave?(
    ctx: RuleContext<Subject, Context>,
    config: RuleConfig,
  ): Promise<GuardFailure | null>;
  /** Run after the record entered the state; a failure never undoes the move. */
  entered?(
    ctx: RuleContext<Subject, Context>,
    config: RuleConfig,
  ): Promise<EntryOutcome | undefined>;
}

export interface WhoRule<Subject, Context> {
  validate?(config: RuleConfig): readonly LifecycleIssue[];
  allows(
    ctx: RuleContext<Subject, Context>,
    config: RuleConfig,
  ): Promise<boolean>;
}

export interface ApproverResolver<Subject, Context> {
  /** The ids of the people who may approve; none means nobody has to. */
  resolve(ctx: RuleContext<Subject, Context>): Promise<readonly string[]>;
}

export interface LifecycleRegistry<Subject, Context> {
  /** Each registers one name, once; they return the registry so registrations chain. */
  stateRule(
    type: string,
    rule: StateRule<Subject, Context>,
  ): LifecycleRegistry<Subject, Context>;
  whoRule(
    type: string,
    rule: WhoRule<Subject, Context>,
  ): LifecycleRegistry<Subject, Context>;
  approver(
    name: string,
    resolver: ApproverResolver<Subject, Context>,
  ): LifecycleRegistry<Subject, Context>;
  findStateRule(type: string): StateRule<Subject, Context> | undefined;
  findWhoRule(type: string): WhoRule<Subject, Context> | undefined;
  findApprover(name: string): ApproverResolver<Subject, Context> | undefined;
}

export function createLifecycleRegistry<Subject, Context>(): LifecycleRegistry<
  Subject,
  Context
> {
  const states = new Map<string, StateRule<Subject, Context>>();
  const who = new Map<string, WhoRule<Subject, Context>>();
  const approvers = new Map<string, ApproverResolver<Subject, Context>>();

  function add<T>(map: Map<string, T>, kind: string, name: string, value: T) {
    if (map.has(name))
      throw new Error(`The ${kind} ${name} is registered already.`);
    map.set(name, value);
  }

  const registry: LifecycleRegistry<Subject, Context> = {
    stateRule(type, rule) {
      add(states, 'state rule', type, rule);
      return registry;
    },
    whoRule(type, rule) {
      add(who, 'who rule', type, rule);
      return registry;
    },
    approver(name, resolver) {
      add(approvers, 'approver', name, resolver);
      return registry;
    },
    findStateRule: (type) => states.get(type),
    findWhoRule: (type) => who.get(type),
    findApprover: (name) => approvers.get(name),
  };
  return registry;
}
