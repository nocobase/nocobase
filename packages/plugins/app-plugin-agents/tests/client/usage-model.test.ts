import { describe, expect, it } from 'vitest';

import {
  chartCurrency,
  defaultRange,
  formatCost,
  formatDayRange,
  formatDuration,
  presetRange,
  rangeDays,
  readGroup,
  rowLink,
  usageChart,
} from '../../client/pages/usage/model.js';
import type {
  UsagePoint,
  UsageReport,
  UsageRow,
} from '../../shared/reports.js';
import type { SubjectVocabulary } from '../../shared/vocabulary.js';

const issue: SubjectVocabulary = {
  kind: 'issue',
  title: null,
  groupTitle: { key: 'project', ns: 'app' },
  path: '/issues/{id}',
  groupPath: '/projects/{id}',
  triggers: {},
  preview: null,
};

describe('the usage page model', () => {
  it('defaults to the last 30 days and reads the grouping', () => {
    expect(defaultRange(new Date(2026, 9, 3))).toEqual({
      from: '2026-09-04',
      to: '2026-10-03',
    });
    expect(readGroup('subject')).toBe('subject');
    expect(readGroup('project')).toBe('agent');
    expect(formatCost(null, 'en-US')).toBe('—');
    expect(formatCost({ USD: 1.5 }, 'en-US')).toBe('$1.50');
  });

  it('links agents to their page, and groups and subjects where the application shows them', () => {
    expect(rowLink('agent', 'a 1', [])).toBe('/agents/a%201');
    expect(rowLink('group', 'p1', [issue])).toBe('/projects/p1');
    expect(rowLink('subject', 'issue:i1', [issue])).toBe('/issues/i1');
    expect(rowLink('subject', 'conversation:c1', [issue])).toBeNull();
    expect(rowLink('group', 'p1', [])).toBeNull();
    expect(rowLink('model', 'gpt', [issue])).toBeNull();
  });
});

const tokens = {
  inputTokens: 10,
  outputTokens: 5,
  cacheReadTokens: 3,
  cacheWriteTokens: 2,
};

function usageRow(key: string): UsageRow {
  return {
    key,
    name: null,
    runs: 1,
    durationMs: 0,
    ...tokens,
    reasoningTokens: 0,
    cost: { USD: 1 },
    pricedRuns: 1,
  };
}

function usageReport(
  keys: readonly string[],
  daily: readonly UsagePoint[],
): UsageReport {
  return {
    from: '2026-09-30',
    to: '2026-10-02',
    groupBy: 'model',
    rows: keys.map(usageRow),
    totals: { ...usageRow('total'), cost: { EUR: 0.5, USD: 2 } },
    daily,
    unpricedModels: [],
  };
}

describe('the usage page range and durations', () => {
  it('says a duration in its two largest units, and "—" when there is none', () => {
    expect(formatDuration(0, 'en-US')).toBe('—');
    expect(formatDuration(null, 'en-US')).toBe('—');
    expect(formatDuration(850, 'en-US')).toBe('850 ms');
    expect(formatDuration(200_000, 'en-US')).toBe('3 min 20 sec');
    expect(formatDuration(3_600_000, 'en-US')).toBe('1 hr');
    expect(formatDuration(200_000, 'zh-CN')).toBe('3分钟 20秒');
  });

  it('works out the presets from today', () => {
    const today = new Date(2026, 9, 5);
    expect(presetRange('last7', today)).toEqual({
      from: '2026-09-29',
      to: '2026-10-05',
    });
    expect(presetRange('thisMonth', today)).toEqual({
      from: '2026-10-01',
      to: '2026-10-05',
    });
    expect(presetRange('lastMonth', today)).toEqual({
      from: '2026-09-01',
      to: '2026-09-30',
    });
    expect(presetRange('last90', today).from).toBe('2026-07-08');
  });

  it('says a range in the locale, the year once when both ends share it', () => {
    expect(formatDayRange('2026-09-06', '2026-10-05', 'zh-CN')).toBe(
      '2026年9月6日 – 10月5日',
    );
    expect(formatDayRange('2026-09-06', '2026-10-05', 'en-US')).toBe(
      'Sep 6, 2026 – Oct 5',
    );
    expect(formatDayRange('2025-12-30', '2026-01-02', 'en-US')).toBe(
      'Dec 30, 2025 – Jan 2, 2026',
    );
    expect(formatDayRange('2026-10-05', '2026-10-05', 'en-US')).toBe(
      'Oct 5, 2026',
    );
  });
});

describe('the usage chart', () => {
  it('fills every day of the range and charts the largest currency', () => {
    expect(rangeDays('2026-09-30', '2026-10-02')).toEqual([
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
    ]);
    expect(chartCurrency({ EUR: 0.5, USD: 2 })).toBe('USD');
    expect(chartCurrency(null)).toBeNull();
    const chart = usageChart(
      usageReport(
        ['m1'],
        [{ day: '2026-10-01', ...tokens, cost: { USD: 1.5, EUR: 9 } }],
      ),
      'cost',
    );
    expect(chart.series).toEqual([{ id: 'total' }]);
    expect(chart.points).toEqual([
      { day: '2026-09-30', total: 0 },
      { day: '2026-10-01', total: 1.5 },
      { day: '2026-10-02', total: 0 },
    ]);
  });

  it('stacks the top groups and folds the rest into other', () => {
    const keys = ['m1', 'm2', 'm3', 'm4'];
    const chart = usageChart(
      usageReport(keys, [
        {
          day: '2026-10-01',
          ...tokens,
          cost: null,
          series: keys.map((key) => ({ key, ...tokens, cost: null })),
        },
      ]),
      'tokens',
      2,
    );
    expect(chart.series).toEqual([
      { id: 's0', key: 'm1' },
      { id: 's1', key: 'm2' },
      { id: 'other' },
    ]);
    expect(chart.points[1]).toEqual({
      day: '2026-10-01',
      s0: 20,
      s1: 20,
      other: 40,
    });
    // One group past the top is shown rather than folded alone.
    expect(
      usageChart(
        usageReport(keys.slice(0, 3), [
          { day: '2026-10-01', ...tokens, cost: null, series: [] },
        ]),
        'tokens',
        2,
      ).series.map((series) => series.id),
    ).toEqual(['s0', 's1', 's2']);
  });
});
