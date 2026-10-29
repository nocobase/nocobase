import { randomUUID } from 'node:crypto';
import type { DatabaseManager, QueryAdapter } from '@nocobase/db';
import type { DemoDailySchedule } from '../../shared/configuration.js';

export interface DailyClaim extends DemoDailySchedule {
  readonly day: string;
  readonly token: string;
  readonly attempt: number;
}

/** The demo data operation's settled outcome, which decides how an unacknowledged claim is closed. */
export interface DailySettledData {
  readonly ready: boolean;
  readonly finishedAt: Date | null;
}

/** Today's admission: `due` once the scheduled minute passed and the day is not acknowledged yet. */
export interface DailyAdmission {
  readonly due: boolean;
  readonly allowCreate: boolean;
}

const STALE_MS = 10 * 60_000;
const RETRY_MS = 5 * 60_000;
/** A retry left unclaimed this long, as across downtime, is abandoned instead of resetting an old day late. */
const RETRY_WINDOW_MS = 24 * 60 * 60_000;
const MAX_ATTEMPTS = 3;

interface DailyRow {
  readonly day: string;
  readonly token: string;
  readonly state: string;
  readonly attempt: number;
  readonly startedAt: Date | null;
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

function retryDue(row: DailyRow, now: Date): boolean {
  if (
    row.state !== 'retry' ||
    Number(row.attempt) >= MAX_ATTEMPTS ||
    row.nextAt === null
  )
    return false;
  const waited = now.getTime() - new Date(row.nextAt).getTime();
  return waited >= 0 && waited < RETRY_WINDOW_MS;
}

/** The latest earlier day whose retry is due, so a retry scheduled across local midnight still runs. */
function earlierRetry(
  rows: readonly DailyRow[],
  day: string,
  now: Date,
): DailyRow | undefined {
  return rows
    .filter((row) => row.day < day && retryDue(row, now))
    .sort((a, b) => b.day.localeCompare(a.day))[0];
}

function message(error: unknown): string {
  return error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : 'Unknown daily reset failure';
}

/**
 * Failed executions retry at most twice. An uncertain execution is never repeated once its reset completed: it is
 * closed when the demo data operation it ran has settled as ready, retried when that operation did not complete, and
 * otherwise waits for manual recovery.
 */
export class DailyResetClaims {
  public constructor(private readonly database: DatabaseManager) {}

  /** Whether a claim attempt could do anything, so idle minutes avoid reading the demo data status. */
  public async pending(
    day: string,
    now: Date,
    admission: DailyAdmission,
  ): Promise<boolean> {
    const rows = await this.rows(day, now);
    if (rows.some((row) => uncertain(row, now))) return admission.due;
    if (
      rows.some(
        (row) =>
          row.day !== day &&
          (row.state === 'running' || row.state === 'interrupted'),
      )
    )
      return false;
    const today = rows.find((row) => row.day === day);
    if (today) return admission.due && retryDue(today, now);
    return (
      (admission.due && admission.allowCreate) ||
      Boolean(earlierRetry(rows, day, now))
    );
  }

