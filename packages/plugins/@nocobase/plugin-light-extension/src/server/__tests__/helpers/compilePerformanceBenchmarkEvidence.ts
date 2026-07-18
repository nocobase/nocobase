/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LIGHT_EXTENSION_COMPILE_METRICS_SCHEMA_VERSION } from '../../../shared/compileMetrics';
import type {
  CompilePerformanceBenchmarkDataset,
  CompilePerformanceBenchmarkRunOutcome,
} from './compilePerformanceAcceptanceReport';
import {
  COMPILE_PERFORMANCE_BENCHMARK_COLD_RUNS,
  COMPILE_PERFORMANCE_BENCHMARK_HOT_RUNS,
  COMPILE_PERFORMANCE_BENCHMARK_MATRIX_VERSION,
  createCompilePerformanceBenchmarkMatrix,
} from './compilePerformanceBenchmarkMatrix';

export interface CompilePerformanceBenchmarkCollectorConfig {
  revision: 'baseline' | 'target';
  sourceCommit: string;
  harnessCommit: string;
  outputPath: string;
  coldRuns: number;
  hotRuns: number;
  requireAcceptanceRuns: boolean;
  uiSingleSavePathVerified: boolean;
  externalReferenceRegressionVerified: boolean;
  productionWorkerPath: boolean;
}

export interface CompilePerformanceBenchmarkEvidenceGate {
  passed: boolean;
  acceptanceReady: boolean;
  failures: string[];
  jqAcceptanceExpression: string;
}

export interface CompilePerformanceBenchmarkEvidence {
  schemaVersion: typeof COMPILE_PERFORMANCE_BENCHMARK_MATRIX_VERSION;
  collectedAt: string;
  revision: 'baseline' | 'target';
  sourceCommit: string;
  harnessCommit: string;
  databaseDialect: string;
  configuredRuns: {
    cold: number;
    hot: number;
  };
  dataset: CompilePerformanceBenchmarkDataset;
  gate: CompilePerformanceBenchmarkEvidenceGate;
}

export function parseCompilePerformanceBenchmarkCollectorConfig(
  env: NodeJS.ProcessEnv,
): CompilePerformanceBenchmarkCollectorConfig {
  return {
    revision: benchmarkRevision(env.LIGHT_EXTENSION_BENCHMARK_REVISION),
    sourceCommit: requiredText(env.LIGHT_EXTENSION_BENCHMARK_SOURCE_COMMIT, 'SOURCE_COMMIT'),
    harnessCommit: requiredText(env.LIGHT_EXTENSION_BENCHMARK_HARNESS_COMMIT, 'HARNESS_COMMIT'),
    outputPath: requiredText(env.LIGHT_EXTENSION_BENCHMARK_OUTPUT, 'OUTPUT'),
    coldRuns: positiveInteger(env.LIGHT_EXTENSION_BENCHMARK_COLD_RUNS, COMPILE_PERFORMANCE_BENCHMARK_COLD_RUNS),
    hotRuns: positiveInteger(env.LIGHT_EXTENSION_BENCHMARK_HOT_RUNS, COMPILE_PERFORMANCE_BENCHMARK_HOT_RUNS),
    requireAcceptanceRuns: env.LIGHT_EXTENSION_BENCHMARK_REQUIRE_ACCEPTANCE !== 'false',
    uiSingleSavePathVerified: env.LIGHT_EXTENSION_BENCHMARK_UI_SAVE_VERIFIED === 'true',
    externalReferenceRegressionVerified: env.LIGHT_EXTENSION_BENCHMARK_REFERENCES_VERIFIED === 'true',
    productionWorkerPath: env.LIGHT_EXTENSION_BENCHMARK_WORKER_PATH !== 'direct',
  };
}

export function createCompilePerformanceBenchmarkEvidence(
  input: Omit<CompilePerformanceBenchmarkEvidence, 'schemaVersion' | 'gate'>,
): CompilePerformanceBenchmarkEvidence {
  const evidence = {
    schemaVersion: COMPILE_PERFORMANCE_BENCHMARK_MATRIX_VERSION,
    ...input,
  } as Omit<CompilePerformanceBenchmarkEvidence, 'gate'>;
  return {
    ...evidence,
    gate: evaluateCompilePerformanceBenchmarkEvidence(evidence),
  };
}

