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
  // Summed in the database: one row per purpose, caller and model however many calls were made.
  const groups = await conn.query
    .selectFrom(TABLE)
    .select((eb) => [
      'purpose',
      'source',
      'modelService',
      'model',
      eb.fn.countAll().as('calls'),
      eb.fn.sum('units').as('units'),
      eb.fn.sum('inputTokens').as('inputTokens'),
      eb.fn.sum('outputTokens').as('outputTokens'),
    ])
    .where('createdAt', '>=', range.start)
    .where('createdAt', '<', range.end)
    .groupBy(['purpose', 'source', 'modelService', 'model'])
    .execute<Record<string, unknown>>();
  const rows = groups.map((group): ModelUsageRow => {
    const modelService = String(group.modelService);
    const model = String(group.model);
    const inputTokens = count(group.inputTokens);
    const outputTokens = count(group.outputTokens);
    // Prices are per token, so the calls' summed tokens cost what the calls cost one by one.
    const price = priceFor(book, { tool: ONLINE_TOOL, modelService, model });
    return {
      purpose: String(group.purpose) as ModelUsagePurpose,
      source: String(group.source),
      modelService,
      model,
      calls: count(group.calls),
      units: count(group.units),
      inputTokens,
      outputTokens,
      cost: price
        ? {
            [price.currency]: costOf(price, {
              inputTokens,
              outputTokens,
              cacheReadTokens: 0,
              cacheWriteTokens: 0,
            }),
          }
        : null,
    };
  });
  return rows.sort(
    (a, b) =>
      a.purpose.localeCompare(b.purpose) ||
      a.source.localeCompare(b.source) ||
      a.modelService.localeCompare(b.modelService) ||
      a.model.localeCompare(b.model),
  );
}
