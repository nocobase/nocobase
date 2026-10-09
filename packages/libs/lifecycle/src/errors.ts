import type { JsonObject } from './types.js';

export type LifecycleErrorCode =
  | 'INVALID_DEFINITION'
  | 'UNKNOWN_LIFECYCLE'
  | 'UNKNOWN_TRANSITION'
  | 'RECORD_NOT_FOUND'
  | 'INVALID_STATE'
  | 'GUARD_REJECTED'
  | 'INVALID_INPUT'
  | 'INVALID_ROUTE'
  | 'INVALID_SET'
  | 'UNKNOWN_EFFECT'
  | 'CONFLICT'
  | 'REQUEST_REUSED'
  | 'NOT_MANUAL'
  | 'INVALID_REQUEST_ID'
  | 'RUN_SETTLED'
  | 'NO_CONTINUATION';

/**
 * What kind of refusal a blocker is: `permission` when this actor may not do
 * it, `precondition` when nobody may until the record or its surroundings
 * change, such as a task that cannot finish while a subtask is open.
 */
export type BlockerKind = 'permission' | 'precondition';

/**
 * Why a transition may not run for this actor now: the state it is in, or a
 * guard that said no. `code` is stable for a client to branch on; `message`
 * is what to show the person. A guard's blocker is a `permission` refusal
 * unless the guard said otherwise; a `state` blocker is a `precondition`.
 */
export interface Blocker {
  readonly source: 'state' | 'guard' | 'manual';
  readonly kind: BlockerKind;
  readonly code: string;
  readonly message: string;
}

/** One thing wrong with a transition's input; `field` names it when it is one field. */
export interface InputProblem {
  readonly field?: string;
  readonly message: string;
}

export interface LifecycleErrorDetails {
  readonly blockers?: readonly Blocker[];
  readonly problems?: readonly InputProblem[];
}

/**
 * Every refusal the lifecycle makes, with a stable code a route can map to an
 * HTTP status. A refused transition changes nothing. A guard refusal carries
 * its blockers and an input refusal its problems, so a page can say why.
 */
export class LifecycleError extends Error {
  public readonly code: LifecycleErrorCode;
  public readonly blockers: readonly Blocker[];
  public readonly problems: readonly InputProblem[];

  public constructor(
    code: LifecycleErrorCode,
    message: string,
    details: LifecycleErrorDetails = {},
  ) {
    super(message);
    this.name = 'LifecycleError';
    this.code = code;
    this.blockers = details.blockers ?? [];
    this.problems = details.problems ?? [];
  }
}

export interface EffectFailureOptions {
  /** Kept as they are and handed to the `onFailure` transition as `details`. */
  readonly details?: JsonObject;
  /**
   * Whether the attempt is worth another under the effect's retry policy.
   * Defaults to false: a failure that knows what happened is an answer, such
   * as a frozen payee account, and trying again changes nothing.
   */
  readonly retry?: boolean;
}

/**
 * What an effect throws when it knows why it failed, so the transition that
 * continues from the failure can branch on `code` rather than on the wording
 * of a message. `onFailure` receives `{ error: message, errorCode: code,
 * details }`; any other error reaches it as `{ error: message }`.
 *
 * ```ts
 * if (response.status === 'PAYEE_FROZEN')
 *   throw new EffectFailure('payeeFrozen', 'The payee account is frozen.', {
 *     details: { payeeId: record.payeeId },
 *   });
 * ```
 */
export class EffectFailure extends Error {
  public readonly code: string;
  public readonly details: JsonObject;
  public readonly retry: boolean;

  public constructor(
    code: string,
    message: string,
    options: EffectFailureOptions = {},
  ) {
    super(message);
    this.name = 'EffectFailure';
    this.code = code;
    this.details = options.details ?? {};
    this.retry = options.retry === true;
  }
}