export function evaluateCompilePerformanceBenchmarkEvidence(
  evidence: Omit<CompilePerformanceBenchmarkEvidence, 'gate'>,
): CompilePerformanceBenchmarkEvidenceGate {
  const failures: string[] = [];
  const matrix = createCompilePerformanceBenchmarkMatrix();
  const dataset = evidence.dataset;
  const dialect = evidence.databaseDialect.trim().toLowerCase();
  if (evidence.schemaVersion !== COMPILE_PERFORMANCE_BENCHMARK_MATRIX_VERSION) {
    failures.push(`unsupported evidence schemaVersion ${evidence.schemaVersion}`);
  }
  if (!evidence.sourceCommit.trim() || evidence.sourceCommit !== dataset.environment.sourceCommit) {
    failures.push('sourceCommit is missing or does not match the dataset environment');
  }
  if (!evidence.harnessCommit.trim() || evidence.harnessCommit !== dataset.environment.harnessCommit) {
    failures.push('harnessCommit is missing or does not match the dataset environment');
  }
  if (dialect !== 'sqlite' && dialect !== 'postgres') {
    failures.push(`databaseDialect must be sqlite or postgres, received ${dialect || 'empty'}`);
  }
  if (dialect !== dataset.environment.databaseDialect.trim().toLowerCase()) {
    failures.push('databaseDialect does not match the dataset environment');
  }
  if (evidence.configuredRuns.cold < 1 || evidence.configuredRuns.hot < 1) {
    failures.push('configured cold and hot run counts must both be positive');
  }

  const byId = new Map(dataset.scenarios.map((scenario) => [scenario.scenarioId, scenario]));
  if (byId.size !== matrix.length || dataset.scenarios.length !== matrix.length) {
    failures.push(`dataset must contain exactly ${matrix.length} unique scenarios`);
  }
  for (const scenario of matrix) {
    const actual = byId.get(scenario.id);
    if (!actual) {
      failures.push(`missing scenario ${scenario.id}`);
      continue;
    }
    checkRunGroup(
      scenario.id,
      'cold',
      actual.coldRuns,
      actual.coldOutcomes,
      evidence.configuredRuns.cold,
      scenario.expectedResult,
      failures,
    );
    checkRunGroup(
      scenario.id,
      'hot',
      actual.hotRuns,
      actual.hotOutcomes,
      evidence.configuredRuns.hot,
      scenario.expectedResult,
      failures,
    );
  }
  if (evidence.revision === 'target') {
    checkDatabaseQueryScaling(dataset, failures);
  }

  const failedFunctionalChecks = Object.entries(dataset.functional)
    .filter(([name]) => evidence.revision === 'target' || name !== 'uiSingleSavePathVerified')
    .filter(([, verified]) => !verified)
    .map(([name]) => name);
  if (failedFunctionalChecks.length > 0) {
    failures.push(`functional evidence failed: ${failedFunctionalChecks.join(', ')}`);
  }
  const acceptanceReady =
    failures.length === 0 &&
    evidence.configuredRuns.cold >= COMPILE_PERFORMANCE_BENCHMARK_COLD_RUNS &&
    evidence.configuredRuns.hot >= COMPILE_PERFORMANCE_BENCHMARK_HOT_RUNS;

  return {
    passed: failures.length === 0,
    acceptanceReady,
    failures,
    jqAcceptanceExpression: '.gate.passed == true and .gate.acceptanceReady == true',
  };
}

function benchmarkRevision(value: string | undefined): 'baseline' | 'target' {
  const normalized = value?.trim() || 'target';
  if (normalized !== 'baseline' && normalized !== 'target') {
    throw new Error(`LIGHT_EXTENSION_BENCHMARK_REVISION must be baseline or target, received "${normalized}"`);
  }
  return normalized;
}

export function serializeCompilePerformanceBenchmarkEvidence(evidence: CompilePerformanceBenchmarkEvidence): string {
  return `${JSON.stringify(evidence, null, 2)}\n`;
}

function checkRunGroup(
  scenarioId: string,
  temperature: 'cold' | 'hot',
  runs: CompilePerformanceBenchmarkDataset['scenarios'][number]['coldRuns'],
  outcomes: CompilePerformanceBenchmarkRunOutcome[] | undefined,
  expectedCount: number,
  expectedResult: 'success' | 'rejected' | 'failed' | 'outdated',
  failures: string[],
): void {
  if (runs.length !== expectedCount) {
    failures.push(`${scenarioId}/${temperature} has ${runs.length} metrics runs, expected ${expectedCount}`);
  }
  if (!outcomes || outcomes.length !== expectedCount) {
    failures.push(`${scenarioId}/${temperature} has ${outcomes?.length || 0} outcomes, expected ${expectedCount}`);
  }
  for (const [index, run] of runs.entries()) {
    if (run.schemaVersion !== LIGHT_EXTENSION_COMPILE_METRICS_SCHEMA_VERSION) {
      failures.push(`${scenarioId}/${temperature}/${index + 1} has unsupported metrics schema`);
    }
    if (run.operation !== 'saveSource' || run.result !== expectedResult) {
      failures.push(
        `${scenarioId}/${temperature}/${index + 1} has operation/result ${run.operation}/${
          run.result
        }, expected saveSource/${expectedResult}`,
      );
    }
  }
  for (const [index, outcome] of (outcomes || []).entries()) {
    checkOutcome(scenarioId, temperature, index + 1, outcome, failures);
  }
}

