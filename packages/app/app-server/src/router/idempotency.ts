import { createHash } from 'node:crypto';
import type { DatabaseConnection } from '@nocobase/db';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { Context } from 'hono';
import { ApiError, appErrorDomain } from './api-error.js';

export const mutationRetryWindowMs: number = 24 * 60 * 60 * 1000;
export const mutationReceiptCollection: string = 'mutationReceipts';

export interface RepositoryIdempotencyConfig {
  readonly required: boolean;
  /** Resolve a stable identity from native, server-validated authentication. */
  readonly principal: (
    context: Context,
  ) => string | undefined | Promise<string | undefined>;
}
export const repositoryIdempotencyToken: ServiceToken<RepositoryIdempotencyConfig> =
  createServiceToken<RepositoryIdempotencyConfig>(
    '@nocobase/app-server/repository-idempotency',
  );

export interface IdempotentMutationOptions<T> {
  readonly connection: DatabaseConnection;
  readonly key: string;
  readonly principal: string;
  readonly operation: string;
  readonly input: unknown;
  /** Called for every attempt, including replay. Must check current permissions. */
  readonly authorize: () => void | Promise<void>;
  /** Check result visibility without repeating the business state transition. */
  readonly authorizeReplay: (result: NoInfer<T>) => void | Promise<void>;
  readonly execute: (transaction: DatabaseConnection) => Promise<T>;
}
export interface IdempotentMutationResult<T> {
  readonly data: T;
  readonly replayed: boolean;
}

/** Stable JSON digest: property order is irrelevant, array order is significant. */
export function mutationDigest(value: unknown): string {
  const canonical = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(canonical);
    if (item && typeof item === 'object') {
      if (item instanceof Date) return item.toJSON();
      return Object.fromEntries(
        Object.entries(item)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([key, value]) => [key, canonical(value)]),
      );
    }
    return item;
  };
  return createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex');
}

function refuse(reason: string, message: string): never {
  throw new ApiError({
    status:
      reason === 'OPERATION_CONFLICT'
        ? 'ALREADY_EXISTS'
        : 'FAILED_PRECONDITION',
    reason,
    domain: appErrorDomain,
    message,
  });
}

/** A receipt is never committed until the business transaction has completed. */
export async function executeIdempotentMutation<T>(
  options: IdempotentMutationOptions<T>,
): Promise<IdempotentMutationResult<T>> {
  await options.authorize();
  const match =
    /^(\d{13})\.([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12})$/i.exec(
      options.key,
    );
  if (!match)
    refuse(
      'INVALID_OPERATION_KEY',
      'An operation key must contain a millisecond timestamp and UUID.',
    );
  const issuedAt = Number(match[1]);
  const now = Date.now();
  if (issuedAt > now + 60_000)
    refuse('OPERATION_CLOCK_SKEW', 'The operation key is in the future.');
  if (issuedAt + mutationRetryWindowMs <= now)
    refuse(
      'OPERATION_EXPIRED',
      'The operation retry window has expired. Check its outcome before starting another operation.',
    );
  const id = mutationDigest([
    options.principal,
    options.operation,
    options.key,
  ]);
  const digest = mutationDigest(options.input);
  const read = () =>
    options.connection.query
      .selectFrom(mutationReceiptCollection)
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
  const replay = async (
    row: Record<string, unknown>,
  ): Promise<IdempotentMutationResult<T>> => {
    if (row.digest !== digest)
      refuse(
        'OPERATION_CONFLICT',
        'This operation key belongs to a different request.',
      );
    const data = (
      typeof row.result === 'string' ? JSON.parse(row.result) : row.result
    ) as T;
    await options.authorizeReplay(data);
    return { data, replayed: true };
  };
  const existing = await read();
  if (existing) return replay(existing);
  let claimed = false;
  try {
    const data = await options.connection.transaction(async (transaction) => {
      await transaction.query
        .insertInto(mutationReceiptCollection)
        .values({
          id,
          digest,
          result: null,
          expiresAt: new Date(issuedAt + mutationRetryWindowMs),
        })
        .execute();
      claimed = true;
      const data = await options.execute(transaction);
      const result = JSON.stringify(data);
      await transaction.query
        .updateTable(mutationReceiptCollection)
        .set({ result })
        .where('id', '=', id)
        .execute();
      // Replay the wire representation on the first response as well.
      return JSON.parse(result) as T;
    });
    return { data, replayed: false };
  } catch (error) {
    // A unique-key conflict aborts PostgreSQL's transaction. Only read after rollback.
    // Never reinterpret a business failure after our own successful claim as a replay.
    if (claimed) throw error;
    const winner = await read();
    if (winner) return replay(winner);
    throw error;
  }
}

/** Bounded cleanup, called by the application's existing scheduled jobs. No request-path writes. */
export async function pruneMutationReceipts(
  connection: DatabaseConnection,
  limit: number = 500,
): Promise<number> {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 5000)
    throw new Error('Receipt cleanup limit must be between 1 and 5000.');
  return connection.transaction(async (transaction) => {
    const rows = await transaction.query
      .selectFrom(mutationReceiptCollection)
      .select('id')
      .where('expiresAt', '<=', new Date())
      .limit(limit)
      .execute();
    if (!rows.length) return 0;
    await transaction.query
      .deleteFrom(mutationReceiptCollection)
      .where(
        'id',
        'in',
        rows.map((row) => row.id),
      )
      .execute();
    return rows.length;
  });
}
