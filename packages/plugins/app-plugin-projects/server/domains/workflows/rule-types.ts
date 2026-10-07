/**
 * Status rule types: the ones other plugins contribute (`projectsStatusRulesToken`) and this plugin's own
 * (`built-in-rule-types.ts`), which follow the same contract and are put in front of the contributed ones
 * (`withBuiltInTypes`). A type names itself, checks its settings, says what it does in a sentence, and
 * acts once an issue entered a status carrying it, inside the transaction of the move: what it cannot do there is a
 * skip, not a refusal.
 *
 * A type may also hold an entry condition (`canEnter`): asked inside the move's transaction before the issue enters a
 * status carrying the rule, it lets the move through (null) or refuses it with 400 (`FAILED_PRECONDITION`) and its own code. Every move asks
 * it, whoever moves: a person, an agent, a plan's row, an approved request when it is applied, and the system moving
 * an issue on a workflow event (`StatusRuleCheck.event` says which). A refusal of an event move does not fail the
 * event: the issue stays, `auto_move_skipped` records the code, and the firer hears it as `refused`. A condition that
 * should let the system through says so itself (`actor.type === 'system'`). Nothing is asked when the rule's plugin is
 * gone. A type may likewise hold an exit condition (`canLeave`), asked before an issue leaves a status carrying the
 * rule (the checklist waits for its required items this way).
 *
 * - A type is looked up on each use, so a plugin may add it after this plugin's services are created.
 * - A definition may keep a rule whose type is gone (its plugin was removed): saving leaves it as it was, entering the
 *   status skips it (`unavailable`), and the editor shows it as unavailable.
 * - Each outcome is recorded on the issue (`stage_action_applied`, `stage_action_skipped` with `reason`, or
 *   `stage_action_failed` when it throws); what the issue's owner should hear about is the type's to tell, through
 *   the notice rules (`projectsNoticeRulesToken`).
 */
import type { Executor, Issue } from '../../../shared/issues.js';
import type { StatusCategory } from '../../../shared/issues.js';
import {
  STATUS_RULE_TYPES,
  STATUS_RULE_TYPE_PATTERN,
  type WorkflowValidationIssue,
} from '../../../shared/workflows.js';
import type { Actor } from '../../kernel/actor.js';
import type { Tx } from '../../kernel/tx.js';
import type { RuleConfig } from '../../lifecycle/index.js';

/** The status an issue entered, as a rule sees it. */
export interface EnteredStatus {
  readonly key: string;
  /** As the workflow names it. */
  readonly name: string;
  readonly category: StatusCategory;
}

/** What a rule gets when an issue entered its status. */
export interface StatusRuleEntry {
  /** The move's transaction: what the rule writes commits with the move. Its events are kept only when it succeeds. */
  readonly tx: Tx;
  /** The issue as it is now, in the status it entered. */
  readonly issue: Issue;
  /** The status it came from. */
  readonly from: string;
  readonly status: EnteredStatus;
  /** Who moved it: a person, the system, or a principal of another kind. */
  readonly actor: Actor;
  /**
   * Makes `executor` the issue's executor, recorded as `executor_changed` with `trigger: 'stageEntered'`; the change
   * reaches the executor's kind like any other once the move is announced. Returns the issue as it is then.
   */
  setExecutor(executor: Executor): Promise<Issue>;
}

/** What an entry or exit condition is asked, before the issue moves. */
export interface StatusRuleCheck {
  /** The move's transaction; read only. */
  readonly tx: Tx;
  /** The issue as it is before the move. */
  readonly issue: Issue;
  /** The status it would leave: the one carrying the rule, for an exit condition. */
  readonly from: string;
  /** The status it would enter. */
  readonly status: EnteredStatus;
  /** Who moves it: a person, the system, or a principal of another kind. */
  readonly actor: Actor;
  /** The workflow event the move answers, or null for an ordinary move. */
  readonly event: string | null;
}

