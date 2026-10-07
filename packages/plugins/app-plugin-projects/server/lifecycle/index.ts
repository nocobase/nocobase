/**
 * A record lifecycle: a state machine whose definition is data and whose state lives in the record. Self-contained on
 * purpose (nothing from this plugin's domains), so it can move into a platform package once another plugin needs it.
 */
export {
  ANY_STATE,
  DEFAULT_LIMITS,
  STATE_KEY_PATTERN,
  type LifecycleApproval,
  type LifecycleDefinition,
  type LifecycleLimits,
  type LifecycleRuleRef,
  type LifecycleSchema,
  type LifecycleState,
  type LifecycleTransition,
} from './definition.js';
export { compile, type LifecycleMachine } from './machine.js';
export {
  canMove,
  fire,
  LifecycleError,
  move,
  type ApprovalNote,
  type EntryReport,
  type LifecycleErrorCode,
  type MoveRequest,
  type MoveResult,
  UNAVAILABLE_RULE,
} from './move.js';
export {
  createLifecycleRegistry,
  type ApproverResolver,
  type EntryOutcome,
  type GuardFailure,
  type LifecycleActor,
  type LifecycleRegistry,
  type RuleConfig,
  type RuleContext,
  type StateRule,
  type WhoRule,
} from './registry.js';
export {
  validateDefinition,
  type LifecycleIssue,
  type LifecycleRule,
  type ValidateOptions,
  type ValidationResult,
} from './validate.js';
