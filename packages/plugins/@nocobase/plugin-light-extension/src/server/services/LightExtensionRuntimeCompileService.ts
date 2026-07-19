/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { buildRunJSArtifactHash, buildRunJSRuntimeCodeHash } from '@nocobase/runjs';
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
import { buildLightExtensionCompileKey, type LightExtensionCompileKeyResult } from './LightExtensionCompileKey';
import {
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  type LightExtensionCompileExecutor,
  type LightExtensionCompileJob,
  type LightExtensionCompileResult,
  type LightExtensionCompileSuccessResult,
  type LightExtensionCompilerBuildIdentity,
} from './LightExtensionCompileContract';
import { assertPreparedCandidateWorkspace, type PreparedCandidateWorkspace } from './PreparedCandidateWorkspace';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import { executeLightExtensionCompileJob } from './LightExtensionCompileJobExecutor';
import { PublishCompiledEntriesService } from './PublishCompiledEntriesService';
import { sortDiagnostics } from './LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from './LightExtensionWorkspaceCompilerBridge';

type ReferenceRefreshService = {
  refreshReferencesForRepo: (repoId: string, ctx?: LightExtensionServiceContext, reason?: string) => Promise<unknown>;
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
}

interface PreparedCompileResults {
  results: LightExtensionCompileResult[];
  compiledEntryCount: number;
}

export interface LightExtensionRuntimeCompileServiceOptions {
  compilerBuildIdentity?: LightExtensionCompilerBuildIdentity;
  compileExecutor?: LightExtensionCompileExecutor;
  publishCompiledEntries?: PublishCompiledEntriesService;
}

export interface LightExtensionPreparedSave {
  readonly candidate: LightExtensionPreparedSourceCandidate;
  readonly entryPlan: LightExtensionEntryReconcilePlan;
  readonly compileResults: readonly LightExtensionCompileSuccessResult[];
  readonly compileEntries: LightExtensionSaveSourceResult['compile']['entries'];
  readonly diagnostics: readonly LightExtensionDiagnostic[];
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

  private readonly compilerBuildIdentity: LightExtensionCompilerBuildIdentity;

