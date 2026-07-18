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
import { calculateDurationStatistics, type CompilePerformanceDurationStatistics } from './compilePerformanceReport';
import {
  COMPILE_PERFORMANCE_BENCHMARK_MATRIX_VERSION,
  createCompilePerformanceBenchmarkMatrix,
  type CompilePerformanceBenchmarkScenario,
  type CompilePerformanceBenchmarkScenarioId,
} from './compilePerformanceBenchmarkMatrix';
import type { CompilePerformanceResourceSoakEvidence } from './compilePerformanceResourceEvidence';

const LEGACY_SCHEMA_V1_ZERO_FILL_COUNTERS = new Set<LightExtensionCompileMetricCounter>([
  'compileCacheMissCount',
  'compileCacheCorruptCount',
  'dependencyGraphRuntimeFileCount',
  'dependencyGraphTypeFileCount',
  'dependencyGraphUnresolvedCount',
  'dependencyGraphByteSize',
  'dependencyPlanPreciseHitCount',
  'dependencyPlanConservativeFallbackCount',
  'dependencyManifestVersionMismatchCount',
]);

export type CompilePerformanceAcceptanceStatus = 'pending' | 'pass' | 'fail';

export interface CompilePerformanceBenchmarkEnvironment {
  sourceCommit: string;
  harnessCommit: string;
  nodeVersion: string;
  dependencyFingerprint: string;
  machineFingerprint: string;
  databaseDialect: string;
  databaseVersion: string;
  databaseConfigurationFingerprint: string;
  compileExecutionPath: 'direct' | 'production-worker';
}

export interface CompilePerformanceBenchmarkFunctionalEvidence {
  uiSingleSavePathVerified: boolean;
  rollbackVerified: boolean;
  concurrencyVerified: boolean;
  runtimeArtifactsVerified: boolean;
  referenceConsistencyVerified: boolean;
}

export interface CompilePerformanceBenchmarkScenarioEvidence {
  scenarioId: CompilePerformanceBenchmarkScenarioId;
  coldRuns: LightExtensionCompileMetricsSummary[];
  hotRuns: LightExtensionCompileMetricsSummary[];
  coldOutcomes?: CompilePerformanceBenchmarkRunOutcome[];
  hotOutcomes?: CompilePerformanceBenchmarkRunOutcome[];
}

export interface CompilePerformanceBenchmarkRunOutcome {
  iteration: number;
  temperature: 'cold' | 'hot';
  successCount: number;
  rejectedCount: number;
  outdatedCount: number;
  failedCount: number;
  headAdvanced: boolean;
  rollbackVerified: boolean;
  runtimeArtifactsVerified: boolean;
  referenceConsistencyVerified: boolean;
  sql: CompilePerformanceSqlMeasurement;
}

export interface CompilePerformanceSqlMeasurement {
  queryCount: number;
  totalDurationMs: number;
}

export interface CompilePerformanceBenchmarkDataset {
  environment: CompilePerformanceBenchmarkEnvironment;
  scenarios: CompilePerformanceBenchmarkScenarioEvidence[];
  functional: CompilePerformanceBenchmarkFunctionalEvidence;
}

export interface CompilePerformanceCanaryEvidence {
  status: CompilePerformanceAcceptanceStatus;
  observationWindow: string;
  staleRuntimeIncrease: boolean;
  artifactMismatchIncrease: boolean;
  headConflictRateIncrease: boolean;
  sustainedMemoryGrowth: boolean;
  notes: string;
}

export interface CompilePerformanceAcceptanceReportInput {
  generatedAt: string;
  releaseScope?: CompilePerformanceReleaseScope;
  baseline: CompilePerformanceBenchmarkDataset[];
  target: CompilePerformanceBenchmarkDataset[];
  canary?: CompilePerformanceCanaryEvidence;
  resources?: CompilePerformanceResourceSoakEvidence[];
}

export interface CompilePerformanceReleaseScope {
  trustedPreviewTicket: boolean;
  optimisticTwoPhaseSave: boolean;
  incrementalCompilerSessions: boolean;
  runtimeAndTypeDependencyGraph: boolean;
  boundedCompilationAndPersistence: boolean;
  browserProvisionalPreview: boolean;
}

export interface CompilePerformanceRunGroupSummary {
  runCount: number;
  operation?: LightExtensionCompileMetricOperation;
  result?: LightExtensionCompileMetricResult;
  durationsMs: Partial<Record<LightExtensionCompileMetricStage, CompilePerformanceDurationStatistics>>;
  counters: Record<LightExtensionCompileMetricCounter, number>;
  sql: {
    queryCount?: CompilePerformanceDurationStatistics;
    totalDurationMs?: CompilePerformanceDurationStatistics;
  };
  zeroFilledCounters: LightExtensionCompileMetricCounter[];
}

export interface CompilePerformanceScenarioSummary {
  scenarioId: CompilePerformanceBenchmarkScenarioId;
  cold: CompilePerformanceRunGroupSummary;
  hot: CompilePerformanceRunGroupSummary;
}

export interface CompilePerformanceDatasetSummary {
  environment: CompilePerformanceBenchmarkEnvironment;
  scenarios: CompilePerformanceScenarioSummary[];
  functional: CompilePerformanceBenchmarkFunctionalEvidence;
}

export interface CompilePerformanceAcceptanceCheck {
  id: string;
  title: string;
  status: CompilePerformanceAcceptanceStatus;
  details: string;
}

