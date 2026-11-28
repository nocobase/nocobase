/**
 * What runs used and cost, over a date range (UTC days, `to` inclusive, the last 30 days by default), for the
 * application's report pages:
 *
 * - `usage`: the tokens each run reported, grouped by agent, the person who woke it, the group of its subject, its
 *   subject, day, model, coding tool or the agent's type (online or runner), with its working time and its cost at the
 *   current prices;
 * - `runFigures`: how the runs started in the range went (failures, claim latency, duration, runs lost), what the
 *   usage reported in the range cost, and when and for whom runs ran. The application adds its subjects' own figures.
 *
 * Who sees what: a caller who may see every run (`allRuns`, which the application decides) counts every run, anyone
 * else the runs they started or own; either way only runs on subjects they may see (`SubjectReports.describe`).
 */
import { runVisibility, subjectBounds } from '../runs/access.js';
import type { DatabaseConnection, SelectQuery } from '@nocobase/db';

import {
  DEFAULT_REPORT_DAYS,
  MAX_REPORT_DAYS,
  USAGE_GROUP_BYS,
  type Costs,
  type ReportRun,
  type ReportRunQuery,
  type RunDay,
  type RunFigures,
  type UsageGroupBy,
  type ModelUsageReport,
  type UsageQuery,
  type UsageReport,
} from '../../../shared/reports.js';
import type { Clock } from '../../kernel/clock.js';
import { invalid } from '../../kernel/errors.js';
import type { People } from '../../kernel/people.js';
import type { TxRunner } from '../../kernel/tx.js';
import { agentsRepo } from '../agents/agent.store.js';
import type { SubjectFacts, SubjectRegistry } from '../runs/index.js';
import type { RunRecord } from '../runs/run.store.js';
import { reliability } from './metrics.js';
import { modelUsageRows } from './model-usage.js';
import { listPrices } from './prices.js';
import { aggregateUsage, type UsageRecord } from './usage.js';

const DAY_MS = 24 * 3600 * 1000;

/** What the reports read of a run: never its texts or execution history. */
type ReportRunRow = Pick<
  RunRecord,
  | 'id'
  | 'agentId'
  | 'agentType'
  | 'status'
  | 'subjectKind'
  | 'subjectId'
  | 'actorUserId'
  | 'ownerUserId'
  | 'retryOfRunId'
  | 'failureReason'
  | 'createdAt'
  | 'dispatchedAt'
  | 'startedAt'
  | 'finishedAt'
  | 'lastActivityAt'
>;

const RUN_COLUMNS = [
  'id',
  'agentId',
  'agentType',
  'status',
  'subjectKind',
  'subjectId',
  'actorUserId',
  'ownerUserId',
  'retryOfRunId',
  'failureReason',
  'createdAt',
  'dispatchedAt',
  'startedAt',
  'finishedAt',
  'lastActivityAt',
] as const;

/** What the usage figures read of a run. */
const USAGE_RUN_COLUMNS = [
  'id',
  'agentId',
  'agentType',
  'actorUserId',
  'ownerUserId',
  'subjectKind',
  'subjectId',
  'startedAt',
  'finishedAt',
] as const;

type Row = Record<string, unknown>;

/**
 * The most parameters one statement may bind, by dialect: SQLite as bundled with better-sqlite3 (32766 since SQLite
 * 3.32), the 16-bit count of PostgreSQL's and MySQL's protocols, SQL Server's 2100; 999, SQLite's oldest default,
 * for any other.
 */
const PARAMETER_LIMITS: Readonly<Record<string, number>> = {
  sqlite: 32_766,
  postgres: 65_535,
  mysql: 65_535,
  mariadb: 65_535,
  oracle: 65_535,
  mssql: 2_100,
};

/**
 * How a usage report reads its runs: at most `runIds` ids a read (Oracle takes no more in one `IN` list), and within
 * `parameters`, or the dialect's limit when null, with the statement's other parameters (the visibility bound's, such
 * as the ids of the projects a reader sees). Tests lower them.
 */
export const usageReadLimits: { parameters: number | null; runIds: number } = {
  parameters: null,
  runIds: 1_000,
};

const text = (value: unknown): string =>
  typeof value === 'string'
    ? value
    : typeof value === 'number' || typeof value === 'bigint'
      ? String(value)
      : '';
const textOrNull = (value: unknown): string | null =>
  value === null || value === undefined ? null : text(value);

