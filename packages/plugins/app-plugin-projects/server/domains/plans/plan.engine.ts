/**
 * Rehearsing and executing a plan's rows through the operation catalogue (`plan.ops.ts`).
 *
 * - `rehearse` runs every row in a unit that always rolls back (`TxRunner.unit` with `rehearse`): each row in its own
 *   savepoint, so a failing row leaves the next ones checkable (a row naming a failed row's `ref` then fails with
 *   `INVALID_REF`). Triggers only report whom they would wake; nothing is announced. Each row gets its check: the
 *   error, the wakes, the risk flags, the target and its baseline.
 * - `execute` runs the rows in the caller's unit, in order. Before each row its target is compared with the baseline
 *   the last rehearsal recorded; a difference throws `RowFailure` with `stale`, and a service's refusal throws it with
 *   the error, so the caller rolls the whole unit back. After the last row, every row records the state the whole plan
 *   left its target in (`after`, `revision`), which is what undo compares later.
 */
import type { ApiErrorBody } from '../../../shared/common.js';
import type {
  PlanBaseline,
  PlanObjectRef,
  PlanRiskFlag,
  PlanRowCheck,
  PlanRowOp,
  PlanRowResult,
  PlanWake,
} from '../../../shared/plans.js';
import type { Viewer } from '../../access/viewer.js';
import { DomainError, invalid } from '../../kernel/errors.js';
import type { KindRegistry } from '../../kernel/kinds.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import { collectRunAttempts, type RunAttempt } from '../../kernel/work.js';
import { findIssue } from '../issues/index.js';
import {
  dependencyExists,
  issueFields,
  OPERATIONS,
  type OpContext,
  type OpOutcome,
  type OpServices,
  type Refs,
} from './plan.ops.js';

export interface EngineDeps {
  readonly tx: TxRunner;
  readonly kinds: KindRegistry;
  readonly services: OpServices;
  readonly onError?: (error: unknown) => void;
}

/** A row as the engine runs it. */
export interface EngineRow {
  readonly op: PlanRowOp;
  readonly params: unknown;
  readonly ref: string | null;
  /** The baseline of the last rehearsal; execution compares it. */
  readonly baseline?: PlanBaseline | null;
}

/** A row stopped the execution; the caller rolls back. */
export class RowFailure extends Error {
  public constructor(
    public readonly index: number,
    public readonly error: ApiErrorBody,
    public readonly stale: boolean,
  ) {
    super(error.message);
    this.name = 'RowFailure';
  }
}

function errorBody(error: unknown, onError?: (error: unknown) => void) {
  if (error instanceof DomainError)
    return {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    };
  onError?.(error);
  return { code: 'INTERNAL_ERROR', message: 'The operation failed.' };
}

/** Same JSON, ignoring key order. */
function same(a: unknown, b: unknown): boolean {
  const canonical = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.keys(value)
          .sort()
          .map((key) => [
            key,
            canonical((value as Record<string, unknown>)[key]),
          ]),
      );
    return value ?? null;
  };
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

/** The row's shape problems as an error, or null. */
function shapeError(op: PlanRowOp, params: unknown): DomainError | null {
  const definition = OPERATIONS[op];
  if (!definition)
    return invalid(
      'UNSUPPORTED_OPERATION',
      `${String(op)} is not an operation.`,
    );
  const problems = definition.problems(params);
  if (problems.length === 0) return null;
  return invalid(
    'INVALID_PARAMS',
    `${op}: ${problems.map((problem) => problem.message).join(' ')}`,
    { errors: problems },
  );
}

