/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import {
  buildRunJSArtifactHash,
  buildRunJSRuntimeCodeHash,
  isRunJSEntryDependencyManifestPersistable,
  sha256Hex,
  stableSerialize,
  validateRunJSEntryDependencyManifest,
  type RunJSEntryDependencyManifestV1,
  type RunJSRuntimeArtifact,
} from '@nocobase/runjs';
import { buildRunJSEntryDependencyManifestFromGraph } from '@nocobase/runjs/compiler';
import { randomUUID } from 'crypto';
import { serialize } from 'node:v8';
import { posix as pathPosix } from 'path';

import {
  LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
  LIGHT_EXTENSION_SUPPORTED_KINDS,
  type LightExtensionKind,
} from '../../constants';
import { LightExtensionError } from '../../shared/errors';
import type {
  LightExtensionDiagnostic,
  LightExtensionEntryRecord,
  LightExtensionSaveSourceInput,
  LightExtensionSaveSourceResult,
} from '../../shared/types';
import {
  createAffectedEntryCompilePlan,
  type AffectedEntryPathChange,
  type CompilePlan,
  type EntryPlanSnapshot,
} from './AffectedEntryCompilePlanner';
import {
  entryFromModel,
  LightExtensionEntryService,
  type LightExtensionEntryReconcilePlan,
  type LightExtensionPreparedEntries,
} from './LightExtensionEntryService';
import {
  classifyLightExtensionCompileMetricsError,
  combineLightExtensionCompileMetricsRecorders,
  LightExtensionCompileMetricsProbe,
  type LightExtensionCompileMetricsCollector,
} from './LightExtensionCompileMetrics';
import {
  LightExtensionFileService,
  type LightExtensionPreparedSourceCandidate,
  type LightExtensionReplaceSourceSnapshotInput,
} from './LightExtensionFileService';
import {
  buildLightExtensionCompileKey,
  type CompileDecision,
  type CompileInputManifest,
  type LightExtensionCompileKeyResult,
} from './LightExtensionCompileKey';
import {
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  type LightExtensionCompilerBuildIdentity,
} from './LightExtensionCompileContract';
import { assertPreparedCandidateWorkspace, type PreparedCandidateWorkspace } from './PreparedCandidateWorkspace';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import {
  type LightExtensionCompileJob,
  type LightExtensionCompileResult,
  type LightExtensionCompileSuccessResult,
} from './LightExtensionCompileWorkerProtocol';
import { executeLightExtensionCompileJob } from './LightExtensionCompileJobExecutor';
import { LightExtensionCompileWorkerPool } from './LightExtensionCompileWorkerPool';
import {
  LightExtensionPreviewTicketVerifier,
  type LightExtensionPreviewTicketVerification,
} from './LightExtensionPreviewTicket';
import { createReferenceRefreshPlan, type ReferenceRefreshPlan } from './ReferenceRefreshPlanner';
import { PublishCompiledEntriesService } from './PublishCompiledEntriesService';
import {
  LightExtensionTrustedCompileCacheService,
  type TrustedCompileArtifact,
} from './LightExtensionTrustedCompileCacheService';
import { sortDiagnostics } from './LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from './LightExtensionWorkspaceCompilerBridge';

type ReferenceRefreshService = {
  refreshReferencesForRepo: (repoId: string, ctx?: LightExtensionServiceContext) => Promise<void>;
  refreshReferences?: (
    input: { repoId: string; plan: ReferenceRefreshPlan },
    ctx?: LightExtensionServiceContext,
  ) => Promise<unknown>;
};

interface RuntimeCompileSourceFile {
  path: string;
  content?: string;
  blobHash: string;
  language?: string;
  mode?: string;
}

interface PreparedEntryCompileInput extends LightExtensionCompileKeyResult {
  entry: LightExtensionEntryRecord;
  compileFiles: Array<{
    path: string;
    content?: string;
    blobHash: string;
    language?: string;
    mode?: string;
  }>;
  affected: boolean;
}

interface TrustedCompileCacheHit {
  artifactHash: string;
  runtimeCodeHash: string;
  code: string;
  sourceMap?: string;
  version: string;
  artifactFilesHash: string;
  diagnostics: LightExtensionDiagnostic[];
  compiledAt: Date;
  dependencyManifest?: RunJSEntryDependencyManifestV1;
  dependencyManifestHash?: string;
}

interface TrustedCompileCacheLookup {
  hits: Map<string, TrustedCompileCacheHit>;
  corruptKeys: Set<string>;
}

interface PreparedCompileResults {
  results: LightExtensionCompileResult[];
  executions: Map<string, 'compiled' | 'reused'>;
  compiledEntryCount: number;
}

export interface LightExtensionRuntimeCompileServiceOptions {
  compileCacheEnabled?: boolean;
  compilerBuildIdentity?: LightExtensionCompilerBuildIdentity;
  trustedCompileCache?: LightExtensionTrustedCompileCacheService;
  previewTicketVerifier?: LightExtensionPreviewTicketVerifier;
  compileWorkerPool?: LightExtensionCompileWorkerPool;
  publishCompiledEntries?: PublishCompiledEntriesService;
}

export interface LightExtensionPreparedSave {
  readonly candidate: LightExtensionPreparedSourceCandidate;
  readonly entryPlan: LightExtensionEntryReconcilePlan;
  readonly compilePlan: CompilePlan;
  readonly compileResults: readonly LightExtensionCompileSuccessResult[];
  readonly compileEntries: LightExtensionSaveSourceResult['compile']['entries'];
  readonly diagnostics: readonly LightExtensionDiagnostic[];
  readonly referencePlan: ReferenceRefreshPlan;
  readonly previewTicketToConsume?: string;
  readonly compiledEntryCount: number;
}

export interface LightExtensionRemoteSnapshotCompileResult {
  repo: LightExtensionSaveSourceResult['repo'];
  commitId: string;
  contentHash: string;
  changed: boolean;
  compile: LightExtensionSaveSourceResult['compile'];
  diagnostics: LightExtensionDiagnostic[];
}

export class LightExtensionRuntimeCompileService {
  private referenceService?: ReferenceRefreshService;

  private compileCacheEnabled: boolean;

  private readonly compilerBuildIdentity: LightExtensionCompilerBuildIdentity;

  private readonly trustedCompileCache: LightExtensionTrustedCompileCacheService;

  private readonly previewTicketVerifier?: LightExtensionPreviewTicketVerifier;

  private readonly compileWorkerPool?: LightExtensionCompileWorkerPool;

  private readonly publishCompiledEntries: PublishCompiledEntriesService;

  private readonly preparedSaves = new WeakSet<object>();

  constructor(
    private readonly db: Database,
    private readonly fileService: LightExtensionFileService,
    private readonly entryService: LightExtensionEntryService,
    private readonly compilerBridge: LightExtensionWorkspaceCompilerBridge,
    private readonly metricsCollector?: LightExtensionCompileMetricsCollector,
    options: LightExtensionRuntimeCompileServiceOptions = {},
  ) {
    this.compileCacheEnabled =
      options.compileCacheEnabled ?? process.env.LIGHT_EXTENSION_COMPILE_CACHE_ENABLED !== 'false';
    this.compilerBuildIdentity =
      options.compilerBuildIdentity ||
      (typeof compilerBridge.getCompilerBuildIdentity === 'function'
        ? compilerBridge.getCompilerBuildIdentity()
        : LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY);
    this.trustedCompileCache = options.trustedCompileCache || new LightExtensionTrustedCompileCacheService(db);
    this.previewTicketVerifier = options.previewTicketVerifier;
    this.compileWorkerPool = options.compileWorkerPool;
    this.publishCompiledEntries = options.publishCompiledEntries || PublishCompiledEntriesService.forDatabase(db);
  }

  useReferenceService(referenceService: ReferenceRefreshService): void {
    this.referenceService = referenceService;
  }

  setCompileCacheEnabled(enabled: boolean): void {
    this.compileCacheEnabled = enabled;
  }

  isCompileCacheEnabled(): boolean {
    return this.compileCacheEnabled;
  }

  async clearCompileCache(ctx: LightExtensionServiceContext = {}): Promise<void> {
    await this.db.getRepository('lightExtensionCompileCache').destroy({
      truncate: true,
      transaction: ctx.transaction,
    });
  }

