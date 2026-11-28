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
import type { RunBucket, SourceBucket, TokenBucket } from './usage-query.js';

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

interface TokenTotals {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  reasoningTokens: number;
  readonly cost: Map<string, number>;
}

function tokenTotals(): TokenTotals {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    reasoningTokens: 0,
    cost: new Map(),
  };
}

interface Accumulator extends TokenTotals {
  readonly runs: Map<string, number>;
  readonly unpriced: Set<string>;
}

function accumulator(): Accumulator {
  return { ...tokenTotals(), runs: new Map(), unpriced: new Set() };
}

type TokenCounts = Omit<TokenTotals, 'cost'>;

function addTokens(
  acc: TokenTotals,
  record: TokenCounts,
  price: ModelPrice | null,
): void {
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
}

function add(acc: Accumulator, record: UsageRecord, price: ModelPrice | null) {
  acc.runs.set(record.runId, record.durationMs);
  if (!price) acc.unpriced.add(record.runId);
  addTokens(acc, record, price);
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
      // A subject left out of the caller's view (`subjectKind` emptied) adds to one unnamed row.
      return record.subjectKind
        ? `${record.subjectKind}:${record.subjectId}`
        : '';
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

const tokensAndCost = (acc: TokenTotals): Omit<UsageSeriesPoint, 'key'> => ({
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
  const daily = orderUsage(groupBy, rows, days, series ? dayGroups : null);
  return {
    rows,
    totals: toRow('total', null, total),
    daily,
    unpricedModels: [...unpricedModels].sort(),
  };
}

function orderUsage(
  groupBy: UsageGroupBy,
  rows: UsageRow[],
  days: ReadonlyMap<string, TokenTotals>,
  dayGroups: ReadonlyMap<string, ReadonlyMap<string, TokenTotals>> | null,
): UsagePoint[] {
  const series = dayGroups !== null;
  rows.sort((a, b) =>
    groupBy === 'day'
      ? a.key.localeCompare(b.key)
      : firstCost(b) - firstCost(a) || tokensOf(b) - tokensOf(a),
  );
  return [...days]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, acc]): UsagePoint => {
      const point = { day, ...tokensAndCost(acc) };
      if (!series) return point;
      const byKey = dayGroups?.get(day) ?? new Map<string, TokenTotals>();
      return {
        ...point,
        series: rows
          .filter((row) => byKey.has(row.key))
          .map((row) => ({
            key: row.key,
            ...tokensAndCost(byKey.get(row.key) ?? tokenTotals()),
          })),
      };
    });
}

const stringOrNull = (value: string | null): string | null =>
  value === null ? null : String(value);

function sourceOf(row: SourceBucket): SourceBucket {
  return {
    tool: String(row.tool),
    model_service: stringOrNull(row.model_service),
    model: stringOrNull(row.model),
  };
}

interface BucketPrices {
  readonly of: (row: SourceBucket) => ModelPrice | null;
  readonly unpriced: readonly SourceBucket[];
  readonly allUnpriced: boolean;
  readonly unpricedModels: string[];
}

export function priceBuckets(
  rows: readonly TokenBucket[],
  book: PriceBook,
): BucketPrices {
  const combinations = new Map<
    string,
    { source: SourceBucket; price: ModelPrice | null }
  >();
  const prices = new Map<string, ModelPrice | null>();
  const unpricedModels = new Set<string>();
  for (const row of rows) {
    const source = sourceOf(row);
    const key = JSON.stringify(source);
    if (combinations.has(key)) continue;
    const usageSource = { ...source, modelService: source.model_service };
    const label = sourceLabel(usageSource);
    // The detail report resolves the first occurrence of every display source in usage-ID order.
    if (!prices.has(label)) prices.set(label, priceFor(book, usageSource));
    const price = prices.get(label) ?? null;
    combinations.set(key, { source, price });
    if (!price) unpricedModels.add(source.model ? label : '');
  }
  const unpriced = [...combinations.values()]
    .filter(({ price }) => !price)
    .map(({ source }) => source);
  return {
    of: (row: SourceBucket) =>
      combinations.get(JSON.stringify(sourceOf(row)))?.price ?? null,
    unpriced,
    allUnpriced: unpriced.length === combinations.size,
    unpricedModels: [...unpricedModels].sort(),
  };
}

