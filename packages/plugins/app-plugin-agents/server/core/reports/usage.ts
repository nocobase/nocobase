/**
 * Grouping usage records into report rows, with cost worked out from the prices as they are now. Pure: the service
 * reads the records and names, this adds them up.
 *
 * A record is one model's tokens in one run. A run counts once in a group however many records it has; its working
 * time (start to finish) counts once too. A record without a matching price adds no cost: a group with no priced record
 * has `cost: null`, and `pricedRuns` counts the runs whose every record was priced.
 */
import {
  priceFor,
  sourceLabel,
  type Costs,
  type ModelPrice,
  type PriceBook,
  type UsageGroupBy,
  type UsagePoint,
  type UsageRow,
  type UsageSeriesPoint,
} from '../../../shared/reports.js';
import { costOf } from './prices.js';

export interface UsageRecord {
  readonly runId: string;
  readonly agentId: string;
  /** The agent's type, `online` or `runner`. */
  readonly type: string;
  /** Who woke the agent. */
  readonly userId: string;
  readonly tool: string;
  /** The model service of an online model call; null for a coding tool's usage. */
  readonly modelService: string | null;
  readonly model: string | null;
  readonly subjectKind: string;
  readonly subjectId: string;
  /** The group of the run's subject, when its domain names one. */
  readonly groupId: string | null;
  /** `YYYY-MM-DD` (UTC) the usage was reported. */
  readonly day: string;
  /** The run's start to finish, or 0 when it never started. */
  readonly durationMs: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens: number;
  readonly cacheWriteTokens: number;
  readonly reasoningTokens: number;
}

interface Accumulator {
  readonly runs: Map<string, number>;
  readonly unpriced: Set<string>;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  reasoningTokens: number;
  readonly cost: Map<string, number>;
}

function accumulator(): Accumulator {
  return {
    runs: new Map(),
    unpriced: new Set(),
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    reasoningTokens: 0,
    cost: new Map(),
  };
}

function add(
  acc: Accumulator,
  record: UsageRecord,
  price: ModelPrice | null,
): void {
  acc.runs.set(record.runId, record.durationMs);
  acc.inputTokens += record.inputTokens;
  acc.outputTokens += record.outputTokens;
  acc.cacheReadTokens += record.cacheReadTokens;
  acc.cacheWriteTokens += record.cacheWriteTokens;
  acc.reasoningTokens += record.reasoningTokens;
  if (price)
    acc.cost.set(
      price.currency,
      (acc.cost.get(price.currency) ?? 0) + costOf(price, record),
    );
  else acc.unpriced.add(record.runId);
}

/** Amounts rounded to a millionth, or null when nothing was priced. */
export function costs(amounts: ReadonlyMap<string, number>): Costs | null {
  if (amounts.size === 0) return null;
  return Object.fromEntries(
    [...amounts].map(([currency, value]) => [
      currency,
      Math.round(value * 1e6) / 1e6,
    ]),
  );
}

function toRow(key: string, name: string | null, acc: Accumulator): UsageRow {
  let durationMs = 0;
  for (const duration of acc.runs.values()) durationMs += duration;
  return {
    key,
    name,
    runs: acc.runs.size,
    durationMs,
    inputTokens: acc.inputTokens,
    outputTokens: acc.outputTokens,
    cacheReadTokens: acc.cacheReadTokens,
    cacheWriteTokens: acc.cacheWriteTokens,
    reasoningTokens: acc.reasoningTokens,
    cost: costs(acc.cost),
    pricedRuns: [...acc.runs.keys()].filter((id) => !acc.unpriced.has(id))
      .length,
  };
}

/** The group a record falls in; `''` for a record without a group (or model). */
export function keyOf(record: UsageRecord, groupBy: UsageGroupBy): string {
  switch (groupBy) {
    case 'agent':
      return record.agentId;
    case 'person':
      return record.userId;
    case 'group':
      return record.groupId ?? '';
    case 'subject':
      return `${record.subjectKind}:${record.subjectId}`;
    case 'day':
      return record.day;
    case 'model':
      return record.model ?? '';
    case 'tool':
      return record.tool;
    case 'type':
      return record.type;
  }
}

/** The first cost of a row, for ordering (rows of one currency compare as expected). */
const firstCost = (row: UsageRow): number =>
  row.cost ? (Object.values(row.cost)[0] ?? 0) : -1;

const tokensOf = (row: UsageRow): number =>
  row.inputTokens +
  row.outputTokens +
  row.cacheReadTokens +
  row.cacheWriteTokens;

export interface AggregatedUsage {
  readonly rows: UsageRow[];
  readonly totals: UsageRow;
  readonly daily: UsagePoint[];
  readonly unpricedModels: string[];
}

const tokensAndCost = (acc: Accumulator): Omit<UsageSeriesPoint, 'key'> => ({
  inputTokens: acc.inputTokens,
  outputTokens: acc.outputTokens,
  cacheReadTokens: acc.cacheReadTokens,
  cacheWriteTokens: acc.cacheWriteTokens,
  cost: costs(acc.cost),
});

/**
 * Groups `records`; `names` gives a group key its display name. Rows come by cost (unpriced last) then tokens; by
 * day, in date order. With `series`, each day is also broken down by group, in the rows' order.
 */
export function aggregateUsage(
  records: readonly UsageRecord[],
  groupBy: UsageGroupBy,
  book: PriceBook,
  names: ReadonlyMap<string, string> = new Map(),
  series = false,
): AggregatedUsage {
  const groups = new Map<string, Accumulator>();
  const days = new Map<string, Accumulator>();
  const dayGroups = new Map<string, Map<string, Accumulator>>();
  const total = accumulator();
  const unpricedModels = new Set<string>();
  const priceOf = new Map<string, ModelPrice | null>();
  for (const record of records) {
    const source = sourceLabel(record);
    if (!priceOf.has(source)) priceOf.set(source, priceFor(book, record));
    const price = priceOf.get(source) ?? null;
    if (!price) unpricedModels.add(record.model ? source : '');
    const key = keyOf(record, groupBy);
    const group = groups.get(key) ?? accumulator();
    groups.set(key, group);
    add(group, record, price);
    const day = days.get(record.day) ?? accumulator();
    days.set(record.day, day);
    add(day, record, price);
    if (series) {
      const byKey = dayGroups.get(record.day) ?? new Map<string, Accumulator>();
      dayGroups.set(record.day, byKey);
      const cell = byKey.get(key) ?? accumulator();
      byKey.set(key, cell);
      add(cell, record, price);
    }
    add(total, record, price);
  }
  const rows = [...groups].map(([key, acc]) =>
    toRow(key, names.get(key) ?? null, acc),
  );
  rows.sort((a, b) =>
    groupBy === 'day'
      ? a.key.localeCompare(b.key)
      : firstCost(b) - firstCost(a) || tokensOf(b) - tokensOf(a),
  );
  const daily = [...days]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, acc]): UsagePoint => {
      const point = { day, ...tokensAndCost(acc) };
      if (!series) return point;
      const byKey = dayGroups.get(day) ?? new Map<string, Accumulator>();
      return {
        ...point,
        series: rows
          .filter((row) => byKey.has(row.key))
          .map((row) => ({
            key: row.key,
            ...tokensAndCost(byKey.get(row.key) ?? accumulator()),
          })),
      };
    });
  return {
    rows,
    totals: toRow('total', null, total),
    daily,
    unpricedModels: [...unpricedModels].sort(),
  };
}
