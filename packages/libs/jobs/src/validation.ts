import { CronExpressionParser } from 'cron-parser';

import type { ScheduleJob, ScheduleJobOption } from './types.js';

const FORBIDDEN_SCOPE_CHARACTERS = /[:\\\s]/u;
const SCOPED_PACKAGE_NAME = /^@([^/]+)\/([^/]+)$/u;

/**
 * A scope names a BullMQ queue and a state file, so it may contain neither `:`
 * nor whitespace nor a path separator. The one `/` allowed is the separator of
 * an npm scoped package name, which is what consumers pass by convention; the
 * memory adapter encodes it before building a file name.
 */
export function assertValidScope(scope: string): void {
  const segments = typeof scope === 'string' ? scopeSegments(scope) : undefined;
  if (
    !segments ||
    FORBIDDEN_SCOPE_CHARACTERS.test(scope) ||
    segments.some(
      (segment) => segment === '' || segment === '.' || segment === '..',
    )
  ) {
    throw new Error(
      `Invalid schedule scope ${JSON.stringify(scope)}: use a package name without ":", whitespace or path separators other than the one in "@scope/name".`,
    );
  }
}

function scopeSegments(scope: string): string[] | undefined {
  if (!scope.includes('/')) return [scope];
  const match = SCOPED_PACKAGE_NAME.exec(scope);
  return match ? [match[1], match[2]] : undefined;
}

/** BullMQ 6 treats an id shaped like `name:id:endDate:tz:pattern` as a legacy repeatable key. */
export function assertValidJobName(name: string): void {
  if (typeof name !== 'string' || name === '' || name.includes(':')) {
    throw new Error(
      `Invalid schedule job name ${JSON.stringify(name)}: it must be a non-empty string without ":".`,
    );
  }
}

/** The rule a job stores, without the creation-only `immediately` flag. */
export type ScheduleRule = Omit<ScheduleJobOption, 'immediately'>;

export interface NormalizedScheduleJob {
  readonly name: string;
  readonly options: ScheduleRule;
  /** Whether to fire on creation; only ever true for a cron rule. */
  readonly immediately: boolean;
}

export function normalizeScheduleJob(job: ScheduleJob): NormalizedScheduleJob {
  assertValidJobName(job.name);
  if (typeof job.execute !== 'function') {
    throw new Error(`Schedule job "${job.name}": execute must be a function.`);
  }
  const options = job.options ?? {};
  const hasCron = options.cron !== undefined;
  const hasEvery = options.every !== undefined;
  if (hasCron === hasEvery) {
    throw new Error(
      `Schedule job "${job.name}" needs exactly one of cron or every.`,
    );
  }
  if (hasEvery && !isPositiveInteger(options.every)) {
    throw new Error(
      `Schedule job "${job.name}": every must be a positive integer of milliseconds.`,
    );
  }
  if (options.limit !== undefined && !isPositiveInteger(options.limit)) {
    throw new Error(
      `Schedule job "${job.name}": limit must be a positive integer.`,
    );
  }
  for (const field of ['startDate', 'endDate'] as const) {
    const value = options[field];
    if (
      value !== undefined &&
      (!(value instanceof Date) || Number.isNaN(value.getTime()))
    ) {
      throw new Error(
        `Schedule job "${job.name}": ${field} must be a valid Date.`,
      );
    }
  }
  if (
    options.startDate &&
    options.endDate &&
    options.endDate.getTime() <= options.startDate.getTime()
  ) {
    throw new Error(
      `Schedule job "${job.name}": endDate must be later than startDate.`,
    );
  }
  if (hasCron && options.immediately === true && options.startDate) {
    throw new Error(
      `Schedule job "${job.name}": immediately cannot be combined with startDate.`,
    );
  }
  if (hasCron) {
    try {
      // The time zone is only applied when a date is computed, so compute one.
      CronExpressionParser.parse(options.cron, {
        tz: options.tz ?? 'UTC',
      }).next();
    } catch (error) {
      throw new Error(
        `Schedule job "${job.name}": Invalid cron expression ${JSON.stringify(options.cron)}${options.tz ? ` in time zone ${options.tz}` : ''}.`,
        { cause: error },
      );
    }
  }
  const rule: { -readonly [K in keyof ScheduleRule]: ScheduleRule[K] } = {};
  if (hasCron) rule.cron = options.cron!;
  if (hasEvery) rule.every = options.every!;
  if (options.limit !== undefined) rule.limit = options.limit;
  if (options.startDate) rule.startDate = options.startDate;
  if (options.endDate) rule.endDate = options.endDate;
  if (options.tz !== undefined) rule.tz = options.tz;
  return {
    name: job.name,
    options: rule,
    immediately: hasCron && options.immediately === true,
  };
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}