type RunTotals = Pick<UsageRow, 'runs' | 'durationMs' | 'pricedRuns'>;

function runTotals(rows: readonly RunBucket[]): RunTotals {
  let runs = 0;
  let durationMs = 0;
  let unpriced = 0;
  for (const row of rows) {
    runs += Number(row.runs);
    durationMs += Number(row.duration);
    unpriced += Number(row.unpriced_runs);
  }
  return { runs, durationMs, pricedRuns: runs - unpriced };
}

function totalsFor(map: Map<string, TokenTotals>, key: string): TokenTotals {
  const found = map.get(key);
  if (found) return found;
  const entry = tokenTotals();
  map.set(key, entry);
  return entry;
}

function counts(row: TokenBucket): TokenCounts {
  return {
    inputTokens: Number(row.input_tokens),
    outputTokens: Number(row.output_tokens),
    cacheReadTokens: Number(row.cache_read_tokens),
    cacheWriteTokens: Number(row.cache_write_tokens),
    reasoningTokens: Number(row.reasoning_tokens),
  };
}

/** Merge SQL buckets after subject names, visibility and price rules have been resolved. */
export function mergeUsageBuckets(options: {
  readonly groupBy: UsageGroupBy;
  readonly tokens: readonly TokenBucket[];
  readonly daily: readonly TokenBucket[];
  readonly runs: readonly RunBucket[];
  readonly totalRuns: readonly RunBucket[];
  readonly price: BucketPrices;
  readonly keyOf: (row: TokenBucket | RunBucket) => string;
  readonly series: boolean;
}): AggregatedUsage & { readonly roundingSensitive: boolean } {
  const groups = new Map<string, TokenTotals>();
  const days = new Map<string, TokenTotals>();
  const dayGroups = new Map<string, Map<string, TokenTotals>>();
  const total = tokenTotals();
  for (const row of options.tokens) {
    const key = options.keyOf(row);
    const price = options.price.of(row);
    const tokens = counts(row);
    addTokens(totalsFor(groups, key), tokens, price);
    addTokens(total, tokens, price);
    if (options.series && row.utc_day) {
      const byKey =
        dayGroups.get(row.utc_day) ?? new Map<string, TokenTotals>();
      dayGroups.set(row.utc_day, byKey);
      addTokens(totalsFor(byKey, key), tokens, price);
    }
  }
  for (const row of options.daily) {
    if (row.utc_day)
      addTokens(
        totalsFor(days, row.utc_day),
        counts(row),
        options.price.of(row),
      );
  }
  const groupRuns = new Map<string, RunBucket[]>();
  for (const row of options.runs) {
    const key = options.keyOf(row);
    const group = groupRuns.get(key) ?? [];
    group.push(row);
    groupRuns.set(key, group);
  }
  const rowOf = (
    key: string,
    tokens: TokenTotals,
    runs: readonly RunBucket[],
  ): UsageRow => ({
    key,
    name: null,
    ...tokensAndCost(tokens),
    reasoningTokens: tokens.reasoningTokens,
    ...runTotals(runs),
  });
  const rows = [...groups].map(([key, tokens]) =>
    rowOf(key, tokens, groupRuns.get(key) ?? []),
  );
  const records = options.tokens.reduce(
    (sum, row) => sum + Number(row.records),
    0,
  );
  // Summing buckets changes the order of floating-point addition. At a rounding boundary
  // the original usage-ID order may change the last reported decimal place.
  const nearHalf = (amounts: TokenTotals) =>
    [...amounts.cost.values()].some((cost) => {
      const scaled = cost * 1e6;
      const margin = Number.EPSILON * Math.max(1, scaled) * (records + 8) * 4;
      return Math.abs(scaled - Math.floor(scaled) - 0.5) <= margin;
    });
  const roundingSensitive =
    nearHalf(total) ||
    [...groups.values()].some(nearHalf) ||
    [...days.values()].some(nearHalf) ||
    [...dayGroups.values()].some((day) => [...day.values()].some(nearHalf));
  return {
    roundingSensitive,
    rows,
    daily: orderUsage(
      options.groupBy,
      rows,
      days,
      options.series ? dayGroups : null,
    ),
    totals: rowOf('total', total, options.totalRuns),
    unpricedModels: options.price.unpricedModels,
  };
}
