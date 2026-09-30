import type { RepositoryOptions } from '@nocobase/ai-employee';
import type { DatabaseConnection, Row, SelectQuery } from '@nocobase/db';

import {
  AI_USAGE_FILTER_FIELDS,
  type AIUsageEventAggregateQuery,
  type AIUsageEventAggregateRow,
  type AIUsageEventEntity,
  type AIUsageEventRepository,
  type AIUsageEventTotals,
  type AIUsageEventUpsertValues,
} from '../ai-usage-event.js';
import { BaseCollectionRepository } from './base-collection-repository.js';

/** Counters summed by {@link DatabaseAIUsageEventRepository.aggregate}. */
const SUMMED_FIELDS = [
  'inputTokens',
  'outputTokens',
  'totalTokens',
  'cachedTokens',
  'reasoningTokens',
  'toolCallCount',
  'autoToolCallCount',
] as const satisfies readonly (keyof AIUsageEventTotals)[];

const COUNT_ALIAS = 'aggregateEventCount';

/** Distinct from every column name, so `orderBy` cannot resolve to a column. */
function sumAlias(field: (typeof SUMMED_FIELDS)[number]): string {
  return `aggregateSum${field[0].toUpperCase()}${field.slice(1)}`;
}

function totalsAlias(field: keyof AIUsageEventTotals): string {
  return field === 'eventCount' ? COUNT_ALIAS : sumAlias(field);
}

export class DatabaseAIUsageEventRepository
  extends BaseCollectionRepository<AIUsageEventEntity>
  implements AIUsageEventRepository
{
  public constructor(
    private readonly databaseConnection: DatabaseConnection,
    generateId: () => string | number | bigint,
  ) {
    super(databaseConnection, 'aiUsageEvents', generateId);
  }

  public async aggregate(
    query: AIUsageEventAggregateQuery,
    options?: RepositoryOptions,
  ): Promise<AIUsageEventAggregateRow[]> {
    const connection =
      (options?.connection as DatabaseConnection | undefined) ??
      this.databaseConnection;
    const { filter } = query;
    const groupBy = query.groupBy ?? [];

    let statement: SelectQuery = connection.query
      .selectFrom('aiUsageEvents')
      .select((eb) => [
        ...groupBy,
        eb.fn.countAll().as(COUNT_ALIAS),
        ...SUMMED_FIELDS.map((field) => eb.fn.sum(field).as(sumAlias(field))),
      ])
      .where('occurredHour', '>=', filter.startHour)
      .where('occurredHour', '<=', filter.endHour);

    for (const field of AI_USAGE_FILTER_FIELDS) {
      const value = filter[field];
      if (value !== undefined) statement = statement.where(field, '=', value);
    }
    if (groupBy.length > 0) statement = statement.groupBy(groupBy);
    if (query.orderBy) {
      statement = statement.orderBy(totalsAlias(query.orderBy), 'desc');
    }
    if (query.limit !== undefined) statement = statement.limit(query.limit);

    const rows = await statement.execute<Row>();
    return rows.map((row) => ({
      group: Object.fromEntries(
        groupBy.map((field) => [field, normalizeGroupValue(row[field])]),
      ),
      eventCount: toCounter(row[COUNT_ALIAS]),
      ...(Object.fromEntries(
        SUMMED_FIELDS.map((field) => [field, toCounter(row[sumAlias(field)])]),
      ) as Omit<AIUsageEventTotals, 'eventCount'>),
    }));
  }

  public async upsert(
    values: AIUsageEventUpsertValues,
    options?: RepositoryOptions,
  ): Promise<void> {
    const connection =
      (options?.connection as DatabaseConnection | undefined) ??
      this.databaseConnection;
    const filter = {
      messageId: values.messageId,
      eventType: values.eventType,
    };

    try {
      await connection.transaction(async (savepoint) => {
        const existing = await this.findOne(
          { filter },
          { connection: savepoint },
        );
        if (existing) {
          await this.update({ filter, values }, { connection: savepoint });
          return;
        }
        await this.create({ values }, { connection: savepoint });
      });
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) throw error;
      const updated = await this.update({ filter, values }, { connection });
      if (updated === 0) throw error;
    }
  }
}

/** Grouped bigint columns arrive as strings from some drivers. */
function normalizeGroupValue(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (typeof value === 'bigint') return Number(value);
  return String(value);
}

/** `SUM` over a bigint column returns a string on PostgreSQL and MySQL. */
function toCounter(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isUniqueConstraintViolation(error: unknown): boolean {
  const visited = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === 'object' && !visited.has(current)) {
    visited.add(current);
    const record = current as Record<string, unknown>;
    const code = record.code;
    const number = record.errno ?? record.number ?? record.errorNum;
    if (
      code === '23505' ||
      code === 'ER_DUP_ENTRY' ||
      code === 'SQLITE_CONSTRAINT' ||
      code === 'SQLITE_CONSTRAINT_UNIQUE' ||
      code === 'SQLITE_CONSTRAINT_PRIMARYKEY' ||
      number === 1 ||
      number === 1062 ||
      number === 2601 ||
      number === 2627
    ) {
      return true;
    }
    current = record.cause ?? record.originalError;
  }
  return false;
}
