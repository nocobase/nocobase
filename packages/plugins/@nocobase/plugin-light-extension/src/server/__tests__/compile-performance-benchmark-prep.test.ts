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
import { LightExtensionValidator } from '../services/LightExtensionValidator';
import {
  buildCompilePerformanceAcceptanceReport,
  createCompilePerformanceAcceptanceReportTemplate,
  serializeCompilePerformanceAcceptanceJson,
  serializeCompilePerformanceAcceptanceMarkdown,
  type CompilePerformanceBenchmarkDataset,
  type CompilePerformanceBenchmarkRunOutcome,
} from './helpers/compilePerformanceAcceptanceReport';
import {
  COMPILE_PERFORMANCE_BENCHMARK_SCENARIO_IDS,
  createCompilePerformanceBenchmarkFixture,
  createCompilePerformanceBenchmarkMatrix,
  createCompilePerformanceBenchmarkMutation,
  type CompilePerformanceBenchmarkScenario,
  type CompilePerformanceBenchmarkScenarioId,
} from './helpers/compilePerformanceBenchmarkMatrix';
import { createCompilePerformanceResourceSoakEvidence } from './helpers/compilePerformanceResourceEvidence';

describe('end-to-end compile performance benchmark preparation', () => {
  it('builds deterministic benchmark fixtures with explicit single-consumer and unused shared files', () => {
    const first = createCompilePerformanceBenchmarkFixture('medium');
    const second = createCompilePerformanceBenchmarkFixture('medium');

    expect(second).toEqual(first);
    expect(first).toMatchObject({
      fixtureVersion: 1,
      profile: 'medium',
      entryCount: 20,
      fileCount: 200,
      totalBytes: 21_495,
    });
    expect(first.sharedReferences[first.roles.singleConsumerSharedFilePath]).toEqual(['entry-01']);
    const unusedSharedFilePath = first.roles.unusedSharedFilePath;
    expect(unusedSharedFilePath).toBe('src/shared/shared-20.ts');
    if (!unusedSharedFilePath) {
      throw new Error('Expected the medium benchmark fixture to define an unused shared file');
    }
    expect(first.sharedReferences[unusedSharedFilePath]).toEqual([]);
    expect(first.totalBytes).toBe(totalBytes(first.files));
    expect(new LightExtensionValidator().validateWorkspace({ files: first.files })).toMatchObject({
      accepted: true,
      diagnostics: [],
    });
  });

  it('defines all 8 scenarios with one cold run, 20 hot runs, and repeatable per-iteration mutations', () => {
    const matrix = createCompilePerformanceBenchmarkMatrix();
    const medium = createCompilePerformanceBenchmarkFixture('medium');

    expect(matrix.map((scenario) => scenario.id)).toEqual(COMPILE_PERFORMANCE_BENCHMARK_SCENARIO_IDS);
    expect(matrix.every((scenario) => scenario.coldRuns === 1 && scenario.hotRuns === 20)).toBe(true);
    expect(createCompilePerformanceBenchmarkMutation(medium, 'medium-private-file', 7)).toEqual(
      createCompilePerformanceBenchmarkMutation(medium, 'medium-private-file', 7),
    );
    expect(createCompilePerformanceBenchmarkMutation(medium, 'medium-private-file', 7)).not.toEqual(
      createCompilePerformanceBenchmarkMutation(medium, 'medium-private-file', 8),
    );

    const singleConsumerChange = createCompilePerformanceBenchmarkMutation(
      medium,
      'medium-single-consumer-shared-file',
      1,
    );
    expect(singleConsumerChange.primary).toEqual([
      expect.objectContaining({ path: medium.roles.singleConsumerSharedFilePath, language: 'typescript' }),
    ]);
    const concurrent = createCompilePerformanceBenchmarkMutation(medium, 'medium-concurrent-same-head', 1);
    expect(concurrent.primary).toHaveLength(1);
    expect(concurrent.concurrent).toHaveLength(1);
    expect(concurrent.concurrent?.[0].path).not.toBe(concurrent.primary[0].path);

    const compileFailure = createCompilePerformanceBenchmarkMutation(medium, 'medium-compile-failure', 1);
    expect(compileFailure.primary).toEqual([
      expect.objectContaining({
        path: medium.roles.failingEntryPath,
        content: expect.stringContaining("from './missing-01'"),
      }),
    ]);
  });

  it('renders a pending report template without claiming that final acceptance passed', () => {
    const report = createCompilePerformanceAcceptanceReportTemplate('2026-07-17T12:00:00.000Z');

    expect(report.status).toBe('pending');
    expect(report.matrix).toHaveLength(8);
    expect(report.checks.some((check) => check.status === 'pending')).toBe(true);
    expect(JSON.parse(serializeCompilePerformanceAcceptanceJson(report))).toEqual(report);

    const markdown = serializeCompilePerformanceAcceptanceMarkdown(report);
    expect(markdown).toContain('Status: **PENDING**');
    expect(markdown).toContain('PENDING — final measured benchmark or canary evidence is incomplete.');
    expect(markdown).toContain('## Fixed benchmark matrix');
    expect(markdown).toContain('## Canary');
    expect(markdown).toContain('## Rollback order');
    expect(markdown).not.toContain('Status: **PASS**');
  });

  it('passes only when complete paired SQLite and PostgreSQL evidence satisfies every gate', () => {
    const matrix = createCompilePerformanceBenchmarkMatrix();
    const baseline = [
      createDataset('baseline-commit', 'sqlite', matrix, 'baseline'),
      createDataset('baseline-commit', 'postgres', matrix, 'baseline'),
    ];
    const target = [
      createDataset('target-commit', 'sqlite', matrix, 'target'),
      createDataset('target-commit', 'postgres', matrix, 'target'),
    ];
    const report = buildCompilePerformanceAcceptanceReport({
      generatedAt: '2026-07-17T12:00:00.000Z',
      releaseScope: completeReleaseScope(),
      baseline,
      target,
      resources: [passingResourceEvidence()],
      canary: {
        status: 'pass',
        observationWindow: '24h',
        staleRuntimeIncrease: false,
        artifactMismatchIncrease: false,
        headConflictRateIncrease: false,
        sustainedMemoryGrowth: false,
        notes: 'No rollout regression observed.',
      },
    });

    expect(report.status).toBe('pass');
    expect(report.checks.every((check) => check.status === 'pass')).toBe(true);
    expect(serializeCompilePerformanceAcceptanceMarkdown(report)).toContain('Status: **PASS**');
  });

  it('fails a complete report when the medium median or small p95 performance gate regresses', () => {
    const matrix = createCompilePerformanceBenchmarkMatrix();
    const baseline = [createDataset('baseline-commit', 'sqlite', matrix, 'baseline')];
    const regressed = createDataset('target-commit', 'sqlite', matrix, 'target');
    replaceHotDuration(regressed, 'medium-private-file', 60);
    replaceHotDuration(regressed, 'small-private-file', 12);
    const report = buildCompilePerformanceAcceptanceReport({
      generatedAt: '2026-07-17T12:00:00.000Z',
      releaseScope: completeReleaseScope(),
      baseline,
      target: [regressed],
      resources: [passingResourceEvidence()],
      canary: {
        status: 'pass',
        observationWindow: '24h',
        staleRuntimeIncrease: false,
        artifactMismatchIncrease: false,
        headConflictRateIncrease: false,
        sustainedMemoryGrowth: false,
        notes: 'No rollout regression observed.',
      },
    });

    expect(report.status).toBe('fail');
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'performance-sqlite-medium-private-file-median', status: 'fail' }),
        expect.objectContaining({ id: 'performance-sqlite-small-private-file-p95', status: 'fail' }),
      ]),
    );
  });

  it('zero-fills legacy schemaVersion 1 baseline counters but rejects missing target counters', () => {
    const matrix = createCompilePerformanceBenchmarkMatrix();
    const baseline = createDataset('baseline-commit', 'sqlite', matrix, 'baseline');
    const target = createDataset('target-commit', 'sqlite', matrix, 'target');
    const legacyCounters: LightExtensionCompileMetricCounter[] = [
      'compileCacheMissCount',
      'compileCacheCorruptCount',
      'dependencyGraphRuntimeFileCount',
      'dependencyGraphTypeFileCount',
      'dependencyGraphUnresolvedCount',
      'dependencyGraphByteSize',
      'dependencyPlanPreciseHitCount',
      'dependencyPlanConservativeFallbackCount',
      'dependencyManifestVersionMismatchCount',
    ];
    for (const scenario of baseline.scenarios) {
      for (const run of [...scenario.coldRuns, ...scenario.hotRuns]) {
        for (const counter of legacyCounters) {
          delete (run.counters as Partial<Record<LightExtensionCompileMetricCounter, number>>)[counter];
        }
      }
    }
    const report = buildCompilePerformanceAcceptanceReport({
      generatedAt: '2026-07-18T00:00:00.000Z',
      baseline: [baseline],
      target: [target],
      canary: passingCanary(),
    });
    expect(report.baseline[0].scenarios[0].cold.counters.dependencyGraphByteSize).toBe(0);
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'legacy-counter-compatibility',
        status: 'pass',
        details: expect.stringContaining('dependencyGraphByteSize'),
      }),
    );

    delete (target.scenarios[0].coldRuns[0].counters as Partial<Record<LightExtensionCompileMetricCounter, number>>)
      .dependencyGraphByteSize;
    expect(() =>
      buildCompilePerformanceAcceptanceReport({
        generatedAt: '2026-07-18T00:00:00.000Z',
        baseline: [baseline],
        target: [target],
        canary: passingCanary(),
      }),
    ).toThrow('counter "dependencyGraphByteSize"');

    delete (baseline.scenarios[0].coldRuns[0].counters as Partial<Record<LightExtensionCompileMetricCounter, number>>)
      .entryCount;
    expect(() =>
      buildCompilePerformanceAcceptanceReport({
        generatedAt: '2026-07-18T00:00:00.000Z',
        baseline: [baseline],
        target: [],
        canary: passingCanary(),
      }),
    ).toThrow('counter "entryCount"');
  });

  it('requires one valid SQL outcome per metrics run and a production Worker target for bounded compilation', () => {
    const matrix = createCompilePerformanceBenchmarkMatrix();
    const baseline = createDataset('baseline-commit', 'sqlite', matrix, 'baseline');
    const target = createDataset('target-commit', 'sqlite', matrix, 'target');
    target.scenarios[0].hotOutcomes?.pop();
    expect(() =>
      buildCompilePerformanceAcceptanceReport({
        generatedAt: '2026-07-18T00:00:00.000Z',
        baseline: [baseline],
        target: [target],
        canary: passingCanary(),
      }),
    ).toThrow('19 hot SQL outcomes for 20 metrics runs');

    const directTarget = createDataset('target-commit', 'sqlite', matrix, 'target');
    directTarget.environment.compileExecutionPath = 'direct';
    const report = buildCompilePerformanceAcceptanceReport({
      generatedAt: '2026-07-18T00:00:00.000Z',
      releaseScope: completeReleaseScope(),
      baseline: [baseline],
      target: [directTarget],
      canary: passingCanary(),
    });
    expect(report.checks).toContainEqual(
      expect.objectContaining({ id: 'resource-soak', status: 'fail', details: expect.stringContaining('Worker path') }),
    );
  });
});

