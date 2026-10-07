/**
 * Operation plans (`shared/plans.ts`): storing, rehearsing again, executing, voiding, expiring and undoing them. The
 * rows themselves run through the engine (`plan.engine.ts`), as the person who decides or executes, with the trace
 * that marks every change "via ‹Agent›'s plan".
 */
import type { Permissions } from '../../../shared/access.js';
import {
  PLAN_DESCRIPTION_MAX,
  PLAN_OPEN_STATUSES,
  PLAN_OPS,
  PLAN_PAGE_LIMIT,
  PLAN_REF_PATTERN,
  PLAN_ROWS_MAX,
  PLAN_STATUSES,
  PLAN_TITLE_MAX,
  PLAN_TTL_HOURS,
  PLAN_UNDO_HOURS,
  type CreatePlanRequest,
  type Plan,
  type PlanDecided,
  type PlanDecisionOutcome,
  type PlanFailure,
  type PlanProposer,
  type PlanRowCheck,
  type PlanRowOp,
  type PlanSource,
  type PlanStatus,
  type PlanUndoSkip,
} from '../../../shared/plans.js';
import type { Viewer } from '../../access/viewer.js';
import { AGENT_VIA_KIND } from '../../kernel/activity.js';
import {
  SYSTEM_ACTOR,
  type Actor,
  type ActorTrace,
} from '../../kernel/actor.js';
import {
  DomainError,
  conflict,
  forbidden,
  invalid,
  notFound,
} from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { KindRegistry } from '../../kernel/kinds.js';
import { decodeCursor, pageLimit, pageOf } from '../../kernel/pagination.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import type { UserDirectory } from '../../kernel/users.js';
import { oneOf } from '../../kernel/db.js';
import { canSee, findIssue, issuesOfProject } from '../issues/index.js';
import { maySeePlan } from './plan.access.js';
import {
  planInvalid,
  RowFailure,
  type EngineRow,
  type PlanEngine,
} from './plan.engine.js';
import './plan.events.js';
import {
  addPlanIssues,
  deleteRows,
  expiredPlans,
  findPlan,
  findPlans,
  insertPlan,
  insertRows,
  openPlansOfSource,
  plansOfIssue,
  rowsOf,
  setPlanIssues,
  updatePlan,
  updatePlanIf,
  updateRow,
  type PlanRecord,
  type PlanRowRecord,
} from './plan.store.js';
import { issuesNamedBy, issuesOfResults } from './plan.touched.js';
import { buildUndo, type UndoRow } from './plan.undo.js';
import type {
  CreatePlanOptions,
  PlanExecutedHook,
  PlanHooks,
  PlanService,
} from './ports.js';

export interface PlanDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly kinds: KindRegistry;
  readonly users: UserDirectory;
  readonly engine: PlanEngine;
  readonly hooks: () => PlanHooks | undefined;
  /** The follow-up of an executed plan of each source kind (an intake's files go to the issues it created). */
  readonly onExecuted?: Readonly<Record<string, PlanExecutedHook>>;
  /** What another person may do, for a plan proposed to them (`ProjectsAccess.permissionsOfUser`). */
  readonly permissionsOfUser?: (userId: string) => Promise<Permissions>;
  readonly now?: () => Date;
}

const HOUR = 60 * 60 * 1000;
const SOURCE_DATA_MAX = 10_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

interface Parsed {
  readonly title: string;
  readonly description: string;
  readonly source: PlanSource;
  readonly proposer: PlanProposer | null;
  readonly rows: readonly EngineRow[];
}

interface Problem {
  readonly field: string;
  readonly message: string;
}

function malformed(problems: readonly Problem[]): DomainError {
  return invalid(
    'PLAN_INVALID',
    problems.map((problem) => problem.message).join(' '),
    { errors: problems },
  );
}

function titleProblems(value: unknown, problems: Problem[]): string {
  const title = typeof value === 'string' ? value.trim() : '';
  if (!title || title.length > PLAN_TITLE_MAX)
    problems.push({
      field: 'title',
      message: `title must be 1 to ${PLAN_TITLE_MAX} characters.`,
    });
  return title;
}

function descriptionProblems(value: unknown, problems: Problem[]): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.length > PLAN_DESCRIPTION_MAX) {
    problems.push({
      field: 'description',
      message: `description must be text of at most ${PLAN_DESCRIPTION_MAX} characters.`,
    });
    return '';
  }
  return value;
}

