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
  type LightExtensionCompileMetricResult,
  type LightExtensionCompileMetricsSummary,
} from '../../shared/compileMetrics';
import type {
  CompilePerformanceBenchmarkDataset,
  CompilePerformanceBenchmarkRunOutcome,
} from './helpers/compilePerformanceAcceptanceReport';
import {
  createCompilePerformanceBenchmarkEvidence,
  parseCompilePerformanceBenchmarkCollectorConfig,
  serializeCompilePerformanceBenchmarkEvidence,
} from './helpers/compilePerformanceBenchmarkEvidence';
import { createCompilePerformanceBenchmarkMatrix } from './helpers/compilePerformanceBenchmarkMatrix';

describe('compile performance benchmark evidence', () => {
  it('parses required commit/output metadata and configurable run counts', () => {
    const config = parseCompilePerformanceBenchmarkCollectorConfig({
      LIGHT_EXTENSION_BENCHMARK_SOURCE_COMMIT: 'source-commit',
      LIGHT_EXTENSION_BENCHMARK_HARNESS_COMMIT: 'harness-commit',
      LIGHT_EXTENSION_BENCHMARK_OUTPUT: '/tmp/evidence.json',
      LIGHT_EXTENSION_BENCHMARK_COLD_RUNS: '2',
      LIGHT_EXTENSION_BENCHMARK_HOT_RUNS: '3',
      LIGHT_EXTENSION_BENCHMARK_REQUIRE_ACCEPTANCE: 'false',
      LIGHT_EXTENSION_BENCHMARK_UI_SAVE_VERIFIED: 'true',
      LIGHT_EXTENSION_BENCHMARK_REFERENCES_VERIFIED: 'true',
    });

    expect(config).toEqual({
      sourceCommit: 'source-commit',
      harnessCommit: 'harness-commit',
      outputPath: '/tmp/evidence.json',
      coldRuns: 2,
      hotRuns: 3,
      requireAcceptanceRuns: false,
      uiSingleSavePathVerified: true,
      externalReferenceRegressionVerified: true,
    });
    expect(() =>
      parseCompilePerformanceBenchmarkCollectorConfig({
        LIGHT_EXTENSION_BENCHMARK_SOURCE_COMMIT: 'source-commit',
        LIGHT_EXTENSION_BENCHMARK_HARNESS_COMMIT: 'harness-commit',
      }),
    ).toThrow('LIGHT_EXTENSION_BENCHMARK_OUTPUT is required');
    expect(() =>
      parseCompilePerformanceBenchmarkCollectorConfig({
        LIGHT_EXTENSION_BENCHMARK_SOURCE_COMMIT: 'source-commit',
        LIGHT_EXTENSION_BENCHMARK_HARNESS_COMMIT: 'harness-commit',
        LIGHT_EXTENSION_BENCHMARK_OUTPUT: '/tmp/evidence.json',
        LIGHT_EXTENSION_BENCHMARK_HOT_RUNS: '0',
      }),
    ).toThrow('positive integer');
  });

  it('accepts complete real-evidence shapes and exposes a jq acceptance expression', () => {
    const evidence = createEvidence(1, 20);

    expect(evidence.gate).toEqual({
      passed: true,
      acceptanceReady: true,
      failures: [],
      jqAcceptanceExpression: '.gate.passed == true and .gate.acceptanceReady == true',
    });
    expect(JSON.parse(serializeCompilePerformanceBenchmarkEvidence(evidence))).toEqual(evidence);
  });

  it('keeps smoke collections distinguishable from acceptance-ready evidence', () => {
    const evidence = createEvidence(1, 2);

    expect(evidence.gate.passed).toBe(true);
    expect(evidence.gate.acceptanceReady).toBe(false);
  });

  it('fails evidence when rollback or same-Head concurrency outcomes are not proven', () => {
    const evidence = createEvidence(1, 20);
    const failure = evidence.dataset.scenarios.find((scenario) => scenario.scenarioId === 'medium-compile-failure');
    const concurrency = evidence.dataset.scenarios.find(
      (scenario) => scenario.scenarioId === 'medium-concurrent-same-head',
    );
    if (!failure?.coldOutcomes?.[0] || !concurrency?.hotOutcomes?.[0]) {
      throw new Error('Expected failure and concurrency evidence');
    }
    failure.coldOutcomes[0].rollbackVerified = false;
    concurrency.hotOutcomes[0].outdatedCount = 0;
    const invalid = createCompilePerformanceBenchmarkEvidence({
      collectedAt: evidence.collectedAt,
      sourceCommit: evidence.sourceCommit,
      harnessCommit: evidence.harnessCommit,
      databaseDialect: evidence.databaseDialect,
      configuredRuns: evidence.configuredRuns,
      dataset: evidence.dataset,
    });

    expect(invalid.gate.passed).toBe(false);
    expect(invalid.gate.acceptanceReady).toBe(false);
    expect(invalid.gate.failures).toEqual(
      expect.arrayContaining([
        expect.stringContaining('did not prove rejected compile rollback'),
        expect.stringContaining('did not prove one success and one outdated request'),
      ]),
    );
  });
});