  async saveSource(
    input: LightExtensionSaveSourceInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionSaveSourceResult> {
    const probe = new LightExtensionCompileMetricsProbe('saveSource', this.metricsCollector);
    const compileMetrics = combineLightExtensionCompileMetricsRecorders(ctx.compileMetrics, probe);
    const deferredRejectedPushAudits: Array<() => Promise<void>> = [];
    const operationContext: LightExtensionServiceContext = {
      ...ctx,
      compileMetrics,
    };
    if (ctx.transaction) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        'saveSource cannot compile inside an existing transaction; use prepareSaveSource and publishPreparedSave',
      );
    }
    operationContext.deferredRejectedPushAudits = deferredRejectedPushAudits;
    compileMetrics?.set('changedFileCount', input.files.length);
    let result: 'success' | 'rejected' | 'failed' | 'outdated' = 'failed';
    try {
      const prepared = await probe.measureAsync('prepare', () => this.prepareSaveSource(input, operationContext));
      const save = await probe.measureAsync('transaction', () =>
        this.db.sequelize.transaction((transaction) =>
          this.publishPreparedSave(prepared, {
            ...operationContext,
            transaction,
          }),
        ),
      );
      result = 'success';
      return save;
    } catch (error) {
      result = classifyLightExtensionCompileMetricsError(error);
      for (const recordRejectedPush of deferredRejectedPushAudits) {
        await recordRejectedPush();
      }
      throw error;
    } finally {
      await probe.finish(result);
    }
  }

  async prepareSaveSource(
    input: LightExtensionSaveSourceInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionPreparedSave> {
    const probe = new LightExtensionCompileMetricsProbe('runtimeCompile', this.metricsCollector);
    const compileMetrics = combineLightExtensionCompileMetricsRecorders(ctx.compileMetrics, probe);
    let result: 'success' | 'rejected' | 'failed' | 'outdated' = 'failed';
    try {
      const prepared = await this.prepareSaveSourceInternal(input, { ...ctx, compileMetrics });
      result = 'success';
      return prepared;
    } catch (error) {
      result = classifyLightExtensionCompileMetricsError(error);
      throw error;
    } finally {
      await probe.finish(result);
    }
  }

  private async prepareSaveSourceInternal(
    input: LightExtensionSaveSourceInput,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionPreparedSave> {
    if (ctx.transaction) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        'Save preparation must run outside a database transaction',
      );
    }
    const candidate = await this.fileService.prepareSourceCandidate(
      {
        ...input,
        allowEmptyCommit: false,
      },
      ctx,
    );
    const entryPlan = await this.entryService.planReconcileEntries(
      candidate.repo.id,
      candidate.validation.entries,
      candidate.expectedHeadCommitId,
    );
    const preparedEntries: LightExtensionPreparedEntries = {
      repo: candidate.repo,
      commitId: candidate.expectedHeadCommitId || '',
      diagnostics: sortDiagnostics(candidate.validation.diagnostics),
      entries: entryPlan.result.entries,
      reconcile: entryPlan.result,
    };
    const compilePlan = createCompilePlan(
      preparedEntries,
      candidate.vscPreparedPush.candidate.changedPaths,
      this.compilerBuildIdentity.compilerBuildId,
      candidate.vscPreparedPush.candidate.changes.map((change) => ({
        path: change.path,
        operation: change.kind,
      })),
    );
    const readyInputs = prepareEntryCompileInputs(
      preparedEntries.entries,
      candidate.vscPreparedPush.candidate.files,
      compilePlan,
      this.compilerBuildIdentity,
    );
    ctx.compileMetrics?.set('entryCount', preparedEntries.entries.length);
    ctx.compileMetrics?.set('affectedEntryCount', compilePlan.metrics.affectedEntryCount);
    recordDependencyPlanMetrics(compilePlan, ctx.compileMetrics);
    const ticketVerification = await this.verifyPreviewTicket(input, candidate, readyInputs, entryPlan, ctx);
    const compilePreparation = await this.prepareCompileResults(
      candidate.repo.id,
      readyInputs,
      ticketVerification,
      ctx,
    );
    const diagnostics = sortDiagnostics([
      ...preparedEntries.diagnostics,
      ...compilePreparation.results.flatMap((entry) => entry.diagnostics),
    ]);
    const failures = compilePreparation.results.filter((entry) => !entry.accepted);
    if (failures.length > 0) {
      throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Light extension source cannot be compiled', {
        status: 422,
        details: {
          repoId: candidate.repo.id,
          diagnostics,
          entries: failures.map(toFailedCompileEntryResult),
        },
      });
    }
    const successfulResults = compilePreparation.results as LightExtensionCompileSuccessResult[];
    const compileEntries = successfulResults.map((entry) =>
      toSuccessfulCompileEntryResult(entry, compilePreparation.executions.get(entry.entryId) || 'compiled'),
    );
    const runtimeAvailability = entryPlan.result.changes.map((change) => ({
      entryId: change.entry.id,
      beforeUsable: Boolean(change.before?.runtimeUsable),
      afterUsable:
        change.entry.healthStatus === 'ready' && successfulResults.some((item) => item.entryId === change.entry.id),
    }));
    const referencePlan = createReferenceRefreshPlan({
      compilePlan,
      reconcileResult: entryPlan.result,
      runtimeAvailability,
    });
    const prepared: LightExtensionPreparedSave = Object.freeze({
      candidate,
      entryPlan,
      compilePlan,
      compileResults: Object.freeze(successfulResults.map((entry) => Object.freeze(entry))),
      compileEntries: Object.freeze(compileEntries),
      diagnostics: Object.freeze(diagnostics),
      referencePlan: Object.freeze(referencePlan),
      ...(ticketVerification.status === 'hit' ? { previewTicketToConsume: ticketVerification.ticket } : {}),
      compiledEntryCount: compilePreparation.compiledEntryCount,
    });
    this.preparedSaves.add(prepared);
    return prepared;
  }

  async publishPreparedSave(
    prepared: LightExtensionPreparedSave,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionSaveSourceResult> {
    const transaction = ctx.transaction;
    if (!transaction) {
      throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', 'A transaction is required to publish a save');
    }
    if (!prepared || !this.preparedSaves.has(prepared)) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        'Prepared save must be created by this runtime compile service instance',
      );
    }
    if (prepared.previewTicketToConsume && this.previewTicketVerifier) {
      transaction.afterCommit(() => this.consumePreviewTicketBestEffort(prepared.previewTicketToConsume as string));
    }
    const candidate = await this.fileService.publishSourceCandidate(prepared.candidate, ctx);
    await this.entryService.publishReconcilePlan(prepared.entryPlan, transaction);
    await this.publishCompiledEntries.publishCompiledEntries(
      {
        commitId: candidate.commit.id,
        results: prepared.compileResults,
      },
      transaction,
    );
    await this.db.getRepository('lightExtensionRepos').update({
      filterByTk: candidate.repo.id,
      values: {
        healthStatus: 'ready',
        ...(prepared.compiledEntryCount > 0 ? { lastCompiledAt: new Date() } : {}),
      },
      transaction,
    });
    if (this.referenceService?.refreshReferences) {
      await this.referenceService.refreshReferences({ repoId: candidate.repo.id, plan: prepared.referencePlan }, ctx);
    } else if (prepared.referencePlan.mode !== 'skip') {
      await this.referenceService?.refreshReferencesForRepo(candidate.repo.id, ctx);
    }
    await this.recordPublishedCompileAudits(prepared.compileResults, ctx);
    const [repo, entryModels] = await Promise.all([
      this.db.getRepository('lightExtensionRepos').findOne({ filterByTk: candidate.repo.id, transaction }),
      this.db.getRepository('lightExtensionEntries').find({ filter: { repoId: candidate.repo.id }, transaction }),
    ]);
    const entries = entryModels.map(entryFromModel);
    return {
      repo: withEntrySummary(repo ? repoFromModelLike(repo) : candidate.repo, entries),
      commit: candidate.commit,
      tree: candidate.tree,
      compile: {
        status: prepared.compileEntries.length === 0 ? 'skipped' : 'success',
        entries: prepared.compileEntries,
      },
      diagnostics: [...prepared.diagnostics],
    };
  }

  private async consumePreviewTicketBestEffort(ticket: string): Promise<void> {
    try {
      await this.previewTicketVerifier?.consumeAfterSuccessfulSave(ticket);
    } catch {
      // A cache failure after commit must not turn an already published Save into a client-visible failure.
    }
  }

  private async recordPublishedCompileAudits(
    results: readonly LightExtensionCompileSuccessResult[],
    ctx: LightExtensionServiceContext,
  ): Promise<void> {
    for (const result of results) {
      if (result.execution === 'reused') {
        continue;
      }
      await this.compilerBridge.recordPublishedRuntimeCompileAudit(
        {
          repoId: result.repoId,
          entryId: result.entryId,
          kind: result.kind,
          entryName: result.entryName,
          entryPath: result.entryPath,
          runtimeVersion: result.artifact.version,
          requestId: result.requestId,
          diagnostics: result.diagnostics,
          filesHash: result.artifact.filesHash,
          artifactEntryPath: result.artifact.entryPath,
        },
        ctx,
      );
    }
  }

  private async verifyPreviewTicket(
    input: LightExtensionSaveSourceInput,
    candidate: LightExtensionPreparedSourceCandidate,
    readyInputs: PreparedEntryCompileInput[],
    entryPlan: LightExtensionEntryReconcilePlan,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionPreviewTicketVerification> {
    if (!this.previewTicketVerifier) {
      if (input.requirePreviewTicket) {
        throw new LightExtensionError(
          'LIGHT_EXTENSION_PREVIEW_TICKET_INVALID',
          'A valid trusted preview ticket is required to save this light extension source',
          { status: 409, details: { reason: 'missing' } },
        );
      }
      return { status: 'miss', reason: 'not_provided' };
    }
    try {
      return await this.previewTicketVerifier.verify({
        previewTicket: input.previewTicket,
        requirePreviewTicket: input.requirePreviewTicket,
        repoId: candidate.repo.id,
        actorId: ctx.actorUserId,
        baseHeadCommitId: candidate.expectedHeadCommitId,
        workspaceDigest: candidate.vscPreparedPush.candidate.treeHash,
        compilerBuildId: this.compilerBuildIdentity.compilerBuildId,
        runtimeContract: LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
        entries: readyInputs.map((entry) => ({
          target: 'client',
          kind: entry.entry.kind as LightExtensionKind,
          entryName: entry.entry.entryName,
          entryId:
            entryPlan.result.changes.find((change) => change.entry.id === entry.entry.id)?.previousEntry?.id || null,
          entryPath: entry.entry.entryPath,
          compileKey: entry.compileKey,
          filesHash: entry.filesHash,
          inputManifest: entry.inputManifest,
        })),
      });
    } catch (error) {
      if (error instanceof LightExtensionError && error.code === 'LIGHT_EXTENSION_PREVIEW_TICKET_INVALID') {
        await this.assertPreparedCandidateHeadStillCurrent(candidate);
      }
      throw error;
    }
  }

  private async assertPreparedCandidateHeadStillCurrent(
    candidate: LightExtensionPreparedSourceCandidate,
  ): Promise<void> {
    const [repo, vscRepo] = await Promise.all([
      this.db.getRepository('lightExtensionRepos').findOne({ filterByTk: candidate.repo.id }),
      this.db.getRepository('vscFileRepositories').findOne({ filterByTk: candidate.repo.vscRepoId }),
    ]);
    const currentHeadCommitId = repo ? nullableString(repo.get('headCommitId')) : null;
    const currentVscHeadCommitId = vscRepo ? nullableString(vscRepo.get('headCommitId')) : null;
    if (
      currentHeadCommitId === candidate.expectedHeadCommitId &&
      currentVscHeadCommitId === candidate.expectedHeadCommitId
    ) {
      return;
    }
    throw new LightExtensionError(
      'LIGHT_EXTENSION_SOURCE_OUTDATED',
      'Light extension source changed after the workspace was opened',
      {
        details: {
          repoId: candidate.repo.id,
          expectedHeadCommitId: candidate.expectedHeadCommitId,
          currentHeadCommitId,
          currentVscHeadCommitId,
        },
      },
    );
  }

  private async prepareCompileResults(
    repoId: string,
    readyInputs: PreparedEntryCompileInput[],
    ticketVerification: LightExtensionPreviewTicketVerification,
    ctx: LightExtensionServiceContext,
  ): Promise<PreparedCompileResults> {
    const expectations = readyInputs.map((input) => ({
      compileKey: input.compileKey,
      filesHash: input.filesHash,
      inputManifest: input.inputManifest,
    }));
    const cacheLookup =
      ticketVerification.status === 'hit'
        ? {
            hits: ticketVerification.artifacts,
            missingKeys: new Set<string>(),
            corruptKeys: new Set<string>(),
          }
        : this.compileCacheEnabled
          ? await this.trustedCompileCache.loadVerified(expectations)
          : {
              hits: new Map<string, TrustedCompileArtifact>(),
              missingKeys: new Set<string>(),
              corruptKeys: new Set<string>(),
            };
    const executions = new Map<string, 'compiled' | 'reused'>();
    const results: Array<LightExtensionCompileResult | undefined> = new Array(readyInputs.length);
    const compileJobs: Array<{ index: number; input: PreparedEntryCompileInput; job: LightExtensionCompileJob }> = [];
    const requestId = ctx.requestId || randomUUID();
    const correlationId = randomUUID();

    readyInputs.forEach((input, index) => {
      const legacyEntryNeedsCompile = Boolean(input.entry.artifactHash && !input.entry.compiledInputKey);
      const cached =
        legacyEntryNeedsCompile && ticketVerification.status !== 'hit'
          ? undefined
          : cacheLookup.hits.get(input.compileKey);
      if (cached) {
        ctx.compileMetrics?.increment('compileCacheHitCount');
        ctx.compileMetrics?.increment('reusedEntryCount');
        executions.set(input.entry.id, 'reused');
        results[index] = createCompileResultFromTrustedArtifact(input, cached, requestId, correlationId, index);
        return;
      }
      if (cacheLookup.corruptKeys.has(input.compileKey)) {
        ctx.compileMetrics?.increment('compileCacheCorruptCount');
      }
      ctx.compileMetrics?.increment('compileCacheMissCount');
      const currentCacheMappingMissing =
        cacheLookup.missingKeys.has(input.compileKey) && input.entry.compiledInputKey === input.compileKey;
      const currentArtifact =
        input.affected ||
        !this.compileCacheEnabled ||
        cacheLookup.corruptKeys.has(input.compileKey) ||
        currentCacheMappingMissing
          ? undefined
          : buildTrustedArtifactFromCurrentEntry(input);
      if (currentArtifact) {
        ctx.compileMetrics?.increment('reusedEntryCount');
        executions.set(input.entry.id, 'reused');
        results[index] = createCompileResultFromTrustedArtifact(
          input,
          currentArtifact,
          requestId,
          correlationId,
          index,
        );
        return;
      }
      ctx.compileMetrics?.increment('compiledEntryCount');
      executions.set(input.entry.id, 'compiled');
      compileJobs.push({
        index,
        input,
        job: createCompileJob(input, {
          repoId,
          requestId,
          correlationId,
          ordinal: index,
          compilerBuildIdentity: this.compilerBuildIdentity,
        }),
      });
    });

    const compileWorkerPool = this.compileWorkerPool;
    if (compileWorkerPool) {
      const compiled = await Promise.all(compileJobs.map(({ job }) => compileWorkerPool.submitWithBackpressure(job)));
      for (const [position, result] of compiled.entries()) {
        const target = compileJobs[position];
        results[target.index] = result;
      }
    } else {
      // The non-worker compatibility path is intentionally serial so database-backed compile audit hooks remain safe
      // on SQLite. Production Save uses the bounded Worker Pool for parallel cache misses.
      for (const { index, job, input } of compileJobs) {
        results[index] = this.compilerBridge
          ? await this.compileEntryWithoutWorker(job, input, ctx)
          : await executeLightExtensionCompileJob({ job, workerId: 0, attempt: 1, executingThreadId: 0 });
      }
    }
    if (results.some((result) => !result)) {
      throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', 'Compile result aggregation is incomplete');
    }
    const compileResults = results as LightExtensionCompileResult[];
    recordDependencyGraphMetrics(compileResults, executions, ctx.compileMetrics);
    return {
      results: compileResults,
      executions,
      compiledEntryCount: compileJobs.length,
    };
  }

  private async compileEntryWithoutWorker(
    job: LightExtensionCompileJob,
    input: PreparedEntryCompileInput,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionCompileResult> {
    const compiled = await this.compilerBridge.compileEntry(
      {
        repoId: job.repoId,
        entryId: job.entryId,
        operation: 'runtimeCompile',
        kind: job.kind,
        entryName: job.entryName,
        entryPath: job.entryPath,
        runtimeVersion: job.runtimeVersion,
        files: input.compileFiles,
      },
      {
        ...ctx,
        deferSuccessfulCompileAudit: true,
      },
    );
    if (!compiled.accepted) {
      return {
        ...compileResultIdentity(job),
        accepted: false,
        diagnostics: compiled.diagnostics,
        failureCode: compiled.failureCode || 'compile_failed',
      };
    }
    const runtimeCodeHash = buildRunJSRuntimeCodeHash(compiled.artifact.code);
    const artifactHash = buildRunJSArtifactHash({
      code: compiled.artifact.code,
      sourceMap: compiled.artifact.sourceMap,
      version: compiled.artifact.version,
      entryPath: compiled.artifact.entryPath || job.entryPath,
      runtimeContract: job.inputManifest.runtimeContract,
    });
    if (!compiled.dependencyGraph) {
      throw new Error('RunJS compiler did not return a dependency graph for an accepted compile');
    }
    const dependency = buildRunJSEntryDependencyManifestFromGraph({
      compilerBuildId: job.compilerBuildIdentity.compilerBuildId,
      entryPath: job.entryPath,
      files: job.files,
      graph: compiled.dependencyGraph,
    });
    const persistDependencyManifest = isRunJSEntryDependencyManifestPersistable(dependency.manifest);
    return {
      ...compileResultIdentity(job),
      accepted: true,
      artifact: compiled.artifact,
      artifactHash,
      runtimeCodeHash,
      diagnostics: compiled.diagnostics,
      ...(persistDependencyManifest
        ? {
            dependencyManifest: dependency.manifest,
            dependencyManifestHash: dependency.manifestHash,
          }
        : {}),
    };
  }

  async replaceSourceSnapshot(
    input: LightExtensionReplaceSourceSnapshotInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionRemoteSnapshotCompileResult> {
    if (ctx.transaction) {
      return this.replaceSourceSnapshotInTransaction(input, ctx);
    }

    return this.db.sequelize.transaction((transaction) =>
      this.replaceSourceSnapshotInTransaction(input, { ...ctx, transaction }),
    );
  }

  private async replaceSourceSnapshotInTransaction(
    input: LightExtensionReplaceSourceSnapshotInput,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionRemoteSnapshotCompileResult> {
    const replacement = await this.fileService.replaceSourceSnapshot(input, ctx);
    const commitId = replacement.commit?.id || replacement.repo.headCommitId;
    if (!commitId) {
      throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', 'Light extension source has no commit after pull');
    }
    if (!replacement.changed) {
      return {
        repo: replacement.repo,
        commitId,
        contentHash: replacement.contentHash,
        changed: false,
        compile: { status: 'skipped', entries: [] },
        diagnostics: [],
      };
    }

    const compile = await this.compileCurrentRuntime(input.repoId, commitId, {
      ...ctx,
      requestSource: ctx.requestSource || 'light-extension-remote-pull',
    });
    await this.referenceService?.refreshReferencesForRepo(input.repoId, ctx);

    return {
      repo: compile.repo,
      commitId,
      contentHash: replacement.contentHash,
      changed: true,
      compile: {
        status: compile.status,
        entries: compile.entries,
      },
      diagnostics: sortDiagnostics(compile.diagnostics),
    };
  }

  async compilePreparedCandidate(
    candidate: PreparedCandidateWorkspace,
    ctx: LightExtensionServiceContext,
  ): Promise<
    Pick<LightExtensionSaveSourceResult['compile'], 'status' | 'entries'> & {
      repo: LightExtensionSaveSourceResult['repo'];
      diagnostics: LightExtensionDiagnostic[];
    }
  > {
    const transaction = ctx.transaction;
    if (!transaction) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        'A transaction is required to compile a prepared candidate workspace',
      );
    }

    const probe = new LightExtensionCompileMetricsProbe('runtimeCompile', this.metricsCollector);
    const compileMetrics = combineLightExtensionCompileMetricsRecorders(ctx.compileMetrics, probe);
    let result: 'success' | 'rejected' | 'failed' | 'outdated' = 'failed';
    try {
      const compile = await probe.measureAsync('transaction', () =>
        this.compilePreparedCandidateInTransaction(candidate, {
          ...ctx,
          compileMetrics,
          transaction,
        }),
      );
      result = 'success';
      return compile;
    } catch (error) {
      result = classifyLightExtensionCompileMetricsError(error);
      throw error;
    } finally {
      await probe.finish(result);
    }
  }

  async compileCurrentRuntime(
    repoId: string,
    commitId: string,
    ctx: LightExtensionServiceContext = {},
  ): Promise<
    Pick<LightExtensionSaveSourceResult['compile'], 'status' | 'entries'> & {
      repo: LightExtensionSaveSourceResult['repo'];
      diagnostics: LightExtensionDiagnostic[];
    }
  > {
    const probe = new LightExtensionCompileMetricsProbe('runtimeCompile', this.metricsCollector);
    const compileMetrics = combineLightExtensionCompileMetricsRecorders(ctx.compileMetrics, probe);
    let result: 'success' | 'rejected' | 'failed' | 'outdated' = 'failed';
    try {
      const compile = await probe.measureAsync('transaction', () => {
        if (ctx.transaction) {
          return this.compileCurrentRuntimeInTransaction(repoId, commitId, { ...ctx, compileMetrics });
        }

        return this.db.sequelize.transaction((transaction) =>
          this.compileCurrentRuntimeInTransaction(repoId, commitId, { ...ctx, compileMetrics, transaction }),
        );
      });
      result = 'success';
      return compile;
    } catch (error) {
      result = classifyLightExtensionCompileMetricsError(error);
      throw error;
    } finally {
      await probe.finish(result);
    }
  }

  private async compileCurrentRuntimeInTransaction(
    repoId: string,
    commitId: string,
    ctx: LightExtensionServiceContext,
  ): Promise<
    Pick<LightExtensionSaveSourceResult['compile'], 'status' | 'entries'> & {
      repo: LightExtensionSaveSourceResult['repo'];
      diagnostics: LightExtensionDiagnostic[];
    }
  > {
    const prepareEntries = () => this.entryService.prepareEntries(repoId, ctx);
    const prepared = ctx.compileMetrics
      ? await ctx.compileMetrics.measureAsync('treePrepare', prepareEntries)
      : await prepareEntries();
    if (prepared.commitId !== commitId) {
      throw new Error(
        `Light extension repository head changed before compile: expected=${commitId}, actual=${prepared.commitId}`,
      );
    }
    const pull = await this.fileService.pullCommit(
      {
        repoId,
        commitId,
        includeContent: 'all',
      },
      {
        ...ctx,
        requestSource: ctx.requestSource || 'light-extension-runtime-compile',
      },
    );

    return this.compilePreparedEntries(repoId, commitId, prepared, pull.files || [], ctx);
  }

  private async compilePreparedCandidateInTransaction(
    candidate: PreparedCandidateWorkspace,
    ctx: LightExtensionServiceContext,
  ): Promise<
    Pick<LightExtensionSaveSourceResult['compile'], 'status' | 'entries'> & {
      repo: LightExtensionSaveSourceResult['repo'];
      diagnostics: LightExtensionDiagnostic[];
    }
  > {
    const transaction = ctx.transaction;
    if (!transaction) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        'A transaction is required to compile a prepared candidate workspace',
      );
    }
    assertPreparedCandidateWorkspace(candidate, {
      transaction,
      repoId: candidate.repo.id,
      commitId: candidate.commit.id,
    });

    const prepareEntries = () => this.entryService.reconcilePreparedCandidate(candidate, ctx);
    const prepared = ctx.compileMetrics
      ? await ctx.compileMetrics.measureAsync('treePrepare', prepareEntries)
      : await prepareEntries();

    return this.compilePreparedEntries(
      candidate.repo.id,
      candidate.commit.id,
      prepared,
      candidate.files,
      ctx,
      candidate.changedPaths,
    );
  }

  private async compilePreparedEntries(
    repoId: string,
    commitId: string,
    prepared: LightExtensionPreparedEntries,
    files: readonly RuntimeCompileSourceFile[],
    ctx: LightExtensionServiceContext,
    changedPaths?: readonly string[],
  ): Promise<
    Pick<LightExtensionSaveSourceResult['compile'], 'status' | 'entries'> & {
      repo: LightExtensionSaveSourceResult['repo'];
      diagnostics: LightExtensionDiagnostic[];
    }
  > {
    const compileEntries: LightExtensionSaveSourceResult['compile']['entries'] = [];
    const buildPlan = () => createCompilePlan(prepared, changedPaths, this.compilerBuildIdentity.compilerBuildId);
    const compilePlan = ctx.compileMetrics ? ctx.compileMetrics.measure('compilePlan', buildPlan) : buildPlan();
    const readyInputs = prepareEntryCompileInputs(prepared.entries, files, compilePlan, this.compilerBuildIdentity);
    const skipRuntimeDecisions = createSkipRuntimeDecisions(prepared.entries);
    ctx.compileMetrics?.set('entryCount', prepared.entries.length);
    ctx.compileMetrics?.set('affectedEntryCount', compilePlan.metrics.affectedEntryCount);
    recordDependencyPlanMetrics(compilePlan, ctx.compileMetrics);
    ctx.compileMetrics?.set('skippedEntryCount', skipRuntimeDecisions.length);
    const trustedCache = this.compileCacheEnabled
      ? await this.loadTrustedCompileCache(readyInputs, ctx.transaction, ctx.compileMetrics)
      : { hits: new Map<string, TrustedCompileCacheHit>(), corruptKeys: new Set<string>() };
    let compiledEntryCount = 0;

    for (const input of readyInputs) {
      const { entry } = input;
      const legacyEntryNeedsCompile = Boolean(entry.artifactHash && !entry.compiledInputKey);
      const cached = legacyEntryNeedsCompile ? undefined : trustedCache.hits.get(input.compileKey);
      const decision = createCompileDecision(
        input,
        cached,
        this.compileCacheEnabled,
        trustedCache.corruptKeys.has(input.compileKey),
      );
      if (decision.decision === 'reuse' && cached) {
        ctx.compileMetrics?.increment('compileCacheHitCount');
        ctx.compileMetrics?.increment('reusedEntryCount');
        const persistReuse = () =>
          this.updateEntryRuntimePointer(
            {
              entry,
              commitId,
              compileKey: input.compileKey,
              inputManifest: input.inputManifest,
              artifact: cached,
            },
            ctx.transaction,
          );
        const persisted = ctx.compileMetrics
          ? await ctx.compileMetrics.measureAsync('artifactPersist', persistReuse)
          : await persistReuse();
        compileEntries.push(buildSuccessfulCompileEntryResult(persisted, cached, input.inputManifest, 'reused'));
        continue;
      }

      ctx.compileMetrics?.increment('compileCacheMissCount');
      ctx.compileMetrics?.increment('compiledEntryCount');
      compiledEntryCount += 1;
      const compileEntry = () =>
        this.compilerBridge.compileEntry(
          {
            repoId,
            entryId: entry.id,
            operation: 'runtimeCompile',
            kind: entry.kind as LightExtensionKind,
            entryName: entry.entryName,
            entryPath: entry.entryPath,
            runtimeVersion: input.inputManifest.runtimeVersion,
            files: input.compileFiles,
          },
          {
            ...ctx,
            requestSource: ctx.requestSource || 'light-extension-runtime-compile',
          },
        );
      const compiled = ctx.compileMetrics
        ? await ctx.compileMetrics.measureAsync('compileEntries', compileEntry)
        : await compileEntry();

      if (!compiled.accepted) {
        compileEntries.push({
          entryId: entry.id,
          entryName: entry.entryName,
          kind: entry.kind,
          entryPath: entry.entryPath,
          status: 'failed',
          diagnostics: compiled.diagnostics,
          failureCode: compiled.failureCode || 'compile_failed',
          execution: 'compiled',
        });
        continue;
      }
      if (!compiled.dependencyGraph) {
        throw new Error('RunJS compiler did not return a dependency graph for an accepted compile');
      }
      const dependency = buildRunJSEntryDependencyManifestFromGraph({
        compilerBuildId: input.inputManifest.compilerBuildId,
        entryPath: input.inputManifest.entryPath,
        files: input.compileFiles,
        graph: compiled.dependencyGraph,
      });
      recordDependencyManifestMetrics(dependency.manifest, ctx.compileMetrics);
      const persistDependencyManifest = isRunJSEntryDependencyManifestPersistable(dependency.manifest);

      const persistArtifact = () =>
        this.persistSuccessfulCompile(
          {
            entry,
            commitId,
            artifact: compiled.artifact,
            surfaceStyle: compiled.surface.surfaceStyle,
            diagnostics: compiled.diagnostics,
            compileKey: input.compileKey,
            filesHash: input.filesHash,
            inputManifest: input.inputManifest,
            dependencyManifest: persistDependencyManifest ? dependency.manifest : undefined,
            dependencyManifestHash: persistDependencyManifest ? dependency.manifestHash : undefined,
          },
          ctx.transaction,
          ctx.compileMetrics,
        );
      const persisted = ctx.compileMetrics
        ? await ctx.compileMetrics.measureAsync('artifactPersist', persistArtifact)
        : await persistArtifact();
      compileEntries.push({
        entryId: persisted.id,
        entryName: persisted.entryName,
        kind: persisted.kind,
        entryPath: persisted.entryPath,
        status: 'success',
        execution: 'compiled',
        diagnostics: compiled.diagnostics,
        artifact: {
          version: compiled.artifact.version,
          entryPath: compiled.artifact.entryPath,
          filesHash: compiled.artifact.filesHash,
          metadata: normalizeRecord(compiled.artifact.metadata),
        },
      });
    }

    const failedCount = compileEntries.filter((entry) => entry.status === 'failed').length;
    const diagnostics = sortDiagnostics([
      ...prepared.diagnostics,
      ...compileEntries.flatMap((entry) => entry.diagnostics),
    ]);
    if (failedCount > 0) {
      throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Light extension source cannot be compiled', {
        status: 422,
        details: {
          repoId,
          commitId,
          diagnostics,
          entries: compileEntries,
        },
      });
    }
    await this.db.getRepository('lightExtensionRepos').update({
      filterByTk: repoId,
      values: {
        healthStatus: 'ready',
        ...(compiledEntryCount > 0 ? { lastCompiledAt: new Date() } : {}),
      },
      transaction: ctx.transaction,
    });

    const repo = await this.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repoId,
      transaction: ctx.transaction,
    });

    return {
      repo: withEntrySummary(repo ? repoFromModelLike(repo) : prepared.repo, prepared.entries),
      status: compileEntries.length === 0 ? 'skipped' : 'success',
      entries: compileEntries,
      diagnostics,
    };
  }

  private async persistSuccessfulCompile(
    input: {
      entry: LightExtensionEntryRecord;
      commitId: string;
      artifact: RunJSRuntimeArtifact;
      surfaceStyle: string;
      diagnostics: LightExtensionDiagnostic[];
      compileKey?: string;
      filesHash?: string;
      inputManifest?: CompileInputManifest;
      dependencyManifest?: RunJSEntryDependencyManifestV1;
      dependencyManifestHash?: string;
    },
    transaction?: Transaction,
    compileMetrics?: LightExtensionServiceContext['compileMetrics'],
  ): Promise<LightExtensionEntryRecord> {
    const compiledAt = new Date();
    const runtimeCodeHash = buildRunJSRuntimeCodeHash(input.artifact.code);
    const entryPath = input.artifact.entryPath || input.entry.entryPath;
    const artifactHash = buildRunJSArtifactHash({
      code: input.artifact.code,
      sourceMap: input.artifact.sourceMap,
      version: input.artifact.version,
      entryPath,
      runtimeContract: LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
    });
    await this.db.getRepository('lightExtensionRuntimeArtifacts').updateOrCreate({
      filterKeys: ['artifactHash'],
      values: {
        artifactHash,
        runtimeCodeHash,
        code: input.artifact.code,
        sourceMap: input.artifact.sourceMap || null,
        version: input.artifact.version,
        entryPath,
        runtimeContract: LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
        byteSize:
          Buffer.byteLength(input.artifact.code, 'utf8') + Buffer.byteLength(input.artifact.sourceMap || '', 'utf8'),
      },
      transaction,
    });
    if (input.compileKey && input.filesHash && input.inputManifest) {
      const existing = await this.db.getRepository('lightExtensionCompileCache').findOne({
        filterByTk: input.compileKey,
        transaction,
      });
      if (existing && existing.get('artifactHash') !== artifactHash) {
        compileMetrics?.increment('compileCacheCorruptCount');
      }
      await this.db.getRepository('lightExtensionCompileCache').updateOrCreate({
        filterKeys: ['compileKey'],
        values: {
          compileKey: input.compileKey,
          artifactHash,
          compilerBuildId: input.inputManifest.compilerBuildId,
          runtimeContract: input.inputManifest.runtimeContract,
          filesHash: input.filesHash,
          artifactFilesHash: input.artifact.filesHash || '',
          inputManifest: input.inputManifest,
          diagnostics: sortDiagnostics(input.diagnostics),
          compiledAt,
          dependencyManifest: input.dependencyManifest || null,
          dependencyManifestHash: input.dependencyManifestHash || null,
        },
        transaction,
      });
    }

    return this.updateEntryRuntimePointer(
      {
        entry: input.entry,
        commitId: input.commitId,
        compileKey: input.compileKey || null,
        inputManifest:
          input.inputManifest ||
          buildFallbackInputManifest(
            input.entry,
            input.artifact.version,
            input.surfaceStyle,
            this.compilerBuildIdentity,
          ),
        artifact: {
          artifactHash,
          runtimeCodeHash,
          code: input.artifact.code,
          sourceMap: input.artifact.sourceMap,
          version: input.artifact.version,
          artifactFilesHash: input.artifact.filesHash || '',
          diagnostics: input.diagnostics,
          compiledAt,
          dependencyManifest: input.dependencyManifest,
          dependencyManifestHash: input.dependencyManifestHash,
        },
      },
      transaction,
    );
  }

  private async loadTrustedCompileCache(
    inputs: PreparedEntryCompileInput[],
    transaction?: Transaction,
    compileMetrics?: LightExtensionServiceContext['compileMetrics'],
  ): Promise<TrustedCompileCacheLookup> {
    if (inputs.length === 0) {
      return { hits: new Map(), corruptKeys: new Set() };
    }
    const compileKeys = [...new Set(inputs.map((input) => input.compileKey))];
    const cacheRows = await this.db.getRepository('lightExtensionCompileCache').find({
      filter: { compileKey: { $in: compileKeys } },
      transaction,
    });
    const cacheByKey = new Map(cacheRows.map((row: Model) => [String(row.get('compileKey')), row]));
    const artifactHashes = [
      ...new Set(
        cacheRows
          .map((row: Model) => row.get('artifactHash'))
          .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0),
      ),
    ];
    const artifactRows = artifactHashes.length
      ? await this.db.getRepository('lightExtensionRuntimeArtifacts').find({
          filter: { artifactHash: { $in: artifactHashes } },
          transaction,
        })
      : [];
    const artifactByHash = new Map(artifactRows.map((row: Model) => [String(row.get('artifactHash')), row]));
    const trusted = new Map<string, TrustedCompileCacheHit>();
    const corruptKeys = new Set<string>();
    for (const input of inputs) {
      const cacheRow = cacheByKey.get(input.compileKey);
      if (!cacheRow) {
        continue;
      }
      const artifactHash = cacheRow.get('artifactHash');
      const hit = validateTrustedCompileCache(
        input,
        cacheRow,
        typeof artifactHash === 'string' ? artifactByHash.get(artifactHash) : undefined,
      );
      if (hit) {
        trusted.set(input.compileKey, hit);
      } else {
        corruptKeys.add(input.compileKey);
        compileMetrics?.increment('compileCacheCorruptCount');
      }
    }
    return { hits: trusted, corruptKeys };
  }

  private async updateEntryRuntimePointer(
    input: {
      entry: LightExtensionEntryRecord;
      commitId: string;
      compileKey: string | null;
      inputManifest: CompileInputManifest;
      artifact: TrustedCompileCacheHit;
    },
    transaction?: Transaction,
  ): Promise<LightExtensionEntryRecord> {
    const entry = await this.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: input.entry.id,
      transaction,
    });
    if (!entry) {
      return input.entry;
    }
    const runtimeArtifact = buildEntryRuntimeArtifact(input.entry, input.inputManifest, input.artifact);
    await entry.update(
      {
        compiledCommitId: input.commitId,
        compiledInputKey: input.compileKey,
        compilerBuildId: input.inputManifest.compilerBuildId,
        runtimeArtifact,
        runtimeVersion: input.artifact.version,
        surfaceStyle: input.inputManifest.surfaceStyle,
        runtimeCodeHash: input.artifact.runtimeCodeHash,
        artifactHash: input.artifact.artifactHash,
        filesHash: input.artifact.artifactFilesHash,
        compiledAt: input.artifact.compiledAt,
        dependencyManifest: input.artifact.dependencyManifest || null,
        dependencyManifestHash: input.artifact.dependencyManifestHash || null,
        diagnostics: sortDiagnostics([...input.entry.diagnostics, ...input.artifact.diagnostics]),
        healthStatus: 'ready',
      },
      { transaction },
    );
    return entryFromModel(entry);
  }
}