export interface CompilePerformanceAcceptanceReport {
  schemaVersion: typeof COMPILE_PERFORMANCE_BENCHMARK_MATRIX_VERSION;
  generatedAt: string;
  status: CompilePerformanceAcceptanceStatus;
  releaseScope: CompilePerformanceReleaseScope;
  matrix: CompilePerformanceBenchmarkScenario[];
  baseline: CompilePerformanceDatasetSummary[];
  target: CompilePerformanceDatasetSummary[];
  checks: CompilePerformanceAcceptanceCheck[];
  canary: CompilePerformanceCanaryEvidence | null;
  resources: CompilePerformanceResourceSoakEvidence[];
}

export function createCompilePerformanceAcceptanceReportTemplate(
  generatedAt: string,
): CompilePerformanceAcceptanceReport {
  return buildCompilePerformanceAcceptanceReport({ generatedAt, baseline: [], target: [] });
}

export function buildCompilePerformanceAcceptanceReport(
  input: CompilePerformanceAcceptanceReportInput,
): CompilePerformanceAcceptanceReport {
  assertNonEmpty(input.generatedAt, 'generatedAt');
  const matrix = createCompilePerformanceBenchmarkMatrix();
  const releaseScope = normalizeReleaseScope(input.releaseScope);
  const baseline = input.baseline.map((dataset) => summarizeDataset(dataset, 'baseline'));
  const target = input.target.map((dataset) => summarizeDataset(dataset, 'target'));
  const resources = input.resources || [];
  const checks = buildAcceptanceChecks(matrix, baseline, target, releaseScope, resources, input.canary);
  const status = checks.some((check) => check.status === 'fail')
    ? 'fail'
    : checks.some((check) => check.status === 'pending')
      ? 'pending'
      : 'pass';

  return {
    schemaVersion: COMPILE_PERFORMANCE_BENCHMARK_MATRIX_VERSION,
    generatedAt: input.generatedAt,
    status,
    releaseScope,
    matrix,
    baseline,
    target,
    checks,
    canary: input.canary || null,
    resources,
  };
}

