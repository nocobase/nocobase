import type {
  CollectionRepository,
  RepositoryOptions,
} from '@nocobase/ai-employee';

export type AIUsageEventEntity = {
  id?: string | number | bigint;
  occurredAt?: Date | string | number | bigint;
  occurredHour?: number;
  sessionId?: string;
  messageId?: string | number | bigint;
  userId?: string | number | bigint;
  aiEmployeeUsername?: string;
  from?: string;
  category?: string;
  eventType?: string;
  role?: string;
  provider?: string;
  llmService?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cachedTokens?: number;
  reasoningTokens?: number;
  toolCallCount?: number;
  autoToolCallCount?: number;
  status?: string;
  rawUsageMetadata?: Record<string, unknown>;
  rawResponseMetadata?: Record<string, unknown>;
};

export type AIUsageEventUpsertValues = Omit<
  AIUsageEventEntity,
  'messageId' | 'eventType'
> & {
  messageId: string | number;
  eventType: string;
};

/** Columns a usage aggregation may group by. */
export const AI_USAGE_GROUP_FIELDS = [
  'occurredHour',
  'model',
  'provider',
  'llmService',
  'aiEmployeeUsername',
  'userId',
  'category',
  'from',
  'role',
  'status',
] as const;

export type AIUsageGroupField = (typeof AI_USAGE_GROUP_FIELDS)[number];

/** Columns a usage aggregation may filter by, beyond the hour range. */
export const AI_USAGE_FILTER_FIELDS = [
  'model',
  'provider',
  'llmService',
  'aiEmployeeUsername',
  'userId',
  'category',
  'from',
] as const;

export type AIUsageFilterField = (typeof AI_USAGE_FILTER_FIELDS)[number];

/** Inclusive UTC hour-bucket range plus optional equality filters. */
export type AIUsageEventAggregateFilter = {
  readonly startHour: number;
  readonly endHour: number;
} & Partial<Readonly<Record<AIUsageFilterField, string>>>;

export type AIUsageEventTotals = {
  eventCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  toolCallCount: number;
  autoToolCallCount: number;
};

export type AIUsageEventAggregateRow = AIUsageEventTotals & {
  readonly group: Readonly<Record<string, string | number | null>>;
};

export type AIUsageEventAggregateQuery = {
  readonly filter: AIUsageEventAggregateFilter;
  readonly groupBy?: readonly AIUsageGroupField[];
  /** Sorts descending by the named total. Grouped queries only. */
  readonly orderBy?: keyof AIUsageEventTotals;
  readonly limit?: number;
};

export interface AIUsageEventRepository extends CollectionRepository<AIUsageEventEntity> {
  upsert(
    values: AIUsageEventUpsertValues,
    options?: RepositoryOptions,
  ): Promise<void>;
  /**
   * Sums token and call counters over the hour range, optionally grouped.
   * Without `groupBy` it returns a single row holding the range totals.
   */
  aggregate(
    query: AIUsageEventAggregateQuery,
    options?: RepositoryOptions,
  ): Promise<AIUsageEventAggregateRow[]>;
}