export function createPlanEngine(deps: EngineDeps) {
  async function wakesOf(
    tx: Tx,
    attempts: readonly RunAttempt[],
  ): Promise<PlanWake[]> {
    const name = await deps.kinds.nameAll(
      tx.conn,
      attempts.map((attempt) => ({
        type: attempt.kind,
        id: attempt.principalId,
      })),
    );
    return attempts.map((attempt) => ({
      kind: attempt.kind,
      principalId: attempt.principalId,
      name: name(attempt.kind, attempt.principalId),
      subjectId: attempt.subjectId,
      triggerType: attempt.triggerType,
      started: attempt.started,
      ...(attempt.skipped ? { skipped: attempt.skipped } : {}),
      ...(attempt.runId ? { runId: attempt.runId } : {}),
    }));
  }

  function flagsOf(
    outcome: OpOutcome,
    wakes: readonly PlanWake[],
  ): PlanRiskFlag[] {
    const flags = new Set<PlanRiskFlag>(outcome.flags);
    if (wakes.some((wake) => wake.started)) flags.add('startsRun');
    return [...flags];
  }

  /** Runs one row; records its ref. */
  async function perform(
    ctx: OpContext,
    row: EngineRow,
  ): Promise<{
    readonly outcome: OpOutcome;
    readonly attempts: readonly RunAttempt[];
  }> {
    const problem = shapeError(row.op, row.params);
    if (problem) throw problem;
    const { value: outcome, attempts } = await collectRunAttempts(() =>
      OPERATIONS[row.op].run(ctx, row.params as never),
    );
    if (row.ref && outcome.created?.id) {
      if (
        outcome.created.type !== 'issue' &&
        outcome.created.type !== 'project'
      )
        throw invalid(
          'INVALID_REF',
          `ref ${row.ref} names nothing this row creates.`,
        );
      ctx.refs.set(row.ref, {
        type: outcome.created.type,
        id: outcome.created.id,
      });
    }
    return { outcome, attempts };
  }

  /** The current state of the row's baseline target, as its baseline would record it. */
  async function current(
    ctx: OpContext,
    row: EngineRow,
  ): Promise<PlanBaseline | null> {
    return OPERATIONS[row.op].baseline(ctx, row.params as never);
  }

  return {
    /** Rehearses `rows` as `viewer`; rolls everything back. */
    async rehearse(
      viewer: Viewer,
      rows: readonly EngineRow[],
    ): Promise<PlanRowCheck[]> {
      return deps.tx.unit(
        async (tx) => {
          const refs: Refs = new Map();
          // What the rehearsal created; it is rolled back, so the card shows no id for it.
          const transient = new Set<string>();
          const hide = (ref: PlanObjectRef | null): PlanObjectRef | null =>
            ref?.id && transient.has(ref.id)
              ? { ...ref, id: null, identifier: null }
              : ref;
          const checks: PlanRowCheck[] = [];
          for (const row of rows) {
            const ctx: OpContext = {
              tx,
              viewer,
              services: deps.services,
              refs,
            };
            let baseline: PlanBaseline | null = null;
            try {
              const problem = shapeError(row.op, row.params);
              if (problem) throw problem;
              baseline = await current(ctx, row);
              const { outcome, attempts } = await deps.tx.savepoint(
                tx,
                (inner) => perform({ ...ctx, tx: inner }, row),
              );
              if (outcome.created?.id) transient.add(outcome.created.id);
              const wakes = await wakesOf(tx, attempts);
              checks.push({
                ok: true,
                error: null,
                target: hide(outcome.target),
                wakes,
                flags: flagsOf(outcome, wakes),
                baseline,
              });
            } catch (error) {
              checks.push({
                ok: false,
                error: errorBody(error, deps.onError),
                target: baseline?.target ?? null,
                wakes: [],
                flags: [],
                baseline,
              });
            }
          }
          return checks;
        },
        { rehearse: true },
      );
    },

    /** Executes `rows` in `tx` as `viewer`; throws `RowFailure` at the first row that cannot run. */
    async execute(
      tx: Tx,
      viewer: Viewer,
      rows: readonly EngineRow[],
    ): Promise<PlanRowResult[]> {
      const refs: Refs = new Map();
      const ctx: OpContext = { tx, viewer, services: deps.services, refs };
      const outcomes: { outcome: OpOutcome; wakes: PlanWake[] }[] = [];
      for (const [index, row] of rows.entries()) {
        try {
          if (row.baseline) {
            const now = await current(ctx, row);
            if (
              !now ||
              now.target.id !== row.baseline.target.id ||
              !same(now.fields, row.baseline.fields)
            )
              throw new RowFailure(
                index,
                {
                  code: 'PLAN_STALE',
                  message:
                    'Something this row changes was changed after the plan was checked; check the plan again.',
                  details: {
                    target: row.baseline.target,
                    expected: row.baseline.fields,
                    actual: now?.fields ?? null,
                  },
                },
                true,
              );
          }
          const { outcome, attempts } = await perform(ctx, row);
          outcomes.push({ outcome, wakes: await wakesOf(tx, attempts) });
        } catch (error) {
          if (error instanceof RowFailure) throw error;
          throw new RowFailure(index, errorBody(error, deps.onError), false);
        }
      }
      // What the whole plan left each target as, for undo.
      const results: PlanRowResult[] = [];
      for (const [index, { outcome, wakes }] of outcomes.entries()) {
        const row = rows[index];
        const issueId = OPERATIONS[row.op].issueOf?.(outcome) ?? null;
        const issue = issueId ? await findIssue(tx.conn, issueId) : undefined;
        let after = outcome.after;
        if (row.op === 'issue.update' && issue && after)
          after = await issueFields(ctx, issue, Object.keys(after));
        if (row.op === 'dependency' && after) {
          const link = after as {
            readonly issueId: string;
            readonly dependsOnIssueId: string;
            readonly type: 'blockedBy' | 'relatedTo';
          };
          after = {
            ...after,
            exists: await dependencyExists(tx, {
              id: outcome.created?.id ?? null,
              ...link,
            }),
          };
        }
        results.push({
          target: outcome.target,
          created: outcome.created,
          after,
          revision: issue?.revision ?? null,
          wakes,
        });
      }
      return results;
    },
  };
}

export type PlanEngine = ReturnType<typeof createPlanEngine>;

/** 400 `PLAN_INVALID` with every row's check. */
export function planInvalid(checks: readonly PlanRowCheck[]): DomainError {
  const failing = checks.findIndex((check) => !check.ok);
  return invalid(
    'PLAN_INVALID',
    failing < 0
      ? 'The plan is not valid.'
      : `Row ${failing + 1} cannot run: ${checks[failing]?.error?.message ?? ''}`,
    { rows: checks },
  );
}
