// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { countsAsRun } from '../../server/agents/comment-guard.js';
import { rosterLine } from '../../server/agents/manager/roster.js';

describe('execution machine disk failures', () => {
  it('does not count a started disk-full failure as an attempted step', () => {
    const run = {
      status: 'failed' as const,
      startedAt: '2026-10-13T04:00:00Z',
      failureReason: 'runnerDiskFull' as const,
      cancelRequestedAt: null,
    };
    expect(countsAsRun(run)).toBe(false);
    expect(countsAsRun({ ...run, failureReason: 'toolProcess' })).toBe(true);
  });
  it('provides actual runner names so reassignment can choose another machine', () => {
    expect(
      rosterLine({
        id: 'a',
        name: 'A',
        goodAt: 'Implementation',
        tool: 'codex',
        model: 'm',
        online: true,
        personalOnly: false,
        busy: 0,
        runners: { team: 1, personal: 0, mine: 0, names: ['other-machine'] },
      }),
    ).toContain('runners: other-machine');
  });
});
