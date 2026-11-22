import { CronExpressionParser } from 'cron-parser';

/** What the next firings of a Schedule are computed from. */
export interface UpcomingRunsInput {
  readonly cron: string;
  readonly timezone: string;
  readonly from?: string;
  readonly to?: string;
  readonly limit?: number;
  readonly runCount: number;
}

/**
 * The next `count` firings of a Schedule after `now`, as ISO strings: its cron rule in its time zone, starting no
 * earlier than `from`, ending at `to`, and no more than its limit leaves. A rule that cannot be read plans nothing.
 */
export function upcomingRuns(
  schedule: UpcomingRunsInput,
  count: number,
  now: Date,
): string[] {
  const remaining =
    schedule.limit === undefined
      ? count
      : Math.min(count, Math.max(schedule.limit - schedule.runCount, 0));
  if (remaining === 0) return [];
  // `from` is inclusive while the parser starts strictly after its current date, as the executor's rule does.
  const start = schedule.from
    ? new Date(schedule.from).getTime() - 1
    : -Infinity;
  const currentDate = new Date(Math.max(now.getTime(), start));
  const runs: string[] = [];
  try {
    const expression = CronExpressionParser.parse(schedule.cron, {
      currentDate,
      tz: schedule.timezone,
      ...(schedule.to ? { endDate: new Date(schedule.to) } : {}),
    });
    while (runs.length < remaining && expression.hasNext())
      runs.push(expression.next().toDate().toISOString());
  } catch {
    // An invalid rule never reaches the database, which `defineSchedule` validates; an ended window has no next.
  }
  return runs;
}
