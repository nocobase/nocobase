import { describe, expect, it } from 'vitest';

import type { Schedule } from '../client/lib/api.js';
import {
  describeCron,
  formatDuration,
  utcOffset,
} from '../client/lib/format.js';
import {
  attentionOf,
  LONG_WAIT_MS,
  scheduleState,
} from '../client/lib/schedule-state.js';
import { reasonText } from '../client/pages/schedules/occurrence-text.js';

const t = (key: string, options?: Record<string, unknown>) =>
  options ? `${key} ${JSON.stringify(options)}` : key;

describe('describeCron', () => {
  it('words the common shapes and leaves the rest as they are', () => {
    expect(describeCron('*/5 * * * *', t, 'en-US')).toBe(
      'cron.everyMinutes {"count":5}',
    );
    expect(describeCron('* * * * *', t, 'en-US')).toBe('cron.everyMinute');
    expect(describeCron('0 2 * * *', t, 'en-US')).toBe(
      'cron.daily {"time":"02:00"}',
    );
    expect(describeCron('0 */6 * * *', t, 'en-US')).toBe(
      'cron.everyHours {"count":6}',
    );
    expect(describeCron('30 9 * * 1-5', t, 'en-US')).toBe(
      'cron.weekdays {"time":"09:30"}',
    );
    expect(describeCron('0 9 * * 1', t, 'en-US')).toBe(
      'cron.weekly {"day":"Monday","time":"09:00"}',
    );
    expect(describeCron('0 9 1 * *', t, 'en-US')).toBe(
      'cron.monthly {"day":1,"time":"09:00"}',
    );
    expect(describeCron('0 9 1 1,7 *', t, 'en-US')).toBe('0 9 1 1,7 *');
  });
});

describe('formatting', () => {
  it('uses the largest whole unit of a duration', () => {
    expect(formatDuration(12, 'en-US')).toBe('12 ms');
    expect(formatDuration(4200, 'en-US')).toBe('4.2 sec');
    expect(formatDuration(-1, 'en-US')).toBeUndefined();
  });

  it('names a time zone by its offset', () => {
    expect(utcOffset('Asia/Singapore')).toBe('UTC+8');
    expect(utcOffset('Not/AZone')).toBe('');
  });

  it('translates a known reason and keeps its code', () => {
    const translate = (key: string) =>
      key === 'reason.target-missing' ? 'The target does not exist' : '';
    expect(reasonText(translate, 'target-missing')).toBe(
      'The target does not exist (target-missing)',
    );
    expect(reasonText(translate, 'custom-code')).toBe('custom-code');
    expect(reasonText(translate, undefined)).toBeUndefined();
  });
});

function schedule(overrides: Partial<Schedule> = {}): Schedule {
  return {
    id: 'id',
    key: 'key',
    sourceType: 'code',
    title: 'Title',
    cron: '*/5 * * * *',
    timezone: 'UTC',
    enabled: true,
    targetType: 'log',
    lifecycleState: 'active',
    runCount: 0,
    completedCount: 0,
    scheduleStatus: 'active',
    targetState: 'ready',
    targetSummary: { targetLabel: 'Log' },
    ...overrides,
  };
}

describe('schedule state', () => {
  it('ranks removed over paused over an unavailable target', () => {
    expect(scheduleState(schedule())).toBe('running');
    expect(scheduleState(schedule({ targetState: 'missing' }))).toBe(
      'unavailable',
    );
    expect(
      scheduleState(schedule({ enabled: false, targetState: 'missing' })),
    ).toBe('paused');
    expect(
      scheduleState(schedule({ enabled: false, lifecycleState: 'inactive' })),
    ).toBe('removed');
  });

  it('points out an unavailable target, a failure and a long wait', () => {
    const now = Date.parse('2026-11-21T12:00:00Z');
    expect(attentionOf(schedule({ targetState: 'invalid' }), now)?.kind).toBe(
      'target',
    );
    expect(
      attentionOf(schedule({ lastRun: { status: 'timed_out' } }), now)?.kind,
    ).toBe('failed');
    const waitingSince = (ms: number) =>
      schedule({
        lastRun: { status: 'waiting' },
        lastRunAt: new Date(now - ms).toISOString(),
      });
    expect(attentionOf(waitingSince(LONG_WAIT_MS + 1), now)?.kind).toBe(
      'waiting',
    );
    expect(attentionOf(waitingSince(60_000), now)).toBeUndefined();
    expect(
      attentionOf(
        schedule({ enabled: false, lastRun: { status: 'failed' } }),
        now,
      ),
    ).toBeUndefined();
  });
});
