/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginVscFileServer from '@nocobase/plugin-vsc-file';
import { createMockServer, type MockServer } from '@nocobase/test';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { arch, cpus, platform } from 'node:os';

import { isLightExtensionError } from '../../../shared/errors';
import type { LightExtensionCompileMetricsSummary } from '../../../shared/compileMetrics';
import PluginLightExtensionServer from '../../plugin';
import { LightExtensionAuditService } from '../../services/LightExtensionAuditService';
import { LightExtensionCompileWorkerPool } from '../../services/LightExtensionCompileWorkerPool';
import { LightExtensionEntryService } from '../../services/LightExtensionEntryService';
import { LightExtensionFileService } from '../../services/LightExtensionFileService';
import { LightExtensionPermissionService } from '../../services/LightExtensionPermissionService';
import { LightExtensionRepoService } from '../../services/LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from '../../services/LightExtensionRuntimeCompileService';
import { LightExtensionValidator } from '../../services/LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from '../../services/LightExtensionWorkspaceCompilerBridge';
import { ReferenceService } from '../../services/ReferenceService';
import { RuntimeResolveService } from '../../services/RuntimeResolveService';
import type {
  CompilePerformanceBenchmarkDataset,
  CompilePerformanceBenchmarkRunOutcome,
  CompilePerformanceBenchmarkScenarioEvidence,
} from './compilePerformanceAcceptanceReport';
import {
  createCompilePerformanceBenchmarkEvidence,
  type CompilePerformanceBenchmarkCollectorConfig,
  type CompilePerformanceBenchmarkEvidence,
} from './compilePerformanceBenchmarkEvidence';
import {
  createCompilePerformanceBenchmarkFixture,
  createCompilePerformanceBenchmarkMatrix,
  createCompilePerformanceBenchmarkMutation,
  type CompilePerformanceBenchmarkFixture,
  type CompilePerformanceBenchmarkMutation,
  type CompilePerformanceBenchmarkScenario,
} from './compilePerformanceBenchmarkMatrix';

interface CollectorContext {
  app: MockServer;
  auditService: LightExtensionAuditService;
  permissionService: LightExtensionPermissionService;
  repoService: LightExtensionRepoService;
  fileService: LightExtensionFileService;
  entryService: LightExtensionEntryService;
}

interface CollectorServices extends CollectorContext {
  compileWorkerPool: LightExtensionCompileWorkerPool;
  runtimeCompileService: LightExtensionRuntimeCompileService;
  runtimeResolveService: RuntimeResolveService;
  metrics: LightExtensionCompileMetricsSummary[];
}

interface ScenarioRepository {
  repoId: string;
  fixture: CompilePerformanceBenchmarkFixture;
}

interface ScenarioRunResult {
  summary: LightExtensionCompileMetricsSummary;
  outcome: CompilePerformanceBenchmarkRunOutcome;
}

