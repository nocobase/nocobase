import type {
  CreateContext,
  EffectDefinition,
  GuardVerdict,
  Lifecycle,
  LifecycleTransition,
  TransitionContext,
} from './definition.js';
import { LifecycleError, type Blocker, type InputProblem } from './errors.js';
import type {
  JsonObject,
  LifecycleActor,
  LifecycleTypes,
  ParametersOf,
  ServicesOf,
} from './types.js';

/**
 * A guard added from outside the definition, with `runtime.addGuard()`: a
 * budget plugin refusing approvals while a budget is frozen, say. It answers
 * like a definition's guard, and its refusals join the same blockers.
 */
export type ExtraGuard<T extends LifecycleTypes> = (
  context: TransitionContext<T> & { readonly transition: string },
) => GuardVerdict | Promise<GuardVerdict>;

export interface PlanContext<T extends LifecycleTypes> {
  readonly actor: LifecycleActor;
  readonly input?: JsonObject;
  readonly parameters: ParametersOf<T>;
  readonly services: ServicesOf<T>;
  readonly now: Date;
  /** Guards added for this transition with `runtime.addGuard()`. */
  readonly guards?: readonly ExtraGuard<T>[];
}

function blockerOf(verdict: GuardVerdict, fallback: string): Blocker | null {
  if (verdict === true) return null;
  if (verdict === false)
    return {
      source: 'guard',
      kind: 'permission',
      code: 'GUARD_REJECTED',
      message: fallback,
    };
  if (typeof verdict === 'string')
    return {
      source: 'guard',
      kind: 'permission',
      code: 'GUARD_REJECTED',
      message: verdict,
    };
  return {
    source: 'guard',
    // Unmarked, a refusal is about who asks: reporting a missing permission
    // as a precondition would tell the person to wait for something that
    // never comes.
    kind: verdict.kind === 'precondition' ? 'precondition' : 'permission',
    code: verdict.code ?? 'GUARD_REJECTED',
    message: verdict.message,
  };
}

/**
 * Every guard's answer for this context: the definition's, then the added
 * ones. All are asked, so a page can show each reason at once; `fire()` and
 * `available()` call this same function, so what a button shows and what a
 * click does cannot disagree.
 */
export async function guardBlockers<T extends LifecycleTypes>(
  transition: LifecycleTransition<T>,
  context: TransitionContext<T>,
  guards: readonly ExtraGuard<T>[] = [],
): Promise<Blocker[]> {
  const fallback = `"${context.actor.id}" may not fire "${transition.name}" now.`;
  const verdicts: GuardVerdict[] = [];
  if (transition.definition.guard)
    verdicts.push(await transition.definition.guard(context));
  for (const guard of guards)
    verdicts.push(await guard({ ...context, transition: transition.name }));
  return verdicts
    .map((verdict) => blockerOf(verdict, fallback))
    .filter((blocker): blocker is Blocker => blocker !== null);
}

function problemsOf(
  answer: string | readonly InputProblem[] | null | undefined,
): readonly InputProblem[] {
  if (answer === null || answer === undefined) return [];
  return typeof answer === 'string' ? [{ message: answer }] : answer;
}

/** What the transition's `validate` finds wrong with `input`; empty when nothing is. */
export function inputProblems<T extends LifecycleTypes>(
  transition: LifecycleTransition<T>,
  input: JsonObject,
): readonly InputProblem[] {
  return problemsOf(transition.definition.validate?.(input));
}

/**
 * Checks a creation against the definition's `create`: the values first,
 * then the guard, so a guard reads only values that passed. Throws the
 * refusal; returns when the record may be written.
 */
export async function checkCreation<T extends LifecycleTypes>(
  lifecycle: Lifecycle<T>,
  context: CreateContext<T>,
): Promise<void> {
  const checks = lifecycle.create;
  const problems = problemsOf(checks.validate?.(context.values));
  if (problems.length)
    throw new LifecycleError(
      'INVALID_INPUT',
      problems.map((problem) => problem.message).join('; '),
      { problems },
    );
  if (!checks.guard) return;
  const blocker = blockerOf(
    await checks.guard(context),
    `"${context.actor.id}" may not create a ${lifecycle.name} record in "${context.state}".`,
  );
  if (blocker)
    throw new LifecycleError('GUARD_REJECTED', blocker.message, {
      blockers: [blocker],
    });
}

