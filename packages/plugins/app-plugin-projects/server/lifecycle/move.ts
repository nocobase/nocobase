/**
 * The one way a record changes state. `move` runs inside the caller's unit of work (its transaction travels in
 * `context`) and knows nothing about storage: `apply` writes the new state. The steps, in order:
 *
 * 1. Who may: a transition from `from` to `to` names the actor's type, and its "who may" rule, if any, allows the actor.
 * 2. Guards: the state rules of `from` allow leaving it and those of `to` allow entering it.
 * 3. Approval: when a transition taken needs one, the move stops as `pending` with the people who may approve it,
 *    unless nobody resolves (no approver) or the actor is one of them (self). An approved move passes `approved`.
 * 4. `apply`.
 * 5. Entry actions: the state rules of `to`, each in `isolate` (a savepoint), so one failing leaves the move and the
 *    other actions in place. Each reports what it did; a rule the registry no longer has is skipped (`unavailable`),
 *    so a definition naming the rule of a removed plugin still moves.
 *
 * A move with an `event` may take only that event's transitions, and a move without one never takes them; `fire`
 * finds where an event leads and moves there.
 */
import type { LifecycleMachine } from './machine.js';
import {
  ANY_STATE,
  type LifecycleState,
  type LifecycleTransition,
} from './definition.js';
import type {
  GuardFailure,
  LifecycleActor,
  LifecycleRegistry,
  RuleContext,
} from './registry.js';

export type LifecycleErrorCode =
  'UNKNOWN_STATE' | 'TRANSITION_NOT_ALLOWED' | 'GUARD_FAILED';

export class LifecycleError extends Error {
  public readonly code: LifecycleErrorCode;
  /** Set for `GUARD_FAILED`: what the guard said, and which rule it was. */
  public readonly failure?: GuardFailure & { readonly rule: string };

  public constructor(
    code: LifecycleErrorCode,
    message: string,
    failure?: GuardFailure & { readonly rule: string },
  ) {
    super(message);
    this.name = 'LifecycleError';
    this.code = code;
    if (failure) this.failure = failure;
  }
}

export interface MoveRequest<Subject, Context> {
  readonly from: string;
  readonly to: string;
  readonly actor: LifecycleActor;
  readonly subject: Subject;
  readonly context: Context;
  /** The approval was given already: step 3 is skipped. */
  readonly approved?: boolean;
  /** Guards are not asked (a system write that must go through). */
  readonly skipGuards?: boolean;
  /** The event this move answers: only transitions with the same `on` are taken (none when unset). */
  readonly event?: string;
  /**
   * Runs one entry action so that its failure leaves the rest of the work intact (a savepoint), handing it the context
   * to use inside; defaults to running it directly with `context`.
   */
  readonly isolate?: <T>(run: (context: Context) => Promise<T>) => Promise<T>;
}

/** Why the move needed no approval step: none required, the actor approves it, nobody resolved, or it was given. */
export type ApprovalNote = 'none' | 'self' | 'noApprover' | 'approved';

export interface EntryReport {
  readonly rule: string;
  readonly status: 'applied' | 'skipped' | 'failed';
  readonly reason?: string;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly error?: unknown;
}

/** The reason a rule the registry does not have is skipped. */
export const UNAVAILABLE_RULE = 'unavailable';

export type MoveResult =
  | { readonly outcome: 'unchanged' }
  | {
      readonly outcome: 'pending';
      /** The approver names of the transitions taken. */
      readonly approvers: readonly string[];
      /** The people they resolve to. */
      readonly approverIds: readonly string[];
    }
  | {
      readonly outcome: 'moved';
      readonly approval: ApprovalNote;
      readonly entry: readonly EntryReport[];
    };

const matches = (pattern: string, key: string) =>
  pattern === ANY_STATE || pattern === key;

const stateOf = (machine: LifecycleMachine, key: string) =>
  machine.states.find((state) => state.key === key);

const rulesOf = (state: LifecycleState | undefined) => state?.rules ?? [];

/** The transitions the actor may take from `from` to `to`, "who may" rules included. */
async function takeable<Subject, Context>(
  machine: LifecycleMachine,
  registry: LifecycleRegistry<Subject, Context>,
  ctx: RuleContext<Subject, Context>,
  event: string | undefined,
): Promise<LifecycleTransition[]> {
  const taken: LifecycleTransition[] = [];
  for (const transition of machine.definition.transitions) {
    if (
      transition.on !== event ||
      !transition.actors.includes(ctx.actor.type) ||
      !matches(transition.from, ctx.from) ||
      !matches(transition.to, ctx.to)
    )
      continue;
    if (transition.who) {
      const rule = registry.findWhoRule(transition.who.type);
      if (!rule || !(await rule.allows(ctx, transition.who.config ?? {})))
        continue;
    }
    taken.push(transition);
  }
  return taken;
}

async function checkGuards<Subject, Context>(
  machine: LifecycleMachine,
  registry: LifecycleRegistry<Subject, Context>,
  ctx: RuleContext<Subject, Context>,
): Promise<void> {
  const checks = [
    ...rulesOf(stateOf(machine, ctx.from)).map((ref) => ({
      ref,
      leaving: true,
    })),
    ...rulesOf(stateOf(machine, ctx.to)).map((ref) => ({
      ref,
      leaving: false,
    })),
  ];
  for (const { ref, leaving } of checks) {
    const rule = registry.findStateRule(ref.type);
    const config = ref.config ?? {};
    const failure = await (leaving
      ? rule?.canLeave?.(ctx, config)
      : rule?.canEnter?.(ctx, config));
    if (failure)
      throw new LifecycleError('GUARD_FAILED', failure.message, {
        ...failure,
        rule: ref.type,
      });
  }
}