/**
 * Why an entry condition refuses a move: reaches the caller as 400 with `code` (upper snake case, prefixed by the
 * plugin so it cannot be mistaken for this plugin's own, such as `ACME_PR_NOT_MERGED`), the message, and `details`
 * plus `rule` (the type) in the error's details.
 */
export interface StatusRuleRefusal {
  readonly code: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

/** What a rule did; `undefined` counts as applied. `details` are recorded with it. */
export type StatusRuleOutcome =
  | undefined
  | {
      readonly status: 'applied';
      readonly details?: Readonly<Record<string, unknown>>;
    }
  | {
      readonly status: 'skipped';
      readonly reason: string;
      readonly details?: Readonly<Record<string, unknown>>;
    };

/** A rule in a sentence, for a workflow's change summary. */
export interface StatusRuleDescription {
  /** English, such as "Runs Reviewer with an instruction." */
  readonly summary: string;
  /** Entering the status wakes someone without anybody confirming it: a change summary points it out. */
  readonly attention?: boolean;
}

export interface StatusRuleType {
  /** `^[a-z][A-Za-z0-9]{1,63}$`; a contributed type cannot take a built-in type's key. */
  readonly type: string;
  /** The categories of status it may be put on; every category when left out. */
  readonly categories?: readonly StatusCategory[];
  /** Problems with its settings, at paths relative to them (`agentId`). */
  validate?(config: RuleConfig): readonly WorkflowValidationIssue[];
  describe?(config: RuleConfig): StatusRuleDescription;
  /** An entry condition: null lets the issue enter a status carrying the rule, a refusal stops the move (400). */
  canEnter?(
    check: StatusRuleCheck,
    config: RuleConfig,
  ): Promise<StatusRuleRefusal | null>;
  /** An exit condition: null lets the issue leave a status carrying the rule, a refusal stops the move (400). */
  canLeave?(
    check: StatusRuleCheck,
    config: RuleConfig,
  ): Promise<StatusRuleRefusal | null>;
  /**
   * Runs after an issue entered a status carrying the rule; a failure never undoes the move. Left out by a type that
   * is only a condition.
   */
  entered?(
    entry: StatusRuleEntry,
    config: RuleConfig,
  ): Promise<StatusRuleOutcome>;
}

export interface StatusRuleTypes {
  /** Adds a contributed type; returns what removes it. Throws when the key is taken (or built in) or malformed. */
  add(type: StatusRuleType): () => void;
  get(type: string): StatusRuleType | undefined;
  list(): readonly StatusRuleType[];
}

export function createStatusRuleTypes(): StatusRuleTypes {
  const types = new Map<string, StatusRuleType>();
  return {
    add(type) {
      if (!STATUS_RULE_TYPE_PATTERN.test(type.type))
        throw new TypeError(
          `Status rule type ${type.type} must match ${String(STATUS_RULE_TYPE_PATTERN)}.`,
        );
      if (
        (STATUS_RULE_TYPES as readonly string[]).includes(type.type) ||
        types.has(type.type)
      )
        throw new TypeError(
          `Status rule type ${type.type} is registered already.`,
        );
      types.set(type.type, type);
      return () => {
        if (types.get(type.type) === type) types.delete(type.type);
      };
    },
    get: (type) => types.get(type),
    list: () => [...types.values()],
  };
}

/**
 * `types` with this plugin's own types in front: what the workflows domain looks every rule up in. `add` goes to
 * `types`, so a plugin contributing through the view is the same as contributing through `types`.
 */
export function withBuiltInTypes(
  types: StatusRuleTypes,
  builtIn: readonly StatusRuleType[],
): StatusRuleTypes {
  const own = new Map(builtIn.map((type) => [type.type, type]));
  return {
    add: (type) => types.add(type),
    get: (type) => own.get(type) ?? types.get(type),
    list: () => [...own.values(), ...types.list()],
  };
}
