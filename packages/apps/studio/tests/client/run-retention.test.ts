import { describe, expect, it } from 'vitest';
import {
  hasClearedRunData,
  isRunPastRetention,
} from '../../client/agents/run-retention.js';

const now = Date.parse('2026-10-14T12:00:00Z');
describe('run retention hint', () => {
  it('requires positive retention and a strictly expired terminal run', () => {
    for (const status of ['completed', 'failed', 'cancelled']) {
      const run = { status, finishedAt: '2026-09-01T00:00:00Z' };
      expect(isRunPastRetention(run, 14, now)).toBe(true);
      expect(isRunPastRetention(run, 0, now)).toBe(false);
      expect(isRunPastRetention({ ...run, finishedAt: null }, 14, now)).toBe(
        false,
      );
      expect(
        isRunPastRetention(
          { ...run, finishedAt: '2026-09-30T12:00:00Z' },
          14,
          now,
        ),
      ).toBe(false);
    }
    for (const status of ['queued', 'dispatched', 'running'])
      expect(
        isRunPastRetention(
          { status, finishedAt: '2026-09-01T00:00:00Z' },
          14,
          now,
        ),
      ).toBe(false);
  });
  it('requires full empty events and a missing brief, preserves data and hides the hint on errors or loading', () => {
    expect(hasClearedRunData(true, [], false, { status: 404 })).toBe(true);
    expect(hasClearedRunData(false, [], false, { status: 404 })).toBe(false);
    expect(hasClearedRunData(true, [{ seq: 1 }], false, { status: 404 })).toBe(
      false,
    );
    expect(hasClearedRunData(true, undefined, false, { status: 404 })).toBe(
      false,
    );
    expect(hasClearedRunData(true, [], true, { status: 404 })).toBe(false);
    expect(hasClearedRunData(true, [], false, null)).toBe(false);
    expect(hasClearedRunData(true, [], false, { status: 500 })).toBe(false);
  });
});
