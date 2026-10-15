import { describe, expect, it } from 'vitest';
import { dayWindow, dueDay, localDay, shiftDay, validDay, validTimezone } from '../shared/time.js';

describe('report calendar windows', () => {
  it('rejects impossible dates rather than normalizing them', () => {
    expect(validDay('2026-02-30')).toBe(false);
    expect(validDay('2024-02-29')).toBe(true);
    expect(validDay('2026-2-01')).toBe(false);
    expect(validTimezone('not/a/timezone')).toBe(false);
  });
  it('uses a half-open local day', () => {
    expect(dayWindow('2026-10-14', 'Asia/Shanghai')).toEqual({ start: '2026-10-13T16:00:00.000Z', end: '2026-10-14T16:00:00.000Z' });
  });
  it('handles a 23-hour daylight-saving day', () => {
    const window = dayWindow('2026-10-04', 'Australia/Melbourne');
    expect(Date.parse(window.end) - Date.parse(window.start)).toBe(23 * 3_600_000);
  });
  it('handles a 25-hour daylight-saving day', () => {
    const window = dayWindow('2026-04-05', 'Australia/Melbourne');
    expect(Date.parse(window.end) - Date.parse(window.start)).toBe(25 * 3_600_000);
  });
  it('handles offsets with nonzero minutes', () => {
    expect(dayWindow('2026-10-14', 'Asia/Kathmandu').start).toBe('2026-10-13T18:15:00.000Z');
  });
  it('schedules the previous local date without confusing UTC', () => {
    expect(dueDay(new Date('2026-10-14T17:00:00Z'), 'Asia/Shanghai', 2)).toBeNull();
    expect(dueDay(new Date('2026-10-14T18:00:00Z'), 'Asia/Shanghai', 2)).toBe('2026-10-14');
    expect(localDay(new Date('2026-10-14T18:00:00Z'), 'Asia/Shanghai')).toBe('2026-10-15');
    expect(shiftDay('2026-01-01', -1)).toBe('2025-12-31');
  });
});
