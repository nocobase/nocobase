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
  LIGHT_EXTENSION_COMPILE_METRIC_STAGES,
  LIGHT_EXTENSION_COMPILE_METRICS_SCHEMA_VERSION,
  type LightExtensionCompileMetricCounter,
  type LightExtensionCompileMetricOperation,
  type LightExtensionCompileMetricResult,
  type LightExtensionCompileMetricStage,
  type LightExtensionCompileMetricsSummary,
} from '../../../shared/compileMetrics';
import type { CompilePerformanceFixtureParameters } from './compilePerformanceFixture';

export interface CompilePerformanceDurationStatistics {
  sampleCount: number;
  median: number;
  p95: number;
}

export interface CompilePerformanceRunGroupReport {
  runCount: number;
  durationsMs: Partial<Record<LightExtensionCompileMetricStage, CompilePerformanceDurationStatistics>>;
  counters: Record<LightExtensionCompileMetricCounter, number>;
}

export interface CompilePerformanceScenarioInput {
  name: string;
  coldRuns: LightExtensionCompileMetricsSummary[];
  hotRuns: LightExtensionCompileMetricsSummary[];
}

export interface CompilePerformanceScenarioReport {
  name: string;
  operation: LightExtensionCompileMetricOperation;
  result: LightExtensionCompileMetricResult;
  cold: CompilePerformanceRunGroupReport;
  hot: CompilePerformanceRunGroupReport;
}

export interface CompilePerformanceBaselineReportInput {
  commit: string;
  nodeVersion: string;
  databaseDialect: string;
  fixture: CompilePerformanceFixtureParameters;
  scenarios: CompilePerformanceScenarioInput[];
}

export interface CompilePerformanceBaselineReport {
  schemaVersion: typeof LIGHT_EXTENSION_COMPILE_METRICS_SCHEMA_VERSION;
  environment: {
    commit: string;
    nodeVersion: string;
    databaseDialect: string;
  };
  fixture: CompilePerformanceFixtureParameters;
  scenarios: CompilePerformanceScenarioReport[];
}

export function calculateDurationStatistics(samples: number[]): CompilePerformanceDurationStatistics {
  if (samples.length === 0) {
    throw new Error('Duration statistics require at least one sample');
  }
  const sortedSamples = samples.map(assertNonNegativeFiniteDuration).sort((left, right) => left - right);

  return {
    sampleCount: sortedSamples.length,
    median: percentile(sortedSamples, 0.5),
    p95: percentile(sortedSamples, 0.95),
  };
}

export function buildCompilePerformanceBaselineReport(
  input: CompilePerformanceBaselineReportInput,
): CompilePerformanceBaselineReport {
  assertNonEmptyText(input.commit, 'commit');
  assertNonEmptyText(input.nodeVersion, 'Node version');
  assertNonEmptyText(input.databaseDialect, 'database dialect');
  if (input.scenarios.length === 0) {
    throw new Error('Compile performance baseline reports require at least one scenario');
  }

  return {
    schemaVersion: LIGHT_EXTENSION_COMPILE_METRICS_SCHEMA_VERSION,
    environment: {
      commit: input.commit,
      nodeVersion: input.nodeVersion,
      databaseDialect: input.databaseDialect,
    },
    fixture: { ...input.fixture },
    scenarios: input.scenarios.map(buildScenarioReport),
  };
}

export function serializeCompilePerformanceBaselineJson(report: CompilePerformanceBaselineReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function serializeCompilePerformanceBaselineMarkdown(report: CompilePerformanceBaselineReport): string {
  const lines = [
    '# Light Extension Compile Performance Baseline',
    '',
    '## Environment',
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| Commit | ${escapeMarkdownCell(report.environment.commit)} |`,
    `| Node version | ${escapeMarkdownCell(report.environment.nodeVersion)} |`,
    `| Database dialect | ${escapeMarkdownCell(report.environment.databaseDialect)} |`,
    '',
    '## Fixture',
    '',
    '| Parameter | Value |',
    '| --- | ---: |',
    `| Fixture version | ${report.fixture.fixtureVersion} |`,
    `| Profile | ${escapeMarkdownCell(report.fixture.profile)} |`,
    `| Entries | ${report.fixture.entryCount} |`,
    `| Files | ${report.fixture.fileCount} |`,
    `| Shared files | ${report.fixture.sharedFileCount} |`,
    `| Private files | ${report.fixture.privateFileCount} |`,
    `| Root files | ${report.fixture.rootFileCount} |`,
    `| Total bytes | ${report.fixture.totalBytes} |`,
  ];

  for (const scenario of report.scenarios) {
    lines.push(
      '',
      `## ${escapeMarkdownHeading(scenario.name)}`,
      '',
      `Operation: \`${scenario.operation}\`  `,
      `Result: \`${scenario.result}\``,
      '',
      '### Runs',
      '',
      '| Temperature | Runs |',
      '| --- | ---: |',
      `| Cold | ${scenario.cold.runCount} |`,
      `| Hot | ${scenario.hot.runCount} |`,
      '',
      '### Duration (ms)',
      '',
      '| Temperature | Stage | Samples | Median | p95 |',
      '| --- | --- | ---: | ---: | ---: |',
      ...durationRows('Cold', scenario.cold),
      ...durationRows('Hot', scenario.hot),
      '',
      '### Structural counts',
      '',
      '| Temperature | Counter | Exact value |',
      '| --- | --- | ---: |',
      ...counterRows('Cold', scenario.cold),
      ...counterRows('Hot', scenario.hot),
    );
  }

  return `${lines.join('\n')}\n`;
}