export function serializeCompilePerformanceAcceptanceJson(report: CompilePerformanceAcceptanceReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function serializeCompilePerformanceAcceptanceMarkdown(report: CompilePerformanceAcceptanceReport): string {
  const conclusion =
    report.status === 'pass'
      ? 'PASS — all benchmark, correctness, database, and canary gates passed.'
      : report.status === 'fail'
        ? 'FAIL — at least one measured acceptance gate failed.'
        : 'PENDING — final measured benchmark or canary evidence is incomplete.';
  const lines = [
    '# Light Extension End-to-End Performance Acceptance',
    '',
    `Status: **${report.status.toUpperCase()}**`,
    '',
    `Generated at: ${escapeMarkdownCell(report.generatedAt)}`,
    '',
    '## Conclusion',
    '',
    conclusion,
    '',
    '## Fixed benchmark matrix',
    '',
    '| Scenario | Fixture | Cold runs | Hot runs | Expected result |',
    '| --- | --- | ---: | ---: | --- |',
    ...report.matrix.map(
      (scenario) =>
        `| ${scenario.id} | ${scenario.fixtureProfile} | ${scenario.coldRuns} | ${scenario.hotRuns} | ${scenario.expectedResult} |`,
    ),
    '',
    '## Release scope',
    '',
    '| Optional task | Enabled |',
    '| --- | --- |',
    ...Object.entries(report.releaseScope).map(([task, enabled]) => `| ${task} | ${enabled ? 'yes' : 'no'} |`),
    '',
    '## Environments',
    '',
    '| Revision | Source commit | Harness commit | Node | Database | Database version | Database config fingerprint | Compile path | Dependency fingerprint | Machine fingerprint |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...environmentRows('Baseline', report.baseline),
    ...environmentRows('Target', report.target),
    '',
    '## Acceptance checks',
    '',
    '| Check | Status | Details |',
    '| --- | --- | --- |',
    ...report.checks.map(
      (check) =>
        `| ${escapeMarkdownCell(check.title)} | ${check.status.toUpperCase()} | ${escapeMarkdownCell(check.details)} |`,
    ),
    '',
    '## Measured scenario summary',
    '',
    '| Revision | Database | Scenario | Temperature | Runs | Total median (ms) | Total p95 (ms) | SQL queries median | SQL queries p95 | SQL duration median (ms) | SQL duration p95 (ms) | Affected | Compiled | Reused | Skipped | Blob queries | Snapshot materializations | Tree normalizations | Reference scans |',
    '| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...datasetRows('Baseline', report.baseline),
    ...datasetRows('Target', report.target),
    '',
    '## Supplemental Session, Worker, and memory evidence',
    '',
    ...resourceRows(report.resources),
    '',
    '## Canary',
    '',
    ...canaryRows(report.canary),
    '',
    '## Rollback order',
    '',
    '1. Disable or clear optional Session, Preview ticket, and compile cache paths.',
    '2. Revert 10/13/12/11/09, then 08/07, then 05/04/03, then 02.',
    '3. Re-run rollback, concurrency, runtime Artifact, and reference consistency checks before reopening rollout.',
  ];

  return `${lines.join('\n')}\n`;
}

function summarizeDataset(
  dataset: CompilePerformanceBenchmarkDataset,
  revision: 'baseline' | 'target',
): CompilePerformanceDatasetSummary {
  assertEnvironment(dataset.environment);
  return {
    environment: { ...dataset.environment },
    scenarios: dataset.scenarios.map((scenario) => ({
      scenarioId: scenario.scenarioId,
      cold: summarizeRuns(
        scenario.scenarioId,
        'cold',
        scenario.coldRuns,
        scenario.coldOutcomes,
        revision === 'baseline',
      ),
      hot: summarizeRuns(scenario.scenarioId, 'hot', scenario.hotRuns, scenario.hotOutcomes, revision === 'baseline'),
    })),
    functional: { ...dataset.functional },
  };
}

function summarizeRuns(
  scenarioId: CompilePerformanceBenchmarkScenarioId,
  temperature: 'cold' | 'hot',
  runs: LightExtensionCompileMetricsSummary[],
  outcomes?: CompilePerformanceBenchmarkRunOutcome[],
  allowLegacyMissingCounters = false,
): CompilePerformanceRunGroupSummary {
  if (runs.length === 0) {
    return {
      runCount: 0,
      durationsMs: {},
      counters: zeroCounters(),
      sql: {},
      zeroFilledCounters: [],
    };
  }
  const [firstRun] = runs;
  for (const run of runs) {
    if (run.schemaVersion !== LIGHT_EXTENSION_COMPILE_METRICS_SCHEMA_VERSION) {
      throw new Error(`Benchmark scenario "${scenarioId}" has an unsupported metrics schema version`);
    }
    if (run.operation !== firstRun.operation || run.result !== firstRun.result) {
      throw new Error(`Benchmark scenario "${scenarioId}" mixes operation or result values in ${temperature} runs`);
    }
  }
  const durationsMs: CompilePerformanceRunGroupSummary['durationsMs'] = {};
  for (const stage of LIGHT_EXTENSION_COMPILE_METRIC_STAGES) {
    const samples = runs.flatMap((run) => (typeof run.durationsMs[stage] === 'number' ? [run.durationsMs[stage]] : []));
    if (samples.length > 0) {
      durationsMs[stage] = calculateDurationStatistics(samples);
    }
  }
  const counters = {} as Record<LightExtensionCompileMetricCounter, number>;
  const zeroFilledCounters = new Set<LightExtensionCompileMetricCounter>();
  for (const counter of LIGHT_EXTENSION_COMPILE_METRIC_COUNTERS) {
    const values = runs.map((run) => {
      const value = run.counters[counter];
      if (
        typeof value === 'undefined' &&
        allowLegacyMissingCounters &&
        LEGACY_SCHEMA_V1_ZERO_FILL_COUNTERS.has(counter)
      ) {
        zeroFilledCounters.add(counter);
        return 0;
      }
      return value;
    });
    const first = values[0];
    if (!Number.isSafeInteger(first) || first < 0) {
      throw new Error(`Benchmark scenario "${scenarioId}" has an invalid ${temperature} counter "${counter}"`);
    }
    if (values.some((value) => value !== first)) {
      throw new Error(`Benchmark scenario "${scenarioId}" has a non-deterministic ${temperature} counter "${counter}"`);
    }
    counters[counter] = first;
  }
  assertSqlOutcomes(scenarioId, temperature, runs.length, outcomes);
  const sql = {
    queryCount: calculateDurationStatistics(outcomes.map((outcome) => outcome.sql.queryCount)),
    totalDurationMs: calculateDurationStatistics(outcomes.map((outcome) => outcome.sql.totalDurationMs)),
  };
  return {
    runCount: runs.length,
    operation: firstRun.operation,
    result: firstRun.result,
    durationsMs,
    counters,
    sql,
    zeroFilledCounters: [...zeroFilledCounters],
  };
}

function assertSqlOutcomes(
  scenarioId: CompilePerformanceBenchmarkScenarioId,
  temperature: 'cold' | 'hot',
  runCount: number,
  outcomes: CompilePerformanceBenchmarkRunOutcome[] | undefined,
): asserts outcomes is CompilePerformanceBenchmarkRunOutcome[] {
  if (!outcomes || outcomes.length !== runCount) {
    throw new Error(
      `Benchmark scenario "${scenarioId}" has ${
        outcomes?.length || 0
      } ${temperature} SQL outcomes for ${runCount} metrics runs`,
    );
  }
  for (const [index, outcome] of outcomes.entries()) {
    if (
      outcome.iteration !== index + 1 ||
      outcome.temperature !== temperature ||
      !Number.isSafeInteger(outcome.sql?.queryCount) ||
      outcome.sql.queryCount <= 0 ||
      !Number.isFinite(outcome.sql?.totalDurationMs) ||
      outcome.sql.totalDurationMs < 0
    ) {
      throw new Error(
        `Benchmark scenario "${scenarioId}" has an invalid ${temperature} SQL outcome at run ${index + 1}`,
      );
    }
  }
}

function buildAcceptanceChecks(
  matrix: CompilePerformanceBenchmarkScenario[],
  baseline: CompilePerformanceDatasetSummary[],
  target: CompilePerformanceDatasetSummary[],
  releaseScope: CompilePerformanceReleaseScope,
  resources: CompilePerformanceResourceSoakEvidence[],
  canary?: CompilePerformanceCanaryEvidence,
): CompilePerformanceAcceptanceCheck[] {
  const checks = [
    collectionCompletenessCheck(matrix, baseline, target),
    legacyCounterCompatibilityCheck(baseline),
    databaseCoverageCheck(baseline, target),
    environmentParityCheck(baseline, target),
    structuralChecks(matrix, target, releaseScope),
    databaseQueryScalingChecks(target),
    resourceSoakChecks(target, releaseScope, resources),
    functionalChecks(target),
    mediumPrivatePerformanceCheck(baseline, target),
    smallRepositoryRegressionCheck(baseline, target),
    canaryCheck(canary),
  ];
  return checks.flat();
}

function collectionCompletenessCheck(
  matrix: CompilePerformanceBenchmarkScenario[],
  baseline: CompilePerformanceDatasetSummary[],
  target: CompilePerformanceDatasetSummary[],
): CompilePerformanceAcceptanceCheck {
  if (baseline.length === 0 || target.length === 0) {
    return pendingCheck('collection-complete', 'Fixed matrix collection', 'Baseline and target datasets are required.');
  }
  const missing: string[] = [];
  for (const dataset of [...baseline, ...target]) {
    const byId = new Map(dataset.scenarios.map((scenario) => [scenario.scenarioId, scenario]));
    for (const expected of matrix) {
      const scenario = byId.get(expected.id);
      if (!scenario) {
        missing.push(`${dataset.environment.sourceCommit}/${dataset.environment.databaseDialect}/${expected.id}`);
        continue;
      }
      if (scenario.cold.runCount < expected.coldRuns || scenario.hot.runCount < expected.hotRuns) {
        missing.push(
          `${dataset.environment.sourceCommit}/${dataset.environment.databaseDialect}/${expected.id} (${scenario.cold.runCount} cold, ${scenario.hot.runCount} hot)`,
        );
      }
    }
  }
  return missing.length === 0
    ? passCheck(
        'collection-complete',
        'Fixed matrix collection',
        'Every dataset contains at least 1 cold and 20 hot runs for all 8 scenarios.',
      )
    : pendingCheck('collection-complete', 'Fixed matrix collection', `Missing or incomplete: ${missing.join(', ')}`);
}

function legacyCounterCompatibilityCheck(
  baseline: CompilePerformanceDatasetSummary[],
): CompilePerformanceAcceptanceCheck {
  if (baseline.length === 0) {
    return pendingCheck('legacy-counter-compatibility', 'Legacy counter compatibility', 'No baseline is available.');
  }
  const zeroFilled = [
    ...new Set(
      baseline.flatMap((dataset) =>
        dataset.scenarios.flatMap((scenario) => [
          ...scenario.cold.zeroFilledCounters,
          ...scenario.hot.zeroFilledCounters,
        ]),
      ),
    ),
  ].sort();
  return passCheck(
    'legacy-counter-compatibility',
    'Legacy counter compatibility',
    zeroFilled.length > 0
      ? `Legacy schemaVersion 1 baseline counters zero-filled deterministically: ${zeroFilled.join(', ')}.`
      : 'Baseline already contains every current schemaVersion 1 counter.',
  );
}

function databaseCoverageCheck(
  baseline: CompilePerformanceDatasetSummary[],
  target: CompilePerformanceDatasetSummary[],
): CompilePerformanceAcceptanceCheck {
  const baselineDialects = new Set(baseline.map((dataset) => normalizeDialect(dataset.environment.databaseDialect)));
  const targetDialects = new Set(target.map((dataset) => normalizeDialect(dataset.environment.databaseDialect)));
  const paired = [...targetDialects].filter((dialect) => baselineDialects.has(dialect));
  const hasSqlite = paired.includes('sqlite');
  const hasNetwork = paired.some((dialect) => dialect === 'postgres' || dialect === 'mysql' || dialect === 'mariadb');
  return hasSqlite && hasNetwork
    ? passCheck('database-coverage', 'Database coverage', `Paired dialects: ${paired.sort().join(', ')}.`)
    : pendingCheck(
        'database-coverage',
        'Database coverage',
        'Paired baseline and target datasets must include SQLite and PostgreSQL/MySQL/MariaDB.',
      );
}

function environmentParityCheck(
  baseline: CompilePerformanceDatasetSummary[],
  target: CompilePerformanceDatasetSummary[],
): CompilePerformanceAcceptanceCheck[] {
  if (baseline.length === 0 || target.length === 0) {
    return [pendingCheck('environment-parity', 'Environment parity', 'No comparable datasets are available.')];
  }
  return target.map((targetDataset) => {
    const dialect = normalizeDialect(targetDataset.environment.databaseDialect);
    const baselineDataset = baseline.find(
      (candidate) => normalizeDialect(candidate.environment.databaseDialect) === dialect,
    );
    if (!baselineDataset) {
      return pendingCheck(
        `environment-parity-${dialect}`,
        `Environment parity (${dialect})`,
        'Missing baseline dataset.',
      );
    }
    const fields: Array<keyof CompilePerformanceBenchmarkEnvironment> = [
      'nodeVersion',
      'harnessCommit',
      'dependencyFingerprint',
      'machineFingerprint',
      'databaseVersion',
      'databaseConfigurationFingerprint',
    ];
    const mismatches = fields.filter(
      (field) => baselineDataset.environment[field] !== targetDataset.environment[field],
    );
    return mismatches.length === 0
      ? passCheck(
          `environment-parity-${dialect}`,
          `Environment parity (${dialect})`,
          'Baseline and target use the same measured environment.',
        )
      : failCheck(
          `environment-parity-${dialect}`,
          `Environment parity (${dialect})`,
          `Mismatched fields: ${mismatches.join(', ')}.`,
        );
  });
}

function structuralChecks(
  matrix: CompilePerformanceBenchmarkScenario[],
  target: CompilePerformanceDatasetSummary[],
  releaseScope: CompilePerformanceReleaseScope,
): CompilePerformanceAcceptanceCheck[] {
  if (target.length === 0) {
    return [pendingCheck('structural-counters', 'Structural counters', 'No target datasets are available.')];
  }
  return target.flatMap((dataset) => {
    const dialect = normalizeDialect(dataset.environment.databaseDialect);
    const scenarios = new Map(dataset.scenarios.map((scenario) => [scenario.scenarioId, scenario]));
    return matrix.map((expected) => {
      const structural =
        releaseScope.runtimeAndTypeDependencyGraph && expected.dependencyGraphStructural
          ? expected.dependencyGraphStructural
          : expected.structural;
      const actual = scenarios.get(expected.id);
      const id = `structural-${dialect}-${expected.id}`;
      const title = `Structural counters (${dialect}, ${expected.id})`;
      if (!actual || actual.cold.runCount < expected.coldRuns || actual.hot.runCount < expected.hotRuns) {
        return pendingCheck(id, title, 'Required target samples are incomplete.');
      }
      const failures = [
        ...checkStructuralGroup(expected, structural, 'cold', actual.cold),
        ...checkStructuralGroup(expected, structural, 'hot', actual.hot),
      ];
      return failures.length === 0
        ? passCheck(id, title, 'Cold and hot structural counters meet the matrix contract.')
        : failCheck(id, title, failures.join('; '));
    });
  });
}

function checkStructuralGroup(
  expected: CompilePerformanceBenchmarkScenario,
  structural: CompilePerformanceBenchmarkScenario['structural'],
  temperature: 'cold' | 'hot',
  actual: CompilePerformanceRunGroupSummary,
): string[] {
  const failures: string[] = [];
  const counters = actual.counters;
  if (actual.operation !== 'saveSource' || actual.result !== expected.expectedResult) {
    failures.push(`${temperature} operation/result=${actual.operation || 'missing'}/${actual.result || 'missing'}`);
  }
  if (
    typeof structural.affectedEntryCount === 'number' &&
    counters.affectedEntryCount !== structural.affectedEntryCount
  ) {
    failures.push(`${temperature} affectedEntryCount=${counters.affectedEntryCount}`);
  }
  if (
    typeof structural.compiledEntryCount === 'number' &&
    counters.compiledEntryCount !== structural.compiledEntryCount
  ) {
    failures.push(`${temperature} compiledEntryCount=${counters.compiledEntryCount}`);
  }
  if (
    typeof structural.compiledEntryCountMax === 'number' &&
    counters.compiledEntryCount > structural.compiledEntryCountMax
  ) {
    failures.push(`${temperature} compiledEntryCount=${counters.compiledEntryCount}`);
  }
  if (counters.blobContentQueryCount > structural.blobContentQueryCountMax) {
    failures.push(`${temperature} blobContentQueryCount=${counters.blobContentQueryCount}`);
  }
  if (counters.snapshotMaterializationCount > structural.snapshotMaterializationCountMax) {
    failures.push(`${temperature} snapshotMaterializationCount=${counters.snapshotMaterializationCount}`);
  }
  if (counters.treeNormalizationCount > structural.treeNormalizationCountMax) {
    failures.push(`${temperature} treeNormalizationCount=${counters.treeNormalizationCount}`);
  }
  if (
    structural.requireUncompiledEntriesReusedOrSkipped &&
    counters.compiledEntryCount + counters.reusedEntryCount + counters.skippedEntryCount !== counters.entryCount
  ) {
    failures.push(`${temperature} compile/reuse/skip total does not equal entryCount`);
  }
  return failures;
}

function databaseQueryScalingChecks(target: CompilePerformanceDatasetSummary[]): CompilePerformanceAcceptanceCheck[] {
  if (target.length === 0) {
    return [pendingCheck('database-query-scaling', 'Database query scaling', 'No target datasets are available.')];
  }
  return target.map((dataset) => {
    const dialect = normalizeDialect(dataset.environment.databaseDialect);
    const smallScenario = dataset.scenarios.find((scenario) => scenario.scenarioId === 'small-private-file');
    const mediumScenario = dataset.scenarios.find((scenario) => scenario.scenarioId === 'medium-private-file');
    const small = smallScenario?.hot.sql.queryCount;
    const medium = mediumScenario?.hot.sql.queryCount;
    if (!smallScenario || !mediumScenario || !small || !medium || small.p95 <= 0) {
      return pendingCheck(
        `database-query-scaling-${dialect}`,
        `Database query scaling (${dialect})`,
        'Measured Save-only SQL query counts are incomplete.',
      );
    }
    const ratio = medium.p95 / small.p95;
    const blobCounts = [
      smallScenario.cold.counters.blobContentQueryCount,
      smallScenario.hot.counters.blobContentQueryCount,
      mediumScenario.cold.counters.blobContentQueryCount,
      mediumScenario.hot.counters.blobContentQueryCount,
    ];
    const details = `Small hot p95 ${formatNumber(small.p95)} queries; medium hot p95 ${formatNumber(
      medium.p95,
    )} queries; ratio ${formatNumber(ratio)}x for 20x files/Entries; Blob includeContent query counts ${blobCounts.join(
      '/',
    )}.`;
    return ratio < 10 && blobCounts.every((count) => count === 1)
      ? passCheck(`database-query-scaling-${dialect}`, `Database query scaling (${dialect})`, details)
      : failCheck(`database-query-scaling-${dialect}`, `Database query scaling (${dialect})`, details);
  });
}

function resourceSoakChecks(
  target: CompilePerformanceDatasetSummary[],
  releaseScope: CompilePerformanceReleaseScope,
  resources: CompilePerformanceResourceSoakEvidence[],
): CompilePerformanceAcceptanceCheck {
  const required = releaseScope.incrementalCompilerSessions || releaseScope.boundedCompilationAndPersistence;
  const directTargets = releaseScope.boundedCompilationAndPersistence
    ? target.filter((dataset) => dataset.environment.compileExecutionPath !== 'production-worker')
    : [];
  if (directTargets.length > 0) {
    return failCheck(
      'resource-soak',
      'Session, Worker, and memory soak',
      directTargets
        .map((dataset) => `${dataset.environment.databaseDialect} core matrix bypassed the production Worker path`)
        .join('; '),
    );
  }
  if (!required && resources.length === 0) {
    return passCheck(
      'resource-soak',
      'Session, Worker, and memory soak',
      'Supplemental resource evidence is not required by the selected release scope.',
    );
  }
  if (resources.length === 0 || target.length === 0) {
    return pendingCheck(
      'resource-soak',
      'Session, Worker, and memory soak',
      'Acceptance-ready supplemental resource evidence is required.',
    );
  }
  const failures: string[] = [];
  const pending: string[] = [];
  for (const dataset of target) {
    const environment = dataset.environment;
    const resource = resources.find(
      (candidate) =>
        candidate.sourceCommit === environment.sourceCommit &&
        candidate.harnessCommit === environment.harnessCommit &&
        candidate.nodeVersion === environment.nodeVersion &&
        candidate.machineFingerprint === environment.machineFingerprint &&
        candidate.dependencyFingerprint === environment.dependencyFingerprint,
    );
    if (!resource) {
      const sameRevision = resources.some(
        (candidate) =>
          candidate.sourceCommit === environment.sourceCommit && candidate.harnessCommit === environment.harnessCommit,
      );
      if (sameRevision) {
        failures.push(`${environment.databaseDialect} resource environment does not match the measured target`);
      } else {
        pending.push(`${environment.sourceCommit}/${environment.harnessCommit}`);
      }
      continue;
    }
    if (!resource.gate.passed) {
      failures.push(`${environment.databaseDialect}: ${resource.gate.failures.join(', ')}`);
    } else if (!resource.gate.acceptanceReady) {
      pending.push(`${environment.databaseDialect} resource soak has fewer than 20 iterations`);
    }
  }
  if (failures.length > 0) {
    return failCheck('resource-soak', 'Session, Worker, and memory soak', failures.join('; '));
  }
  if (pending.length > 0) {
    return pendingCheck('resource-soak', 'Session, Worker, and memory soak', pending.join('; '));
  }
  return passCheck(
    'resource-soak',
    'Session, Worker, and memory soak',
    'Session limits, TTL/disable/shutdown release, production Workers, and memory growth gates passed.',
  );
}

function functionalChecks(target: CompilePerformanceDatasetSummary[]): CompilePerformanceAcceptanceCheck[] {
  if (target.length === 0) {
    return [pendingCheck('functional-regression', 'Functional regression', 'No target datasets are available.')];
  }
  return target.map((dataset) => {
    const dialect = normalizeDialect(dataset.environment.databaseDialect);
    const failed = Object.entries(dataset.functional)
      .filter(([, value]) => !value)
      .map(([key]) => key);
    return failed.length === 0
      ? passCheck(
          `functional-regression-${dialect}`,
          `Functional regression (${dialect})`,
          'UI save path, rollback, concurrency, runtime Artifact, and reference consistency were verified.',
        )
      : failCheck(
          `functional-regression-${dialect}`,
          `Functional regression (${dialect})`,
          `Failed checks: ${failed.join(', ')}.`,
        );
  });
}

function mediumPrivatePerformanceCheck(
  baseline: CompilePerformanceDatasetSummary[],
  target: CompilePerformanceDatasetSummary[],
): CompilePerformanceAcceptanceCheck[] {
  return comparisonChecks(
    'medium-private-file',
    'median',
    baseline,
    target,
    (baselineValue, targetValue) => targetValue <= baselineValue * 0.5,
    (baselineValue, targetValue) =>
      `Baseline ${formatNumber(baselineValue)} ms; target ${formatNumber(targetValue)} ms; reduction ${formatPercentage(
        1 - targetValue / baselineValue,
      )}. Required reduction: at least 50%.`,
  );
}

function smallRepositoryRegressionCheck(
  baseline: CompilePerformanceDatasetSummary[],
  target: CompilePerformanceDatasetSummary[],
): CompilePerformanceAcceptanceCheck[] {
  return comparisonChecks(
    'small-private-file',
    'p95',
    baseline,
    target,
    (baselineValue, targetValue) => targetValue <= baselineValue * 1.1,
    (baselineValue, targetValue) =>
      `Baseline ${formatNumber(baselineValue)} ms; target ${formatNumber(targetValue)} ms; change ${formatPercentage(
        targetValue / baselineValue - 1,
      )}. Maximum allowed regression: 10%.`,
  );
}

function comparisonChecks(
  scenarioId: CompilePerformanceBenchmarkScenarioId,
  statistic: 'median' | 'p95',
  baseline: CompilePerformanceDatasetSummary[],
  target: CompilePerformanceDatasetSummary[],
  accepts: (baselineValue: number, targetValue: number) => boolean,
  details: (baselineValue: number, targetValue: number) => string,
): CompilePerformanceAcceptanceCheck[] {
  if (target.length === 0) {
    return [
      pendingCheck(
        `performance-${scenarioId}`,
        `Performance gate (${scenarioId})`,
        'No target datasets are available.',
      ),
    ];
  }
  return target.map((targetDataset) => {
    const dialect = normalizeDialect(targetDataset.environment.databaseDialect);
    const id = `performance-${dialect}-${scenarioId}-${statistic}`;
    const title = `Performance gate (${dialect}, ${scenarioId} ${statistic})`;
    const baselineDataset = baseline.find(
      (candidate) => normalizeDialect(candidate.environment.databaseDialect) === dialect,
    );
    const baselineValue = totalStatistic(baselineDataset, scenarioId, statistic);
    const targetValue = totalStatistic(targetDataset, scenarioId, statistic);
    if (typeof baselineValue !== 'number' || typeof targetValue !== 'number' || baselineValue <= 0) {
      return pendingCheck(id, title, 'Comparable hot total duration statistics are incomplete.');
    }
    return accepts(baselineValue, targetValue)
      ? passCheck(id, title, details(baselineValue, targetValue))
      : failCheck(id, title, details(baselineValue, targetValue));
  });
}

function totalStatistic(
  dataset: CompilePerformanceDatasetSummary | undefined,
  scenarioId: CompilePerformanceBenchmarkScenarioId,
  statistic: 'median' | 'p95',
): number | undefined {
  return dataset?.scenarios.find((scenario) => scenario.scenarioId === scenarioId)?.hot.durationsMs.total?.[statistic];
}

function canaryCheck(canary?: CompilePerformanceCanaryEvidence): CompilePerformanceAcceptanceCheck {
  if (!canary || canary.status === 'pending') {
    return pendingCheck('canary', 'Canary observation', 'Canary evidence is not complete.');
  }
  const regressions = [
    canary.staleRuntimeIncrease && 'stale runtime increase',
    canary.artifactMismatchIncrease && 'Artifact mismatch increase',
    canary.headConflictRateIncrease && 'Head conflict rate increase',
    canary.sustainedMemoryGrowth && 'sustained memory growth',
  ].filter((value): value is string => Boolean(value));
  if (canary.status === 'fail' || regressions.length > 0) {
    return failCheck('canary', 'Canary observation', regressions.length > 0 ? regressions.join(', ') : canary.notes);
  }
  return passCheck('canary', 'Canary observation', `${canary.observationWindow}: ${canary.notes}`);
}

function assertEnvironment(environment: CompilePerformanceBenchmarkEnvironment): void {
  const requiredFields: Array<keyof CompilePerformanceBenchmarkEnvironment> = [
    'sourceCommit',
    'harnessCommit',
    'nodeVersion',
    'dependencyFingerprint',
    'machineFingerprint',
    'databaseDialect',
    'databaseVersion',
    'databaseConfigurationFingerprint',
    'compileExecutionPath',
  ];
  for (const field of requiredFields) {
    assertNonEmpty(environment[field], `environment.${field}`);
  }
  if (environment.compileExecutionPath !== 'direct' && environment.compileExecutionPath !== 'production-worker') {
    throw new Error('Compile performance acceptance report environment.compileExecutionPath is invalid');
  }
}

function assertNonEmpty(value: unknown, label: string): void {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Compile performance acceptance report ${label} is required`);
  }
}

function zeroCounters(): Record<LightExtensionCompileMetricCounter, number> {
  return Object.fromEntries(LIGHT_EXTENSION_COMPILE_METRIC_COUNTERS.map((counter) => [counter, 0])) as Record<
    LightExtensionCompileMetricCounter,
    number
  >;
}

function normalizeDialect(dialect: string): string {
  return dialect.trim().toLowerCase();
}

function normalizeReleaseScope(scope?: CompilePerformanceReleaseScope): CompilePerformanceReleaseScope {
  return {
    trustedPreviewTicket: scope?.trustedPreviewTicket || false,
    optimisticTwoPhaseSave: scope?.optimisticTwoPhaseSave || false,
    incrementalCompilerSessions: scope?.incrementalCompilerSessions || false,
    runtimeAndTypeDependencyGraph: scope?.runtimeAndTypeDependencyGraph || false,
    boundedCompilationAndPersistence: scope?.boundedCompilationAndPersistence || false,
    browserProvisionalPreview: scope?.browserProvisionalPreview || false,
  };
}

function passCheck(id: string, title: string, details: string): CompilePerformanceAcceptanceCheck {
  return { id, title, status: 'pass', details };
}

function pendingCheck(id: string, title: string, details: string): CompilePerformanceAcceptanceCheck {
  return { id, title, status: 'pending', details };
}

function failCheck(id: string, title: string, details: string): CompilePerformanceAcceptanceCheck {
  return { id, title, status: 'fail', details };
}

function environmentRows(revision: 'Baseline' | 'Target', datasets: CompilePerformanceDatasetSummary[]): string[] {
  if (datasets.length === 0) {
    return [
      `| ${revision} | pending | pending | pending | pending | pending | pending | pending | pending | pending |`,
    ];
  }
  return datasets.map(
    ({ environment }) =>
      `| ${revision} | ${escapeMarkdownCell(environment.sourceCommit)} | ${escapeMarkdownCell(
        environment.harnessCommit,
      )} | ${escapeMarkdownCell(environment.nodeVersion)} | ${escapeMarkdownCell(
        environment.databaseDialect,
      )} | ${escapeMarkdownCell(environment.databaseVersion)} | ${escapeMarkdownCell(
        environment.databaseConfigurationFingerprint,
      )} | ${escapeMarkdownCell(environment.compileExecutionPath)} | ${escapeMarkdownCell(
        environment.dependencyFingerprint,
      )} | ${escapeMarkdownCell(environment.machineFingerprint)} |`,
  );
}

function resourceRows(resources: CompilePerformanceResourceSoakEvidence[]): string[] {
  if (resources.length === 0) {
    return ['Resource soak evidence pending.'];
  }
  return [
    '| Source commit | Harness commit | Iterations | Gate | Session peak repos | Session peak entries | Session peak bytes | Worker threads | Worker max active | Worker max queue | RSS growth | Heap growth |',
    '| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...resources.map(
      (resource) =>
        `| ${escapeMarkdownCell(resource.sourceCommit)} | ${escapeMarkdownCell(resource.harnessCommit)} | ${
          resource.iterations
        } | ${resource.gate.acceptanceReady ? 'PASS' : resource.gate.passed ? 'SMOKE' : 'FAIL'} | ${
          resource.session.peak.activeRepos
        } | ${resource.session.peak.activeEntries} | ${resource.session.peak.estimatedFileBytes} | ${
          resource.worker.workerThreadIds.length
        } | ${resource.worker.observed.maxActive} | ${resource.worker.observed.maxQueueDepth} | ${
          resource.memory.afterShutdown.rssBytes - resource.memory.start.rssBytes
        } | ${resource.memory.afterShutdown.heapUsedBytes - resource.memory.start.heapUsedBytes} |`,
    ),
    '',
    ...resources.flatMap((resource) => [
      `Resource environment: Node ${escapeMarkdownCell(resource.nodeVersion)}, machine ${escapeMarkdownCell(
        resource.machineFingerprint,
      )}, dependencies ${escapeMarkdownCell(resource.dependencyFingerprint)}.`,
      '',
      `Session limits/peak: repos ${resource.session.peak.activeRepos}/${resource.session.configured.maxRepos}, entries ${resource.session.peak.activeEntries}/${resource.session.configured.maxEntries}, bytes ${resource.session.peak.estimatedFileBytes}/${resource.session.configured.maxEstimatedFileBytes}; TTL released ${resource.session.afterTtl.activeRepos}/${resource.session.afterTtl.activeEntries}/${resource.session.afterTtl.estimatedFileBytes}; disabled retained ${resource.session.disabled.activeRepos}/${resource.session.disabled.activeEntries}/${resource.session.disabled.estimatedFileBytes}; shutdown released ${resource.session.afterShutdown.activeRepos}/${resource.session.afterShutdown.activeEntries}/${resource.session.afterShutdown.estimatedFileBytes}.`,
      '',
      `Worker proof: production path ${resource.worker.productionWorkerPath ? 'yes' : 'no'}, thread IDs ${
        resource.worker.workerThreadIds.join(', ') || 'none'
      }, configured workers/queue/inflight ${resource.worker.configured.workerCount}/${
        resource.worker.configured.maxQueueLength
      }/${resource.worker.configured.maxInflightBytes}, observed inflight peak ${
        resource.worker.observed.maxInflightBytes
      }, shutdown workers/active/queue/inflight ${resource.worker.afterShutdown.workerCount}/${
        resource.worker.afterShutdown.active
      }/${resource.worker.afterShutdown.queueDepth}/${resource.worker.afterShutdown.inflightBytes}.`,
      '',
      `Reproduce: \`${escapeMarkdownCode(resource.reproducibleCommand)}\``,
      '',
    ]),
  ];
}