function checkOutcome(
  scenarioId: string,
  temperature: 'cold' | 'hot',
  index: number,
  outcome: CompilePerformanceBenchmarkRunOutcome,
  failures: string[],
): void {
  const label = `${scenarioId}/${temperature}/${index}`;
  if (outcome.temperature !== temperature || outcome.iteration !== index) {
    failures.push(`${label} outcome iteration metadata is inconsistent`);
  }
  if (
    !Number.isSafeInteger(outcome.sql.queryCount) ||
    outcome.sql.queryCount <= 0 ||
    !Number.isFinite(outcome.sql.totalDurationMs) ||
    outcome.sql.totalDurationMs < 0
  ) {
    failures.push(`${label} has invalid Save-only SQL measurement`);
  }
  if (scenarioId === 'medium-compile-failure') {
    if (
      outcome.rejectedCount !== 1 ||
      outcome.successCount !== 0 ||
      outcome.outdatedCount !== 0 ||
      outcome.failedCount !== 0 ||
      outcome.headAdvanced ||
      !outcome.rollbackVerified
    ) {
      failures.push(`${label} did not prove rejected compile rollback`);
    }
    return;
  }
  if (scenarioId === 'medium-concurrent-same-head') {
    if (
      outcome.successCount !== 1 ||
      outcome.outdatedCount !== 1 ||
      outcome.rejectedCount !== 0 ||
      outcome.failedCount !== 0 ||
      !outcome.headAdvanced
    ) {
      failures.push(`${label} did not prove one success and one outdated request`);
    }
    return;
  }
  if (
    outcome.successCount !== 1 ||
    outcome.rejectedCount !== 0 ||
    outcome.outdatedCount !== 0 ||
    outcome.failedCount !== 0 ||
    !outcome.headAdvanced ||
    !outcome.runtimeArtifactsVerified ||
    !outcome.referenceConsistencyVerified
  ) {
    failures.push(`${label} did not prove a successful consistent save`);
  }
}

function checkDatabaseQueryScaling(dataset: CompilePerformanceBenchmarkDataset, failures: string[]): void {
  const small = dataset.scenarios.find((scenario) => scenario.scenarioId === 'small-private-file');
  const medium = dataset.scenarios.find((scenario) => scenario.scenarioId === 'medium-private-file');
  const blobQueryCounts = [
    ...(small?.coldRuns || []),
    ...(small?.hotRuns || []),
    ...(medium?.coldRuns || []),
    ...(medium?.hotRuns || []),
  ].map((run) => run.counters.blobContentQueryCount);
  if (blobQueryCounts.length === 0 || blobQueryCounts.some((count) => count !== 1)) {
    failures.push('small/medium private-file Blob includeContent query counts must remain constant at 1');
  }
  const smallHot = (small?.hotOutcomes || []).map((outcome) => outcome.sql.queryCount);
  const mediumHot = (medium?.hotOutcomes || []).map((outcome) => outcome.sql.queryCount);
  if (smallHot.length === 0 || mediumHot.length === 0) {
    failures.push('small/medium hot Save-only SQL measurements are required');
    return;
  }
  const smallP95 = percentile(smallHot, 0.95);
  const mediumP95 = percentile(mediumHot, 0.95);
  if (smallP95 <= 0 || mediumP95 / smallP95 >= 10) {
    failures.push(
      `medium private-file SQL query p95 ${mediumP95} is not sublinear versus small p95 ${smallP95} (ratio must be below 10x for a 20x fixture)`,
    );
  }
}

function percentile(values: number[], quantile: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  const index = (sorted.length - 1) * quantile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return sorted[lower];
  }
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function requiredText(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`LIGHT_EXTENSION_BENCHMARK_${name} is required`);
  }
  return normalized;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  if (typeof value === 'undefined' || value.trim() === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`Benchmark run count must be a positive integer, received "${value}"`);
  }
  return parsed;
}