function passingCanary() {
  return {
    status: 'pass' as const,
    observationWindow: '24h',
    staleRuntimeIncrease: false,
    artifactMismatchIncrease: false,
    headConflictRateIncrease: false,
    sustainedMemoryGrowth: false,
    notes: 'No rollout regression observed.',
  };
}

function passingResourceEvidence() {
  return createCompilePerformanceResourceSoakEvidence({
    collectedAt: '2026-07-18T00:00:00.000Z',
    sourceCommit: 'target-commit',
    harnessCommit: 'benchmark-harness-commit',
    nodeVersion: '20.16.0',
    machineFingerprint: 'darwin-arm64-test-host',
    dependencyFingerprint: 'yarn-lock-sha256',
    iterations: 20,
    session: {
      configured: { maxRepos: 2, maxEntries: 4, maxEstimatedFileBytes: 4096, idleTtlMs: 10 },
      peak: { activeRepos: 2, activeEntries: 4, estimatedFileBytes: 2048 },
      afterTtl: { activeRepos: 0, activeEntries: 0, estimatedFileBytes: 0 },
      disabled: { execution: 'cold', activeRepos: 0, activeEntries: 0, estimatedFileBytes: 0 },
      afterShutdown: { disposed: true, activeRepos: 0, activeEntries: 0, estimatedFileBytes: 0 },
      ttlEvictionCount: 2,
      lruEvictionCount: 2,
      shutdownEvictionCount: 1,
    },
    worker: {
      productionWorkerPath: true,
      mainThreadId: 0,
      workerThreadIds: [1, 2],
      configured: { workerCount: 2, maxQueueLength: 4, maxInflightBytes: 4096 },
      observed: {
        maxActive: 2,
        maxQueueDepth: 4,
        maxInflightBytes: 2048,
        completed: 20,
        accepted: 20,
        rejected: 0,
        restarts: 0,
        timeouts: 0,
      },
      afterShutdown: { workerCount: 0, active: 0, queueDepth: 0, inflightBytes: 0, shuttingDown: true },
    },
    memory: {
      start: { rssBytes: 1000, heapUsedBytes: 500 },
      peak: { rssBytes: 2000, heapUsedBytes: 1000 },
      afterShutdown: { rssBytes: 1500, heapUsedBytes: 750 },
      configuredMaxRssGrowthBytes: 10_000,
      configuredMaxHeapGrowthBytes: 5000,
    },
    reproducibleCommand: 'LIGHT_EXTENSION_RESOURCE_SOAK=true yarn test resource-soak',
  });
}

