/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  LIGHT_EXTENSION_COMPILE_METRIC_COUNTERS,
  LIGHT_EXTENSION_COMPILE_METRICS_SCHEMA_VERSION,
  type LightExtensionCompileMetricCounter,
  type LightExtensionCompileMetricsSummary,
} from '../../shared/compileMetrics';
import { LightExtensionValidator } from '../services/LightExtensionValidator';
import {
  createMediumCompilePerformanceFixture,
  createSmallCompilePerformanceFixture,
} from './helpers/compilePerformanceFixture';
import {
  buildCompilePerformanceBaselineReport,
  calculateDurationStatistics,
  serializeCompilePerformanceBaselineJson,
  serializeCompilePerformanceBaselineMarkdown,
} from './helpers/compilePerformanceReport';

describe('compile performance fixture helper', () => {
  it('generates the deterministic 1 Entry / 10 file fixture with a stable byte size', () => {
    const first = createSmallCompilePerformanceFixture();
    const second = createSmallCompilePerformanceFixture();

    expect(second).toEqual(first);
    expect(first.parameters).toEqual({
      fixtureVersion: 1,
      profile: 'small',
      entryCount: 1,
      fileCount: 10,
      sharedFileCount: 2,
      privateFileCount: 5,
      rootFileCount: 1,
      totalBytes: 926,
    });
    expect(first.entryNames).toEqual(['entry-01']);
    expect(first.files).toHaveLength(10);
    expect(first.files.map((file) => file.path)).toEqual([...first.files.map((file) => file.path)].sort());
    expect(new Set(first.files.map((file) => file.path)).size).toBe(10);
    expect(first.sharedReferences).toEqual({
      'src/shared/shared-01.ts': ['entry-01'],
      'src/shared/shared-02.ts': ['entry-01'],
    });
    expect(totalFixtureBytes(first.files)).toBe(926);
    expect(new LightExtensionValidator().validateWorkspace({ files: first.files })).toMatchObject({
      accepted: true,
      entries: [{ entryName: 'entry-01' }],
      diagnostics: [],
    });
  });

  it('generates the deterministic 20 Entry / 200 file fixture with repeatable shared references', () => {
    const first = createMediumCompilePerformanceFixture();
    const second = createMediumCompilePerformanceFixture();

    expect(second).toEqual(first);
    expect(first.parameters).toEqual({
      fixtureVersion: 1,
      profile: 'medium',
      entryCount: 20,
      fileCount: 200,
      sharedFileCount: 20,
      privateFileCount: 139,
      rootFileCount: 1,
      totalBytes: 21_496,
    });
    expect(first.entryNames).toHaveLength(20);
    expect(first.files).toHaveLength(200);
    expect(new Set(first.files.map((file) => file.path)).size).toBe(200);
    expect(totalFixtureBytes(first.files)).toBe(21_496);
    expect(first.sharedReferences['src/shared/shared-01.ts']).toEqual(['entry-01', 'entry-20']);
    expect(first.sharedReferences['src/shared/shared-20.ts']).toEqual(['entry-19', 'entry-20']);
    expect(Object.values(first.sharedReferences).every((entryNames) => entryNames.length === 2)).toBe(true);

    const validation = new LightExtensionValidator().validateWorkspace({ files: first.files });
    expect(validation.accepted).toBe(true);
    expect(validation.entries).toHaveLength(20);
    expect(validation.diagnostics).toEqual([]);
  });
});

