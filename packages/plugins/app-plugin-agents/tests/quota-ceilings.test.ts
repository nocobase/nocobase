import { expect, it } from 'vitest';
import { quotaBlocks, type Runner } from '../shared/runners.js';
it('keeps model-specific ceilings separate, handles unknown resets and ignores expired readings', () => {
  const runner: Pick<
    Runner,
    'quotaUsage' | 'quotaLimits' | 'unavailableModels'
  > = {
    quotaLimits: { claude: 80 },
    quotaUsage: [
      {
        tool: 'claude',
        window: 'seven_day_opus',
        scope: 'model',
        target: 'claude-opus-4-6',
        usedPercent: 80,
        resetsAt: null,
        observedAt: '2026-11-11T00:00:00.000Z',
      },
    ],
  };
  expect(
    quotaBlocks(
      runner,
      { tool: 'claude', model: 'claude-opus-4-6' },
      Date.now(),
    ),
  ).toHaveLength(1);
  expect(
    quotaBlocks(
      runner,
      { tool: 'claude', model: 'claude-sonnet-4-6' },
      Date.now(),
    ),
  ).toEqual([]);
  expect(
    quotaBlocks(
      {
        ...runner,
        quotaUsage: runner.quotaUsage?.map((u) => ({
          ...u,
          resetsAt: '2020-01-01T00:00:00.000Z',
        })),
      },
      { tool: 'claude', model: 'claude-opus-4-6' },
      Date.now(),
    ),
  ).toEqual([]);
  expect(
    quotaBlocks(
      { ...runner, quotaLimits: null },
      { tool: 'claude', model: 'claude-opus-4-6' },
      Date.now(),
    ),
  ).toEqual([]);
});