async function approvalStep<Subject, Context>(
  registry: LifecycleRegistry<Subject, Context>,
  ctx: RuleContext<Subject, Context>,
  taken: readonly LifecycleTransition[],
): Promise<
  | { readonly note: ApprovalNote }
  | { readonly approvers: string[]; readonly approverIds: string[] }
> {
  // When several transitions apply (`* → *` and `in_review → done`), one needing an approval is enough.
  const approvers = [
    ...new Set(taken.flatMap((item) => item.approval?.approvers ?? [])),
  ];
  if (approvers.length === 0) return { note: 'none' };
  const ids = new Set<string>();
  for (const name of approvers)
    for (const id of (await registry.findApprover(name)?.resolve(ctx)) ?? [])
      ids.add(id);
  if (ids.size === 0) return { note: 'noApprover' };
  if (ctx.actor.id !== null && ids.has(ctx.actor.id)) return { note: 'self' };
  return { approvers, approverIds: [...ids] };
}

async function runEntry<Subject, Context>(
  machine: LifecycleMachine,
  registry: LifecycleRegistry<Subject, Context>,
  ctx: RuleContext<Subject, Context>,
  isolate: <T>(run: (context: Context) => Promise<T>) => Promise<T>,
): Promise<EntryReport[]> {
  const reports: EntryReport[] = [];
  for (const ref of rulesOf(stateOf(machine, ctx.to))) {
    const rule = registry.findStateRule(ref.type);
    if (!rule) {
      reports.push({
        rule: ref.type,
        status: 'skipped',
        reason: UNAVAILABLE_RULE,
      });
      continue;
    }
    const entered = rule.entered?.bind(rule);
    if (!entered) continue;
    try {
      const outcome = await isolate((context) =>
        entered({ ...ctx, context }, ref.config ?? {}),
      );
      const details = outcome?.details ? { details: outcome.details } : {};
      reports.push(
        outcome?.status === 'skipped'
          ? {
              rule: ref.type,
              status: 'skipped',
              reason: outcome.reason,
              ...details,
            }
          : { rule: ref.type, status: 'applied', ...details },
      );
    } catch (error) {
      reports.push({ rule: ref.type, status: 'failed', error });
    }
  }
  return reports;
}

/**
 * Steps 1 and 2 alone: whether the actor may take the record from `from` to `to` now (who may, and the guards unless
 * skipped). Nothing is written; the error is what `move` would throw.
 */
export async function canMove<Subject, Context>(
  machine: LifecycleMachine,
  registry: LifecycleRegistry<Subject, Context>,
  request: Omit<MoveRequest<Subject, Context>, 'approved' | 'isolate'>,
): Promise<
  { readonly ok: true } | { readonly ok: false; readonly error: LifecycleError }
> {
  try {
    const { from, to, actor } = request;
    if (!machine.isKnown(to))
      throw new LifecycleError('UNKNOWN_STATE', `There is no state ${to}.`);
    const ctx: RuleContext<Subject, Context> = {
      subject: request.subject,
      from,
      to,
      actor,
      machine,
      context: request.context,
      ...(request.event === undefined ? {} : { event: request.event }),
    };
    if ((await takeable(machine, registry, ctx, request.event)).length === 0)
      throw new LifecycleError(
        'TRANSITION_NOT_ALLOWED',
        `Moving from ${from} to ${to} is not allowed.`,
      );
    if (!request.skipGuards) await checkGuards(machine, registry, ctx);
    return { ok: true };
  } catch (error) {
    if (error instanceof LifecycleError) return { ok: false, error };
    throw error;
  }
}

export async function move<Subject, Context>(
  machine: LifecycleMachine,
  registry: LifecycleRegistry<Subject, Context>,
  request: MoveRequest<Subject, Context>,
  apply: () => Promise<void>,
): Promise<MoveResult> {
  const { from, to, actor } = request;
  if (!machine.isKnown(to))
    throw new LifecycleError('UNKNOWN_STATE', `There is no state ${to}.`);
  if (from === to) return { outcome: 'unchanged' };
  const ctx: RuleContext<Subject, Context> = {
    subject: request.subject,
    from,
    to,
    actor,
    machine,
    context: request.context,
    ...(request.event === undefined ? {} : { event: request.event }),
  };

  const taken = await takeable(machine, registry, ctx, request.event);
  if (taken.length === 0)
    throw new LifecycleError(
      'TRANSITION_NOT_ALLOWED',
      `Moving from ${from} to ${to} is not allowed.`,
    );
  if (!request.skipGuards) await checkGuards(machine, registry, ctx);
  const approval = request.approved
    ? { note: 'approved' as const }
    : await approvalStep(registry, ctx, taken);
  if (!('note' in approval)) return { outcome: 'pending', ...approval };

  await apply();
  const entry = await runEntry(
    machine,
    registry,
    ctx,
    request.isolate ?? ((run) => run(request.context)),
  );
  return { outcome: 'moved', approval: approval.note, entry };
}

/**
 * Moves the record where `event` takes it from `from`, through `move` with every step but approval (an event has
 * nobody to ask): guards still apply and refuse with `GUARD_FAILED`. `ignored` when no event transition leaves `from`
 * on it.
 */
export async function fire<Subject, Context>(
  machine: LifecycleMachine,
  registry: LifecycleRegistry<Subject, Context>,
  request: Omit<MoveRequest<Subject, Context>, 'to' | 'approved' | 'event'> & {
    readonly event: string;
  },
  apply: (to: string) => Promise<void>,
): Promise<MoveResult | { readonly outcome: 'ignored' }> {
  const to = machine.eventTarget(request.from, request.event);
  if (to === null) return { outcome: 'ignored' };
  return move(machine, registry, { ...request, to, approved: true }, () =>
    apply(to),
  );
}
