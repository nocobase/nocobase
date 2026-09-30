import type { DatabaseConnection } from '@nocobase/db';

import type { DatabaseRepositoryFactory } from '../repository/runtime-factory.js';
import {
  AI_USAGE_FILTER_FIELDS,
  type AIUsageEventAggregateFilter,
  type AIUsageEventTotals,
  type AIUsageFilterField,
  type AIUsageGroupField,
} from '../repository/ai-usage-event.js';
import { ResourceActionError, type UsageStatisticsActor } from '../types.js';
import {
  MAX_RANGE_HOURS,
  USAGE_GRANULARITIES,
  bucketStartHour,
  enumerateBucketStarts,
  hourIndexToEpochMs,
  resolveGranularity,
  resolveOffsetHours,
  toHourIndex,
  type UsageGranularity,
} from './usage-buckets.js';

/** Dimensions the breakdown endpoint may group by. */
export const USAGE_BREAKDOWN_DIMENSIONS = [
  'model',
  'provider',
  'llmService',
  'aiEmployeeUsername',
  'userId',
  'category',
  'from',
] as const satisfies readonly AIUsageGroupField[];

export type UsageBreakdownDimension =
  (typeof USAGE_BREAKDOWN_DIMENSIONS)[number];

const DEFAULT_RANGE_HOURS = 7 * 24;
const DEFAULT_BREAKDOWN_LIMIT = 10;
const MAX_BREAKDOWN_LIMIT = 50;
const MAX_FILTER_OPTIONS = 100;

export type UsageStatisticsFilterInput = Partial<
  Record<AIUsageFilterField, string>
>;

export interface UsageStatisticsRequest extends UsageStatisticsFilterInput {
  readonly actor: UsageStatisticsActor;
  /** Inclusive range start, epoch milliseconds. */
  readonly start?: string | number;
  /** Inclusive range end, epoch milliseconds. */
  readonly end?: string | number;
  /** East-positive minutes, as `-new Date().getTimezoneOffset()` reports. */
  readonly timezoneOffset?: string | number;
  readonly granularity?: string;
}

export interface UsageStatisticsRange {
  readonly start: number;
  readonly end: number;
  readonly timezoneOffsetHours: number;
}

export interface UsageSummaryResult {
  readonly range: UsageStatisticsRange;
  readonly totals: AIUsageEventTotals;
  /** Same-length window immediately before `range`, for period-over-period. */
  readonly previous: AIUsageEventTotals;
  readonly previousRange: { readonly start: number; readonly end: number };
}

export interface UsageSeriesBucket extends AIUsageEventTotals {
  /** Bucket start as epoch milliseconds. */
  readonly start: number;
}

export interface UsageSeriesResult {
  readonly range: UsageStatisticsRange;
  readonly granularity: UsageGranularity;
  readonly buckets: readonly UsageSeriesBucket[];
}

export interface UsageBreakdownRow extends AIUsageEventTotals {
  readonly key: string;
  readonly label: string;
}

export interface UsageBreakdownResult {
  readonly range: UsageStatisticsRange;
  readonly dimension: UsageBreakdownDimension;
  readonly rows: readonly UsageBreakdownRow[];
  /** Range totals, so the caller can render each row's share and a remainder. */
  readonly totals: AIUsageEventTotals;
}

export interface UsageFilterOption {
  readonly value: string;
  readonly label: string;
}

export interface UsageFilterOptionsResult {
  readonly range: UsageStatisticsRange;
  readonly models: readonly UsageFilterOption[];
  readonly aiEmployees: readonly UsageFilterOption[];
}

export interface AIUsageStatisticsServiceOptions {
  readonly repositories: DatabaseRepositoryFactory;
  readonly database: DatabaseConnection;
}

interface ResolvedRange extends UsageStatisticsRange {
  readonly startHour: number;
  readonly endHour: number;
  readonly filter: AIUsageEventAggregateFilter;
}