  public async claim(
    day: string,
    schedule: DemoDailySchedule,
    now: Date,
    admission: DailyAdmission,
    settled?: DailySettledData,
  ): Promise<DailyClaim | null> {
    const query = this.database.query();
    for (const row of await this.rows(day, now)) {
      if (row.state !== 'running' && row.state !== 'interrupted') continue;
      if (!uncertain(row, now)) {
        // Never start a later day while an earlier owner is still renewing its claim.
        if (row.day !== day) return null;
        continue;
      }
      // Uncertain claims are settled only by a due run, which reads the demo data status first.
      if (!admission.due) return null;
      if (!settled) {
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
      await this.settle(row, settled, now);
    }
    const rows = await this.rows(day, now);
    const today = rows.find((row) => row.day === day);
    if (admission.due && !today && admission.allowCreate) {
      const token = randomUUID();
      try {
        await query
          .insertInto('demoModeDailyResets')
          .values({
            day,
            token,
            state: 'running',
            attempt: 1,
            startedAt: now,
            updatedAt: now,
          })
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
    const candidate = today
      ? admission.due && retryDue(today, now)
        ? today
        : undefined
      : earlierRetry(rows, day, now);
    return candidate ? this.retry(candidate, schedule, now) : null;
  }

  private async retry(
    row: DailyRow,
    schedule: DemoDailySchedule,
    now: Date,
  ): Promise<DailyClaim | null> {
    const token = randomUUID();
    const attempt = Number(row.attempt) + 1;
    const claimed = await this.database
      .query()
      .updateTable('demoModeDailyResets')
      .set({
        token,
        attempt,
        state: 'running',
        startedAt: now,
        updatedAt: now,
        nextAt: null,
      })
      .where('day', '=', row.day)
      .where('token', '=', row.token)
      .where('state', '=', 'retry')
      .execute();
    return claimed.updatedCount === 1
      ? { ...schedule, day: row.day, token, attempt }
      : null;
  }

  /**
   * The owner stopped renewing and its data operation settled. A reset that completed after the claim started only
   * misses its acknowledgement and is not repeated; anything else, including a claim that never reached the data
   * operation, is a settled failure and takes the retry path.
   */
  private async settle(
    row: DailyRow,
    settled: DailySettledData,
    now: Date,
  ): Promise<void> {
    const completed =
      settled.ready &&
      settled.finishedAt !== null &&
      row.startedAt !== null &&
      new Date(settled.finishedAt).getTime() >=
        new Date(row.startedAt).getTime();
    await this.database.transaction(async ({ query }) => {
      const result = await query
        .updateTable('demoModeDailyResets')
        .set(
          completed
            ? { state: 'recovered', updatedAt: now }
            : {
                state: Number(row.attempt) < MAX_ATTEMPTS ? 'retry' : 'failed',
                updatedAt: now,
                nextAt: Number(row.attempt) < MAX_ATTEMPTS ? now : null,
                failure: JSON.stringify({
                  message:
                    'The daily demo reset stopped before its data operation completed.',
                }),
              },
        )
        .where('day', '=', row.day)
        .where('token', '=', row.token)
        .where('state', '=', row.state)
        .where('updatedAt', '=', row.updatedAt)
        .execute();
      if (completed && result.updatedCount === 1)
        await this.acknowledge(query, row.day);
    });
  }

  /** Today's row, every unacknowledged claim and recent retries of any day. */
  private rows(day: string, now: Date): Promise<DailyRow[]> {
    return this.database
      .query()
      .selectFrom('demoModeDailyResets')
      .select([
        'day',
        'token',
        'state',
        'attempt',
        'startedAt',
        'updatedAt',
        'nextAt',
      ])
      .where((eb) =>
        eb.or([
          eb('day', '=', day),
          eb('state', 'in', ['running', 'interrupted']),
          eb.and([
            eb('state', '=', 'retry'),
            eb('nextAt', '>', new Date(now.getTime() - RETRY_WINDOW_MS)),
          ]),
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
    const retry =
      error !== undefined && retryable && claim.attempt < MAX_ATTEMPTS;
    await this.database.transaction(async ({ query }) => {
      let update = query
        .updateTable('demoModeDailyResets')
        .set({
          state: error === undefined ? 'succeeded' : retry ? 'retry' : 'failed',
          updatedAt: new Date(),
          nextAt: retry ? new Date(Date.now() + RETRY_MS) : null,
          failure:
            error === undefined
              ? null
              : JSON.stringify({ message: message(error) }),
        })
        .where('day', '=', claim.day)
        .where('token', '=', claim.token);
      // The token alone proves ownership of a completed reset, even after another process settled the claim it
      // stopped renewing; a failure never overrides such a settlement.
      if (error !== undefined)
        update = update.where('state', 'in', ['running', 'interrupted']);
      const result = await update.execute();
      if (result.updatedCount !== 1)
        throw new Error('The daily demo reset claim was lost.');
      if (error === undefined) await this.acknowledge(query, claim.day);
    });
  }

  /** `lastDay` only moves forward, so a late retry of an earlier day never reopens a later one. */
  private async acknowledge(query: QueryAdapter, day: string): Promise<void> {
    await query
      .updateTable('demoModeConfiguration')
      .set({ lastDay: day })
      .where('id', '=', 'default')
      .where((eb) =>
        eb.or([eb('lastDay', 'is', null), eb('lastDay', '<', day)]),
      )
      .execute();
  }
}
