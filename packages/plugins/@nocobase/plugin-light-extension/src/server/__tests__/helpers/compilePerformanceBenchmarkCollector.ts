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
import type { IDatabaseOptions } from '@nocobase/database';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { arch, cpus, platform } from 'node:os';

import { isLightExtensionError } from '../../../shared/errors';
import type { LightExtensionCompileMetricsSummary } from '../../../shared/compileMetrics';
import PluginLightExtensionServer from '../../plugin';
import { LightExtensionAuditService } from '../../services/LightExtensionAuditService';
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
import { SaveSqlQueryMeter, type SequelizeQueryHooks } from './compilePerformanceSqlMeter';

interface CollectorContext {
  app: MockServer;
  auditService: LightExtensionAuditService;
  permissionService: LightExtensionPermissionService;
  repoService: LightExtensionRepoService;
  fileService: LightExtensionFileService;
  entryService: LightExtensionEntryService;
  sqlMeter: SaveSqlQueryMeter;
}

interface CollectorServices extends CollectorContext {
  runtimeCompileService: LightExtensionRuntimeCompileService;
  runtimeResolveService: RuntimeResolveService;
  metrics: LightExtensionCompileMetricsSummary[];
  compileWorkerPool?: { shutdown(): Promise<void> };
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
  const scenarios: CompilePerformanceBenchmarkScenarioEvidence[] = [];
  let databaseDialect: 'sqlite' | 'postgres' | undefined;
  let measuredDatabaseVersion: string | undefined;
  let measuredDatabaseConfigurationFingerprint: string | undefined;
  for (const scenario of createCompilePerformanceBenchmarkMatrix()) {
    const repository = await seedScenarioWithFreshApp(scenario);
    const measuredContext = await createCollectorContext(true);
    try {
      const currentDialect = measuredContext.app.db.sequelize.getDialect();
      if (currentDialect !== 'sqlite' && currentDialect !== 'postgres') {
        throw new Error(`Compile performance collector supports sqlite and postgres, received ${currentDialect}`);
      }
      databaseDialect = databaseDialect || currentDialect;
      if (databaseDialect !== currentDialect) {
        throw new Error(`Compile performance collector database dialect changed during collection`);
      }
      measuredDatabaseVersion = measuredDatabaseVersion || (await databaseVersion(measuredContext.app, currentDialect));
      measuredDatabaseConfigurationFingerprint =
        measuredDatabaseConfigurationFingerprint ||
        (await databaseConfigurationFingerprint(measuredContext.app, currentDialect));
      const measuredServices = await createRuntimeServices(measuredContext, config.productionWorkerPath);
      try {
        scenarios.push(await collectScenario(measuredServices, repository, scenario, config));
      } finally {
        await measuredServices.compileWorkerPool?.shutdown();
      }
    } finally {
      await disposeCollectorContext(measuredContext);
    }
  }

  if (!databaseDialect || !measuredDatabaseVersion || !measuredDatabaseConfigurationFingerprint) {
    throw new Error('Compile performance collector did not capture a measured database environment');
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
      databaseVersion: measuredDatabaseVersion,
      databaseConfigurationFingerprint: measuredDatabaseConfigurationFingerprint,
      compileExecutionPath: config.productionWorkerPath ? 'production-worker' : 'direct',
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
    revision: config.revision,
    sourceCommit: config.sourceCommit,
    harnessCommit: config.harnessCommit,
    databaseDialect,
    configuredRuns: { cold: config.coldRuns, hot: config.hotRuns },
    dataset,
  });
}

async function seedScenarioWithFreshApp(scenario: CompilePerformanceBenchmarkScenario): Promise<ScenarioRepository> {
  const context = await createCollectorContext();
  try {
    const services = await createRuntimeServices(context, false);
    const cacheControl = services.runtimeCompileService as LightExtensionRuntimeCompileService & {
      clearCompileCache?: () => Promise<void>;
    };
    if (cacheControl.clearCompileCache) {
      await cacheControl.clearCompileCache();
    }
    return await seedScenarioRepository(services, scenario);
  } finally {
    await disposeCollectorContext(context);
  }
}

