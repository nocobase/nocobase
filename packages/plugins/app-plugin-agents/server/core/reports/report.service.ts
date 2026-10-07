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
import type {
  DatabaseConnection,
  FilterBuilder,
  FilterNode,
} from '@nocobase/db';

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
import { listAgents } from '../agents/index.js';
import type { SubjectFacts, SubjectRegistry } from '../runs/index.js';
import {
  runsRepo,
  usageRepo,
  type RunRecord,
  type UsageRecord as UsageRow,
} from '../runs/run.store.js';
import { reliability } from './metrics.js';
import { modelUsageRows } from './model-usage.js';
import { listPrices } from './prices.js';
import { aggregateUsage, type UsageRecord } from './usage.js';

const DAY_MS = 24 * 3600 * 1000;
const PAGE = 200;

/** Every day of `range`, with the runs started that day by outcome and the day's cost by agent type. */
export function runDays(
  range: Pick<ReportRange, 'start' | 'end'>,
  runs: readonly Pick<RunRecord, 'status' | 'createdAt'>[],
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
): ReportRange {
  const to = day(query.to, 'to') ?? now.toISOString().slice(0, 10);
  const end = new Date(Date.parse(`${to}T00:00:00Z`) + DAY_MS);
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

function anyOf(f: FilterBuilder, field: string, values: readonly string[]) {
  return f.or(values.map((value) => f.string(field).eq(value)));
}

async function inPages<T>(
  ids: readonly string[],
  read: (page: readonly string[]) => Promise<readonly T[]>,
): Promise<T[]> {
  const result: T[] = [];
  for (let at = 0; at < ids.length; at += PAGE)
    result.push(...(await read(ids.slice(at, at + PAGE))));
  return result;
}

const inRange =
  (field: string, range: ReportRange) =>
  (f: FilterBuilder): FilterNode =>
    f.and([
      f.date(field).notBefore(range.start),
      f.date(field).before(range.end),
    ]);

export function createReportService(deps: {
  readonly tx: TxRunner;
  readonly clock: Clock;
  readonly people: People;
  readonly subjects: SubjectRegistry;
}): ReportService {
  const sees = (caller: ReportCaller, run: RunRecord) =>
    caller.allRuns ||
    run.actorUserId === caller.userId ||
    run.ownerUserId === caller.userId;

  /** What the subjects' domains say of the runs' subjects, by `kind:id`; unknown kinds are visible and in no group. */
  async function factsOf(
    conn: DatabaseConnection,
    caller: ReportCaller,
    runs: readonly RunRecord[],
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

  /** The runs the caller counts: theirs or all, on visible subjects, in the group when one is asked. */
  async function countable(
    conn: DatabaseConnection,
    caller: ReportCaller,
    runs: readonly RunRecord[],
    groupId: string | null,
  ) {
    const mine = runs.filter((run) => sees(caller, run));
    const facts = await factsOf(conn, caller, mine);
    const kept = mine.filter((run) => {
      const fact = facts.get(`${run.subjectKind}:${run.subjectId}`);
      return (
        fact !== undefined &&
        fact.visible &&
        (!groupId || fact.group?.id === groupId)
      );
    });
    return { runs: kept, facts };
  }

  async function usageRecords(
    conn: DatabaseConnection,
    caller: ReportCaller,
    range: ReportRange,
    filter: {
      readonly groupId: string | null;
      readonly agentId?: string | null;
      readonly userId?: string | null;
    },
  ) {
    const usage = await usageRepo(conn).findMany({
      filter: inRange('createdAt', range),
    });
    const runIds = [...new Set(usage.map((row) => row.runId))];
    const runs = await inPages<RunRecord>(
      runIds,
      async (page) =>
        await runsRepo(conn).findMany({ filter: (f) => anyOf(f, 'id', page) }),
    );
    const { runs: kept, facts } = await countable(
      conn,
      caller,
      runs.filter(
        (run) =>
          (!filter.agentId || run.agentId === filter.agentId) &&
          (!filter.userId || run.actorUserId === filter.userId),
      ),
      filter.groupId,
    );
    const byId = new Map(kept.map((run) => [run.id, run]));
    const records: UsageRecord[] = [];
    for (const row of usage as readonly UsageRow[]) {
      const run = byId.get(row.runId);
      if (!run) continue;
      const started = iso(run.startedAt);
      const finished = iso(run.finishedAt);
      records.push({
        runId: run.id,
        agentId: run.agentId,
        type: run.agentType,
        userId: run.actorUserId,
        tool: row.tool,
        modelService: row.modelService ?? null,
        model: row.model ?? null,
        subjectKind: run.subjectKind,
        subjectId: run.subjectId,
        groupId:
          facts.get(`${run.subjectKind}:${run.subjectId}`)?.group?.id ?? null,
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
      (await listAgents(conn, true)).map((agent) => [agent.id, agent.name]),
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
          keys.map((key) => [key, facts.get(key)?.label ?? key] as const),
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
      if (!caller.allRuns) return { from: range.from, to: range.to, rows: [] };
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
      const range = reportRange(query, deps.clock.now());
      const conn = deps.tx.read();
      const { records, facts } = await usageRecords(conn, caller, range, {
        groupId: query.groupId ?? null,
        agentId: query.agentId ?? null,
        userId: query.userId ?? null,
      });
      const prices = await listPrices(conn);
      const first = aggregateUsage(
        records,
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
        from: range.from,
        to: range.to,
        groupBy,
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
      const when = (f: FilterBuilder): FilterNode[] => [
        ...(query.start ? [f.date('createdAt').notBefore(query.start)] : []),
        ...(query.end ? [f.date('createdAt').before(query.end)] : []),
      ];
      const found = query.subjects
        ? await inPages<RunRecord>(
            [...new Set(query.subjects.ids)],
            async (page) =>
              await runsRepo(conn).findMany({
                filter: (f) =>
                  f.and([
                    f.string('subjectKind').eq(query.subjects?.kind ?? ''),
                    anyOf(f, 'subjectId', page),
                    ...when(f),
                  ]),
              }),
          )
        : await runsRepo(conn).findMany(
            query.start || query.end ? { filter: (f) => f.and(when(f)) } : {},
          );
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
          createdAt: iso(run.createdAt) ?? '',
          dispatchedAt: iso(run.dispatchedAt),
          startedAt: iso(run.startedAt),
          finishedAt: iso(run.finishedAt),
        }))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },

    async runFigures(caller, range) {
      const now = deps.clock.now();
      const conn = deps.tx.read();
      // Runs started in the range.
      const started = await runsRepo(conn).findMany({
        filter: inRange('createdAt', range),
      });
      const { runs } = await countable(conn, caller, started, range.groupId);
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
        ...reliability(
          runs.map((run) => ({
            status: run.status,
            failureReason: run.failureReason,
            createdAt: iso(run.createdAt) ?? '',
            dispatchedAt: iso(run.dispatchedAt),
            startedAt: iso(run.startedAt),
            finishedAt: iso(run.finishedAt),
            lastActivityAt: iso(run.lastActivityAt),
          })),
          now,
        ),
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
          ...new Set(
            runs.map((run) => (iso(run.createdAt) ?? '').slice(0, 10)),
          ),
        ],
        actorIds: [...new Set(runs.map((run) => run.actorUserId))],
        daily: runDays(range, runs, dailyCost('online'), dailyCost('runner')),
      };
    },
  };
}