const EMPTY_TOTALS: AIUsageEventTotals = {
  eventCount: 0,
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  cachedTokens: 0,
  reasoningTokens: 0,
  toolCallCount: 0,
  autoToolCallCount: 0,
};

/** Read-only aggregation over `aiUsageEvents` for the admin statistics page. */
export class AIUsageStatisticsService {
  private readonly repositories: DatabaseRepositoryFactory;
  private readonly database: DatabaseConnection;

  public constructor(options: AIUsageStatisticsServiceOptions) {
    this.repositories = options.repositories;
    this.database = options.database;
  }

  public async summary(
    request: UsageStatisticsRequest & {
      readonly compareShiftHours?: string | number;
    },
  ): Promise<UsageSummaryResult> {
    const range = this.resolveRange(request);
    const span = range.endHour - range.startHour + 1;
    // Shifting the whole window back by one period compares like with like:
    // a range ending midway through today lands on the same hours yesterday
    // rather than on the equally long stretch that just ended.
    const shift = parseCompareShift(request.compareShiftHours) ?? span;
    const previousFilter: AIUsageEventAggregateFilter = {
      ...range.filter,
      startHour: range.startHour - shift,
      endHour: range.endHour - shift,
    };
    const [totals, previous] = await Promise.all([
      this.totalsOf(range.filter),
      this.totalsOf(previousFilter),
    ]);
    return {
      range: toPublicRange(range),
      totals,
      previous,
      previousRange: {
        start: hourIndexToEpochMs(previousFilter.startHour),
        end: hourIndexToEpochMs(previousFilter.endHour + 1) - 1,
      },
    };
  }

  public async series(
    request: UsageStatisticsRequest,
  ): Promise<UsageSeriesResult> {
    const range = this.resolveRange(request);
    const granularity = resolveGranularity(
      range.startHour,
      range.endHour,
      parseGranularity(request.granularity),
    );
    const rows = await this.repositories.aiUsageEvents.aggregate({
      filter: range.filter,
      groupBy: ['occurredHour'],
    });

    const buckets = new Map<number, AIUsageEventTotals>();
    for (const start of enumerateBucketStarts(
      range.startHour,
      range.endHour,
      granularity,
      range.timezoneOffsetHours,
    )) {
      buckets.set(start, { ...EMPTY_TOTALS });
    }
    for (const row of rows) {
      const hour = Number(row.group.occurredHour);
      if (!Number.isFinite(hour)) continue;
      const start = bucketStartHour(
        hour,
        granularity,
        range.timezoneOffsetHours,
      );
      const bucket = buckets.get(start);
      if (bucket) addTotals(bucket, row);
    }

    return {
      range: toPublicRange(range),
      granularity,
      buckets: [...buckets.entries()]
        .sort(([left], [right]) => left - right)
        .map(([start, totals]) => ({
          start: hourIndexToEpochMs(start),
          ...totals,
        })),
    };
  }

  public async breakdown(
    request: UsageStatisticsRequest & {
      readonly dimension?: string;
      readonly limit?: string | number;
    },
  ): Promise<UsageBreakdownResult> {
    const dimension = parseDimension(request.dimension);
    const limit = parseLimit(request.limit);
    const range = this.resolveRange(request);
    const [rows, totals] = await Promise.all([
      this.repositories.aiUsageEvents.aggregate({
        filter: range.filter,
        groupBy: [dimension],
        orderBy: 'totalTokens',
        limit,
      }),
      this.totalsOf(range.filter),
    ]);

    const keys = rows.map((row) => stringifyKey(row.group[dimension]));
    const labels = await this.resolveLabels(dimension, keys);
    return {
      range: toPublicRange(range),
      dimension,
      rows: rows.map((row, index) => {
        const key = keys[index] ?? '';
        return {
          key,
          label: labels.get(key) ?? key,
          ...pickTotals(row),
        };
      }),
      totals,
    };
  }

