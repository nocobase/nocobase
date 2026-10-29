import { randomUUID } from 'node:crypto';
import type { DatabaseManager } from '@nocobase/db';
import type { DemoDailySchedule } from '../../shared/configuration.js';

export interface DailyClaim extends DemoDailySchedule {
  readonly day: string;
  readonly token: string;
  readonly attempt: number;
}

const STALE_MS = 10 * 60_000;

interface DailyRow {
  readonly day: string;
  readonly token: string;
  readonly state: string;
  readonly attempt: number;
  readonly updatedAt: Date;
  readonly nextAt: Date | null;
}

function staleRunning(row: DailyRow, now: Date): boolean {
  return (
    row.state === 'running' &&
    now.getTime() - new Date(row.updatedAt).getTime() >= STALE_MS
  );
}

function uncertain(row: DailyRow, now: Date): boolean {
  return row.state === 'interrupted' || staleRunning(row, now);
}

/**
 * Failed executions retry at most twice. An uncertain execution is never repeated: it is settled once the demo data
 * operation it ran has settled, and otherwise waits for manual recovery.
 */
export class DailyResetClaims {
  public constructor(private readonly database: DatabaseManager) {}

  /** Whether a claim attempt could do anything, so idle minutes avoid reading the demo data status. */
  public async pending(
    day: string,
    now: Date,
    allowCreate: boolean,
  ): Promise<boolean> {
    const rows = await this.rows(day);
    if (rows.some((row) => uncertain(row, now))) return true;
    if (rows.some((row) => row.day !== day)) return false;
    const today = rows.find((row) => row.day === day);
    if (!today) return allowCreate;
    return (
      today.state === 'retry' &&
      Number(today.attempt) < 3 &&
      today.nextAt !== null &&
      now >= new Date(today.nextAt)
    );
  }

  public async claim(
    day: string,
    schedule: DemoDailySchedule,
    now: Date,
    allowCreate = true,
    dataSettled = false,
  ): Promise<DailyClaim | null> {
    const query = this.database.query();
    for (const row of await this.rows(day)) {
      if (row.state !== 'running' && row.state !== 'interrupted') continue;
      if (!uncertain(row, now)) {
        // Never start a later day while an earlier owner is still renewing its claim.
        if (row.day !== day) return null;
        continue;
      }
      if (!dataSettled) {
        // The owner may still be inside an application callback; its data operation shows the interruption.
        if (row.state === 'running')
          await query
            .updateTable('demoModeDailyResets')
            .set({ state: 'interrupted' })
            .where('day', '=', row.day)
            .where('token', '=', row.token)
            .where('state', '=', 'running')
            .where('updatedAt', '=', row.updatedAt)
            .execute();
        return null;
      }
      // Its data operation settled after the owner stopped renewing, so only the acknowledgement is missing.
      // The day stays terminal: a settled reset is not repeated.
      await query
        .updateTable('demoModeDailyResets')
        .set({ state: 'recovered', updatedAt: now })
        .where('day', '=', row.day)
        .where('token', '=', row.token)
        .where('state', '=', row.state)
        .where('updatedAt', '=', row.updatedAt)
        .execute();
    }
    const row = await query
      .selectFrom('demoModeDailyResets')
      .selectAll()
      .where('day', '=', day)
      .executeTakeFirst<DailyRow>();
    const token = randomUUID();
    if (!row) {
      if (!allowCreate) return null;
      try {
        await query
          .insertInto('demoModeDailyResets')
          .values({ day, token, state: 'running', attempt: 1, updatedAt: now })
          .execute();
      } catch (error) {
        // Only a competing insert is a lost claim; database failures must reach the job log.
        if (
          !(await query
            .selectFrom('demoModeDailyResets')
            .select('day')
            .where('day', '=', day)
            .executeTakeFirst())
        )
          throw error;
        return null;
      }
      return { ...schedule, day, token, attempt: 1 };
    }
    if (
      row.state !== 'retry' ||
      Number(row.attempt) >= 3 ||
      !row.nextAt ||
      now < new Date(row.nextAt)
    )
      return null;
    const attempt = Number(row.attempt) + 1;
    const claimed = await query
      .updateTable('demoModeDailyResets')
      .set({ token, attempt, state: 'running', updatedAt: now, nextAt: null })
      .where('day', '=', day)
      .where('token', '=', row.token)
      .where('state', '=', 'retry')
      .execute();
    return claimed.updatedCount === 1
      ? { ...schedule, day, token, attempt }
      : null;
  }

  /** Today's row and every unacknowledged claim of any day. */
  private rows(day: string): Promise<DailyRow[]> {
    return this.database
      .query()
      .selectFrom('demoModeDailyResets')
      .select(['day', 'token', 'state', 'attempt', 'updatedAt', 'nextAt'])
      .where((eb) =>
        eb.or([
          eb('day', '=', day),
          eb('state', 'in', ['running', 'interrupted']),
        ]),
      )
      .execute<DailyRow>();
  }

  public async renew(claim: DailyClaim): Promise<void> {
    await this.database
      .query()
      .updateTable('demoModeDailyResets')
      .set({ updatedAt: new Date() })
      .where('day', '=', claim.day)
      .where('token', '=', claim.token)
      .where('state', '=', 'running')
      .execute();
  }

  public async finish(
    claim: DailyClaim,
    error?: unknown,
    retryable = false,
  ): Promise<void> {
    await this.database.transaction(async (connection) => {
      const result = await connection.query
        .updateTable('demoModeDailyResets')
        .set({
          state:
            error === undefined
              ? 'succeeded'
              : retryable && claim.attempt < 3
                ? 'retry'
                : 'failed',
          updatedAt: new Date(),
          nextAt:
            error !== undefined && retryable
              ? new Date(Date.now() + 5 * 60_000)
              : null,
          failure:
            error === undefined
              ? null
              : JSON.stringify({
                  message:
                    error instanceof Error
                      ? error.message
                      : typeof error === 'string'
                        ? error
                        : 'Unknown daily reset failure',
                }),
        })
        .where('day', '=', claim.day)
        .where('token', '=', claim.token)
        .where('state', 'in', ['running', 'interrupted'])
        .execute();
      if (result.updatedCount !== 1)
        throw new Error('The daily demo reset claim was lost.');
      if (error === undefined)
        await connection.query
          .updateTable('demoModeConfiguration')
          .set({ lastDay: claim.day })
          .where('id', '=', 'default')
          .execute();
    });
  }
}