function createDataset(
  commit: string,
  databaseDialect: 'sqlite' | 'postgres',
  matrix: CompilePerformanceBenchmarkScenario[],
  revision: 'baseline' | 'target',
): CompilePerformanceBenchmarkDataset {
  return {
    environment: {
      sourceCommit: commit,
      harnessCommit: 'benchmark-harness-commit',
      nodeVersion: '20.16.0',
      dependencyFingerprint: 'yarn-lock-sha256',
      machineFingerprint: 'darwin-arm64-test-host',
      databaseDialect,
      databaseVersion: databaseDialect === 'sqlite' ? '3.45.0' : '17.0',
      databaseConfigurationFingerprint: `${databaseDialect}-benchmark-config`,
      compileExecutionPath: revision === 'baseline' ? 'direct' : 'production-worker',
    },
    scenarios: matrix.map((scenario) => {
      const result = scenario.expectedResult;
      const counters = createScenarioCounters(scenario);
      const hotDuration =
        scenario.id === 'medium-private-file'
          ? revision === 'baseline'
            ? 100
            : 50
          : scenario.id === 'small-private-file'
            ? revision === 'baseline'
              ? 10
              : 11
            : revision === 'baseline'
              ? 40
              : 20;
      return {
        scenarioId: scenario.id,
        coldRuns: [createSummary(result, hotDuration * 2, counters)],
        hotRuns: Array.from({ length: 20 }, () => createSummary(result, hotDuration, counters)),
        coldOutcomes: [createSyntheticOutcome(scenario.id, 'cold', 1)],
        hotOutcomes: Array.from({ length: 20 }, (_, index) => createSyntheticOutcome(scenario.id, 'hot', index + 1)),
      };
    }),
    functional: {
      uiSingleSavePathVerified: true,
      rollbackVerified: true,
      concurrencyVerified: true,
      runtimeArtifactsVerified: true,
      referenceConsistencyVerified: true,
    },
  };
}