async function disposeCollectorContext(context: CollectorContext): Promise<void> {
  context.sqlMeter.dispose();
  await context.app.destroy();
}

async function createCollectorContext(skipInstall = false): Promise<CollectorContext> {
  const testPrefix = process.env.DB_TEST_PREFIX;
  delete process.env.DB_TEST_PREFIX;
  let app: MockServer;
  try {
    app = await createMockServer({
      database: benchmarkDatabaseOptions(),
      plugins: [PluginVscFileServer, PluginLightExtensionServer],
      skipInstall,
    });
  } finally {
    if (typeof testPrefix === 'string') {
      process.env.DB_TEST_PREFIX = testPrefix;
    }
  }
  if (app.db.sequelize.getDialect() === 'sqlite') {
    // Full acceptance runs keep one SQLite database alive for hundreds of Save operations. WAL prevents long-lived
    // readers from starving the audit transaction used by rejected/outdated scenarios, while busy_timeout lets the
    // single writer finish instead of surfacing an environment-only SQLITE_BUSY failure.
    await app.db.sequelize.query('PRAGMA journal_mode = WAL');
    await app.db.sequelize.query('PRAGMA busy_timeout = 60000');
  }
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
  const sqlMeter = new SaveSqlQueryMeter(app.db.sequelize as unknown as SequelizeQueryHooks);
  return { app, auditService, permissionService, repoService, fileService, entryService, sqlMeter };
}

function benchmarkDatabaseOptions(): IDatabaseOptions {
  return {
    dialect: (process.env.DB_DIALECT || 'sqlite') as IDatabaseOptions['dialect'],
    storage: process.env.DB_STORAGE,
    database: process.env.DB_DATABASE,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    schema: process.env.DB_SCHEMA,
    timezone: process.env.DB_TIMEZONE,
    underscored: process.env.DB_UNDERSCORED === 'true',
  };
}

async function createRuntimeServices(
  context: CollectorContext,
  productionWorkerPath: boolean,
): Promise<CollectorServices> {
  const compilerBridge = new LightExtensionWorkspaceCompilerBridge(context.auditService, context.permissionService);
  const metrics: LightExtensionCompileMetricsSummary[] = [];
  const compileWorkerPool = productionWorkerPath ? await createProductionCompileWorkerPool() : undefined;
  const runtimeCompileService = new LightExtensionRuntimeCompileService(
    context.app.db,
    context.fileService,
    context.entryService,
    compilerBridge,
    (summary) => {
      metrics.push(summary);
    },
    compileWorkerPool ? { compileWorkerPool } : {},
  );
  runtimeCompileService.useReferenceService(
    new ReferenceService(context.app.db, context.auditService, context.permissionService),
  );
  return {
    ...context,
    runtimeCompileService,
    runtimeResolveService: new RuntimeResolveService(context.app.db),
    metrics,
    ...(compileWorkerPool ? { compileWorkerPool } : {}),
  };
}