/** Every day of `range`, with the runs started that day by outcome and the day's cost by agent type. */
export function runDays(
  range: Pick<ReportRange, 'start' | 'end'>,
  runs: readonly { readonly status: string; readonly createdAt: string }[],
  onlineCost: ReadonlyMap<string, Costs | null>,
  runnerCost: ReadonlyMap<string, Costs | null>,
): RunDay[] {
  const days = new Map<string, RunDay>();
  for (let at = range.start.getTime(); at < range.end.getTime(); at += DAY_MS) {
    const day = new Date(at).toISOString().slice(0, 10);
    days.set(day, {
      day,
      completed: 0,
      failed: 0,
      cancelled: 0,
      open: 0,
      onlineCost: onlineCost.get(day) ?? null,
      runnerCost: runnerCost.get(day) ?? null,
    });
  }
  for (const run of runs) {
    const day = days.get(new Date(run.createdAt).toISOString().slice(0, 10));
    if (!day) continue;
    const outcome =
      run.status === 'completed' ||
      run.status === 'failed' ||
      run.status === 'cancelled'
        ? run.status
        : 'open';
    days.set(day.day, { ...day, [outcome]: day[outcome] + 1 });
  }
  return [...days.values()];
}

/** Who is asking, and whether they may see every run. */
export interface ReportCaller {
  readonly userId: string;
  readonly allRuns: boolean;
}

export interface ReportService {
  /**
   * What model calls outside runs used in the range (embeddings, reranking, utility texts), by purpose, caller and
   * model; rows only for a caller who may see every run.
   */
  modelUsage(
    caller: ReportCaller,
    query: { readonly from?: string; readonly to?: string },
  ): Promise<ModelUsageReport>;
  /** `from` / `to` as UTC days; 400 when they are not dates, or out of order, or span more than 366 days. */
  range(query: { readonly from?: string; readonly to?: string }): ReportRange;
  usage(caller: ReportCaller, query: UsageQuery): Promise<UsageReport>;
  /** The runs started in `range` (of `groupId`'s subjects, when given), and the usage reported in it. */
  runFigures(
    caller: ReportCaller,
    range: ReportRange & { readonly groupId: string | null },
  ): Promise<RunFigures>;
  /**
   * The runs the caller counts, queued in the range and/or on the subjects asked, oldest first, for the application to
   * work out figures of its own (how often an agent waited for a person, how many runs a subject took).
   */
  runRecords(caller: ReportCaller, query: ReportRunQuery): Promise<ReportRun[]>;
}