export async function collectCompilePerformanceBenchmarkEvidence(
  config: CompilePerformanceBenchmarkCollectorConfig,
): Promise<CompilePerformanceBenchmarkEvidence> {
  const context = await createCollectorContext();
  try {
    const databaseDialect = context.app.db.sequelize.getDialect();
    if (databaseDialect !== 'sqlite' && databaseDialect !== 'postgres') {
      throw new Error(`Compile performance collector supports sqlite and postgres, received ${databaseDialect}`);
    }
    const scenarios: CompilePerformanceBenchmarkScenarioEvidence[] = [];
    for (const scenario of createCompilePerformanceBenchmarkMatrix()) {
      const seedServices = createRuntimeServices(context);
      let repository: ScenarioRepository;
      try {
        await seedServices.runtimeCompileService.clearCompileCache();
        repository = await seedScenarioRepository(seedServices, scenario);
      } finally {
        await seedServices.compileWorkerPool.shutdown();
      }
      const measuredServices = createRuntimeServices(context);
      try {
        scenarios.push(await collectScenario(measuredServices, repository, scenario, config));
      } finally {
        await measuredServices.compileWorkerPool.shutdown();
      }
    }

    const rollbackOutcomes = scenarioOutcomes(scenarios, 'medium-compile-failure');
    const concurrencyOutcomes = scenarioOutcomes(scenarios, 'medium-concurrent-same-head');
    const ordinaryOutcomes = scenarios
      .filter(
        (scenario) =>
          scenario.scenarioId !== 'medium-compile-failure' && scenario.scenarioId !== 'medium-concurrent-same-head',
      )
      .flatMap((scenario) => [...(scenario.coldOutcomes || []), ...(scenario.hotOutcomes || [])]);
    const concurrentRuntimeOutcomes = concurrencyOutcomes.filter((outcome) => outcome.successCount === 1);
    const localReferenceConsistency = [...ordinaryOutcomes, ...concurrentRuntimeOutcomes].every(
      (outcome) => outcome.referenceConsistencyVerified,
    );
    const dataset: CompilePerformanceBenchmarkDataset = {
      environment: {
        sourceCommit: config.sourceCommit,
        harnessCommit: config.harnessCommit,
        nodeVersion: process.version,
        dependencyFingerprint: await dependencyFingerprint(),
        machineFingerprint: machineFingerprint(),
        databaseDialect,
        databaseVersion: await databaseVersion(context.app, databaseDialect),
        databaseConfigurationFingerprint: databaseConfigurationFingerprint(databaseDialect),
      },
      scenarios,
      functional: {
        uiSingleSavePathVerified: config.uiSingleSavePathVerified,
        rollbackVerified: rollbackOutcomes.every(
          (outcome) => outcome.rejectedCount === 1 && outcome.rollbackVerified && !outcome.headAdvanced,
        ),
        concurrencyVerified: concurrencyOutcomes.every(
          (outcome) => outcome.successCount === 1 && outcome.outdatedCount === 1 && outcome.headAdvanced,
        ),
        runtimeArtifactsVerified: [...ordinaryOutcomes, ...concurrentRuntimeOutcomes].every(
          (outcome) => outcome.runtimeArtifactsVerified,
        ),
        referenceConsistencyVerified: config.externalReferenceRegressionVerified && localReferenceConsistency,
      },
    };

    return createCompilePerformanceBenchmarkEvidence({
      collectedAt: new Date().toISOString(),
      sourceCommit: config.sourceCommit,
      harnessCommit: config.harnessCommit,
      databaseDialect,
      configuredRuns: { cold: config.coldRuns, hot: config.hotRuns },
      dataset,
    });
  } finally {
    await context.app.destroy();
  }
}

async function createCollectorContext(): Promise<CollectorContext> {
  const app = await createMockServer({ plugins: [PluginVscFileServer, PluginLightExtensionServer] });
  const auditService = new LightExtensionAuditService(app.db);
  const permissionService = new LightExtensionPermissionService(auditService);
  const validator = new LightExtensionValidator();
  const repoService = new LightExtensionRepoService(app.db, auditService, permissionService, undefined, validator);
  const fileService = new LightExtensionFileService(
    app.db,
    auditService,
    permissionService,
    repoService,
    undefined,
    validator,
  );
  const entryService = new LightExtensionEntryService(app.db, fileService, repoService, validator);
  return { app, auditService, permissionService, repoService, fileService, entryService };
}

function createRuntimeServices(context: CollectorContext): CollectorServices {
  const compilerBridge = new LightExtensionWorkspaceCompilerBridge(context.auditService, context.permissionService);
  const compileWorkerPool = new LightExtensionCompileWorkerPool({
    workerCount: context.app.db.sequelize.getDialect() === 'sqlite' ? 1 : 2,
  });
  const metrics: LightExtensionCompileMetricsSummary[] = [];
  const runtimeCompileService = new LightExtensionRuntimeCompileService(
    context.app.db,
    context.fileService,
    context.entryService,
    compilerBridge,
    (summary) => metrics.push(summary),
    { compileWorkerPool },
  );
  runtimeCompileService.useReferenceService(
    new ReferenceService(context.app.db, context.auditService, context.permissionService),
  );
  return {
    ...context,
    compileWorkerPool,
    runtimeCompileService,
    runtimeResolveService: new RuntimeResolveService(context.app.db),
    metrics,
  };
}