/** What a transition will write and run, decided without touching any store. */
export interface TransitionPlan<T extends LifecycleTypes> {
  readonly transition: string;
  readonly from: T['state'];
  readonly to: T['state'];
  /** The record's version as it was read; the update is conditional on it. */
  readonly version: number | null;
  /** The version this transition writes, also stored on its log entry. */
  readonly nextVersion: number;
  /** Every field the transition writes, the state, its timestamp and the version included. */
  readonly values: Readonly<Record<string, unknown>>;
  readonly input: JsonObject;
  readonly effects: readonly EffectDefinition<T>[];
}

export function stateOf<T extends LifecycleTypes>(
  lifecycle: Lifecycle<T>,
  record: T['record'],
): T['state'] {
  return String(record[lifecycle.stateField]);
}

/** The record's version, or null for a record written before it had one. */
export function versionOf<T extends LifecycleTypes>(
  lifecycle: Lifecycle<T>,
  record: T['record'],
): number | null {
  const value = record[lifecycle.versionField];
  if (value === null || value === undefined) return null;
  const version = Number(value);
  return Number.isSafeInteger(version) ? version : null;
}

/** Transitions that may start from the record's current state, before any guard. */
export function transitionsFrom<T extends LifecycleTypes>(
  lifecycle: Lifecycle<T>,
  state: T['state'],
): readonly LifecycleTransition<T>[] {
  return [...lifecycle.transitions.values()].filter((transition) =>
    transition.from.includes(state),
  );
}

/**
 * Decides one transition: state, input, guard, route and extra fields, in
 * that order. The function is pure apart from what `guard`, `route` and `set`
 * do, so a lifecycle can be tested by calling it directly.
 */
export async function planTransition<T extends LifecycleTypes>(
  lifecycle: Lifecycle<T>,
  record: T['record'],
  transitionName: string,
  context: PlanContext<T>,
): Promise<TransitionPlan<T>> {
  const transition = lifecycle.transitions.get(transitionName);
  if (!transition)
    throw new LifecycleError(
      'UNKNOWN_TRANSITION',
      `Lifecycle "${lifecycle.name}" has no transition "${transitionName}".`,
    );
  const from = stateOf(lifecycle, record);
  if (!transition.from.includes(from))
    throw new LifecycleError(
      'INVALID_STATE',
      `"${transitionName}" cannot start from "${from}".`,
    );

  const input = context.input ?? {};
  const base: TransitionContext<T> = Object.freeze({
    record,
    actor: context.actor,
    input,
    parameters: context.parameters,
    services: context.services,
    now: context.now,
  });
  const definition = transition.definition;
  // The input first, so a guard asked by fire() reads only input that
  // passed: judging "may this actor approve line 3" need not defend against
  // a malformed line. available(), view() and can() without input still ask
  // it with {}, which it has to answer as well.
  const problems = inputProblems(transition, input);
  if (problems.length)
    throw new LifecycleError(
      'INVALID_INPUT',
      problems.map((problem) => problem.message).join('; '),
      { problems },
    );
  const blockers = await guardBlockers(transition, base, context.guards);
  if (blockers.length)
    throw new LifecycleError('GUARD_REJECTED', blockers[0].message, {
      blockers,
    });

  const to = definition.route ? definition.route(base) : transition.to[0];
  if (!transition.to.includes(to))
    throw new LifecycleError(
      'INVALID_ROUTE',
      `"${transitionName}" routed to "${to}", which it does not declare.`,
    );

  const accepted: Record<string, unknown> = {};
  for (const field of definition.accept ?? [])
    if (field in input) accepted[field] = input[field];
  const extra = {
    ...accepted,
    ...(definition.set
      ? await definition.set(Object.freeze({ ...base, from, to }))
      : {}),
  };
  for (const field of [
    'id',
    lifecycle.stateField,
    lifecycle.changedAtField,
    lifecycle.versionField,
  ])
    if (field in extra)
      throw new LifecycleError(
        'INVALID_SET',
        `"${transitionName}" may not set "${field}"; the lifecycle owns it.`,
      );

  const version = versionOf(lifecycle, record);
  const nextVersion = (version ?? 0) + 1;
  return {
    transition: transitionName,
    from,
    to,
    input,
    version,
    nextVersion,
    values: {
      ...extra,
      [lifecycle.stateField]: to,
      [lifecycle.changedAtField]: context.now.toISOString(),
      [lifecycle.versionField]: nextVersion,
    },
    effects: [...transition.effects, ...(lifecycle.onEnter.get(to) ?? [])],
  };
}