/** The request's own shape; the rows' params are the rehearsal's to judge. */
function parse(input: CreatePlanRequest): Parsed {
  const problems: Problem[] = [];
  if (!isRecord(input))
    throw malformed([{ field: '', message: 'The plan must be an object.' }]);
  const title = titleProblems(input.title, problems);
  const description = descriptionProblems(input.description, problems);

  const source = input.source as unknown;
  if (
    !isRecord(source) ||
    typeof source.kind !== 'string' ||
    !source.kind ||
    source.kind.length > 32
  )
    problems.push({
      field: 'source.kind',
      message: 'source.kind must be a name of at most 32 characters.',
    });
  else {
    if (
      source.key !== undefined &&
      source.key !== null &&
      (typeof source.key !== 'string' || source.key.length > 200)
    )
      problems.push({
        field: 'source.key',
        message: 'source.key must be text of at most 200 characters.',
      });
    if (
      source.issueId !== undefined &&
      source.issueId !== null &&
      typeof source.issueId !== 'string'
    )
      problems.push({
        field: 'source.issueId',
        message: 'source.issueId must be an issue id.',
      });
    if (
      source.data !== undefined &&
      JSON.stringify(source.data).length > SOURCE_DATA_MAX
    )
      problems.push({
        field: 'source.data',
        message: `source.data must be at most ${SOURCE_DATA_MAX} characters of JSON.`,
      });
  }

  const proposer = input.proposer as unknown;
  if (
    proposer !== undefined &&
    proposer !== null &&
    (!isRecord(proposer) ||
      typeof proposer.agentId !== 'string' ||
      !proposer.agentId ||
      (proposer.runId != null && typeof proposer.runId !== 'string') ||
      (proposer.conversationId != null &&
        typeof proposer.conversationId !== 'string'))
  )
    problems.push({
      field: 'proposer',
      message: 'proposer must be { agentId, runId?, conversationId? }.',
    });

  const rows: EngineRow[] = [];
  if (
    !Array.isArray(input.rows) ||
    input.rows.length === 0 ||
    input.rows.length > PLAN_ROWS_MAX
  )
    problems.push({
      field: 'rows',
      message: `A plan holds 1 to ${PLAN_ROWS_MAX} rows.`,
    });
  else {
    const refs = new Set<string>();
    for (const [index, row] of (input.rows as readonly unknown[]).entries()) {
      const field = `rows[${index}]`;
      if (!isRecord(row)) {
        problems.push({ field, message: `${field} must be an object.` });
        continue;
      }
      for (const key of Object.keys(row))
        if (key !== 'op' && key !== 'params' && key !== 'ref')
          problems.push({
            field: `${field}.${key}`,
            message: `${field}.${key} is not a field of a row (op, params, ref).`,
          });
      if (!(PLAN_OPS as readonly unknown[]).includes(row.op))
        problems.push({
          field: `${field}.op`,
          message: `${field}.op must be one of ${PLAN_OPS.join(', ')}.`,
        });
      const ref = row.ref;
      if (ref !== undefined && ref !== null) {
        if (typeof ref !== 'string' || !PLAN_REF_PATTERN.test(ref))
          problems.push({
            field: `${field}.ref`,
            message: `${field}.ref must start with a letter and hold at most 40 letters, digits, _ or -.`,
          });
        else if (refs.has(ref))
          problems.push({
            field: `${field}.ref`,
            message: `${field}.ref ${ref} is used twice.`,
          });
        else refs.add(ref);
      }
      rows.push({
        op: row.op as PlanRowOp,
        params: row.params,
        ref: typeof ref === 'string' ? ref : null,
      });
    }
  }
  if (problems.length > 0) throw malformed(problems);
  const s = source as Record<string, unknown>;
  const p = proposer as Record<string, string | null | undefined> | null;
  return {
    title,
    description,
    source: {
      kind: s.kind as string,
      key: (s.key as string | null | undefined) ?? null,
      issueId: (s.issueId as string | null | undefined) ?? null,
      ...(s.data === undefined ? {} : { data: s.data }),
    },
    proposer: p
      ? {
          agentId: p.agentId as string,
          ...(p.runId ? { runId: p.runId } : {}),
          ...(p.conversationId ? { conversationId: p.conversationId } : {}),
        }
      : null,
    rows,
  };
}

/** The agent a viewer acts through, when its actor carries one. */
function proposerOf(actor: Actor): PlanProposer | null {
  const trace = actor.trace;
  if (actor.via !== 'agent' || !trace?.agentId) return null;
  return {
    agentId: trace.agentId,
    ...(trace.runId ? { runId: trace.runId } : {}),
    ...(trace.conversationId ? { conversationId: trace.conversationId } : {}),
  };
}