function createCompileJob(
  input: PreparedEntryCompileInput,
  context: {
    repoId: string;
    requestId: string;
    correlationId: string;
    ordinal: number;
    compilerBuildIdentity: LightExtensionCompilerBuildIdentity;
  },
): LightExtensionCompileJob {
  if (!isSupportedKind(input.entry.kind)) {
    throw new TypeError(`Unsupported light-extension kind: ${input.entry.kind}`);
  }
  return {
    jobId: randomUUID(),
    requestId: context.requestId,
    correlationId: context.correlationId,
    repoId: context.repoId,
    entryId: input.entry.id,
    entryName: input.entry.entryName,
    ordinal: context.ordinal,
    compileKey: input.compileKey,
    filesHash: input.filesHash,
    kind: input.entry.kind,
    entryPath: input.entry.entryPath,
    runtimeVersion: input.inputManifest.runtimeVersion,
    surface: LIGHT_EXTENSION_AUTHORING_SURFACES[input.entry.kind],
    compilerBuildIdentity: context.compilerBuildIdentity,
    inputManifest: input.inputManifest,
    files: input.compileFiles.map((file) => {
      if (typeof file.content !== 'string') {
        throw new TypeError(`Compile file "${file.path}" is missing canonical content`);
      }
      return {
        path: file.path,
        content: file.content,
        blobHash: file.blobHash,
        language: file.language || 'text',
        mode: file.mode || '100644',
      };
    }),
  };
}

