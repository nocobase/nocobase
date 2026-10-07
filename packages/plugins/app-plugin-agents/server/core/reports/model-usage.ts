/**
 * What model calls outside any run used (`agModelUsage`): the embeddings, reranking and short utility texts the
 * application asks the model gateway for (`ModelGateway.embed`, `rerank`, `generate`). The gateway records each call
 * as it returns (`ModelUsageRecorder`); the report groups them by purpose, caller and model, priced like online runs'
 * calls from the service's model prices (`tool` `online`).
 */
import type { DatabaseConnection } from '@nocobase/db';

import {
  ONLINE_TOOL,
  priceFor,
  type ModelUsagePurpose,
  type ModelUsageRow,
  type PriceBook,
} from '../../../shared/reports.js';
import type { Clock } from '../../kernel/clock.js';
import type { IdSource } from '../../kernel/ids.js';
import type { TxRunner } from '../../kernel/tx.js';
import { costOf } from './prices.js';

const TABLE = 'agModelUsage';

/** One model call outside a run. */
export interface ModelUsageEntry {
  readonly purpose: ModelUsagePurpose;
  readonly source: string;
  readonly modelService: string;
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly units: number;
}

export interface ModelUsageRecorder {
  record(entry: ModelUsageEntry): Promise<void>;
}

interface ModelUsageRecord extends ModelUsageEntry {
  readonly id: string;
  readonly createdAt: string | Date;
}

const count = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
};

export function createModelUsageRecorder(deps: {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly clock: Clock;
}): ModelUsageRecorder {
  return {
    async record(entry) {
      await deps.tx
        .read()
        .repository<ModelUsageRecord>(TABLE)
        .createOne({
          values: {
            id: deps.ids.next(),
            purpose: entry.purpose,
            source: entry.source.slice(0, 64),
            modelService: entry.modelService,
            model: entry.model.slice(0, 200),
            inputTokens: count(entry.inputTokens),
            outputTokens: count(entry.outputTokens),
            units: count(entry.units),
            createdAt: deps.clock.now().toISOString(),
          },
        });
    },
  };
}

/** The use recorded in `[start, end)`, one row per purpose, caller and model, with its cost at the current prices. */
export async function modelUsageRows(
  conn: DatabaseConnection,
  range: { readonly start: Date; readonly end: Date },
  book: PriceBook,
): Promise<ModelUsageRow[]> {
  const records = await conn.repository<ModelUsageRecord>(TABLE).findMany({
    filter: (f) =>
      f.and([
        f.date('createdAt').notBefore(range.start),
        f.date('createdAt').before(range.end),
      ]),
  });
  const rows = new Map<
    string,
    {
      -readonly [K in keyof ModelUsageRow]: ModelUsageRow[K];
    } & { cost: Record<string, number> | null }
  >();
  for (const record of records) {
    const key = [
      record.purpose,
      record.source,
      record.modelService,
      record.model,
    ].join('\u0000');
    const price = priceFor(book, {
      tool: ONLINE_TOOL,
      modelService: record.modelService,
      model: record.model,
    });
    const row = rows.get(key) ?? {
      purpose: record.purpose,
      source: record.source,
      modelService: record.modelService,
      model: record.model,
      calls: 0,
      units: 0,
      inputTokens: 0,
      outputTokens: 0,
      cost: price ? {} : null,
    };
    const inputTokens = count(record.inputTokens);
    const outputTokens = count(record.outputTokens);
    row.calls += 1;
    row.units += count(record.units);
    row.inputTokens += inputTokens;
    row.outputTokens += outputTokens;
    if (price && row.cost)
      row.cost[price.currency] =
        (row.cost[price.currency] ?? 0) +
        costOf(price, {
          inputTokens,
          outputTokens,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
        });
    rows.set(key, row);
  }
  return [...rows.values()].sort(
    (a, b) =>
      a.purpose.localeCompare(b.purpose) ||
      a.source.localeCompare(b.source) ||
      a.modelService.localeCompare(b.modelService) ||
      a.model.localeCompare(b.model),
  );
}