async function seedScenarioRepository(
  services: CollectorServices,
  scenario: CompilePerformanceBenchmarkScenario,
): Promise<ScenarioRepository> {
  const fixture = createCompilePerformanceBenchmarkFixture(scenario.fixtureProfile);
  const rootAndSharedFiles = fixture.files.filter((file) => !file.path.startsWith('src/client/js-blocks/'));
  const entryFiles = fixture.files.filter((file) => file.path.startsWith('src/client/js-blocks/'));
  const repo = await services.repoService.createRepo({
    name: `benchmark-${scenario.id}-${randomUUID().slice(0, 8)}`,
    initialFiles: rootAndSharedFiles,
  });
  let headCommitId = repo.headCommitId;
  for (let offset = 0; offset < entryFiles.length; offset += 90) {
    const save = await services.runtimeCompileService.saveSource({
      repoId: repo.id,
      expectedHeadCommitId: headCommitId,
      message: `seed benchmark fixture ${offset / 90 + 1}`,
      files: entryFiles.slice(offset, offset + 90),
    });
    headCommitId = save.commit.id;
  }
  services.metrics.length = 0;
  return { repoId: repo.id, fixture };
}

async function collectScenario(
  services: CollectorServices,
  repository: ScenarioRepository,
  scenario: CompilePerformanceBenchmarkScenario,
  config: CompilePerformanceBenchmarkCollectorConfig,
): Promise<CompilePerformanceBenchmarkScenarioEvidence> {
  const cold = await collectRunGroup(services, repository, scenario, 'cold', config.coldRuns, 0);
  const hot = await collectRunGroup(services, repository, scenario, 'hot', config.hotRuns, config.coldRuns);
  return {
    scenarioId: scenario.id,
    coldRuns: cold.map((run) => run.summary),
    hotRuns: hot.map((run) => run.summary),
    coldOutcomes: cold.map((run) => run.outcome),
    hotOutcomes: hot.map((run) => run.outcome),
  };
}

async function collectRunGroup(
  services: CollectorServices,
  repository: ScenarioRepository,
  scenario: CompilePerformanceBenchmarkScenario,
  temperature: 'cold' | 'hot',
  runCount: number,
  mutationOffset: number,
): Promise<ScenarioRunResult[]> {
  const runs: ScenarioRunResult[] = [];
  for (let index = 1; index <= runCount; index += 1) {
    const mutation = createCompilePerformanceBenchmarkMutation(repository.fixture, scenario.id, mutationOffset + index);
    runs.push(await executeScenarioRun(services, repository, scenario, temperature, index, mutation));
  }
  return runs;
}

async function executeScenarioRun(
  services: CollectorServices,
  repository: ScenarioRepository,
  scenario: CompilePerformanceBenchmarkScenario,
  temperature: 'cold' | 'hot',
  iteration: number,
  mutation: CompilePerformanceBenchmarkMutation,
): Promise<ScenarioRunResult> {
  services.metrics.length = 0;
  if (scenario.id === 'medium-compile-failure') {
    return executeFailureRun(services, repository, temperature, iteration, mutation);
  }
  if (scenario.id === 'medium-concurrent-same-head') {
    return executeConcurrentRun(services, repository, temperature, iteration, mutation);
  }
  return executeSuccessfulRun(services, repository, temperature, iteration, mutation);
}

async function executeSuccessfulRun(
  services: CollectorServices,
  repository: ScenarioRepository,
  temperature: 'cold' | 'hot',
  iteration: number,
  mutation: CompilePerformanceBenchmarkMutation,
): Promise<ScenarioRunResult> {
  const beforeHead = (await services.repoService.getRepo(repository.repoId)).headCommitId;
  let successCount = 0;
  let rejectedCount = 0;
  let outdatedCount = 0;
  let failedCount = 0;
  try {
    await services.runtimeCompileService.saveSource({
      repoId: repository.repoId,
      expectedHeadCommitId: beforeHead,
      message: `benchmark ${temperature} ${iteration}`,
      files: mutation.primary,
    });
    successCount = 1;
  } catch (error) {
    ({ rejectedCount, outdatedCount, failedCount } = classifyRejectedRequest(error));
  }
  const afterHead = (await services.repoService.getRepo(repository.repoId)).headCommitId;
  const runtimeArtifactsVerified = successCount === 1 && (await verifyRuntimeArtifacts(services, repository.repoId));
  const referenceConsistencyVerified =
    successCount === 1 && (await verifyReferenceConsistency(services, repository.repoId));
  return {
    summary: selectSaveSummary(services.metrics, 'success'),
    outcome: {
      iteration,
      temperature,
      successCount,
      rejectedCount,
      outdatedCount,
      failedCount,
      headAdvanced: Boolean(beforeHead && afterHead && beforeHead !== afterHead),
      rollbackVerified: false,
      runtimeArtifactsVerified,
      referenceConsistencyVerified,
    },
  };
}