function compileResultIdentity(job: LightExtensionCompileJob) {
  return {
    jobId: job.jobId,
    requestId: job.requestId,
    correlationId: job.correlationId,
    repoId: job.repoId,
    entryId: job.entryId,
    entryName: job.entryName,
    ordinal: job.ordinal,
    compileKey: job.compileKey,
    filesHash: job.filesHash,
    kind: job.kind,
    entryPath: job.entryPath,
    compilerBuildId: job.compilerBuildIdentity.compilerBuildId,
    inputManifest: job.inputManifest,
    observation: {
      workerId: 0,
      threadId: 0,
      attempt: 1,
      queueDurationMs: 0,
      runDurationMs: 0,
    },
  };
}

function createCompileResultFromTrustedArtifact(
  input: PreparedEntryCompileInput,
  artifact: TrustedCompileArtifact,
  requestId: string,
  correlationId: string,
  ordinal: number,
): LightExtensionCompileSuccessResult {
  if (!isSupportedKind(input.entry.kind)) {
    throw new TypeError(`Unsupported light-extension kind: ${input.entry.kind}`);
  }
  return {
    jobId: `cache:${input.compileKey}`,
    requestId,
    correlationId,
    repoId: input.entry.repoId,
    entryId: input.entry.id,
    entryName: input.entry.entryName,
    ordinal,
    compileKey: input.compileKey,
    filesHash: input.filesHash,
    kind: input.entry.kind,
    entryPath: input.entry.entryPath,
    compilerBuildId: input.inputManifest.compilerBuildId,
    inputManifest: input.inputManifest,
    diagnostics: artifact.diagnostics,
    observation: {
      workerId: 0,
      threadId: 0,
      attempt: 0,
      queueDurationMs: 0,
      runDurationMs: 0,
    },
    accepted: true,
    execution: 'reused',
    compiledAt: artifact.compiledAt.toISOString(),
    artifact: {
      code: artifact.code,
      ...(artifact.sourceMap ? { sourceMap: artifact.sourceMap } : {}),
      version: artifact.version,
      entryPath: artifact.entryPath,
      filesHash: artifact.artifactFilesHash,
      diagnostics: artifact.diagnostics,
    },
    artifactHash: artifact.artifactHash,
    runtimeCodeHash: artifact.runtimeCodeHash,
    ...(artifact.dependencyManifest ? { dependencyManifest: artifact.dependencyManifest } : {}),
    ...(artifact.dependencyManifestHash ? { dependencyManifestHash: artifact.dependencyManifestHash } : {}),
  };
}

