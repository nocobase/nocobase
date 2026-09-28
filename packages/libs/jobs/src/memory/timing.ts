import { CronExpressionParser } from 'cron-parser';

import type { ScheduleRule } from '../validation.js';

/**
 * The first firing of a new rule, in epoch milliseconds, or `null` when the
 * rule never fires. A cron rule fires at its first tick after
 * `max(now, startDate)`, the way BullMQ computes it; an interval rule fires at
 * `max(now, startDate)`; `immediately` fires now.
 */
export function firstFiring(
  rule: ScheduleRule,
  now: number,
  immediately: boolean,
): number | null {
  const from = Math.max(now, rule.startDate?.getTime() ?? now);
  let first: number | null;
  if (rule.cron !== undefined) {
    first = immediately ? now : nextCronTick(rule, from);
  } else {
    first = from;
  }
  return withinEnd(rule, first);
}

/**
 * The firing after one planned for `scheduledAt`, once `fired` firings have
 * started. A cron rule moves to its first tick after both the planned time and
 * now, so firings missed while nothing ran collapse into the one that ran. An
 * interval rule keeps its phase: planned time plus the interval, skipping the
 * intervals that already passed.
 */
export function nextFiring(
  rule: ScheduleRule,
  scheduledAt: number,
  fired: number,
  now: number,
): number | null {
  if (rule.limit !== undefined && fired >= rule.limit) return null;
  let next: number | null;
  if (rule.cron !== undefined) {
    next = nextCronTick(
      rule,
      Math.max(scheduledAt, now, rule.startDate?.getTime() ?? 0),
    );
  } else {
    const every = rule.every!;
    next = scheduledAt + every;
    if (next <= now) {
      next =
        scheduledAt + every * (Math.floor((now - scheduledAt) / every) + 1);
    }
  }
  return withinEnd(rule, next);
}

function nextCronTick(rule: ScheduleRule, after: number): number | null {
  try {
    return CronExpressionParser.parse(rule.cron!, {
      currentDate: new Date(after),
      // An omitted time zone means UTC, not the host's local time.
      tz: rule.tz ?? 'UTC',
    })
      .next()
      .getTime();
  } catch {
    return null;
  }
}

function withinEnd(rule: ScheduleRule, at: number | null): number | null {
  if (at === null) return null;
  return rule.endDate && at > rule.endDate.getTime() ? null : at;
}
