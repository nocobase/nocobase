import { describe, expect, it } from 'vitest';

import { upcomingRuns } from '../server/upcoming.js';

const NOW = new Date('2026-11-21T02:03:00.000Z');

describe('upcomingRuns', () => {
  it('plans the next firings in the Schedule time zone', () => {
    expect(
      upcomingRuns(
        { cron: '0 9 * * *', timezone: 'Asia/Shanghai', runCount: 0 },
        3,
        NOW,
      ),
    ).toEqual([
      '2026-11-22T01:00:00.000Z',
      '2026-11-23T01:00:00.000Z',
      '2026-11-24T01:00:00.000Z',
    ]);
  });

  it('starts at an inclusive `from`, ends at `to` and stops at the limit', () => {
    expect(
      upcomingRuns(
        {
          cron: '0 * * * *',
          timezone: 'UTC',
          from: '2026-12-01T00:00:00.000Z',
          runCount: 0,
        },
        2,
        NOW,
      ),
    ).toEqual(['2026-12-01T00:00:00.000Z', '2026-12-01T01:00:00.000Z']);
    expect(
      upcomingRuns(
        {
          cron: '0 * * * *',
          timezone: 'UTC',
          to: '2026-11-21T04:00:00.000Z',
          runCount: 0,
        },
        3,
        NOW,
      ),
    ).toEqual(['2026-11-21T03:00:00.000Z', '2026-11-21T04:00:00.000Z']);
    expect(
      upcomingRuns(
        { cron: '0 * * * *', timezone: 'UTC', limit: 5, runCount: 4 },
        3,
        NOW,
      ),
    ).toEqual(['2026-11-21T03:00:00.000Z']);
    expect(
      upcomingRuns(
        { cron: '0 * * * *', timezone: 'UTC', limit: 5, runCount: 5 },
        3,
        NOW,
      ),
    ).toEqual([]);
  });
});