  public async filterOptions(
    request: UsageStatisticsRequest,
  ): Promise<UsageFilterOptionsResult> {
    const range = this.resolveRange(request);
    // Options describe what the range actually contains, so a dimension already
    // narrowed by the current filters would hide its own alternatives.
    const unfiltered: AIUsageEventAggregateFilter = {
      startHour: range.startHour,
      endHour: range.endHour,
    };
    const [models, employees] = await Promise.all([
      this.repositories.aiUsageEvents.aggregate({
        filter: unfiltered,
        groupBy: ['model'],
        orderBy: 'totalTokens',
        limit: MAX_FILTER_OPTIONS,
      }),
      this.repositories.aiUsageEvents.aggregate({
        filter: unfiltered,
        groupBy: ['aiEmployeeUsername'],
        orderBy: 'totalTokens',
        limit: MAX_FILTER_OPTIONS,
      }),
    ]);
    const employeeKeys = employees
      .map((row) => stringifyKey(row.group.aiEmployeeUsername))
      .filter((key) => key !== '');
    const employeeLabels = await this.resolveLabels(
      'aiEmployeeUsername',
      employeeKeys,
    );
    return {
      range: toPublicRange(range),
      models: models
        .map((row) => stringifyKey(row.group.model))
        .filter((value) => value !== '')
        .map((value) => ({ value, label: value })),
      aiEmployees: employeeKeys.map((value) => ({
        value,
        label: employeeLabels.get(value) ?? value,
      })),
    };
  }

  private async totalsOf(
    filter: AIUsageEventAggregateFilter,
  ): Promise<AIUsageEventTotals> {
    const [row] = await this.repositories.aiUsageEvents.aggregate({ filter });
    return row ? pickTotals(row) : { ...EMPTY_TOTALS };
  }

  private async resolveLabels(
    dimension: UsageBreakdownDimension,
    keys: readonly string[],
  ): Promise<Map<string, string>> {
    const wanted = keys.filter((key) => key !== '');
    if (wanted.length === 0) return new Map();
    if (dimension === 'aiEmployeeUsername') {
      const employees = await this.repositories.aiEmployees.find({
        filter: { username: { $in: [...wanted] } },
      });
      return new Map(
        employees.map((employee) => [
          String(employee.username),
          nonEmpty(employee.nickname) ?? String(employee.username),
        ]),
      );
    }
    if (dimension === 'userId') return this.resolveUserLabels(wanted);
    return new Map();
  }

  /**
   * The `user` collection belongs to the authentication plugin. An application
   * running without it still gets a usable breakdown, keyed by raw identifier.
   */
  private async resolveUserLabels(
    ids: readonly string[],
  ): Promise<Map<string, string>> {
    try {
      const rows = await this.database.query
        .selectFrom('user')
        .select(['id', 'name', 'username'])
        .where('id', 'in', [...ids])
        .execute<{ id: unknown; name?: unknown; username?: unknown }>();
      return new Map(
        rows.map((row) => [
          String(row.id),
          nonEmpty(row.name) ?? nonEmpty(row.username) ?? String(row.id),
        ]),
      );
    } catch {
      return new Map();
    }
  }

  private resolveRange(request: UsageStatisticsRequest): ResolvedRange {
    requireUsageReadAccess(request.actor);
    const timezoneOffsetHours = resolveOffsetHours(
      parseNumber(request.timezoneOffset, 'timezoneOffset') ?? 0,
    );
    const end = parseNumber(request.end, 'end') ?? Date.now();
    const endHour = toHourIndex(end);
    const start = parseNumber(request.start, 'start');
    const startHour =
      start === undefined
        ? endHour - DEFAULT_RANGE_HOURS + 1
        : toHourIndex(start);

    if (startHour > endHour) {
      throw new ResourceActionError(400, 'Invalid range: start is after end');
    }
    if (endHour - startHour + 1 > MAX_RANGE_HOURS) {
      throw new ResourceActionError(
        400,
        `Invalid range: at most ${MAX_RANGE_HOURS / 24} days`,
      );
    }

    return {
      start: hourIndexToEpochMs(startHour),
      end: hourIndexToEpochMs(endHour + 1) - 1,
      timezoneOffsetHours,
      startHour,
      endHour,
      filter: {
        startHour,
        endHour,
        ...parseFilters(request),
      },
    };
  }
}