async function createProductionCompileWorkerPool(): Promise<{ shutdown(): Promise<void> }> {
  const moduleUrl = new URL('../../services/LightExtensionCompileWorkerPool.ts', import.meta.url).href;
  const workerModule = (await import(/* @vite-ignore */ moduleUrl)) as {
    LightExtensionCompileWorkerPool?: new () => { shutdown(): Promise<void> };
    default?: { LightExtensionCompileWorkerPool?: new () => { shutdown(): Promise<void> } };
  };
  const WorkerPool =
    workerModule.LightExtensionCompileWorkerPool || workerModule.default?.LightExtensionCompileWorkerPool;
  if (!WorkerPool) {
    throw new Error('Production LightExtensionCompileWorkerPool is unavailable in this source revision');
  }
  return new WorkerPool();
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
  const capture = await services.sqlMeter.capture(() =>
    services.runtimeCompileService.saveSource({
      repoId: repository.repoId,
      expectedHeadCommitId: beforeHead,
      message: `benchmark ${temperature} ${iteration}`,
      files: mutation.primary,
    }),
  );
  if (!capture.error) {
    successCount = 1;
  } else {
    ({ rejectedCount, outdatedCount, failedCount } = classifyRejectedRequest(capture.error));
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
      sql: capture.sql,
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
  const capture = await services.sqlMeter.capture(() =>
    services.runtimeCompileService.saveSource({
      repoId: repository.repoId,
      expectedHeadCommitId: before.headCommitId,
      message: `benchmark rejected ${temperature} ${iteration}`,
      files: mutation.primary,
    }),
  );
  if (capture.error) {
    ({ rejectedCount, outdatedCount, failedCount } = classifyRejectedRequest(capture.error));
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
      sql: capture.sql,
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
  const capture = await services.sqlMeter.capture(() =>
    services.app.db.sequelize.getDialect() === 'sqlite'
      ? settleSequentially(changes.map((files, index) => () => saveRequest(files, index)))
      : Promise.allSettled(changes.map(saveRequest)),
  );
  const results = capture.value || [];
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
      sql: capture.sql,
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

async function settleSequentially<T>(requests: Array<() => Promise<T>>): Promise<Array<PromiseSettledResult<T>>> {
  const results: Array<PromiseSettledResult<T>> = [];
  for (const request of requests) {
    results.push(await settle(request()));
  }
  return results;
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

async function databaseConfigurationFingerprint(app: MockServer, dialect: string): Promise<string> {
  const dialectConfiguration =
    dialect === 'sqlite'
      ? {
          storageMode: process.env.DB_STORAGE === ':memory:' ? 'memory' : 'file',
          pragmas: {
            journalMode: await sqlitePragma(app, 'journal_mode'),
            busyTimeout: await sqlitePragma(app, 'busy_timeout'),
            synchronous: await sqlitePragma(app, 'synchronous'),
            cacheSize: await sqlitePragma(app, 'cache_size'),
            tempStore: await sqlitePragma(app, 'temp_store'),
          },
        }
      : {
          host: process.env.DB_HOST || '',
          port: process.env.DB_PORT || '',
          database: process.env.DB_DATABASE || '',
          schema: process.env.DB_SCHEMA || '',
          user: process.env.DB_USER || '',
          timezone: process.env.DB_TIMEZONE || '',
          tablePrefix: process.env.DB_TABLE_PREFIX || '',
          ssl: {
            mode: process.env.DB_DIALECT_OPTIONS_SSL_MODE || '',
            rejectUnauthorized: process.env.DB_DIALECT_OPTIONS_SSL_REJECT_UNAUTHORIZED || '',
            caConfigured: Boolean(process.env.DB_DIALECT_OPTIONS_SSL_CA),
            keyConfigured: Boolean(process.env.DB_DIALECT_OPTIONS_SSL_KEY),
            certConfigured: Boolean(process.env.DB_DIALECT_OPTIONS_SSL_CERT),
          },
          pool: {
            max: process.env.DB_POOL_MAX || '',
            min: process.env.DB_POOL_MIN || '',
            idle: process.env.DB_POOL_IDLE || '',
            acquire: process.env.DB_POOL_ACQUIRE || '',
            evict: process.env.DB_POOL_EVICT || '',
            maxUses: process.env.DB_POOL_MAX_USES || '',
          },
        };
  return sha256(
    Buffer.from(
      JSON.stringify({
        dialect,
        underscored: process.env.DB_UNDERSCORED || '',
        configuration: dialectConfiguration,
      }),
    ),
  );
}

async function sqlitePragma(app: MockServer, pragma: string): Promise<string | number> {
  const [rows] = await app.db.sequelize.query(`PRAGMA ${pragma}`);
  if (!Array.isArray(rows) || rows.length === 0 || !isRecord(rows[0])) {
    throw new Error(`Unable to read SQLite PRAGMA ${pragma}`);
  }
  const value = Object.values(rows[0])[0];
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`SQLite PRAGMA ${pragma} returned an unsupported value`);
  }
  return value;
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