function buildTrustedArtifactFromCurrentEntry(input: PreparedEntryCompileInput): TrustedCompileArtifact | undefined {
  const entry = input.entry;
  const artifact = entry.runtimeArtifact;
  const compiledAt = entry.compiledAt ? new Date(entry.compiledAt) : undefined;
  const dependency = validateRunJSEntryDependencyManifest({
    value: entry.dependencyManifest,
    expectedCompilerBuildId: input.inputManifest.compilerBuildId,
    expectedEntryPath: input.inputManifest.entryPath,
    expectedManifestHash: entry.dependencyManifestHash || undefined,
  });
  if (
    !artifact ||
    !entry.artifactHash ||
    !entry.runtimeCodeHash ||
    entry.compilerBuildId !== input.inputManifest.compilerBuildId ||
    artifact.version !== input.inputManifest.runtimeVersion ||
    artifact.entryPath !== input.inputManifest.entryPath ||
    !artifact.filesHash ||
    !compiledAt ||
    !Number.isFinite(compiledAt.getTime()) ||
    !dependency.valid ||
    !dependencyManifestMatchesCompileInput(dependency.manifest, input.inputManifest.files) ||
    buildRunJSRuntimeCodeHash(artifact.code) !== entry.runtimeCodeHash ||
    buildRunJSArtifactHash({
      code: artifact.code,
      sourceMap: artifact.sourceMap,
      version: artifact.version,
      entryPath: artifact.entryPath,
      runtimeContract: input.inputManifest.runtimeContract,
    }) !== entry.artifactHash
  ) {
    return undefined;
  }
  return {
    compileKey: input.compileKey,
    filesHash: input.filesHash,
    inputManifest: input.inputManifest,
    artifactHash: entry.artifactHash,
    runtimeCodeHash: entry.runtimeCodeHash,
    code: artifact.code,
    ...(artifact.sourceMap ? { sourceMap: artifact.sourceMap } : {}),
    version: artifact.version,
    entryPath: artifact.entryPath,
    artifactFilesHash: artifact.filesHash,
    diagnostics: sortDiagnostics(artifact.diagnostics || entry.diagnostics),
    compiledAt,
    dependencyManifest: dependency.manifest,
    dependencyManifestHash: dependency.manifestHash,
  };
}