describe('compile performance baseline report helper', () => {
  it('calculates deterministic median and interpolated p95 statistics', () => {
    const statistics = calculateDurationStatistics([4, 1, 3, 2]);
    expect(statistics).toMatchObject({ sampleCount: 4, median: 2.5 });
    expect(statistics.p95).toBeCloseTo(3.85);
    expect(calculateDurationStatistics([7])).toEqual({ sampleCount: 1, median: 7, p95: 7 });
  });

  it('builds stable JSON and Markdown reports with environment, fixture, run counts, timings, and every counter', () => {
    const fixture = createSmallCompilePerformanceFixture();
    const coldCounters = createCounters({ compiledEntryCount: 1 });
    const hotCounters = createCounters({ compileCacheHitCount: 1, compiledEntryCount: 0, reusedEntryCount: 1 });
    const report = buildCompilePerformanceBaselineReport({
      commit: 'abc1234',
      nodeVersion: '20.16.0',
      databaseDialect: 'postgres',
      fixture: fixture.parameters,
      scenarios: [
        {
          name: 'Private file save',
          coldRuns: [
            createSummary({ total: 20, compileEntries: 8 }, coldCounters),
            createSummary({ total: 10, compileEntries: 4 }, coldCounters),
          ],
          hotRuns: [createSummary({ total: 5 }, hotCounters), createSummary({ total: 7 }, hotCounters)],
        },
      ],
    });

    expect(report).toMatchObject({
      schemaVersion: 1,
      environment: {
        commit: 'abc1234',
        nodeVersion: '20.16.0',
        databaseDialect: 'postgres',
      },
      fixture: { entryCount: 1, fileCount: 10, totalBytes: 926 },
      scenarios: [
        {
          name: 'Private file save',
          operation: 'saveSource',
          result: 'success',
          cold: {
            runCount: 2,
            durationsMs: {
              total: { sampleCount: 2, median: 15, p95: 19.5 },
              compileEntries: { sampleCount: 2, median: 6, p95: 7.8 },
            },
            counters: coldCounters,
          },
          hot: {
            runCount: 2,
            durationsMs: { total: { sampleCount: 2, median: 6, p95: 6.9 } },
            counters: hotCounters,
          },
        },
      ],
    });

    const json = serializeCompilePerformanceBaselineJson(report);
    expect(json.endsWith('\n')).toBe(true);
    expect(JSON.parse(json)).toEqual(report);

    const markdown = serializeCompilePerformanceBaselineMarkdown(report);
    expect(markdown).toContain('| Commit | abc1234 |');
    expect(markdown).toContain('| Node version | 20.16.0 |');
    expect(markdown).toContain('| Database dialect | postgres |');
    expect(markdown).toContain('| Entries | 1 |');
    expect(markdown).toContain('| Files | 10 |');
    expect(markdown).toContain('| Total bytes | 926 |');
    expect(markdown).toContain('| Cold | total | 2 | 15 | 19.5 |');
    expect(markdown).toContain('| Hot | total | 2 | 6 | 6.9 |');
    for (const counter of LIGHT_EXTENSION_COMPILE_METRIC_COUNTERS) {
      expect(markdown).toContain(`| Cold | ${counter} | ${coldCounters[counter]} |`);
      expect(markdown).toContain(`| Hot | ${counter} | ${hotCounters[counter]} |`);
    }
  });

  it('rejects missing or non-deterministic structure counters instead of hiding structural regressions', () => {
    const fixture = createSmallCompilePerformanceFixture();
    const counters = createCounters();
    const missingCounter = { ...counters };
    delete (missingCounter as Partial<Record<LightExtensionCompileMetricCounter, number>>).referenceScanCount;

    expect(() =>
      buildCompilePerformanceBaselineReport({
        commit: 'abc1234',
        nodeVersion: '20.16.0',
        databaseDialect: 'sqlite',
        fixture: fixture.parameters,
        scenarios: [
          {
            name: 'Missing counter',
            coldRuns: [createSummary({ total: 1 }, missingCounter)],
            hotRuns: [createSummary({ total: 1 }, counters)],
          },
        ],
      }),
    ).toThrow('counter "referenceScanCount"');

    expect(() =>
      buildCompilePerformanceBaselineReport({
        commit: 'abc1234',
        nodeVersion: '20.16.0',
        databaseDialect: 'sqlite',
        fixture: fixture.parameters,
        scenarios: [
          {
            name: 'Counter drift',
            coldRuns: [
              createSummary({ total: 1 }, counters),
              createSummary({ total: 2 }, createCounters({ compiledEntryCount: 2 })),
            ],
            hotRuns: [createSummary({ total: 1 }, counters)],
          },
        ],
      }),
    ).toThrow('non-deterministic cold counter "compiledEntryCount"');
  });
});

function createSummary(
  durationsMs: LightExtensionCompileMetricsSummary['durationsMs'],
  counters: LightExtensionCompileMetricsSummary['counters'],
): LightExtensionCompileMetricsSummary {
  return {
    schemaVersion: LIGHT_EXTENSION_COMPILE_METRICS_SCHEMA_VERSION,
    operation: 'saveSource',
    result: 'success',
    durationsMs,
    counters,
  };
}

function createCounters(
  overrides: Partial<Record<LightExtensionCompileMetricCounter, number>> = {},
): Record<LightExtensionCompileMetricCounter, number> {
  return Object.fromEntries(
    LIGHT_EXTENSION_COMPILE_METRIC_COUNTERS.map((counter, index) => [counter, overrides[counter] ?? index]),
  ) as Record<LightExtensionCompileMetricCounter, number>;
}

function totalFixtureBytes(files: Array<{ content: string }>): number {
  return files.reduce((total, file) => total + Buffer.byteLength(file.content, 'utf8'), 0);
}