function buildScenarioReport(input: CompilePerformanceScenarioInput): CompilePerformanceScenarioReport {
  assertNonEmptyText(input.name, 'scenario name');
  if (input.coldRuns.length === 0 || input.hotRuns.length === 0) {
    throw new Error(`Compile performance scenario "${input.name}" requires at least one cold and one hot run`);
  }

  const runs = [...input.coldRuns, ...input.hotRuns];
  const [firstRun] = runs;
  for (const run of runs) {
    if (run.schemaVersion !== LIGHT_EXTENSION_COMPILE_METRICS_SCHEMA_VERSION) {
      throw new Error(`Compile performance scenario "${input.name}" contains an unsupported metrics schema version`);
    }
    if (run.operation !== firstRun.operation || run.result !== firstRun.result) {
      throw new Error(`Compile performance scenario "${input.name}" must use one operation and result`);
    }
  }

  return {
    name: input.name,
    operation: firstRun.operation,
    result: firstRun.result,
    cold: buildRunGroupReport(input.name, 'cold', input.coldRuns),
    hot: buildRunGroupReport(input.name, 'hot', input.hotRuns),
  };
}

function buildRunGroupReport(
  scenarioName: string,
  temperature: 'cold' | 'hot',
  runs: LightExtensionCompileMetricsSummary[],
): CompilePerformanceRunGroupReport {
  const durationsMs: CompilePerformanceRunGroupReport['durationsMs'] = {};
  for (const stage of LIGHT_EXTENSION_COMPILE_METRIC_STAGES) {
    const samples = runs.flatMap((run) => (typeof run.durationsMs[stage] === 'number' ? [run.durationsMs[stage]] : []));
    if (samples.length > 0) {
      durationsMs[stage] = calculateDurationStatistics(samples);
    }
  }

  const counters = {} as Record<LightExtensionCompileMetricCounter, number>;
  for (const counter of LIGHT_EXTENSION_COMPILE_METRIC_COUNTERS) {
    const values = runs.map((run) => assertCounter(run.counters[counter], counter));
    const expectedValue = values[0];
    if (values.some((value) => value !== expectedValue)) {
      throw new Error(
        `Compile performance scenario "${scenarioName}" has non-deterministic ${temperature} counter "${counter}"`,
      );
    }
    counters[counter] = expectedValue;
  }

  return {
    runCount: runs.length,
    durationsMs,
    counters,
  };
}

function percentile(sortedSamples: number[], quantile: number): number {
  const index = (sortedSamples.length - 1) * quantile;
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);
  if (lowerIndex === upperIndex) {
    return sortedSamples[lowerIndex];
  }

  const fraction = index - lowerIndex;
  return sortedSamples[lowerIndex] + (sortedSamples[upperIndex] - sortedSamples[lowerIndex]) * fraction;
}

function assertNonNegativeFiniteDuration(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Duration samples must be non-negative finite numbers');
  }
  return value;
}

function assertCounter(value: number | undefined, counter: LightExtensionCompileMetricCounter): number {
  if (!Number.isInteger(value) || (value ?? -1) < 0) {
    throw new Error(`Compile performance reports require a non-negative integer value for counter "${counter}"`);
  }
  return value as number;
}

function assertNonEmptyText(value: string, label: string): void {
  if (!value.trim()) {
    throw new Error(`Compile performance report ${label} is required`);
  }
}

function durationRows(temperature: 'Cold' | 'Hot', group: CompilePerformanceRunGroupReport): string[] {
  return LIGHT_EXTENSION_COMPILE_METRIC_STAGES.flatMap((stage) => {
    const statistics = group.durationsMs[stage];
    return statistics
      ? [
          `| ${temperature} | ${stage} | ${statistics.sampleCount} | ${formatNumber(
            statistics.median,
          )} | ${formatNumber(statistics.p95)} |`,
        ]
      : [];
  });
}

function counterRows(temperature: 'Cold' | 'Hot', group: CompilePerformanceRunGroupReport): string[] {
  return LIGHT_EXTENSION_COMPILE_METRIC_COUNTERS.map(
    (counter) => `| ${temperature} | ${counter} | ${group.counters[counter]} |`,
  );
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
}

function escapeMarkdownCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

function escapeMarkdownHeading(value: string): string {
  return value.replaceAll('\n', ' ').trim();
}
