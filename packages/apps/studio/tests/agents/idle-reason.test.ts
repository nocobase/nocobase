// @vitest-environment node
/**
 * Why an agent is idle on an issue it executes (`idleReasonOf`, `server/agents/board.ts`): in backlog first, then how
 * its newest run there ended, then whether the status wakes an agent at all.
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
      idleReasonOf({
        statusKey: 'backlog',
        lastRun: ended('completed'),
        autoRuns: true,
      }),
    ).toEqual({ reason: 'backlog', lastRun: null });
  });

  it.each(['completed', 'failed', 'cancelled'] as const)(
    'names a last run that %s, and when',
    (status) => {
      expect(
        idleReasonOf({
          statusKey: 'todo',
          lastRun: ended(status),
          autoRuns: false,
        }),
      ).toEqual({
        reason: 'lastRun',
        lastRun: { status, at: '2026-10-03T08:00:00.000Z' },
      });
    },
  );

  it('falls back to when the run was last updated', () => {
    expect(
      idleReasonOf({
        statusKey: 'todo',
        lastRun: { ...ended('failed'), finishedAt: null },
        autoRuns: true,
      }).lastRun?.at,
    ).toBe('2026-10-03T08:00:01.000Z');
  });

  it('without a run: whether the status wakes an agent', () => {
    expect(
      idleReasonOf({ statusKey: 'todo', lastRun: null, autoRuns: false }),
    ).toEqual({ reason: 'noAutoRun', lastRun: null });
    expect(
      idleReasonOf({ statusKey: 'analysis', lastRun: null, autoRuns: true }),
    ).toEqual({ reason: 'neverRan', lastRun: null });
  });

  it('ignores a run that has not ended', () => {
    expect(
      idleReasonOf({
        statusKey: 'todo',
        lastRun: { ...ended('completed'), status: 'running' },
        autoRuns: true,
      }).reason,
    ).toBe('neverRan');
  });
});