function datasetRows(revision: 'Baseline' | 'Target', datasets: CompilePerformanceDatasetSummary[]): string[] {
  return datasets.flatMap((dataset) =>
    dataset.scenarios.flatMap((scenario) => [
      scenarioRow(revision, dataset.environment.databaseDialect, scenario.scenarioId, 'Cold', scenario.cold),
      scenarioRow(revision, dataset.environment.databaseDialect, scenario.scenarioId, 'Hot', scenario.hot),
    ]),
  );
}

function scenarioRow(
  revision: 'Baseline' | 'Target',
  dialect: string,
  scenarioId: CompilePerformanceBenchmarkScenarioId,
  temperature: 'Cold' | 'Hot',
  group: CompilePerformanceRunGroupSummary,
): string {
  const total = group.durationsMs.total;
  const sqlQueries = group.sql.queryCount;
  const sqlDuration = group.sql.totalDurationMs;
  const counters = group.counters;
  return `| ${revision} | ${escapeMarkdownCell(dialect)} | ${scenarioId} | ${temperature} | ${
    group.runCount
  } | ${formatOptionalNumber(total?.median)} | ${formatOptionalNumber(total?.p95)} | ${formatOptionalNumber(
    sqlQueries?.median,
  )} | ${formatOptionalNumber(sqlQueries?.p95)} | ${formatOptionalNumber(sqlDuration?.median)} | ${formatOptionalNumber(
    sqlDuration?.p95,
  )} | ${counters.affectedEntryCount} | ${counters.compiledEntryCount} | ${counters.reusedEntryCount} | ${
    counters.skippedEntryCount
  } | ${counters.blobContentQueryCount} | ${counters.snapshotMaterializationCount} | ${
    counters.treeNormalizationCount
  } | ${counters.referenceScanCount} |`;
}

function canaryRows(canary: CompilePerformanceCanaryEvidence | null): string[] {
  if (!canary) {
    return ['Canary evidence pending.'];
  }
  return [
    `Status: **${canary.status.toUpperCase()}**`,
    '',
    `Observation window: ${escapeMarkdownCell(canary.observationWindow)}`,
    '',
    `Notes: ${escapeMarkdownCell(canary.notes)}`,
  ];
}

function formatOptionalNumber(value: number | undefined): string {
  return typeof value === 'number' ? formatNumber(value) : 'pending';
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)));
}

function formatPercentage(value: number): string {
  return `${Number((value * 100).toFixed(1))}%`;
}

function escapeMarkdownCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

function escapeMarkdownCode(value: string): string {
  return value.replaceAll('`', '\\`').replaceAll('\n', ' ');
}