function requireUsageReadAccess(actor: UsageStatisticsActor | undefined): void {
  if (!actor?.canReadUsageStatistics) {
    throw new ResourceActionError(403, 'AI settings access is required');
  }
}

function toPublicRange(range: ResolvedRange): UsageStatisticsRange {
  return {
    start: range.start,
    end: range.end,
    timezoneOffsetHours: range.timezoneOffsetHours,
  };
}

function parseFilters(
  request: UsageStatisticsFilterInput,
): Partial<Record<AIUsageFilterField, string>> {
  const filters: Partial<Record<AIUsageFilterField, string>> = {};
  for (const field of AI_USAGE_FILTER_FIELDS) {
    const value = request[field];
    if (value === undefined || value === '') continue;
    if (typeof value !== 'string' || value.length > 200) {
      throw new ResourceActionError(400, `Invalid ${field}`);
    }
    filters[field] = value;
  }
  return filters;
}

function parseNumber(
  value: string | number | undefined,
  name: string,
): number | undefined {
  if (value === undefined || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ResourceActionError(400, `Invalid ${name}`);
  }
  return parsed;
}

/** Hours to move the comparison window back by; defaults to the range length. */
function parseCompareShift(
  value: string | number | undefined,
): number | undefined {
  const parsed = parseNumber(value, 'compareShiftHours');
  if (parsed === undefined) return undefined;
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > MAX_RANGE_HOURS) {
    throw new ResourceActionError(400, 'Invalid compareShiftHours');
  }
  return parsed;
}

function parseGranularity(
  value: string | undefined,
): UsageGranularity | undefined {
  if (value === undefined || value === '' || value === 'auto') return undefined;
  const granularity = USAGE_GRANULARITIES.find((item) => item === value);
  if (!granularity) throw new ResourceActionError(400, 'Invalid granularity');
  return granularity;
}

function parseDimension(value: string | undefined): UsageBreakdownDimension {
  const dimension = USAGE_BREAKDOWN_DIMENSIONS.find((item) => item === value);
  if (!dimension) throw new ResourceActionError(400, 'Invalid dimension');
  return dimension;
}

function parseLimit(value: string | number | undefined): number {
  const parsed = parseNumber(value, 'limit');
  if (parsed === undefined) return DEFAULT_BREAKDOWN_LIMIT;
  if (
    !Number.isSafeInteger(parsed) ||
    parsed < 1 ||
    parsed > MAX_BREAKDOWN_LIMIT
  ) {
    throw new ResourceActionError(400, 'Invalid limit');
  }
  return parsed;
}

function pickTotals(totals: AIUsageEventTotals): AIUsageEventTotals {
  return {
    eventCount: totals.eventCount,
    inputTokens: totals.inputTokens,
    outputTokens: totals.outputTokens,
    totalTokens: totals.totalTokens,
    cachedTokens: totals.cachedTokens,
    reasoningTokens: totals.reasoningTokens,
    toolCallCount: totals.toolCallCount,
    autoToolCallCount: totals.autoToolCallCount,
  };
}

function addTotals(
  target: AIUsageEventTotals,
  source: AIUsageEventTotals,
): void {
  target.eventCount += source.eventCount;
  target.inputTokens += source.inputTokens;
  target.outputTokens += source.outputTokens;
  target.totalTokens += source.totalTokens;
  target.cachedTokens += source.cachedTokens;
  target.reasoningTokens += source.reasoningTokens;
  target.toolCallCount += source.toolCallCount;
  target.autoToolCallCount += source.autoToolCallCount;
}

function stringifyKey(value: string | number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

function nonEmpty(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}