function createEvidence(coldRuns: number, hotRuns: number) {
  const dataset = createDataset(coldRuns, hotRuns);
  return createCompilePerformanceBenchmarkEvidence({
    collectedAt: '2026-07-18T00:00:00.000Z',
    sourceCommit: 'source-commit',
    harnessCommit: 'harness-commit',
    databaseDialect: 'sqlite',
    configuredRuns: { cold: coldRuns, hot: hotRuns },
    dataset,
  });
}

function createDataset(coldRuns: number, hotRuns: number): CompilePerformanceBenchmarkDataset {
  return {
    environment: {
      sourceCommit: 'source-commit',
      harnessCommit: 'harness-commit',
      nodeVersion: 'v20.16.0',
      dependencyFingerprint: 'dependency-fingerprint',
      machineFingerprint: 'machine-fingerprint',
      databaseDialect: 'sqlite',
      databaseVersion: '3.45.0',
      databaseConfigurationFingerprint: 'database-config-fingerprint',
    },
    scenarios: createCompilePerformanceBenchmarkMatrix().map((scenario) => ({
      scenarioId: scenario.id,
      coldRuns: Array.from({ length: coldRuns }, () => createSummary(scenario.expectedResult)),
      hotRuns: Array.from({ length: hotRuns }, () => createSummary(scenario.expectedResult)),
      coldOutcomes: Array.from({ length: coldRuns }, (_, index) => createOutcome(scenario.id, 'cold', index + 1)),
      hotOutcomes: Array.from({ length: hotRuns }, (_, index) => createOutcome(scenario.id, 'hot', index + 1)),
    })),
    functional: {
      uiSingleSavePathVerified: true,
      rollbackVerified: true,
      concurrencyVerified: true,
      runtimeArtifactsVerified: true,
      referenceConsistencyVerified: true,
    },
  };
}

function createSummary(result: LightExtensionCompileMetricResult): LightExtensionCompileMetricsSummary {
  return {
    schemaVersion: LIGHT_EXTENSION_COMPILE_METRICS_SCHEMA_VERSION,
    operation: 'saveSource',
    result,
    durationsMs: { total: 1 },
    counters: Object.fromEntries(LIGHT_EXTENSION_COMPILE_METRIC_COUNTERS.map((counter) => [counter, 0])) as Record<
      LightExtensionCompileMetricCounter,
      number
    >,
  };
}

function createOutcome(
  scenarioId: string,
  temperature: 'cold' | 'hot',
  iteration: number,
): CompilePerformanceBenchmarkRunOutcome {
  if (scenarioId === 'medium-compile-failure') {
    return {
      iteration,
      temperature,
      successCount: 0,
      rejectedCount: 1,
      outdatedCount: 0,
      failedCount: 0,
      headAdvanced: false,
      rollbackVerified: true,
      runtimeArtifactsVerified: true,
      referenceConsistencyVerified: true,
    };
  }
  if (scenarioId === 'medium-concurrent-same-head') {
    return {
      iteration,
      temperature,
      successCount: 1,
      rejectedCount: 0,
      outdatedCount: 1,
      failedCount: 0,
      headAdvanced: true,
      rollbackVerified: false,
      runtimeArtifactsVerified: true,
      referenceConsistencyVerified: true,
    };
  }
  return {
    iteration,
    temperature,
    successCount: 1,
    rejectedCount: 0,
    outdatedCount: 0,
    failedCount: 0,
    headAdvanced: true,
    rollbackVerified: false,
    runtimeArtifactsVerified: true,
    referenceConsistencyVerified: true,
  };
}