function dependencyManifestMatchesCompileInput(
  manifest: RunJSEntryDependencyManifestV1,
  files: CompileInputManifest['files'],
): boolean {
  const hashes = new Map(files.map((file) => [file.path, file.blobHash]));
  return [...manifest.runtime.files, ...manifest.types.files].every((file) => hashes.get(file.path) === file.blobHash);
}

function recordDependencyPlanMetrics(plan: CompilePlan, metrics: LightExtensionServiceContext['compileMetrics']): void {
  metrics?.set('dependencyPlanPreciseHitCount', plan.metrics.preciseHitEntryCount);
  metrics?.set('dependencyPlanConservativeFallbackCount', plan.metrics.conservativeFallbackEntryCount);
  metrics?.set('dependencyManifestVersionMismatchCount', plan.metrics.manifestVersionMismatchEntryCount);
}

function recordDependencyGraphMetrics(
  results: readonly LightExtensionCompileResult[],
  executions: ReadonlyMap<string, 'compiled' | 'reused'>,
  metrics: LightExtensionServiceContext['compileMetrics'],
): void {
  if (!metrics) {
    return;
  }
  for (const result of results) {
    if (!result.accepted || executions.get(result.entryId) !== 'compiled' || !result.dependencyManifest) {
      continue;
    }
    recordDependencyManifestMetrics(result.dependencyManifest, metrics);
  }
}