  private readonly compileExecutor?: LightExtensionCompileExecutor;

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
    this.compilerBuildIdentity =
      options.compilerBuildIdentity ||
      (typeof compilerBridge.getCompilerBuildIdentity === 'function'
        ? compilerBridge.getCompilerBuildIdentity()
        : LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY);
    this.compileExecutor = options.compileExecutor;
    this.publishCompiledEntries = options.publishCompiledEntries || PublishCompiledEntriesService.forDatabase(db);
  }

  useReferenceService(referenceService: ReferenceRefreshService): void {
    this.referenceService = referenceService;
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
    const readyInputs = prepareEntryCompileInputs(
      preparedEntries.entries,
      candidate.vscPreparedPush.candidate.files,
      this.compilerBuildIdentity,
    );
    ctx.compileMetrics?.set('entryCount', preparedEntries.entries.length);
    ctx.compileMetrics?.set('affectedEntryCount', readyInputs.length);
    const compilePreparation = await this.prepareCompileResults(candidate.repo.id, readyInputs, ctx);
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
    const compileEntries = successfulResults.map(toSuccessfulCompileEntryResult);
    const prepared: LightExtensionPreparedSave = Object.freeze({
      candidate,
      entryPlan,
      compileResults: Object.freeze(successfulResults.map((entry) => Object.freeze(entry))),
      compileEntries: Object.freeze(compileEntries),
      diagnostics: Object.freeze(diagnostics),
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
    await this.referenceService?.refreshReferencesForRepo(candidate.repo.id, ctx, 'source_published');
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

  private async recordPublishedCompileAudits(
    results: readonly LightExtensionCompileSuccessResult[],
    ctx: LightExtensionServiceContext,
  ): Promise<void> {
    for (const result of results) {
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

  private async prepareCompileResults(
    repoId: string,
    readyInputs: PreparedEntryCompileInput[],
    ctx: LightExtensionServiceContext,
  ): Promise<PreparedCompileResults> {
    const requestId = ctx.requestId || randomUUID();
    const correlationId = randomUUID();
    const compileJobs = readyInputs.map((input, ordinal) => ({
      input,
      job: createCompileJob(input, {
        repoId,
        requestId,
        correlationId,
        ordinal,
        compilerBuildIdentity: this.compilerBuildIdentity,
      }),
    }));
    ctx.compileMetrics?.increment('compiledEntryCount', compileJobs.length);

    const compileExecutor = this.compileExecutor;
    let results: LightExtensionCompileResult[];
    if (compileExecutor) {
      results = await Promise.all(compileJobs.map(({ job }) => compileExecutor.submitWithBackpressure(job)));
    } else {
      // The non-worker compatibility path is intentionally serial so database-backed compile audit hooks remain safe
      // on SQLite. Production compile paths use the bounded isolated worker.
      results = [];
      for (const { job, input } of compileJobs) {
        results.push(
          this.compilerBridge
            ? await this.compileEntryWithoutWorker(job, input, ctx)
            : await executeLightExtensionCompileJob({ job, workerId: 0, attempt: 1, executingThreadId: 0 }),
        );
      }
    }
    return {
      results,
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
    return {
      ...compileResultIdentity(job),
      accepted: true,
      artifact: compiled.artifact,
      artifactHash,
      runtimeCodeHash,
      diagnostics: compiled.diagnostics,
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

    return this.compilePreparedEntries(candidate.repo.id, candidate.commit.id, prepared, candidate.files, ctx);
  }

  private async compilePreparedEntries(
    repoId: string,
    commitId: string,
    prepared: LightExtensionPreparedEntries,
    files: readonly RuntimeCompileSourceFile[],
    ctx: LightExtensionServiceContext,
  ): Promise<
    Pick<LightExtensionSaveSourceResult['compile'], 'status' | 'entries'> & {
      repo: LightExtensionSaveSourceResult['repo'];
      diagnostics: LightExtensionDiagnostic[];
    }
  > {
    const readyInputs = prepareEntryCompileInputs(prepared.entries, files, this.compilerBuildIdentity);
    ctx.compileMetrics?.set('entryCount', prepared.entries.length);
    ctx.compileMetrics?.set('affectedEntryCount', readyInputs.length);
    ctx.compileMetrics?.set('skippedEntryCount', prepared.entries.length - readyInputs.length);
    const compilePreparation = await this.prepareCompileResults(repoId, readyInputs, ctx);
    const diagnostics = sortDiagnostics([
      ...prepared.diagnostics,
      ...compilePreparation.results.flatMap((entry) => entry.diagnostics),
    ]);
    const failures = compilePreparation.results.filter((entry) => !entry.accepted);
    if (failures.length > 0) {
      throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Light extension source cannot be compiled', {
        status: 422,
        details: {
          repoId,
          commitId,
          diagnostics,
          entries: failures.map(toFailedCompileEntryResult),
        },
      });
    }
    const successfulResults = compilePreparation.results as LightExtensionCompileSuccessResult[];
    await this.publishCompiledEntries.publishCompiledEntries(
      {
        commitId,
        results: successfulResults,
      },
      ctx.transaction,
    );
    await this.recordPublishedCompileAudits(successfulResults, ctx);
    const compileEntries = successfulResults.map(toSuccessfulCompileEntryResult);
    await this.db.getRepository('lightExtensionRepos').update({
      filterByTk: repoId,
      values: {
        healthStatus: 'ready',
        ...(compilePreparation.compiledEntryCount > 0 ? { lastCompiledAt: new Date() } : {}),
      },
      transaction: ctx.transaction,
    });

    const [repo, entryModels] = await Promise.all([
      this.db.getRepository('lightExtensionRepos').findOne({
        filterByTk: repoId,
        transaction: ctx.transaction,
      }),
      this.db.getRepository('lightExtensionEntries').find({ filter: { repoId }, transaction: ctx.transaction }),
    ]);

    return {
      repo: withEntrySummary(repo ? repoFromModelLike(repo) : prepared.repo, entryModels.map(entryFromModel)),
      status: compileEntries.length === 0 ? 'skipped' : 'success',
      entries: compileEntries,
      diagnostics,
    };
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

function toSuccessfulCompileEntryResult(
  result: LightExtensionCompileSuccessResult,
): LightExtensionSaveSourceResult['compile']['entries'][number] {
  return {
    entryId: result.entryId,
    entryName: result.entryName,
    kind: result.kind,
    entryPath: result.entryPath,
    status: 'success',
    execution: 'compiled',
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

function prepareEntryCompileInputs(
  entries: LightExtensionEntryRecord[],
  files: readonly RuntimeCompileSourceFile[],
  compilerBuildIdentity: LightExtensionCompilerBuildIdentity,
): PreparedEntryCompileInput[] {
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
      };
    });
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
