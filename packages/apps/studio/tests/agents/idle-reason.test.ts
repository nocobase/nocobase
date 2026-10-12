// @vitest-environment node
/**
 * Why an agent is idle on an issue it executes (`idleReasonOf`, `server/agents/board.ts`): in backlog first, then how
 * its newest run there ended, else it never ran.
 */
import { describe, expect, it } from 'vitest';

import { idleReasonOf } from '../../server/agents/board.js';

const ended = (status: 'completed' | 'failed' | 'cancelled') => ({
  status,
  finishedAt: '2026-10-03T08:00:00.000Z',
  updatedAt: '2026-10-03T08:00:01.000Z',
});

describe('why an agent is idle on an issue', () => {
  it('says backlog before anything else', () => {
    expect(
      idleReasonOf({ statusKey: 'backlog', lastRun: ended('completed') }),
    ).toEqual({ reason: 'backlog', lastRun: null });
  });

  it.each(['completed', 'failed', 'cancelled'] as const)(
    'names a last run that %s, and when',
    (status) => {
      expect(
        idleReasonOf({ statusKey: 'in_progress', lastRun: ended(status) }),
      ).toEqual({
        reason: 'lastRun',
        lastRun: { status, at: '2026-10-03T08:00:00.000Z' },
      });
    },
  );

  it('falls back to when the run was last updated', () => {
    expect(
      idleReasonOf({
        statusKey: 'in_progress',
        lastRun: { ...ended('failed'), finishedAt: null },
      }).lastRun?.at,
    ).toBe('2026-10-03T08:00:01.000Z');
  });

  it('says it never ran without an ended run', () => {
    expect(idleReasonOf({ statusKey: 'blocked', lastRun: null })).toEqual({
      reason: 'neverRan',
      lastRun: null,
    });
    expect(
      idleReasonOf({
        statusKey: 'in_progress',
        lastRun: { ...ended('completed'), status: 'running' },
      }).reason,
    ).toBe('neverRan');
  });
});