function recordDependencyManifestMetrics(
  manifest: RunJSEntryDependencyManifestV1,
  metrics: LightExtensionServiceContext['compileMetrics'],
): void {
  metrics?.increment('dependencyGraphRuntimeFileCount', manifest.runtime.files.length);
  metrics?.increment('dependencyGraphTypeFileCount', manifest.types.files.length);
  metrics?.increment('dependencyGraphUnresolvedCount', manifest.unresolved.length);
  metrics?.increment('dependencyGraphByteSize', Buffer.byteLength(stableSerialize(manifest), 'utf8'));
}

function toSuccessfulCompileEntryResult(
  result: LightExtensionCompileSuccessResult,
  execution: 'compiled' | 'reused',
): LightExtensionSaveSourceResult['compile']['entries'][number] {
  return {
    entryId: result.entryId,
    entryName: result.entryName,
    kind: result.kind,
    entryPath: result.entryPath,
    status: 'success',
    execution,
    diagnostics: result.diagnostics,
    artifact: {
      version: result.artifact.version,
      entryPath: result.artifact.entryPath || result.entryPath,
      filesHash: result.artifact.filesHash,
      metadata: normalizeRecord(result.artifact.metadata),
    },
  };
}

function toFailedCompileEntryResult(
  result: LightExtensionCompileResult,
): LightExtensionSaveSourceResult['compile']['entries'][number] {
  return {
    entryId: result.entryId,
    entryName: result.entryName,
    kind: result.kind,
    entryPath: result.entryPath,
    status: 'failed',
    execution: 'compiled',
    diagnostics: result.diagnostics,
    failureCode: result.accepted ? undefined : result.failureCode,
  };
}

function createCompilePlan(
  prepared: LightExtensionPreparedEntries,
  changedPaths: readonly string[] | undefined,
  compilerBuildId: string = LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.compilerBuildId,
  pathChanges?: readonly AffectedEntryPathChange[],
): CompilePlan {
  const previousEntries = prepared.reconcile.changes
    .map((change) => change.previousEntry)
    .filter((entry): entry is LightExtensionEntryRecord => Boolean(entry) && entry.healthStatus === 'ready')
    .map(toEntryPlanSnapshot);
  const candidateEntries = prepared.entries
    .filter((entry) => entry.healthStatus === 'ready' && isSupportedKind(entry.kind))
    .map(toEntryPlanSnapshot);
  return createAffectedEntryCompilePlan({
    changedPaths: changedPaths || ['__light_extension_full_runtime_compile__'],
    pathChanges,
    previousEntries,
    candidateEntries,
    compilerBuildId,
  });
}

function toEntryPlanSnapshot(entry: LightExtensionEntryRecord): EntryPlanSnapshot {
  if (!isSupportedKind(entry.kind)) {
    throw new TypeError(`Unsupported light-extension kind: ${entry.kind}`);
  }
  return {
    id: entry.id,
    target: 'client',
    kind: entry.kind,
    entryName: entry.entryName,
    entryPath: entry.entryPath,
    descriptorPath: entry.descriptorPath,
    healthStatus: entry.healthStatus,
    settingsSchemaHash: entry.settingsSchemaHash,
    settingsDefaultsHash: entry.settingsDefaultsHash,
    metadataFingerprint: sha256Hex(
      stableSerialize({
        title: entry.title,
        description: entry.description,
        category: entry.category,
        icon: entry.icon,
        tags: entry.tags,
        sort: entry.sort,
      }),
    ),
    compilerBuildId: entry.compilerBuildId,
    dependencyManifest: entry.dependencyManifest,
    dependencyManifestHash: entry.dependencyManifestHash,
  };
}

function prepareEntryCompileInputs(
  entries: LightExtensionEntryRecord[],
  files: readonly RuntimeCompileSourceFile[],
  compilePlan: CompilePlan,
  compilerBuildIdentity: LightExtensionCompilerBuildIdentity,
): PreparedEntryCompileInput[] {
  const affectedEntryIds = new Set(compilePlan.compileCandidates.map((entry) => entry.id).filter(Boolean));
  return entries
    .filter((entry) => entry.healthStatus === 'ready' && isSupportedKind(entry.kind))
    .map((entry) => {
      const compileKey = buildLightExtensionCompileKey({
        entry,
        files,
        runtimeVersion: entry.runtimeVersion || 'v2',
        compilerBuildIdentity,
      });
      return {
        ...compileKey,
        entry,
        compileFiles: getEntryCompileFiles(files, entry),
        affected: affectedEntryIds.has(entry.id),
      };
    });
}

function createCompileDecision(
  input: PreparedEntryCompileInput,
  cached: TrustedCompileCacheHit | undefined,
  cacheEnabled: boolean,
  cacheCorrupt: boolean,
): CompileDecision {
  return {
    entryId: input.entry.id,
    compileKey: input.compileKey,
    filesHash: input.filesHash,
    inputManifest: input.inputManifest,
    affected: input.affected,
    decision: cached ? 'reuse' : 'compile',
    reason: cached ? 'cache-hit' : !cacheEnabled ? 'cache-disabled' : cacheCorrupt ? 'cache-corrupt' : 'cache-miss',
  };
}

function createSkipRuntimeDecisions(entries: LightExtensionEntryRecord[]): CompileDecision[] {
  return entries
    .filter((entry) => entry.healthStatus !== 'ready' || !isSupportedKind(entry.kind))
    .map((entry) => ({
      entryId: entry.id,
      decision: 'skip-runtime',
      affected: false,
      reason: 'runtime-unavailable',
    }));
}