export interface ReportRange {
  readonly from: string;
  readonly to: string;
  readonly start: Date;
  /** Exclusive: the day after `to`. */
  readonly end: Date;
  /** No start was asked and none applies: every day up to `to` (one subject's report). */
  readonly unbounded?: boolean;
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

function day(value: string | undefined, name: string): string | null {
  if (value === undefined || value === '') return null;
  if (
    !DAY_PATTERN.test(value) ||
    Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value
  )
    throw invalid(`${name} must be a date (YYYY-MM-DD).`);
  return value;
}

/** `from` / `to` as UTC days, `to` inclusive; the last 30 days up to today by default, at most 366 days. */
export function reportRange(
  query: { readonly from?: string; readonly to?: string },
  now: Date,
  options: { readonly unbounded?: boolean } = {},
): ReportRange {
  const to = day(query.to, 'to') ?? now.toISOString().slice(0, 10);
  const end = new Date(Date.parse(`${to}T00:00:00Z`) + DAY_MS);
  if (options.unbounded && !day(query.from, 'from'))
    return { from: '1970-01-01', to, start: new Date(0), end, unbounded: true };
  const from =
    day(query.from, 'from') ??
    new Date(end.getTime() - DEFAULT_REPORT_DAYS * DAY_MS)
      .toISOString()
      .slice(0, 10);
  const start = new Date(`${from}T00:00:00Z`);
  const days = (end.getTime() - start.getTime()) / DAY_MS;
  if (days < 1 || days > MAX_REPORT_DAYS)
    throw invalid(
      `from must not be after to, and a report covers at most ${MAX_REPORT_DAYS} days.`,
    );
  return { from, to, start, end };
}

const iso = (value: unknown): string | null =>
  value === null || value === undefined || value === ''
    ? null
    : new Date(value as string).toISOString();

/** A run as the reports read it, its times as ISO strings whichever way the driver returns them. */
function runRow(row: Row, prefix = ''): ReportRunRow {
  const at = (name: string) => row[`${prefix}${name}`];
  return {
    id: text(at('id')),
    agentId: text(at('agentId')),
    agentType: text(at('agentType')),
    status: text(at('status')) as RunRecord['status'],
    subjectKind: text(at('subjectKind')),
    subjectId: text(at('subjectId')),
    actorUserId: text(at('actorUserId')),
    ownerUserId: textOrNull(at('ownerUserId')),
    retryOfRunId: textOrNull(at('retryOfRunId')),
    failureReason: textOrNull(at('failureReason')),
    createdAt: iso(at('createdAt')) ?? '',
    dispatchedAt: iso(at('dispatchedAt')),
    startedAt: iso(at('startedAt')),
    finishedAt: iso(at('finishedAt')),
    lastActivityAt: iso(at('lastActivityAt')),
  };
}

export function createReportService(deps: {
  readonly tx: TxRunner;
  readonly clock: Clock;
  readonly people: People;
  readonly subjects: SubjectRegistry;
  readonly includeOnlineUsage: () => Promise<boolean>;
}): ReportService {
  async function callersRuns<Q extends SelectQuery<Row, Row>>(
    query: Q,
    caller: ReportCaller,
    table = 'agRuns',
  ): Promise<Q> {
    return query.where(
      await runVisibility(
        deps.tx.read(),
        deps.subjects,
        caller.userId,
        caller.allRuns,
        table,
      ),
    ) as Q;
  }
  /** What the subjects' domains say of the runs' subjects, by `kind:id`; unknown kinds are visible and in no group. */
  async function factsOf(
    conn: DatabaseConnection,
    caller: ReportCaller,
    runs: readonly Pick<ReportRunRow, 'subjectKind' | 'subjectId'>[],
  ): Promise<Map<string, SubjectFacts>> {
    const byKind = new Map<string, Set<string>>();
    for (const run of runs) {
      const ids = byKind.get(run.subjectKind) ?? new Set<string>();
      ids.add(run.subjectId);
      byKind.set(run.subjectKind, ids);
    }
    const facts = new Map<string, SubjectFacts>();
    for (const [kind, ids] of byKind) {
      const reports = deps.subjects.get(kind)?.reports;
      const known = reports
        ? await reports.describe(conn, caller.userId, [...ids])
        : new Map<string, SubjectFacts>();
      for (const id of ids)
        facts.set(
          `${kind}:${id}`,
          known.get(id) ??
            (reports
              ? { label: id, visible: false, group: null }
              : { label: id, visible: true, group: null }),
        );
    }
    return facts;
  }

  /** Of runs the caller started or owns (or any, `callersRuns`), those on visible subjects, in the group when one is asked. */
  async function countable<
    T extends Pick<ReportRunRow, 'subjectKind' | 'subjectId'>,
  >(
    conn: DatabaseConnection,
    caller: ReportCaller,
    runs: readonly T[],
    groupId: string | null,
  ) {
    const facts = await factsOf(conn, caller, runs);
    const kept = runs.filter((run) => {
      const fact = facts.get(`${run.subjectKind}:${run.subjectId}`);
      return (
        fact !== undefined &&
        (deps.subjects.get(run.subjectKind)?.visibleSubjects
          ? true
          : fact.visible) &&
        (!groupId || fact.group?.id === groupId)
      );
    });
    return { runs: kept, facts };
  }

  /** The runs queued in `[start, end)` the caller counts, in one read. */
  async function runsQueued(
    conn: DatabaseConnection,
    caller: ReportCaller,
    range: { readonly start?: Date; readonly end?: Date },
  ): Promise<ReportRunRow[]> {
    let query = conn.query.selectFrom('agRuns').select([...RUN_COLUMNS]);
    if (range.start) query = query.where('createdAt', '>=', range.start);
    if (range.end) query = query.where('createdAt', '<', range.end);
    return (await (await callersRuns(query, caller)).execute<Row>()).map(
      (row) => runRow(row),
    );
  }

  /**
   * The usage reported in the range of the runs the caller counts: one read of the usage, and one read of the runs it
   * was reported for per batch of ids (`usageReadLimits`), a single batch unless the runs are many. However many ids
   * a reader's visibility binds, the usage read binds none of them: the runs' reads say which runs the caller sees.
   */
  async function usageRecords(
    conn: DatabaseConnection,
    caller: ReportCaller,
    range: ReportRange,
    filter: {
      readonly groupId: string | null;
      readonly agentId?: string | null;
      readonly userId?: string | null;
      readonly subject?: { readonly kind: string; readonly id: string } | null;
    },
  ) {
    // Read once: what the caller may see of each subject kind now, for the runs they count and for naming subjects.
    const bounds = await subjectBounds(conn, deps.subjects, caller.userId);
    // In the usage read only what binds no more than a few parameters: a caller who may not see every run counts the
    // runs they woke or own; one who may counts those and the runs inside their bound, which their runs' reads say.
    const visibility = await runVisibility(
      conn,
      deps.subjects,
      caller.userId,
      caller.allRuns,
      'run',
      null,
    );
    const ofRuns = <Q extends SelectQuery<Row, Row>>(query: Q): Q => {
      let scoped = query.where(visibility) as Q;
      if (filter.agentId)
        scoped = scoped.where('run.agentId', '=', filter.agentId) as Q;
      if (filter.userId)
        scoped = scoped.where('run.actorUserId', '=', filter.userId) as Q;
      if (filter.subject)
        scoped = scoped
          .where('run.subjectKind', '=', filter.subject.kind)
          .where('run.subjectId', '=', filter.subject.id) as Q;
      return scoped;
    };
    // The usage of the runs the caller may count, in one read. The caller counts the runs they woke or own even on
    // subjects they may no longer see (`runVisibility`).
    const usage = await ofRuns(
      conn.query
        .selectFrom('agRunUsage as usage')
        .innerJoin('agRuns as run', 'run.id', 'usage.runId')
        .select([
          'usage.runId as runId',
          'usage.tool as tool',
          'usage.modelService as modelService',
          'usage.model as model',
          'usage.inputTokens as inputTokens',
          'usage.outputTokens as outputTokens',
          'usage.cacheReadTokens as cacheReadTokens',
          'usage.cacheWriteTokens as cacheWriteTokens',
          'usage.reasoningTokens as reasoningTokens',
          'usage.createdAt as createdAt',
        ])
        .where('usage.createdAt', '>=', range.start)
        .where('usage.createdAt', '<', range.end)
        .orderBy('usage.id'),
    ).execute<Row>();
    // Each of those runs once, however many usage records it has, by the ids the usage named (one read unless they
    // exceed a batch) and, when a kind bounds who sees its subjects, whether the run's subject is inside that bound now
    // (`insideId`, null outside it), worked out once per run.
    const ids = [...new Set(usage.map((row) => text(row.runId)))];
    const runs: ReportRunRow[] = [];
    const inside = bounds ? new Set<string>() : null;
    const runsOf = (batch: readonly string[]) =>
      conn.query
        .selectFrom('agRuns as run')
        .select((eb) => [
          ...USAGE_RUN_COLUMNS.map((column) => `run.${column} as ${column}`),
          ...(bounds
            ? [
                eb
                  .selectFrom('agRuns as inside')
                  .select('inside.id')
                  .whereRef('inside.id', '=', 'run.id')
                  .where((inner) => bounds(inner, 'inside'))
                  .as('insideId'),
              ]
            : []),
        ])
        .where('run.id', 'in', batch);
    // The ids fill what the statement's own parameters leave of the limit, and what the adapter may add when it runs
    // it: at most one a column read (PostgreSQL formats each time column with one).
    const limit =
      usageReadLimits.parameters ?? PARAMETER_LIMITS[conn.dialect] ?? 999;
    const own =
      ids.length === 0
        ? 0
        : runsOf(ids.slice(0, 1)).compile().parameters.length -
          1 +
          USAGE_RUN_COLUMNS.length;
    if (ids.length > 0 && own >= limit)
      throw new Error(
        `The visibility of the usage report's subjects needs ${own} parameters of the ${limit} one statement may bind, leaving none for the runs.`,
      );
    const size = Math.min(usageReadLimits.runIds, limit - own);
    for (let at = 0; at < ids.length; at += size) {
      const rows = await runsOf(ids.slice(at, at + size)).execute<Row>();
      for (const row of rows) {
        const run = runRow(row);
        runs.push(run);
        if (inside && row.insideId !== null && row.insideId !== undefined)
          inside.add(run.id);
      }
    }
    // Of a caller who may see every run, the runs they neither woke nor own count only inside their bound.
    const seen = runs.filter(
      (run) =>
        !caller.allRuns ||
        inside === null ||
        inside.has(run.id) ||
        run.actorUserId === caller.userId ||
        run.ownerUserId === caller.userId,
    );
    const { runs: counted, facts } = await countable(conn, caller, seen, null);
    // What identifies a subject the caller may not see now (it, its group) is left out of the records, and a group
    // filter matches only the groups the caller sees, so asking for that group never counts it either.
    // A private kind's counted runs are all the caller's own (`runVisibility` keeps no one else's), and its people see
    // its subjects, so they stay named; its bound only keeps other people's runs out.
    const shown = (run: ReportRunRow): boolean =>
      facts.get(`${run.subjectKind}:${run.subjectId}`)?.visible === true &&
      (inside === null ||
        inside.has(run.id) ||
        deps.subjects.get(run.subjectKind)?.private === true);
    const groupOf = (run: ReportRunRow) =>
      shown(run)
        ? (facts.get(`${run.subjectKind}:${run.subjectId}`)?.group?.id ?? null)
        : null;
    const kept = filter.groupId
      ? counted.filter((run) => groupOf(run) === filter.groupId)
      : counted;
    const byId = new Map(kept.map((run) => [run.id, run]));
    const records: UsageRecord[] = [];
    for (const row of usage) {
      const run = byId.get(text(row.runId));
      if (!run) continue;
      const started = run.startedAt;
      const finished = run.finishedAt;
      records.push({
        runId: run.id,
        agentId: run.agentId,
        type: run.agentType,
        userId: run.actorUserId,
        tool: text(row.tool),
        modelService: textOrNull(row.modelService),
        model: textOrNull(row.model),
        // A subject left out of the caller's view adds to one unnamed row by subject or group.
        ...(shown(run)
          ? { subjectKind: run.subjectKind, subjectId: run.subjectId }
          : { subjectKind: '', subjectId: '' }),
        groupId: groupOf(run),
        day: (iso(row.createdAt) ?? '').slice(0, 10),
        durationMs:
          started && finished
            ? Math.max(0, Date.parse(finished) - Date.parse(started))
            : 0,
        inputTokens: Number(row.inputTokens) || 0,
        outputTokens: Number(row.outputTokens) || 0,
        cacheReadTokens: Number(row.cacheReadTokens) || 0,
        cacheWriteTokens: Number(row.cacheWriteTokens) || 0,
        reasoningTokens: Number(row.reasoningTokens) || 0,
      });
    }
    return { records, facts };
  }

  async function agentNames(
    conn: DatabaseConnection,
  ): Promise<Map<string, string>> {
    return new Map(
      (
        await agentsRepo(conn).findMany({
          select: (select) => select.fields('id', 'name'),
        })
      ).map((agent) => [agent.id, agent.name]),
    );
  }

  async function groupNames(
    conn: DatabaseConnection,
    groupBy: UsageGroupBy,
    keys: readonly string[],
    facts: ReadonlyMap<string, SubjectFacts>,
  ): Promise<Map<string, string>> {
    switch (groupBy) {
      case 'agent':
        return agentNames(conn);
      case 'person':
        return new Map(await deps.people.names(conn, keys));
      case 'group': {
        const names = new Map<string, string>();
        for (const fact of facts.values())
          if (fact.group) names.set(fact.group.id, fact.group.name);
        return names;
      }
      case 'subject':
        return new Map(
          keys
            .filter(Boolean)
            .map((key) => [key, facts.get(key)?.label ?? key] as const),
        );
      case 'type':
        // `online` and `runner` are words the application's pages translate; no name of the server's.
        return new Map();
      default:
        return new Map(keys.filter(Boolean).map((key) => [key, key] as const));
    }
  }

  return {
    range: (query) => reportRange(query, deps.clock.now()),

    async modelUsage(caller, query) {
      const range = reportRange(query, deps.clock.now());
      if (!caller.allRuns || !(await deps.includeOnlineUsage()))
        return { from: range.from, to: range.to, rows: [] };
      const conn = deps.tx.read();
      return {
        from: range.from,
        to: range.to,
        rows: await modelUsageRows(conn, range, await listPrices(conn)),
      };
    },

    async usage(caller, query) {
      const groupBy = query.groupBy ?? 'agent';
      if (!USAGE_GROUP_BYS.includes(groupBy))
        throw invalid(`groupBy must be one of ${USAGE_GROUP_BYS.join(', ')}.`);
      const subject =
        query.subjectKind && query.subjectId
          ? { kind: query.subjectKind, id: query.subjectId }
          : null;
      // One subject's report covers its whole life unless a start is asked: it is never more than that subject's runs.
      const range = reportRange(query, deps.clock.now(), {
        unbounded: subject !== null,
      });
      const conn = deps.tx.read();
      const read = await usageRecords(conn, caller, range, {
        groupId: query.groupId ?? null,
        agentId: query.agentId ?? null,
        userId: query.userId ?? null,
        subject,
      });
      const { facts } = read;
      // A report of one subject the caller may no longer see is empty (its records come unnamed).
      const records = subject
        ? read.records.filter((record) => record.subjectKind !== '')
        : read.records;
      const prices = await listPrices(conn);
      const online = await deps.includeOnlineUsage();
      const first = aggregateUsage(
        online
          ? records
          : records.filter(
              (record) => record.type !== 'online' && record.tool !== 'online',
            ),
        groupBy,
        prices,
        undefined,
        query.series === true,
      );
      const names = await groupNames(
        conn,
        groupBy,
        first.rows.map((row) => row.key),
        facts,
      );
      return {
        to: range.to,
        groupBy,
        from:
          range.unbounded && !query.from
            ? (records.reduce<string | null>(
                (first, record) =>
                  first === null || record.day < first ? record.day : first,
                null,
              ) ?? range.to)
            : range.from,
        rows: first.rows.map((row) => ({
          ...row,
          name: names.get(row.key) ?? null,
        })),
        totals: first.totals,
        daily: first.daily,
        unpricedModels: first.unpricedModels,
      };
    },

    async runRecords(caller, query) {
      if (query.subjects && query.subjects.ids.length === 0) return [];
      const conn = deps.tx.read();
      let found: ReportRunRow[];
      if (query.subjects) {
        let select = conn.query
          .selectFrom('agRuns')
          .select([...RUN_COLUMNS])
          .where('subjectKind', '=', query.subjects.kind)
          .where('subjectId', 'in', [...new Set(query.subjects.ids)]);
        if (query.start) select = select.where('createdAt', '>=', query.start);
        if (query.end) select = select.where('createdAt', '<', query.end);
        found = (await (await callersRuns(select, caller)).execute<Row>()).map(
          (row) => runRow(row),
        );
      } else found = await runsQueued(conn, caller, query);
      const { runs } = await countable(conn, caller, found, query.groupId);
      return runs
        .map((run): ReportRun => ({
          id: run.id,
          agentId: run.agentId,
          subjectKind: run.subjectKind,
          subjectId: run.subjectId,
          status: run.status,
          failureReason: run.failureReason,
          retryOfRunId: run.retryOfRunId,
          createdAt: run.createdAt,
          dispatchedAt: run.dispatchedAt,
          startedAt: run.startedAt,
          finishedAt: run.finishedAt,
        }))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },

    async runFigures(caller, range) {
      const now = deps.clock.now();
      const conn = deps.tx.read();
      // Runs started in the range.
      const { runs } = await countable(
        conn,
        caller,
        await runsQueued(conn, caller, range),
        range.groupId,
      );
      // Cost of the usage reported in the range.
      const { records } = await usageRecords(conn, caller, range, {
        groupId: range.groupId,
      });
      const prices = await listPrices(conn);
      const usage = aggregateUsage(records, 'agent', prices);
      const byType = aggregateUsage(records, 'type', prices);
      const dailyCost = (type: 'online' | 'runner') =>
        new Map(
          aggregateUsage(
            records.filter((record) =>
              type === 'online'
                ? record.type === 'online'
                : record.type !== 'online',
            ),
            'day',
            prices,
          ).daily.map((point) => [point.day, point.cost] as const),
        );
      const names = await agentNames(conn);
      return {
        ...reliability(runs, now),
        inputTokens: usage.totals.inputTokens,
        outputTokens: usage.totals.outputTokens,
        estimatedCost: usage.totals.cost,
        costByAgent: usage.rows.map((row) => ({
          agentId: row.key,
          name: names.get(row.key) ?? null,
          cost: row.cost,
        })),
        usageByType: byType.rows.map((row) => ({
          type: row.key === 'online' ? 'online' : 'runner',
          runs: row.runs,
          inputTokens: row.inputTokens,
          outputTokens: row.outputTokens,
          cacheReadTokens: row.cacheReadTokens,
          cost: row.cost,
        })),
        activityDays: [
          ...new Set(runs.map((run) => run.createdAt.slice(0, 10))),
        ],
        actorIds: [...new Set(runs.map((run) => run.actorUserId))],
        daily: runDays(range, runs, dailyCost('online'), dailyCost('runner')),
      };
    },
  };
}