async function executeFailureRun(
  services: CollectorServices,
  repository: ScenarioRepository,
  temperature: 'cold' | 'hot',
  iteration: number,
  mutation: CompilePerformanceBenchmarkMutation,
): Promise<ScenarioRunResult> {
  const before = await capturePersistentState(services, repository.repoId);
  let rejectedCount = 0;
  let outdatedCount = 0;
  let failedCount = 0;
  try {
    await services.runtimeCompileService.saveSource({
      repoId: repository.repoId,
      expectedHeadCommitId: before.headCommitId,
      message: `benchmark rejected ${temperature} ${iteration}`,
      files: mutation.primary,
    });
  } catch (error) {
    ({ rejectedCount, outdatedCount, failedCount } = classifyRejectedRequest(error));
  }
  const after = await capturePersistentState(services, repository.repoId);
  return {
    summary: selectSaveSummary(services.metrics, 'rejected'),
    outcome: {
      iteration,
      temperature,
      successCount: 0,
      rejectedCount,
      outdatedCount,
      failedCount,
      headAdvanced: before.headCommitId !== after.headCommitId,
      rollbackVerified: JSON.stringify(before) === JSON.stringify(after),
      runtimeArtifactsVerified: true,
      referenceConsistencyVerified: true,
    },
  };
}

async function executeConcurrentRun(
  services: CollectorServices,
  repository: ScenarioRepository,
  temperature: 'cold' | 'hot',
  iteration: number,
  mutation: CompilePerformanceBenchmarkMutation,
): Promise<ScenarioRunResult> {
  const beforeHead = (await services.repoService.getRepo(repository.repoId)).headCommitId;
  const changes = [mutation.primary, mutation.concurrent || []];
  const saveRequest = (files: CompilePerformanceBenchmarkMutation['primary'], requestIndex: number) =>
    services.runtimeCompileService.saveSource({
      repoId: repository.repoId,
      expectedHeadCommitId: beforeHead,
      message: `benchmark concurrent ${temperature} ${iteration}/${requestIndex + 1}`,
      files,
    });
  const results =
    services.app.db.sequelize.getDialect() === 'sqlite'
      ? [await settle(saveRequest(changes[0], 0)), await settle(saveRequest(changes[1], 1))]
      : await Promise.allSettled(changes.map(saveRequest));
  let successCount = 0;
  let rejectedCount = 0;
  let outdatedCount = 0;
  let failedCount = 0;
  for (const result of results) {
    if (result.status === 'fulfilled') {
      successCount += 1;
      continue;
    }
    const classified = classifyRejectedRequest(result.reason);
    rejectedCount += classified.rejectedCount;
    outdatedCount += classified.outdatedCount;
    failedCount += classified.failedCount;
  }
  const afterHead = (await services.repoService.getRepo(repository.repoId)).headCommitId;
  const runtimeArtifactsVerified = successCount === 1 && (await verifyRuntimeArtifacts(services, repository.repoId));
  const referenceConsistencyVerified =
    successCount === 1 && (await verifyReferenceConsistency(services, repository.repoId));
  return {
    summary: selectSaveSummary(services.metrics, 'success'),
    outcome: {
      iteration,
      temperature,
      successCount,
      rejectedCount,
      outdatedCount,
      failedCount,
      headAdvanced: Boolean(beforeHead && afterHead && beforeHead !== afterHead),
      rollbackVerified: false,
      runtimeArtifactsVerified,
      referenceConsistencyVerified,
    },
  };
}

async function settle<T>(promise: Promise<T>): Promise<PromiseSettledResult<T>> {
  try {
    return { status: 'fulfilled', value: await promise };
  } catch (reason) {
    return { status: 'rejected', reason };
  }
}

function selectSaveSummary(
  summaries: LightExtensionCompileMetricsSummary[],
  preferredResult: LightExtensionCompileMetricsSummary['result'],
): LightExtensionCompileMetricsSummary {
  const saveSummaries = summaries.filter((summary) => summary.operation === 'saveSource');
  const selected = saveSummaries.find((summary) => summary.result === preferredResult) || saveSummaries.at(-1);
  if (!selected) {
    throw new Error(`Benchmark run did not emit a saveSource metrics summary for result ${preferredResult}`);
  }
  return selected;
}

