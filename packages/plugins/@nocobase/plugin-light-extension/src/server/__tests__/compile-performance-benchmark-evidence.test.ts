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
import { SaveSqlQueryMeter, type SequelizeQueryHooks } from './helpers/compilePerformanceSqlMeter';

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
      revision: 'target',
      sourceCommit: 'source-commit',
      harnessCommit: 'harness-commit',
      outputPath: '/tmp/evidence.json',
      coldRuns: 2,
      hotRuns: 3,
      requireAcceptanceRuns: false,
      uiSingleSavePathVerified: true,
      externalReferenceRegressionVerified: true,
      productionWorkerPath: true,
    });
    expect(
      parseCompilePerformanceBenchmarkCollectorConfig({
        LIGHT_EXTENSION_BENCHMARK_SOURCE_COMMIT: 'source-commit',
        LIGHT_EXTENSION_BENCHMARK_HARNESS_COMMIT: 'harness-commit',
        LIGHT_EXTENSION_BENCHMARK_OUTPUT: '/tmp/evidence.json',
        LIGHT_EXTENSION_BENCHMARK_REVISION: 'baseline',
        LIGHT_EXTENSION_BENCHMARK_WORKER_PATH: 'direct',
      }),
    ).toMatchObject({ revision: 'baseline', productionWorkerPath: false });
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

  it('allows an honest baseline UI result while retaining target-only functional enforcement', () => {
    const baseline = createEvidence(1, 20);
    baseline.revision = 'baseline';
    baseline.dataset.functional.uiSingleSavePathVerified = false;
    const baselineGate = createCompilePerformanceBenchmarkEvidence({
      collectedAt: baseline.collectedAt,
      revision: baseline.revision,
      sourceCommit: baseline.sourceCommit,
      harnessCommit: baseline.harnessCommit,
      databaseDialect: baseline.databaseDialect,
      configuredRuns: baseline.configuredRuns,
      dataset: baseline.dataset,
    }).gate;
    expect(baselineGate).toMatchObject({ passed: true, acceptanceReady: true });

    baseline.revision = 'target';
    expect(
      createCompilePerformanceBenchmarkEvidence({
        collectedAt: baseline.collectedAt,
        revision: baseline.revision,
        sourceCommit: baseline.sourceCommit,
        harnessCommit: baseline.harnessCommit,
        databaseDialect: baseline.databaseDialect,
        configuredRuns: baseline.configuredRuns,
        dataset: baseline.dataset,
      }).gate.failures,
    ).toContain('functional evidence failed: uiSingleSavePathVerified');
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
      revision: evidence.revision,
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

  it('meters only queries inside the measured Save scope and detaches hooks', async () => {
    const sequelize = new FakeSequelizeQueryHooks();
    const meter = new SaveSqlQueryMeter(sequelize);
    await sequelize.query();
    const captured = await meter.capture(async () => {
      await Promise.all([sequelize.query(), sequelize.query()]);
      return 'saved';
    });
    await sequelize.query();

    expect(captured.value).toBe('saved');
    expect(captured.sql.queryCount).toBe(2);
    expect(captured.sql.totalDurationMs).toBeGreaterThanOrEqual(0);
    const rejected = await meter.capture(async () => {
      await sequelize.query();
      throw new Error('rejected save');
    });
    expect(rejected.error).toEqual(expect.objectContaining({ message: 'rejected save' }));
    expect(rejected.sql.queryCount).toBe(1);
    meter.dispose();
    expect(sequelize.hookCount()).toBe(0);
  });
});

function createEvidence(coldRuns: number, hotRuns: number) {
  const dataset = createDataset(coldRuns, hotRuns);
  return createCompilePerformanceBenchmarkEvidence({
    collectedAt: '2026-07-18T00:00:00.000Z',
    revision: 'target',
    sourceCommit: 'source-commit',
    harnessCommit: 'harness-commit',
    databaseDialect: 'sqlite',
    configuredRuns: { cold: coldRuns, hot: hotRuns },
    dataset,
  });
}

class FakeSequelizeQueryHooks implements SequelizeQueryHooks {
  private readonly hooks = {
    beforeQuery: new Map<string, (options: unknown, query: unknown) => void>(),
    afterQuery: new Map<string, (options: unknown, query: unknown) => void>(),
  };

  addHook(
    hookType: 'beforeQuery' | 'afterQuery',
    hookName: string,
    hook: (options: unknown, query: unknown) => void,
  ): void {
    this.hooks[hookType].set(hookName, hook);
  }

  removeHook(hookType: 'beforeQuery' | 'afterQuery', hookName: string): void {
    this.hooks[hookType].delete(hookName);
  }

  async query(): Promise<void> {
    const options = {};
    const query = {};
    for (const hook of this.hooks.beforeQuery.values()) {
      hook(options, query);
    }
    await Promise.resolve();
    for (const hook of this.hooks.afterQuery.values()) {
      hook(options, query);
    }
  }

  hookCount(): number {
    return this.hooks.beforeQuery.size + this.hooks.afterQuery.size;
  }
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
      compileExecutionPath: 'production-worker',
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
  const counters = Object.fromEntries(LIGHT_EXTENSION_COMPILE_METRIC_COUNTERS.map((counter) => [counter, 0])) as Record<
    LightExtensionCompileMetricCounter,
    number
  >;
  counters.blobContentQueryCount = 1;
  return {
    schemaVersion: LIGHT_EXTENSION_COMPILE_METRICS_SCHEMA_VERSION,
    operation: 'saveSource',
    result,
    durationsMs: { total: 1 },
    counters,
  };
}

function createOutcome(
  scenarioId: string,
  temperature: 'cold' | 'hot',
  iteration: number,
): CompilePerformanceBenchmarkRunOutcome {
  const sql = {
    queryCount: scenarioId === 'small-private-file' ? 20 : scenarioId === 'medium-private-file' ? 30 : 25,
    totalDurationMs: 1,
  };
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
      sql,
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
      sql,
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
    sql,
  };
}