function createSyntheticOutcome(
  scenarioId: CompilePerformanceBenchmarkScenarioId,
  temperature: 'cold' | 'hot',
  iteration: number,
): CompilePerformanceBenchmarkRunOutcome {
  const compileFailure = scenarioId === 'medium-compile-failure';
  const concurrency = scenarioId === 'medium-concurrent-same-head';
  return {
    iteration,
    temperature,
    successCount: compileFailure ? 0 : 1,
    rejectedCount: compileFailure ? 1 : 0,
    outdatedCount: concurrency ? 1 : 0,
    failedCount: 0,
    headAdvanced: !compileFailure,
    rollbackVerified: compileFailure,
    runtimeArtifactsVerified: true,
    referenceConsistencyVerified: true,
    sql: {
      queryCount: scenarioId === 'small-private-file' ? 20 : scenarioId === 'medium-private-file' ? 30 : 25,
      totalDurationMs: 2,
    },
  };
}

function completeReleaseScope() {
  return {
    trustedPreviewTicket: true,
    optimisticTwoPhaseSave: true,
    incrementalCompilerSessions: true,
    runtimeAndTypeDependencyGraph: true,
    boundedCompilationAndPersistence: true,
    browserProvisionalPreview: false,
  };
}

function createScenarioCounters(
  scenario: CompilePerformanceBenchmarkScenario,
): Record<LightExtensionCompileMetricCounter, number> {
  const structural = scenario.dependencyGraphStructural || scenario.structural;
  const entryCount = scenario.fixtureProfile === 'small' ? 1 : 20;
  const compiledEntryCount = structural.compiledEntryCount ?? structural.compiledEntryCountMax ?? 0;
  const counters = Object.fromEntries(LIGHT_EXTENSION_COMPILE_METRIC_COUNTERS.map((counter) => [counter, 0])) as Record<
    LightExtensionCompileMetricCounter,
    number
  >;
  return {
    ...counters,
    repoFileCount: scenario.fixtureProfile === 'small' ? 10 : 200,
    repoByteSize: scenario.fixtureProfile === 'small' ? 926 : 21_496,
    changedFileCount: 1,
    entryCount,
    affectedEntryCount: structural.affectedEntryCount ?? entryCount,
    compiledEntryCount,
    reusedEntryCount: structural.requireUncompiledEntriesReusedOrSkipped ? entryCount - compiledEntryCount : 0,
    blobContentQueryCount: 1,
    blobContentRowCount: scenario.fixtureProfile === 'small' ? 10 : 200,
    snapshotMaterializationCount: 1,
    treeNormalizationCount: 1,
  };
}

function createSummary(
  result: LightExtensionCompileMetricResult,
  totalDuration: number,
  counters: Record<LightExtensionCompileMetricCounter, number>,
): LightExtensionCompileMetricsSummary {
  return {
    schemaVersion: LIGHT_EXTENSION_COMPILE_METRICS_SCHEMA_VERSION,
    operation: 'saveSource',
    result,
    durationsMs: { total: totalDuration, compileEntries: totalDuration / 2 },
    counters: { ...counters },
  };
}

function replaceHotDuration(
  dataset: CompilePerformanceBenchmarkDataset,
  scenarioId: CompilePerformanceBenchmarkScenarioId,
  duration: number,
): void {
  const scenario = dataset.scenarios.find((candidate) => candidate.scenarioId === scenarioId);
  if (!scenario) {
    throw new Error(`Synthetic benchmark scenario not found: ${scenarioId}`);
  }
  scenario.hotRuns = scenario.hotRuns.map((run) => ({
    ...run,
    durationsMs: { ...run.durationsMs, total: duration },
  }));
}

function totalBytes(files: Array<{ content: string }>): number {
  return files.reduce((total, file) => total + Buffer.byteLength(file.content, 'utf8'), 0);
}
