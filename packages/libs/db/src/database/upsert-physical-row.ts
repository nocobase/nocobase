import { setTimeout as delay } from 'node:timers/promises';

import type { Knex } from 'knex';

import type { Row } from '../query/types.js';
import type { DatabaseConnection } from './connection.js';
import { isUniqueConstraintViolation } from './unique-constraint.js';

export interface UpsertPhysicalRowOptions {
  /** Exact physical table name; connection naming and Collection metadata are not applied. */
  readonly table: string;
  /** Non-null columns backed by a primary key or unique constraint. */
  readonly key: Readonly<Row>;
  /** Raw database values for a new row, excluding key columns. */
  readonly create: Readonly<Row>;
  /** Raw database values to replace on an existing row, excluding key columns. */
  readonly update: Readonly<Row>;
}

/**
 * Upsert internal physical storage without registering a Collection. Values are
 * already encoded for storage; use Repository for Collection-level conversion.
 * The row lock lasts until the owning transaction completes. Deadlocks are
 * retried up to five times only when this operation owns the transaction;
 * callers supplying a transaction must retry their entire unit of work.
 */
export async function upsertPhysicalRow(
  connection: DatabaseConnection,
  options: UpsertPhysicalRowOptions,
): Promise<void> {
  const keys = Object.keys(options.key);
  if (keys.length === 0 || keys.some((key) => options.key[key] == null)) {
    throw new Error(
      'Physical row upsert requires a non-empty, non-null unique key.',
    );
  }
  if (keys.some((key) => key in options.create || key in options.update)) {
    throw new Error('Physical row upsert values must not replace key columns.');
  }
  const execute = async (transaction: Knex.Transaction): Promise<void> => {
    const lock = () =>
      transaction(options.table).where(options.key).select(keys).forUpdate();
    if ((await lock()).length === 0) {
      try {
        // A savepoint keeps databases such as PostgreSQL usable after a
        // concurrent insert wins the unique key race.
        await transaction.transaction(async (savepoint) => {
          await savepoint(options.table).insert({
            ...options.create,
            ...options.key,
          });
        });
        return;
      } catch (error) {
        if (
          !isUniqueConstraintViolation(error) ||
          (await lock()).length === 0
        ) {
          throw error;
        }
      }
    }
    if (Object.keys(options.update).length > 0) {
      await transaction(options.table)
        .where(options.key)
        .update(options.update);
    }
  };
  const client = await connection.client<Knex>();
  if (client.isTransaction) {
    await execute(client as Knex.Transaction);
  } else {
    for (let attempt = 0; ; attempt++) {
      try {
        await client.transaction(execute);
        return;
      } catch (error) {
        // A deadlock can roll back the entire transaction, not just its
        // savepoint. Restart only a transaction owned by this operation.
        if (attempt >= 5 || !isDeadlock(error)) throw error;
        await delay(5 * 2 ** attempt + Math.floor(Math.random() * 5));
      }
    }
  }
}

function isDeadlock(error: unknown): boolean {
  const visited = new Set<unknown>();
  let current = error;
  while (current && typeof current === 'object' && !visited.has(current)) {
    visited.add(current);
    const record = current as Record<string, unknown>;
    if (
      record.code === 'ER_LOCK_DEADLOCK' ||
      record.code === '40P01' ||
      record.number === 1205
    ) {
      return true;
    }
    current = record.cause ?? record.originalError;
  }
  return false;
}