/** The viewer as a plan's rows run: the same person and permissions, traced to the plan and its proposer. */
function acting(
  viewer: Viewer,
  planId: string,
  proposer: PlanProposer | null,
): Viewer {
  const trace: ActorTrace = {
    ...(proposer
      ? {
          agentId: proposer.agentId,
          ...(proposer.runId ? { runId: proposer.runId } : {}),
          ...(proposer.conversationId
            ? { conversationId: proposer.conversationId }
            : {}),
        }
      : {}),
    planId,
  };
  const { via } = viewer.actor;
  return {
    ...viewer,
    actor: {
      type: viewer.actor.type,
      id: viewer.actor.id,
      ...(proposer
        ? { via: 'agent' as const }
        : via && via !== 'agent'
          ? { via }
          : {}),
      trace,
    },
  };
}

const isOpen = (status: PlanStatus) => PLAN_OPEN_STATUSES.includes(status);

export function createPlanService(deps: PlanDeps): PlanService {
  const now = () => deps.now?.() ?? new Date();
  const newId = () => deps.ids.next();
  const later = (hours: number, from = now()) =>
    new Date(from.getTime() + hours * HOUR).toISOString();

  /** The status a reader sees: an open plan past its expiry is expired. */
  const effective = (plan: PlanRecord): PlanStatus =>
    isOpen(plan.status) && new Date(plan.expiresAt) <= now()
      ? 'expired'
      : plan.status;

  async function views(
    conn: Tx['conn'],
    records: readonly PlanRecord[],
  ): Promise<Plan[]> {
    const rows = await rowsOf(
      conn,
      records.map((record) => record.id),
    );
    const byPlan = new Map<string, PlanRowRecord[]>();
    for (const row of rows)
      byPlan.set(row.planId, [...(byPlan.get(row.planId) ?? []), row]);
    const users = await deps.users.names(
      conn,
      records.map((record) => record.deciderUserId),
    );
    const name = await deps.kinds.nameAll(
      conn,
      records.flatMap((record) =>
        record.proposer
          ? [{ type: AGENT_VIA_KIND, id: record.proposer.agentId }]
          : [],
      ),
    );
    return records.map((record) => {
      const status = effective(record);
      const undoableUntil =
        status === 'executed' && record.executedAt
          ? later(PLAN_UNDO_HOURS, new Date(record.executedAt))
          : null;
      return {
        id: record.id,
        title: record.title,
        description: record.description,
        status,
        voidReason: record.voidReason,
        source: {
          kind: record.sourceKind,
          key: record.sourceKey,
          issueId: record.sourceIssueId,
          ...(record.sourceData === null || record.sourceData === undefined
            ? {}
            : { data: record.sourceData }),
        },
        proposer: record.proposer,
        proposerName: record.proposer
          ? name(AGENT_VIA_KIND, record.proposer.agentId)
          : null,
        deciderUserId: record.deciderUserId,
        deciderName: users.get(record.deciderUserId) ?? null,
        createdBy: { type: record.createdByType, id: record.createdById },
        revision: record.revision,
        rows: (byPlan.get(record.id) ?? []).map((row) => ({
          id: row.id,
          position: row.position,
          op: row.op,
          ref: row.ref,
          params: row.params,
          check: row.check,
          result: row.result,
        })),
        failure: record.failure,
        expiresAt: record.expiresAt,
        rehearsedAt: record.rehearsedAt,
        executedAt: record.executedAt,
        executedById: record.executedById,
        undoableUntil:
          undoableUntil && new Date(undoableUntil) > now()
            ? undoableUntil
            : null,
        skipped: record.skipped ?? [],
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    });
  }

  async function viewOf(id: string): Promise<Plan> {
    const conn = deps.tx.read();
    const record = await findPlan(conn, id);
    if (!record) throw notFound('Plan');
    return (await views(conn, [record]))[0];
  }

  async function visible(viewer: Viewer, id: string): Promise<PlanRecord> {
    const conn = deps.tx.read();
    const plan = typeof id === 'string' ? await findPlan(conn, id) : undefined;
    if (!plan || !(await maySeePlan(conn, viewer, plan)))
      throw notFound('Plan');
    return plan;
  }

  /** 400 `PLAN_EXPIRED` (and records it) when an open plan is past its expiry. */
  async function assertNotExpired(plan: PlanRecord): Promise<void> {
    if (plan.status === 'expired')
      throw conflict('PLAN_EXPIRED', 'The plan expired; ask for a new one.');
    if (effective(plan) !== 'expired') return;
    await deps.tx.run(async (tx) => {
      if (
        await updatePlanIf(
          tx.conn,
          plan.id,
          { statuses: PLAN_OPEN_STATUSES },
          { status: 'expired', revision: plan.revision + 1 },
        )
      )
        tx.emit({ type: 'plan.changed', planId: plan.id });
    });
    throw conflict('PLAN_EXPIRED', 'The plan expired; ask for a new one.');
  }

  function requireRevision(input: unknown): number {
    const revision = isRecord(input) ? input.revision : undefined;
    if (typeof revision !== 'number' || !Number.isInteger(revision))
      throw invalid('REVISION_REQUIRED', 'revision is required.');
    return revision;
  }

  function engineRows(rows: readonly PlanRowRecord[]): EngineRow[] {
    return rows.map((row) => ({
      op: row.op,
      params: row.params,
      ref: row.ref,
      baseline: row.check?.baseline ?? null,
    }));
  }

  async function decided(
    tx: Tx,
    plan: PlanRecord,
    outcome: PlanDecisionOutcome,
    byUserId: string,
    rows: readonly PlanRowRecord[],
    failure: PlanFailure | null,
  ): Promise<void> {
    const hooks = deps.hooks();
    if (!hooks?.onPlanDecided) return;
    const event: PlanDecided = {
      planId: plan.id,
      outcome,
      title: plan.title,
      source: {
        kind: plan.sourceKind,
        key: plan.sourceKey,
        issueId: plan.sourceIssueId,
        ...(plan.sourceData === null || plan.sourceData === undefined
          ? {}
          : { data: plan.sourceData }),
      },
      proposer: plan.proposer,
      deciderUserId: plan.deciderUserId,
      decidedById: byUserId,
      failure,
      rows: rows.map((row) => {
        const failed = failure?.rowId === row.id;
        return {
          position: row.position,
          op: row.op,
          ok:
            outcome === 'failed' || outcome === 'stale'
              ? !failed
              : (row.check?.ok ?? true),
          created: row.result?.created ?? null,
          target: row.result?.target ?? row.check?.target ?? null,
          error:
            failed && failure
              ? { code: failure.code, message: failure.message }
              : null,
          wakes: row.result?.wakes ?? [],
        };
      }),
    };
    await hooks.onPlanDecided(tx, event);
  }

  /** Voids the open plans of a source key, as superseded. */
  async function supersede(tx: Tx, sourceKey: string | null | undefined) {
    if (!sourceKey) return;
    for (const old of await openPlansOfSource(
      tx.conn,
      sourceKey,
      PLAN_OPEN_STATUSES,
    )) {
      await updatePlan(tx.conn, old.id, {
        status: 'voided',
        voidReason: 'superseded',
        revision: old.revision + 1,
      });
      tx.emit({ type: 'plan.changed', planId: old.id });
    }
  }

  /** Stores a rehearsed plan; answers its id. */
  async function store(input: {
    readonly id: string;
    readonly parsed: Parsed;
    readonly deciderUserId: string;
    readonly createdBy: Actor;
    readonly rows: readonly EngineRow[];
    readonly checks: readonly PlanRowCheck[];
  }): Promise<void> {
    const { parsed } = input;
    const at = now();
    await deps.tx.run(async (tx) => {
      await supersede(tx, parsed.source.key);
      await insertPlan(tx.conn, {
        id: input.id,
        title: parsed.title,
        description: parsed.description,
        status: 'pending',
        voidReason: null,
        sourceKind: parsed.source.kind,
        sourceKey: parsed.source.key ?? null,
        sourceIssueId: parsed.source.issueId ?? null,
        sourceData: parsed.source.data ?? null,
        proposer: parsed.proposer,
        deciderUserId: input.deciderUserId,
        createdByType: input.createdBy.type,
        createdById: input.createdBy.id,
        revision: 1,
        failure: null,
        rehearsedAt: at.toISOString(),
        expiresAt: later(PLAN_TTL_HOURS, at),
        executedAt: null,
        executedById: null,
        skipped: null,
        createdAt: at.toISOString(),
        updatedAt: at.toISOString(),
      });
      await insertRows(
        tx.conn,
        input.rows.map((row, position) => ({
          id: deps.ids.next(),
          planId: input.id,
          position,
          op: row.op,
          ref: row.ref,
          params: row.params ?? null,
          check: input.checks[position] ?? null,
          result: null,
        })),
      );
      await addPlanIssues(
        tx.conn,
        input.id,
        await issuesNamedBy(tx.conn, input.rows),
        newId,
      );
      tx.emit({ type: 'plan.changed', planId: input.id });
    });
  }

  async function createFor(
    viewer: Viewer,
    input: CreatePlanRequest,
    createdBy: Actor,
  ): Promise<string> {
    const parsed = parse(input);
    const proposer = parsed.proposer ?? proposerOf(viewer.actor);
    const id = deps.ids.next();
    const checks = await deps.engine.rehearse(
      acting(viewer, id, proposer),
      parsed.rows,
    );
    if (!checks.every((check) => check.ok)) throw planInvalid(checks);
    await store({
      id,
      parsed: { ...parsed, proposer },
      deciderUserId: viewer.userId,
      createdBy,
      rows: parsed.rows,
      checks,
    });
    return id;
  }

  /** What undoing `id` takes now: the reverse rows that still run, rehearsed, and the rows it leaves alone. */
  async function prepareUndo(viewer: Viewer, id: string) {
    const plan = await visible(viewer, id).catch(async (error: unknown) => {
      // The person who executed a status rule's plan may undo it even when they no longer see it otherwise.
      const record = await findPlan(deps.tx.read(), id);
      if (record?.executedById === viewer.userId) return record;
      throw error;
    });
    if (plan.executedById !== viewer.userId)
      throw forbidden('Only the person who executed a plan may undo it.');
    if (plan.status !== 'executed')
      throw conflict('PLAN_NOT_OPEN', 'Only an executed plan can be undone.');
    if (
      !plan.executedAt ||
      new Date(later(PLAN_UNDO_HOURS, new Date(plan.executedAt))) <= now()
    )
      throw conflict('UNDO_EXPIRED', 'The plan can no longer be undone.');
    const rows = await rowsOf(deps.tx.read(), [plan.id]);
    const built = await deps.tx.unit(
      (tx) =>
        buildUndo(tx, rows, {
          liveIssueIds: async (conn, projectId) =>
            (await issuesOfProject(conn, projectId))
              .filter((issue) => !issue.deletedAt)
              .map((issue) => issue.id),
        }),
      { rehearse: true },
    );
    // The changes are traced to the plan itself, as the person undoing it: there is no separate undo plan.
    const actingViewer = acting(viewer, plan.id, null);
    let undoRows: UndoRow[] = built.rows;
    const skipped: PlanUndoSkip[] = [...built.skipped];
    let checks: PlanRowCheck[] = [];
    // Rows that can no longer run are left alone too; the rest is checked again without them.
    for (
      let round = 0;
      undoRows.length > 0 && round <= PLAN_ROWS_MAX;
      round += 1
    ) {
      checks = await deps.engine.rehearse(actingViewer, undoRows);
      const failing = checks.flatMap((check, index) =>
        check.ok ? [] : [index],
      );
      if (failing.length === 0) break;
      for (const index of failing) {
        const row = undoRows[index];
        const original = rows.find((item) => item.id === row.undoesRowId);
        skipped.push({
          rowId: row.undoesRowId,
          position: original?.position ?? -1,
          reason: 'notReversible',
          message: checks[index]?.error?.message ?? 'It cannot be undone.',
        });
      }
      undoRows = undoRows.filter((_, index) => !failing.includes(index));
    }
    skipped.sort((a, b) => b.position - a.position);
    return { plan, rows, undoRows, checks, skipped, actingViewer };
  }

  const service: PlanService = {
    async rehearse(viewer, input) {
      const parsed = parse(input);
      const rows = await deps.engine.rehearse(
        acting(
          viewer,
          'rehearsal',
          parsed.proposer ?? proposerOf(viewer.actor),
        ),
        parsed.rows,
      );
      return { ok: rows.every((row) => row.ok), rows };
    },

    async create(viewer, input, options: CreatePlanOptions = {}) {
      if (
        isRecord(input) &&
        input.deciderUserId !== undefined &&
        input.deciderUserId !== viewer.userId
      )
        throw forbidden('A plan made here is decided by whoever makes it.');
      const id = await createFor(viewer, input, viewer.actor);
      if (options.execute) return service.execute(viewer, id, { revision: 1 });
      return viewOf(id);
    },

    async propose(input, by = SYSTEM_ACTOR) {
      const decider = input.deciderUserId;
      if (typeof decider !== 'string' || !decider)
        throw invalid('PLAN_INVALID', 'deciderUserId is required.');
      if (!deps.permissionsOfUser)
        throw invalid(
          'PLAN_UNAVAILABLE',
          'Plans for someone else need the application to tell what they may do.',
        );
      const viewer: Viewer = {
        userId: decider,
        actor: { type: 'user', id: decider },
        permissions: await deps.permissionsOfUser(decider),
      };
      return viewOf(await createFor(viewer, input, by));
    },

    async get(viewer, id) {
      await visible(viewer, id);
      return viewOf(id);
    },

    async list(viewer, query) {
      const limit = pageLimit(
        query.limit,
        PLAN_PAGE_LIMIT.default,
        PLAN_PAGE_LIMIT.max,
      );
      const cursor = query.cursor ? decodeCursor(query.cursor) : undefined;
      const at = now().toISOString();
      const status = query.status;
      if (
        status !== undefined &&
        status !== 'open' &&
        !PLAN_STATUSES.includes(status)
      )
        throw invalid('INVALID_QUERY', 'status is not a plan status.');
      const conn = deps.tx.read();
      // About an issue: only one the caller may see, by its source or by the issues its rows touch (`pmPlanIssues`).
      let about: { readonly id: string; readonly plans: string[] } | null =
        null;
      if (query.issueId) {
        const issue = await findIssue(conn, query.issueId);
        if (!issue || !(await canSee(conn, viewer, issue)))
          return { data: [], nextCursor: null };
        about = { id: issue.id, plans: await plansOfIssue(conn, issue.id) };
      }
      const records = await findPlans(conn, {
        filter: (f) =>
          f.and([
            about
              ? f.or([
                  f.string('sourceIssueId').eq(about.id),
                  oneOf(f, 'id', about.plans),
                ])
              : f.string('deciderUserId').eq(viewer.userId),
            ...(query.sourceKind
              ? [f.string('sourceKind').eq(query.sourceKind)]
              : []),
            ...(query.sourceKey
              ? [f.string('sourceKey').eq(query.sourceKey)]
              : []),
            ...(status === 'open'
              ? [
                  oneOf(f, 'status', [...PLAN_OPEN_STATUSES]),
                  f.date('expiresAt').after(at),
                ]
              : status === 'expired'
                ? [
                    f.or([
                      f.string('status').eq('expired'),
                      f.and([
                        oneOf(f, 'status', [...PLAN_OPEN_STATUSES]),
                        f.date('expiresAt').notAfter(at),
                      ]),
                    ]),
                  ]
                : status && isOpen(status)
                  ? [
                      f.string('status').eq(status),
                      f.date('expiresAt').after(at),
                    ]
                  : status
                    ? [f.string('status').eq(status)]
                    : []),
          ]),
        limit: limit + 1,
        ...(cursor
          ? {
              cursor: {
                createdAt: String(cursor.createdAt),
                id: String(cursor.id),
              },
            }
          : {}),
      });
      const page = pageOf(records, limit, (record) => ({
        createdAt: record.createdAt,
        id: record.id,
      }));
      const shown: PlanRecord[] = [];
      for (const record of page.rows)
        if (!about || (await maySeePlan(conn, viewer, record)))
          shown.push(record);
      return { data: await views(conn, shown), nextCursor: page.nextCursor };
    },

    async edit(viewer, id, input) {
      const revision = requireRevision(input);
      const plan = await visible(viewer, id);
      await assertNotExpired(plan);
      if (!isOpen(plan.status))
        throw conflict('PLAN_NOT_OPEN', 'Only an open plan can be edited.');
      if (plan.revision !== revision)
        throw conflict('REVISION_CONFLICT', 'The plan was changed meanwhile.');
      const problems: Problem[] = [];
      const title =
        input.title === undefined
          ? plan.title
          : titleProblems(input.title, problems);
      const description =
        input.description === undefined
          ? plan.description
          : descriptionProblems(input.description, problems);
      const rows = await rowsOf(deps.tx.read(), [plan.id]);
      const changes = new Map<string, { params?: unknown; remove?: boolean }>();
      if (!Array.isArray(input.rows))
        problems.push({ field: 'rows', message: 'rows must be an array.' });
      else
        for (const [index, change] of (
          input.rows as readonly unknown[]
        ).entries()) {
          const field = `rows[${index}]`;
          if (
            !isRecord(change) ||
            typeof change.id !== 'string' ||
            !rows.some((row) => row.id === change.id)
          ) {
            problems.push({
              field,
              message: `${field} must name a row of the plan by its id.`,
            });
            continue;
          }
          if (change.remove !== undefined && typeof change.remove !== 'boolean')
            problems.push({
              field: `${field}.remove`,
              message: `${field}.remove must be true or false.`,
            });
          changes.set(change.id, {
            ...(change.params === undefined ? {} : { params: change.params }),
            ...(change.remove === true ? { remove: true } : {}),
          });
        }
      const kept = rows
        .filter((row) => !changes.get(row.id)?.remove)
        .map((row) => {
          const change = changes.get(row.id);
          return change?.params === undefined
            ? row
            : { ...row, params: change.params };
        });
      if (kept.length === 0)
        problems.push({
          field: 'rows',
          message: 'A plan keeps at least one row; void it instead.',
        });
      if (problems.length > 0) throw malformed(problems);

      const checks = await deps.engine.rehearse(
        acting(viewer, plan.id, plan.proposer),
        engineRows(kept).map((row) => ({ ...row, baseline: null })),
      );
      if (!checks.every((check) => check.ok)) throw planInvalid(checks);
      const at = now();
      await deps.tx.run(async (tx) => {
        if (
          !(await updatePlanIf(
            tx.conn,
            plan.id,
            { revision, statuses: PLAN_OPEN_STATUSES },
            {
              title,
              description,
              status: 'pending',
              failure: null,
              revision: revision + 1,
              rehearsedAt: at.toISOString(),
              expiresAt: later(PLAN_TTL_HOURS, at),
            },
          ))
        )
          throw conflict(
            'REVISION_CONFLICT',
            'The plan was changed meanwhile.',
          );
        await deleteRows(
          tx.conn,
          rows
            .filter((row) => changes.get(row.id)?.remove)
            .map((row) => row.id),
        );
        for (const [index, row] of kept.entries())
          await updateRow(tx.conn, row.id, {
            params: row.params ?? null,
            check: checks[index] ?? null,
            result: null,
          });
        await setPlanIssues(
          tx.conn,
          plan.id,
          await issuesNamedBy(tx.conn, kept),
          newId,
        );
        tx.emit({ type: 'plan.changed', planId: plan.id });
      });
      return viewOf(plan.id);
    },

    async retry(viewer, id, input) {
      const revision = requireRevision(input);
      const plan = await visible(viewer, id);
      await assertNotExpired(plan);
      if (!isOpen(plan.status))
        throw conflict(
          'PLAN_NOT_OPEN',
          'Only an open plan can be checked again.',
        );
      return service.edit(viewer, id, { revision, rows: [] });
    },

    async void(viewer, id, input) {
      const revision = requireRevision(input);
      const plan = await visible(viewer, id);
      await assertNotExpired(plan);
      if (!isOpen(plan.status))
        throw conflict('PLAN_NOT_OPEN', 'Only an open plan can be voided.');
      await deps.tx.run(async (tx) => {
        if (
          !(await updatePlanIf(
            tx.conn,
            plan.id,
            { revision, statuses: PLAN_OPEN_STATUSES },
            { status: 'voided', voidReason: 'person', revision: revision + 1 },
          ))
        )
          throw conflict(
            'REVISION_CONFLICT',
            'The plan was changed meanwhile.',
          );
        await decided(
          tx,
          plan,
          'voided',
          viewer.userId,
          await rowsOf(tx.conn, [plan.id]),
          null,
        );
        tx.emit({ type: 'plan.changed', planId: plan.id });
      });
      return viewOf(plan.id);
    },

    async execute(viewer, id, input) {
      const revision = requireRevision(input);
      const plan = await visible(viewer, id);
      await assertNotExpired(plan);
      if (plan.status !== 'pending')
        throw conflict(
          'PLAN_NOT_OPEN',
          plan.status === 'failed' || plan.status === 'stale'
            ? 'Check the plan again (retry) before executing it.'
            : 'The plan is not waiting to be executed.',
        );
      // pending → executing succeeds once.
      const flipped = await deps.tx.run((tx) =>
        updatePlanIf(
          tx.conn,
          plan.id,
          { revision, statuses: ['pending'] },
          { status: 'executing', revision: revision + 1 },
        ),
      );
      if (!flipped)
        throw conflict('REVISION_CONFLICT', 'The plan was changed meanwhile.');
      const rows = await rowsOf(deps.tx.read(), [plan.id]);
      const at = now().toISOString();
      try {
        await deps.tx.unit(async (tx) => {
          const actingViewer = acting(viewer, plan.id, plan.proposer);
          const results = await deps.engine.execute(
            tx,
            actingViewer,
            engineRows(rows),
          );
          const followUp = deps.onExecuted?.[plan.sourceKind];
          if (followUp)
            await followUp(tx, {
              sourceKind: plan.sourceKind,
              sourceData: plan.sourceData,
              viewer: actingViewer,
              rows: rows.map((row, index) => ({
                ref: row.ref,
                created: results[index]?.created ?? null,
              })),
            });
          for (const [index, row] of rows.entries())
            await updateRow(tx.conn, row.id, {
              result: results[index] ?? null,
            });
          await addPlanIssues(
            tx.conn,
            plan.id,
            issuesOfResults(results),
            newId,
          );
          await updatePlan(tx.conn, plan.id, {
            status: 'executed',
            failure: null,
            executedAt: at,
            executedById: viewer.userId,
            revision: revision + 2,
          });
          const done = await rowsOf(tx.conn, [plan.id]);
          await decided(tx, plan, 'executed', viewer.userId, done, null);
          tx.emit({ type: 'plan.changed', planId: plan.id });
        });
      } catch (error) {
        const failure: PlanFailure =
          error instanceof RowFailure
            ? {
                code: error.error.code,
                message: error.error.message,
                rowId: rows[error.index]?.id ?? null,
                ...(error.error.details
                  ? { details: error.error.details }
                  : {}),
              }
            : error instanceof DomainError
              ? { code: error.code, message: error.message, rowId: null }
              : {
                  code: 'INTERNAL_ERROR',
                  message: 'The plan could not be executed.',
                  rowId: null,
                };
        if (!(error instanceof DomainError) && !(error instanceof RowFailure))
          console.error('A plan failed to execute.', error);
        const outcome =
          error instanceof RowFailure && error.stale ? 'stale' : 'failed';
        await deps.tx.run(async (tx) => {
          await updatePlan(tx.conn, plan.id, {
            status: outcome,
            failure,
            revision: revision + 2,
            // Still open for a retry for the usual time.
            expiresAt: later(PLAN_TTL_HOURS),
          });
          await decided(tx, plan, outcome, viewer.userId, rows, failure);
          tx.emit({ type: 'plan.changed', planId: plan.id });
        });
      }
      return viewOf(plan.id);
    },

    async previewUndo(viewer, id) {
      const { plan, rows, undoRows, checks, skipped } = await prepareUndo(
        viewer,
        id,
      );
      return {
        planId: plan.id,
        revert: undoRows.map((row, index) => {
          const original = rows.find((item) => item.id === row.undoesRowId);
          const params = isRecord(row.params) ? row.params : {};
          return {
            rowId: row.undoesRowId,
            position: original?.position ?? -1,
            op: row.op,
            target:
              checks[index]?.baseline?.target ??
              checks[index]?.target ??
              original?.result?.created ??
              original?.result?.target ??
              null,
            restore:
              row.op === 'issue.update' && isRecord(params.set)
                ? params.set
                : null,
          };
        }),
        skipped,
      };
    },

    async undo(viewer, id) {
      const { plan, rows, undoRows, checks, skipped, actingViewer } =
        await prepareUndo(viewer, id);
      if (undoRows.length === 0)
        throw conflict(
          'NOTHING_TO_UNDO',
          'Everything the plan did was changed since.',
          { skipped },
        );
      try {
        await deps.tx.unit(async (tx) => {
          await deps.engine.execute(
            tx,
            actingViewer,
            undoRows.map((row, index) => ({
              ...row,
              baseline: checks[index]?.baseline ?? null,
            })),
          );
          if (
            !(await updatePlanIf(
              tx.conn,
              plan.id,
              { revision: plan.revision, statuses: ['executed'] },
              {
                status: 'undone',
                skipped,
                revision: plan.revision + 1,
              },
            ))
          )
            throw conflict(
              'REVISION_CONFLICT',
              'The plan was changed meanwhile.',
            );
          await decided(tx, plan, 'undone', viewer.userId, rows, null);
          tx.emit({ type: 'plan.changed', planId: plan.id });
        });
      } catch (error) {
        if (error instanceof RowFailure)
          throw conflict(
            error.stale ? 'UNDO_STALE' : 'UNDO_FAILED',
            error.stale
              ? 'Something changed since the preview; look at what undoing does now and confirm again.'
              : `It could not be undone: ${error.error.message}`,
            { row: error.index, error: error.error },
          );
        throw error;
      }
      return viewOf(plan.id);
    },

    async expire(at = now()) {
      const conn = deps.tx.read();
      let count = 0;
      for (const plan of await expiredPlans(conn, PLAN_OPEN_STATUSES, at))
        await deps.tx.run(async (tx) => {
          if (
            await updatePlanIf(
              tx.conn,
              plan.id,
              { revision: plan.revision, statuses: PLAN_OPEN_STATUSES },
              { status: 'expired', revision: plan.revision + 1 },
            )
          ) {
            count += 1;
            tx.emit({ type: 'plan.changed', planId: plan.id });
          }
        });
      return count;
    },
  };
  return service;
}
