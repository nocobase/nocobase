import { randomUUID } from 'node:crypto';
import type { DatabaseManager } from '@nocobase/db';
import type { DemoDailySchedule } from '../../shared/configuration.js';

export interface DailyClaim extends DemoDailySchedule {
  readonly day: string;
  readonly token: string;
  readonly attempt: number;
}

/** Failed executions retry at most twice. An uncertain execution is never taken over automatically. */
export class DailyResetClaims {
  public constructor(private readonly database: DatabaseManager) {}

  public async claim(
    day: string,
    schedule: DemoDailySchedule,
    now: Date,
    allowCreate = true,
  ): Promise<DailyClaim | null> {
    const query = this.database.query();
    // Never start a later day while an earlier process may still be inside an application callback.
    const outstanding = await query
      .selectFrom('demoModeDailyResets')
      .select(['day', 'token', 'state', 'updatedAt'])
      .where('state', 'in', ['running', 'interrupted'])
      .where('day', '!=', day)
      .executeTakeFirst<{
        day: string;
        token: string;
        state: string;
        updatedAt: Date;
      }>();
    if (outstanding) {
      if (
        outstanding.state === 'running' &&
        now.getTime() - new Date(outstanding.updatedAt).getTime() >= 10 * 60_000
      ) {
        await query
          .updateTable('demoModeDailyResets')
          .set({ state: 'interrupted' })
          .where('day', '=', outstanding.day)
          .where('token', '=', outstanding.token)
          .where('state', '=', 'running')
          .where('updatedAt', '=', outstanding.updatedAt)
          .execute();
      }
      throw new Error(
        'An earlier daily demo reset is unresolved. Stop its owner before manual recovery.',
      );
    }
    const row = await query
      .selectFrom('demoModeDailyResets')
      .selectAll()
      .where('day', '=', day)
      .executeTakeFirst<{
        state: string;
        token: string;
        attempt: number;
        updatedAt: Date;
        nextAt: Date | null;
      }>();
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
      row.state === 'running' &&
      now.getTime() - new Date(row.updatedAt).getTime() >= 10 * 60_000
    ) {
      await query
        .updateTable('demoModeDailyResets')
        .set({ state: 'interrupted' })
        .where('day', '=', day)
        .where('token', '=', row.token)
        .where('updatedAt', '=', row.updatedAt)
        .where('state', '=', 'running')
        .execute();
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
