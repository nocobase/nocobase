import { describe, expect, it } from 'vitest';

import { normalizeScheduleJob } from '../../src/validation.js';
import type { ScheduleJob, ScheduleJobOption } from '../../src/types.js';

function job(options: ScheduleJobOption, name = 'job-1'): ScheduleJob {
  return { name, options, payload: {}, execute: async () => undefined };
}

describe('normalizeScheduleJob', () => {
  it('accepts a cron rule with every optional field', () => {
    const startDate = new Date('2026-01-01T00:00:00Z');
    const endDate = new Date('2027-01-01T00:00:00Z');

    expect(
      normalizeScheduleJob(
        job({
          cron: '*/5 * * * *',
          tz: 'Asia/Shanghai',
          limit: 3,
          startDate,
          endDate,
        }),
      ),
    ).toEqual({
      name: 'job-1',
      options: {
        cron: '*/5 * * * *',
        tz: 'Asia/Shanghai',
        limit: 3,
        startDate,
        endDate,
      },
      immediately: false,
    });
    expect(
      normalizeScheduleJob(job({ cron: '0 * * * *', immediately: true })),
    ).toMatchObject({ immediately: true });
  });

  it('accepts an interval rule and ignores immediately for it', () => {
    expect(
      normalizeScheduleJob(job({ every: 1000, immediately: true })),
    ).toEqual({ name: 'job-1', options: { every: 1000 }, immediately: false });
  });

  it.each([
    ['', /Invalid schedule job name/u],
    ['a:b', /Invalid schedule job name/u],
  ])('rejects job name %j', (name, message) => {
    expect(() => normalizeScheduleJob(job({ every: 1000 }, name))).toThrow(
      message,
    );
  });

  it.each([
    [{}, /exactly one of cron or every/u],
    [{ cron: '* * * * *', every: 1000 }, /exactly one of cron or every/u],
    [{ every: 0 }, /every must be a positive integer/u],
    [{ every: 1.5 }, /every must be a positive integer/u],
    [{ cron: '* * * * *', limit: 0 }, /limit must be a positive integer/u],
    [{ cron: 'not a cron' }, /Invalid cron expression/u],
    [{ cron: '* * * * *', tz: 'Mars/Olympus' }, /Invalid cron expression/u],
    [
      { cron: '* * * * *', startDate: new Date('invalid') },
      /startDate must be a valid Date/u,
    ],
    [
      { every: 1000, endDate: 'tomorrow' as unknown as Date },
      /endDate must be a valid Date/u,
    ],
    [
      {
        every: 1000,
        startDate: new Date('2026-02-01T00:00:00Z'),
        endDate: new Date('2026-01-01T00:00:00Z'),
      },
      /endDate must be later than startDate/u,
    ],
    [
      {
        cron: '* * * * *',
        immediately: true,
        startDate: new Date('2026-01-01T00:00:00Z'),
      },
      /immediately cannot be combined with startDate/u,
    ],
  ] as const)('rejects options %o', (options, message) => {
    expect(() =>
      normalizeScheduleJob(job(options as ScheduleJobOption)),
    ).toThrow(message);
  });

  it('requires an execute function', () => {
    expect(() =>
      normalizeScheduleJob({
        name: 'job',
        options: { every: 10 },
        payload: undefined,
      } as unknown as ScheduleJob),
    ).toThrow(/execute must be a function/u);
  });
});
