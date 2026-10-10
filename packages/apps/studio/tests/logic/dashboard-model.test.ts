import { describe, expect, it } from 'vitest';

import {
  AGENT_FIGURES,
  daysSince,
  figureValue,
  formatDuration,
  formatFigure,
  formatTrend,
  hasRuns,
  hasSpark,
  HEADLINES,
  progressOf,
  sparkPoints,
  trendOf,
} from '../../client/pages/dashboard/model.ts';
import type { DashboardDay, DashboardFigures } from '../../shared/reports.ts';

const figures = (extra: Partial<DashboardFigures> = {}): DashboardFigures => ({
  completed: 10,
  cycleTimeP50Ms: 2 * 3_600_000,
  agentShare: 0.5,
  costPerIssue: { USD: 2 },
  runs: 20,
  successRate: 0.9,
  reworkRate: 0.1,
  runsPerIssue: 1.5,
  interventionRate: 0.2,
  queueWaitP50Ms: 3000,
  ...extra,
});

const spec = (key: string) =>
  [...HEADLINES, ...AGENT_FIGURES].find((item) => item.key === key)!;

describe('dashboard figures', () => {
  it('reads a cost in the report’s currency', () => {
    expect(figureValue(figures(), 'costPerIssue', 'USD')).toBe(2);
    expect(figureValue(figures(), 'costPerIssue', 'EUR')).toBeNull();
    expect(
      figureValue(figures({ costPerIssue: null }), 'costPerIssue', 'USD'),
    ).toBeNull();
  });

  it('compares with the period before, saying which way is good news', () => {
    const report = (
      current: Partial<DashboardFigures>,
      previous: Partial<DashboardFigures>,
    ) => ({
      current: figures(current),
      previous: figures(previous),
      currency: 'USD',
    });
    // More issues is good; a longer cycle and a higher cost per issue are not.
    expect(trendOf(spec('completed'), report({ completed: 15 }, {}))).toEqual({
      change: 0.5,
      unit: 'ratio',
      good: true,
    });
    expect(
      trendOf(
        spec('cycleTimeP50Ms'),
        report({ cycleTimeP50Ms: 3 * 3_600_000 }, {}),
      ),
    ).toMatchObject({ unit: 'ratio', good: false });
    expect(
      trendOf(spec('costPerIssue'), report({ costPerIssue: { USD: 1 } }, {})),
    ).toMatchObject({ change: -0.5, good: true });
    // Shares change in points; less rework is good.
    expect(
      trendOf(spec('reworkRate'), report({ reworkRate: 0.3 }, {})),
    ).toMatchObject({
      unit: 'points',
      good: false,
    });
    expect(
      trendOf(spec('reworkRate'), report({ reworkRate: 0.3 }, {}))?.change,
    ).toBeCloseTo(20);
    // Nothing to compare with.
    expect(trendOf(spec('completed'), report({}, { completed: 0 }))).toBeNull();
    expect(
      trendOf(spec('agentShare'), report({}, { agentShare: null })),
    ).toBeNull();
    expect(trendOf(spec('completed'), report({}, {}))).toMatchObject({
      good: null,
    });
  });

  it('formats figures and changes for the interface language', () => {
    expect(formatFigure(null, 'count', 'USD', 'en-US')).toBe('—');
    expect(formatFigure(1234, 'count', 'USD', 'en-US')).toBe('1,234');
    expect(formatFigure(0.25, 'percent', 'USD', 'en-US')).toBe('25%');
    expect(formatFigure(1.25, 'number', 'USD', 'en-US')).toBe('1.3');
    expect(formatFigure(3.5, 'money', 'USD', 'en-US')).toBe('$3.50');
    expect(formatDuration(40_000, 'en-US')).toBe('40 sec');
    expect(formatDuration(45 * 60_000, 'en-US')).toBe('45 min');
    expect(formatDuration(1.5 * 86_400_000, 'en-US')).toBe('1.5 days');
    expect(
      formatTrend({ change: 0.5, unit: 'ratio', good: true }, 'en-US'),
    ).toBe('+50%');
    expect(
      formatTrend({ change: -3, unit: 'points', good: false }, 'en-US'),
    ).toBe('−3');
  });

  it('draws a sparkline only with two points or more', () => {
    const buckets = [
      {
        from: 'a',
        to: 'a',
        completed: 1,
        cycleTimeP50Ms: null,
        agentShare: 1,
        costPerIssue: null,
      },
      {
        from: 'b',
        to: 'b',
        completed: 0,
        cycleTimeP50Ms: 5,
        agentShare: null,
        costPerIssue: null,
      },
      {
        from: 'c',
        to: 'c',
        completed: 2,
        cycleTimeP50Ms: null,
        agentShare: 0.5,
        costPerIssue: 3,
      },
    ];
    expect(
      sparkPoints(buckets, spec('completed')).map((point) => point.value),
    ).toEqual([1, 0, 2]);
    expect(hasSpark(sparkPoints(buckets, spec('agentShare')))).toBe(true);
    expect(hasSpark(sparkPoints(buckets, spec('cycleTimeP50Ms')))).toBe(false);
    expect(hasSpark(sparkPoints(buckets, spec('costPerIssue')))).toBe(false);
  });

  it('tells whether any run happened, a project’s progress and days since', () => {
    const day = (runsFailed: number): DashboardDay => ({
      day: '2026-10-01',
      completed: 0,
      completedByAgents: 0,
      cycleTimeP50Ms: null,
      cost: 0,
      runsCompleted: 0,
      runsFailed,
      runsCancelled: 0,
      runsOpen: 0,
    });
    expect(hasRuns([day(0), day(0)])).toBe(false);
    expect(hasRuns([day(0), day(1)])).toBe(true);
    expect(progressOf({ done: 3, total: 4 })).toBe(0.75);
    expect(progressOf({ done: 0, total: 0 })).toBe(0);
    expect(
      daysSince('2026-10-01T00:00:00Z', Date.parse('2026-10-03T12:00:00Z')),
    ).toBe(2);
  });
});
