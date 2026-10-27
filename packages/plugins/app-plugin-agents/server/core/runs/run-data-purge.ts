import { setTimeout as pause } from 'node:timers/promises';

import type { TxRunner } from '../../kernel/tx.js';

export const RUN_DATA_PURGE_INTERVAL_MS: number = 60 * 60_000;
export const RUN_DATA_PURGE_BATCH: number = 200;
export const RUN_DATA_PURGE_LIMIT: number = 2000;
export const RUN_DATA_PURGE_PAUSE_MS: number = 100;
export const RUN_DATA_PURGE_TIME_MS: number = 5 * 60_000;

export function runRetentionDays(value: unknown): number {
  if (value === undefined) return 14;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    throw new Error(
      'agents.runs.retentionDays must be a non-negative integer.',
    );
  return value;
}

/** How often archived conversations past their retention are deleted: once a day. */
export const ARCHIVED_CONVERSATION_PURGE_INTERVAL_MS: number = 24 * 60 * 60_000;

/**
 * `agents.conversations.archivedRetentionDays`: archived conversations are deleted this many days after they were
 * archived; 30 by default, 0 keeps them.
 */
export function archivedRetentionDays(value: unknown): number {
  if (value === undefined) return 30;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    throw new Error(
      'agents.conversations.archivedRetentionDays must be a non-negative integer.',
    );
  return value;
}

/** Independent maintenance: no run writes, lifecycle transitions or claim locks. */
export function createRunDataPurge(deps: {
  readonly tx: TxRunner;
  readonly retentionDays: () => number;
  readonly now?: () => number;
  readonly pause?: (ms: number) => Promise<unknown>;
}): () => Promise<number> {
  const now = deps.now ?? Date.now;
  const sleep = deps.pause ?? pause;
  return async (): Promise<number> => {
    const days = runRetentionDays(deps.retentionDays());
    if (days === 0) return 0;
    const started = now();
    const cutoff = new Date(started - days * 86_400_000).toISOString();
    let cursor: { id: string; finishedAt: unknown } | undefined;
    let purged = 0;
    while (
      purged < RUN_DATA_PURGE_LIMIT &&
      now() - started < RUN_DATA_PURGE_TIME_MS
    ) {
      let scan = deps.tx
        .read()
        .query.selectFrom('agRuns')
        .select(['id', 'finishedAt'])
        .where('status', 'in', ['completed', 'failed', 'cancelled'])
        .where('finishedAt', '<', cutoff)
        .where((eb) =>
          eb.or([
            eb.exists(
              eb
                .selectFrom('agRunEvents')
                .select('id')
                .whereRef('agRunEvents.runId', '=', 'agRuns.id'),
            ),
            eb.exists(
              eb
                .selectFrom('agRunBriefs')
                .select('id')
                .whereRef('agRunBriefs.runId', '=', 'agRuns.id'),
            ),
          ]),
        );
      if (cursor) {
        const last = cursor;
        scan = scan.where((eb) =>
          eb.or([
            eb('finishedAt', '>', last.finishedAt),
            eb.and([
              eb('finishedAt', '=', last.finishedAt),
              eb('id', '>', last.id),
            ]),
          ]),
        );
      }
      const rows = await scan
        .orderBy('finishedAt')
        .orderBy('id')
        .limit(Math.min(RUN_DATA_PURGE_BATCH, RUN_DATA_PURGE_LIMIT - purged))
        .execute();
      if (!rows.length || now() - started >= RUN_DATA_PURGE_TIME_MS) break;
      const ids = rows.map((row) => String(row.id));
      await deps.tx.run(async ({ conn }) => {
        await conn.query
          .deleteFrom('agRunEvents')
          .where('runId', 'in', ids)
          .execute();
        await conn.query
          .deleteFrom('agRunBriefs')
          .where('runId', 'in', ids)
          .execute();
      });
      purged += rows.length;
      const last = rows.at(-1)!;
      cursor = { id: String(last.id), finishedAt: last.finishedAt };
      if (rows.length < RUN_DATA_PURGE_BATCH || purged >= RUN_DATA_PURGE_LIMIT)
        break;
      await sleep(RUN_DATA_PURGE_PAUSE_MS);
    }
    return purged;
  };
}