function validateTrustedCompileCache(
  input: PreparedEntryCompileInput,
  cacheRow: Model,
  artifactRow: Model | undefined,
): TrustedCompileCacheHit | undefined {
  if (!artifactRow) {
    return undefined;
  }
  const artifactHash = stringValue(cacheRow.get('artifactHash'));
  const code = stringValue(artifactRow.get('code'));
  const sourceMap = nullableString(artifactRow.get('sourceMap')) || undefined;
  const version = stringValue(artifactRow.get('version'));
  const entryPath = stringValue(artifactRow.get('entryPath'));
  const runtimeContract = stringValue(artifactRow.get('runtimeContract'));
  const runtimeCodeHash = stringValue(artifactRow.get('runtimeCodeHash'));
  const artifactFilesHash = stringValue(cacheRow.get('artifactFilesHash'));
  const compiledAt = dateValue(cacheRow.get('compiledAt'));
  const inputManifest = cacheRow.get('inputManifest');
  const dependencyManifestHash = nullableString(cacheRow.get('dependencyManifestHash')) || undefined;
  const dependencyValidation = validateRunJSEntryDependencyManifest({
    value: cacheRow.get('dependencyManifest'),
    expectedCompilerBuildId: input.inputManifest.compilerBuildId,
    expectedEntryPath: input.inputManifest.entryPath,
    expectedManifestHash: dependencyManifestHash,
  });
  const dependencyManifest =
    dependencyValidation.valid &&
    dependencyManifestMatchesCompileInput(dependencyValidation.manifest, input.inputManifest.files)
      ? dependencyValidation.manifest
      : undefined;
  if (
    cacheRow.get('compileKey') !== input.compileKey ||
    cacheRow.get('compilerBuildId') !== input.inputManifest.compilerBuildId ||
    cacheRow.get('runtimeContract') !== input.inputManifest.runtimeContract ||
    cacheRow.get('filesHash') !== input.filesHash ||
    stableSerialize(inputManifest) !== stableSerialize(input.inputManifest) ||
    !artifactHash ||
    artifactRow.get('artifactHash') !== artifactHash ||
    !code ||
    !version ||
    version !== input.inputManifest.runtimeVersion ||
    entryPath !== input.inputManifest.entryPath ||
    runtimeContract !== input.inputManifest.runtimeContract ||
    !runtimeCodeHash ||
    runtimeCodeHash !== buildRunJSRuntimeCodeHash(code) ||
    !artifactFilesHash ||
    !compiledAt
  ) {
    return undefined;
  }
  const expectedArtifactHash = buildRunJSArtifactHash({
    code,
    sourceMap,
    version,
    entryPath,
    runtimeContract,
  });
  if (expectedArtifactHash !== artifactHash) {
    return undefined;
  }
  const diagnostics = normalizeDiagnostics(cacheRow.get('diagnostics'));
  if (!diagnostics) {
    return undefined;
  }
  return {
    artifactHash,
    runtimeCodeHash,
    code,
    sourceMap,
    version,
    artifactFilesHash,
    diagnostics,
    compiledAt,
    dependencyManifest,
    dependencyManifestHash: dependencyManifest ? dependencyValidation.manifestHash : undefined,
  };
}

function buildSuccessfulCompileEntryResult(
  entry: LightExtensionEntryRecord,
  artifact: TrustedCompileCacheHit,
  manifest: CompileInputManifest,
  execution: 'compiled' | 'reused',
): LightExtensionSaveSourceResult['compile']['entries'][number] {
  return {
    entryId: entry.id,
    entryName: entry.entryName,
    kind: entry.kind,
    entryPath: entry.entryPath,
    status: 'success',
    execution,
    diagnostics: artifact.diagnostics,
    artifact: {
      version: artifact.version,
      entryPath: manifest.entryPath,
      filesHash: artifact.artifactFilesHash,
      metadata: buildEntryRuntimeMetadata(entry, manifest, artifact),
    },
  };
}

function buildEntryRuntimeArtifact(
  entry: LightExtensionEntryRecord,
  manifest: CompileInputManifest,
  artifact: TrustedCompileCacheHit,
): RunJSRuntimeArtifact {
  return {
    code: artifact.code,
    sourceMap: artifact.sourceMap,
    version: artifact.version,
    entryPath: manifest.entryPath,
    filesHash: artifact.artifactFilesHash,
    diagnostics: artifact.diagnostics,
    metadata: buildEntryRuntimeMetadata(entry, manifest, artifact),
  };
}

function buildEntryRuntimeMetadata(
  entry: LightExtensionEntryRecord,
  manifest: CompileInputManifest,
  artifact: Pick<TrustedCompileCacheHit, 'artifactHash' | 'runtimeCodeHash'>,
): Record<string, unknown> {
  const surface = LIGHT_EXTENSION_AUTHORING_SURFACES[manifest.kind];
  return {
    entry: manifest.entryPath,
    runtimeVersion: manifest.runtimeVersion,
    target: 'client',
    repoId: entry.repoId,
    entryId: entry.id,
    kind: entry.kind,
    entryName: entry.entryName,
    modelUse: manifest.modelUse,
    surface: surface.surface,
    surfaceStyle: manifest.surfaceStyle,
    compilerSurfaceStyle: manifest.compilerSurfaceStyle,
    runtimeCodeHash: artifact.runtimeCodeHash,
    artifactHash: artifact.artifactHash,
    runtimeContract: manifest.runtimeContract,
    compilerBuildId: manifest.compilerBuildId,
  };
}

function buildFallbackInputManifest(
  entry: LightExtensionEntryRecord,
  runtimeVersion: string,
  surfaceStyle: string,
  compilerBuildIdentity: LightExtensionCompilerBuildIdentity,
): CompileInputManifest {
  if (!isSupportedKind(entry.kind)) {
    throw new TypeError(`Unsupported light-extension kind: ${entry.kind}`);
  }
  const surface = LIGHT_EXTENSION_AUTHORING_SURFACES[entry.kind];
  return {
    compilerBuildId: compilerBuildIdentity.compilerBuildId,
    runtimeContract: LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
    target: 'client',
    kind: entry.kind,
    entryPath: entry.entryPath,
    runtimeVersion,
    surfaceStyle,
    compilerSurfaceStyle: surface.compilerSurfaceStyle,
    modelUse: surface.modelUse,
    files: [],
  };
}

function getEntryCompileFiles(files: readonly RuntimeCompileSourceFile[], entry: LightExtensionEntryRecord) {
  const rootPath = getEntryRootPath(entry.entryPath);

  return files
    .filter(
      (file) =>
        file.path !== entry.descriptorPath &&
        (file.path === rootPath || file.path.startsWith(`${rootPath}/`) || file.path.startsWith('src/shared/')),
    )
    .map((file) => ({
      path: file.path,
      content: file.content,
      blobHash: file.blobHash,
      language: file.language,
      mode: file.mode,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function getEntryRootPath(entryPath: string): string {
  const normalized = pathPosix.normalize(entryPath.trim()).replace(/^\.\/+/, '');
  return pathPosix.extname(normalized) ? pathPosix.dirname(normalized) : normalized;
}

function isSupportedKind(kind: string): kind is LightExtensionKind {
  return (LIGHT_EXTENSION_SUPPORTED_KINDS as readonly string[]).includes(kind);
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function dateValue(value: unknown): Date | undefined {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : undefined;
  }
  return undefined;
}

function normalizeDiagnostics(value: unknown): LightExtensionDiagnostic[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const diagnostics = value.filter(
    (item): item is LightExtensionDiagnostic =>
      Boolean(item) &&
      typeof item === 'object' &&
      typeof (item as { code?: unknown }).code === 'string' &&
      ['error', 'warning'].includes(String((item as { severity?: unknown }).severity)),
  );
  return diagnostics.length === value.length ? sortDiagnostics(diagnostics) : undefined;
}

function normalizeRecord(value: unknown): Record<string, unknown> | undefined {
  return isPlainRecord(value) ? cloneRecord(value) : undefined;
}

function cloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function repoFromModelLike(record: { get: (key: string) => unknown }): LightExtensionSaveSourceResult['repo'] {
  return {
    id: String(record.get('id')),
    name: String(record.get('name')),
    normalizedName: String(record.get('normalizedName')),
    title: nullableString(record.get('title')),
    description: nullableString(record.get('description')),
    lifecycleStatus: record.get('lifecycleStatus') as LightExtensionSaveSourceResult['repo']['lifecycleStatus'],
    healthStatus: record.get('healthStatus') as LightExtensionSaveSourceResult['repo']['healthStatus'],
    headCommitId: nullableString(record.get('headCommitId')),
    lastCompiledAt: normalizeDate(record.get('lastCompiledAt')),
    createdAt: normalizeDate(record.get('createdAt')),
    updatedAt: normalizeDate(record.get('updatedAt')),
  };
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function normalizeDate(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return typeof value === 'string' ? value : null;
}

function withEntrySummary(
  repo: LightExtensionSaveSourceResult['repo'],
  entries: LightExtensionEntryRecord[],
): LightExtensionSaveSourceResult['repo'] {
  const activeEntries = entries.filter((entry) => entry.healthStatus !== 'missing');
  const entryKinds: NonNullable<LightExtensionSaveSourceResult['repo']['entryKinds']> = {};
  for (const entry of activeEntries) {
    if (!isSupportedKind(entry.kind)) {
      continue;
    }
    entryKinds[entry.kind] = (entryKinds[entry.kind] || 0) + 1;
  }
  return {
    ...repo,
    entryCount: activeEntries.length,
    entryKinds,
  };
}