function classifyRejectedRequest(error: unknown): {
  rejectedCount: number;
  outdatedCount: number;
  failedCount: number;
} {
  if (isLightExtensionError(error)) {
    if (error.code === 'LIGHT_EXTENSION_SOURCE_OUTDATED') {
      return { rejectedCount: 0, outdatedCount: 1, failedCount: 0 };
    }
    if (error.status >= 400 && error.status < 500) {
      return { rejectedCount: 1, outdatedCount: 0, failedCount: 0 };
    }
  }
  return { rejectedCount: 0, outdatedCount: 0, failedCount: 1 };
}

async function verifyRuntimeArtifacts(services: CollectorServices, repoId: string): Promise<boolean> {
  const repo = await services.repoService.getRepo(repoId);
  const entries = await services.app.db.getRepository('lightExtensionEntries').find({
    filter: { repoId, healthStatus: 'ready' },
    sort: ['entryName'],
  });
  if (entries.length === 0 || entries.some((entry) => entry.get('compiledCommitId') !== repo.headCommitId)) {
    return false;
  }
  for (const entry of entries) {
    const artifactHash = entry.get('artifactHash');
    if (typeof artifactHash !== 'string') {
      return false;
    }
    const artifact = await services.runtimeResolveService.getArtifact(artifactHash);
    if (artifact.runtimeCodeHash !== entry.get('runtimeCodeHash') || artifact.version !== entry.get('runtimeVersion')) {
      return false;
    }
  }
  return true;
}

async function verifyReferenceConsistency(services: CollectorServices, repoId: string): Promise<boolean> {
  const references = await services.app.db.getRepository('lightExtensionReferences').find({ filter: { repoId } });
  return references.every((reference) => reference.get('resolvedStatus') === 'active');
}

async function capturePersistentState(services: CollectorServices, repoId: string) {
  const repo = await services.repoService.getRepo(repoId);
  const entries = await services.app.db.getRepository('lightExtensionEntries').find({
    filter: { repoId },
    sort: ['entryName'],
  });
  const artifacts = await services.app.db.getRepository('lightExtensionRuntimeArtifacts').find({
    fields: ['artifactHash'],
    sort: ['artifactHash'],
  });
  const references = await services.app.db.getRepository('lightExtensionReferences').find({
    filter: { repoId },
    fields: ['id', 'entryId', 'resolvedStatus', 'settingsHash'],
    sort: ['id'],
  });
  return {
    headCommitId: repo.headCommitId,
    entries: entries.map((entry) => ({
      id: entry.get('id'),
      compiledCommitId: entry.get('compiledCommitId'),
      artifactHash: entry.get('artifactHash'),
      runtimeCodeHash: entry.get('runtimeCodeHash'),
      healthStatus: entry.get('healthStatus'),
    })),
    artifactHashes: artifacts.map((artifact) => artifact.get('artifactHash')),
    references: references.map((reference) => reference.toJSON()),
  };
}

function scenarioOutcomes(
  scenarios: CompilePerformanceBenchmarkScenarioEvidence[],
  scenarioId: CompilePerformanceBenchmarkScenarioEvidence['scenarioId'],
): CompilePerformanceBenchmarkRunOutcome[] {
  const scenario = scenarios.find((candidate) => candidate.scenarioId === scenarioId);
  return [...(scenario?.coldOutcomes || []), ...(scenario?.hotOutcomes || [])];
}

async function dependencyFingerprint(): Promise<string> {
  return sha256(await readFile('yarn.lock'));
}

function machineFingerprint(): string {
  return sha256(Buffer.from(JSON.stringify([platform(), arch(), cpus()[0]?.model || 'unknown'])));
}

function databaseConfigurationFingerprint(dialect: string): string {
  return sha256(
    Buffer.from(
      JSON.stringify({
        dialect,
        host: process.env.DB_HOST || '',
        port: process.env.DB_PORT || '',
        database: process.env.DB_DATABASE || process.env.DB_STORAGE || '',
        underscored: process.env.DB_UNDERSCORED || '',
        timezone: process.env.DB_TIMEZONE || '',
      }),
    ),
  );
}

async function databaseVersion(app: MockServer, dialect: 'sqlite' | 'postgres'): Promise<string> {
  const sql =
    dialect === 'sqlite' ? 'select sqlite_version() as version' : "select current_setting('server_version') as version";
  const [rows] = await app.db.sequelize.query(sql);
  if (Array.isArray(rows) && rows.length > 0 && isRecord(rows[0])) {
    const version = rows[0].version || rows[0].server_version;
    if (typeof version === 'string') {
      return version;
    }
  }
  throw new Error(`Unable to read ${dialect} database version`);
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
