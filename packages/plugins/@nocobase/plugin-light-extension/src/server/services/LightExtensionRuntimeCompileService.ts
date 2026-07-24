/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { buildRunJSArtifactHash, buildRunJSRuntimeCodeHash, sha256Hex, stableSerialize } from '@nocobase/runjs';
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
  LightExtensionTreeEntryInput,
} from '../../shared/types';
import {
  entryFromModel,
  LightExtensionEntryService,
  type LightExtensionEntryReconcilePlan,
  type LightExtensionPreparedEntries,
} from './LightExtensionEntryService';
import {
  LightExtensionFileService,
  type LightExtensionPreparedSourceCandidate,
  type LightExtensionPreparedSourceSnapshot,
  type LightExtensionReplaceSourceSnapshotInput,
} from './LightExtensionFileService';
import { buildLightExtensionCompileKey, type LightExtensionCompileKeyResult } from './LightExtensionCompileKey';
import {
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  compileLightExtensionValidatedEntry,
  selectLightExtensionEntryCompileFiles,
  validateLightExtensionWorkspace,
  type LightExtensionCompileExecutor,
  type LightExtensionCompileFailureResult,
  type LightExtensionCompileJob,
  type LightExtensionCompileResult,
  type LightExtensionCompileSuccessResult,
  type LightExtensionCompilerBuildIdentity,
} from './LightExtensionCompileContract';
import { assertPreparedCandidateWorkspace, type PreparedCandidateWorkspace } from './PreparedCandidateWorkspace';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import { PublishCompiledEntriesService } from './PublishCompiledEntriesService';
import { LightExtensionValidator, hasErrorDiagnostic, sortDiagnostics } from './LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from './LightExtensionWorkspaceCompilerBridge';
import { TreeService } from '../vsc-file/services/TreeService';

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
  compiledEntryIds: string[];
}

export interface LightExtensionRuntimeCompileServiceOptions {
  compilerBuildIdentity?: LightExtensionCompilerBuildIdentity;
  compileExecutor?: LightExtensionCompileExecutor;
  publishCompiledEntries?: PublishCompiledEntriesService;
  validator?: LightExtensionValidator;
}

interface LightExtensionPreparedCompileState {
  readonly entryPlan: LightExtensionEntryReconcilePlan;
  readonly compileFingerprint: string;
  readonly compileResults: readonly LightExtensionCompileSuccessResult[];
  readonly compileEntries: ReadonlyArray<LightExtensionSaveSourceResult['compile']['entries'][number]>;
  readonly diagnostics: readonly LightExtensionDiagnostic[];
  readonly compiledEntryCount: number;
  readonly compiledEntryIds: readonly string[];
}

export interface LightExtensionPreparedSave extends LightExtensionPreparedCompileState {
  readonly candidate: LightExtensionPreparedSourceCandidate;
}

export interface LightExtensionPreparedInitialWorkspace extends LightExtensionPreparedCompileState {
  readonly repoId: string;
}

export interface LightExtensionPreparedRemoteSnapshot {
  readonly source: LightExtensionPreparedSourceSnapshot;
  readonly preparedSave: LightExtensionPreparedSave | null;
}

export interface LightExtensionInitialWorkspacePublishResult {
  repo: LightExtensionSaveSourceResult['repo'];
  status: LightExtensionSaveSourceResult['compile']['status'];
  entries: LightExtensionSaveSourceResult['compile']['entries'];
  diagnostics: LightExtensionDiagnostic[];
}

export class LightExtensionRuntimeCompileService {
  private referenceService?: ReferenceRefreshService;

  private readonly configuredCompilerBuildIdentity?: LightExtensionCompilerBuildIdentity;

  private readonly compileExecutor?: LightExtensionCompileExecutor;

  private readonly publishCompiledEntries: PublishCompiledEntriesService;

  private readonly preparedSaves = new WeakSet<object>();

  private readonly preparedInitialWorkspaces = new WeakSet<object>();

  private readonly validator: LightExtensionValidator;

  constructor(
    private readonly db: Database,
    private readonly fileService: LightExtensionFileService,
    private readonly entryService: LightExtensionEntryService,
    private readonly compilerBridge: LightExtensionWorkspaceCompilerBridge,
    options: LightExtensionRuntimeCompileServiceOptions = {},
  ) {
    this.configuredCompilerBuildIdentity = options.compilerBuildIdentity;
    this.compileExecutor = options.compileExecutor;
    this.publishCompiledEntries = options.publishCompiledEntries || PublishCompiledEntriesService.forDatabase(db);
    this.validator = options.validator || new LightExtensionValidator();
  }

  useReferenceService(referenceService: ReferenceRefreshService): void {
    this.referenceService = referenceService;
  }

  private get compilerBuildIdentity(): LightExtensionCompilerBuildIdentity {
    return (
      this.configuredCompilerBuildIdentity ||
      (typeof this.compilerBridge.getCompilerBuildIdentity === 'function'
        ? this.compilerBridge.getCompilerBuildIdentity()
        : LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY)
    );
  }

  async saveSource(
    input: LightExtensionSaveSourceInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionSaveSourceResult> {
    const deferredRejectedPushAudits: Array<() => Promise<void>> = [];
    const operationContext: LightExtensionServiceContext = {
      ...ctx,
      deferredRejectedPushAudits,
    };
    if (ctx.transaction) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        'saveSource cannot compile inside an existing transaction; use prepareSaveSource and publishPreparedSave',
      );
    }
    try {
      const prepared = await this.prepareSaveSource(input, operationContext);
      for (let attempt = 0; ; attempt += 1) {
        try {
          return await this.db.sequelize.transaction((transaction) =>
            this.publishPreparedSave(prepared, {
              ...operationContext,
              transaction,
            }),
          );
        } catch (error) {
          if (this.db.sequelize.getDialect() !== 'sqlite' || !isSqliteBusyError(error) || attempt >= 2) {
            throw error;
          }
          await delay(100);
        }
      }
    } catch (error) {
      for (const recordRejectedPush of deferredRejectedPushAudits) {
        await recordRejectedPush();
      }
      throw error;
    }
  }

  async prepareSaveSource(
    input: LightExtensionSaveSourceInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionPreparedSave> {
    return this.prepareSaveSourceInternal(input, ctx);
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
    return this.prepareSaveFromCandidate(candidate, ctx);
  }

  async prepareRemoteSnapshot(
    input: LightExtensionReplaceSourceSnapshotInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionPreparedRemoteSnapshot> {
    if (ctx.transaction) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        'Remote snapshot preparation must run outside a database transaction',
      );
    }
    const source = await this.fileService.prepareSourceSnapshotCandidate(input, ctx);
    return Object.freeze({
      source,
      preparedSave: source.candidate ? await this.prepareSaveFromCandidate(source.candidate, ctx) : null,
    });
  }

  async prepareInitialWorkspace(
    input: { repoId: string; files: readonly LightExtensionTreeEntryInput[] },
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionPreparedInitialWorkspace> {
    if (ctx.transaction) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        'Initial workspace preparation must run outside a database transaction',
      );
    }
    const files = await materializeInitialCompileFiles(this.db, input.files);
    const validation = validateLightExtensionWorkspace(this.validator, files);
    if (hasErrorDiagnostic(validation.diagnostics)) {
      throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Light extension initial source is invalid', {
        status: 422,
        details: { diagnostics: validation.diagnostics },
      });
    }
    const entryPlan = await this.entryService.planReconcileEntries(input.repoId, validation.entries, null);
    const compileState = await this.prepareCompileState(input.repoId, entryPlan, validation.diagnostics, files, ctx);
    const prepared: LightExtensionPreparedInitialWorkspace = Object.freeze({
      repoId: input.repoId,
      ...compileState,
    });
    this.preparedInitialWorkspaces.add(prepared);
    return prepared;
  }

  private async prepareSaveFromCandidate(
    candidate: LightExtensionPreparedSourceCandidate,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionPreparedSave> {
    const entryPlan = await this.entryService.planReconcileEntries(
      candidate.repo.id,
      candidate.validation.entries,
      candidate.expectedHeadCommitId,
    );
    const compileState = await this.prepareCompileState(
      candidate.repo.id,
      entryPlan,
      candidate.validation.diagnostics,
      candidate.vscPreparedPush.candidate.files,
      ctx,
    );
    const prepared: LightExtensionPreparedSave = Object.freeze({ candidate, ...compileState });
    this.preparedSaves.add(prepared);
    return prepared;
  }

  private async prepareCompileState(
    repoId: string,
    entryPlan: LightExtensionEntryReconcilePlan,
    validationDiagnostics: readonly LightExtensionDiagnostic[],
    files: readonly RuntimeCompileSourceFile[],
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionPreparedCompileState> {
    const readyInputs = prepareEntryCompileInputs(entryPlan.result.entries, files, this.compilerBuildIdentity);
    const compilePreparation = await this.prepareCompileResults(repoId, readyInputs, ctx);
    const diagnostics = sortDiagnostics([
      ...validationDiagnostics,
      ...compilePreparation.results.flatMap((entry) => entry.diagnostics),
    ]);
    const failures = compilePreparation.results.filter((entry) => !entry.accepted);
    if (failures.length > 0) {
      throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Light extension source cannot be compiled', {
        status: 422,
        details: {
          repoId,
          diagnostics,
          entries: failures.map(toFailedCompileEntryResult),
        },
      });
    }
    const successfulResults = compilePreparation.results as LightExtensionCompileSuccessResult[];
    const compiledEntryIds = new Set(compilePreparation.compiledEntryIds);
    const compileEntries = successfulResults.map((result) =>
      toSuccessfulCompileEntryResult(result, compiledEntryIds.has(result.entryId)),
    );
    return Object.freeze({
      entryPlan,
      compileFingerprint: buildPreparedCompileFingerprint(
        entryPlan.result.entries,
        successfulResults,
        this.compilerBuildIdentity,
      ),
      compileResults: Object.freeze(successfulResults.map((entry) => Object.freeze(entry))),
      compileEntries: Object.freeze(compileEntries),
      diagnostics: Object.freeze(diagnostics),
      compiledEntryCount: compilePreparation.compiledEntryCount,
      compiledEntryIds: Object.freeze([...compilePreparation.compiledEntryIds]),
    });
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
    this.assertPreparedCompileFingerprint(prepared);
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
    const compiledEntryIds = new Set(prepared.compiledEntryIds);
    await this.recordPublishedCompileAudits(
      prepared.compileResults.filter((result) => compiledEntryIds.has(result.entryId)),
      ctx,
    );
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
        status: prepared.compiledEntryCount === 0 ? 'skipped' : 'success',
        entries: [...prepared.compileEntries],
      },
      diagnostics: [...prepared.diagnostics],
    };
  }

  async publishPreparedInitialWorkspace(
    prepared: LightExtensionPreparedInitialWorkspace,
    commitId: string,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionInitialWorkspacePublishResult> {
    const transaction = ctx.transaction;
    if (!transaction) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        'A transaction is required to publish an initial workspace',
      );
    }
    if (!prepared || !this.preparedInitialWorkspaces.has(prepared)) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        'Prepared initial workspace must be created by this runtime compile service instance',
      );
    }
    this.assertPreparedCompileFingerprint(prepared);
    const repo = await this.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: prepared.repoId,
      transaction,
    });
    if (!repo || repo.get('headCommitId') !== commitId) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_OUTDATED',
        'Light extension initial source changed before compile publish',
        { details: { repoId: prepared.repoId, expectedHeadCommitId: commitId } },
      );
    }
    await this.entryService.publishReconcilePlan(prepared.entryPlan, transaction);
    await this.publishCompiledEntries.publishCompiledEntries(
      {
        commitId,
        results: prepared.compileResults,
      },
      transaction,
    );
    await this.db.getRepository('lightExtensionRepos').update({
      filterByTk: prepared.repoId,
      values: {
        healthStatus: 'ready',
        ...(prepared.compiledEntryCount > 0 ? { lastCompiledAt: new Date() } : {}),
      },
      transaction,
    });
    await this.referenceService?.refreshReferencesForRepo(prepared.repoId, ctx, 'source_published');
    const compiledEntryIds = new Set(prepared.compiledEntryIds);
    await this.recordPublishedCompileAudits(
      prepared.compileResults.filter((result) => compiledEntryIds.has(result.entryId)),
      ctx,
    );
    const [updatedRepo, entryModels] = await Promise.all([
      this.db.getRepository('lightExtensionRepos').findOne({ filterByTk: prepared.repoId, transaction }),
      this.db.getRepository('lightExtensionEntries').find({ filter: { repoId: prepared.repoId }, transaction }),
    ]);
    if (!updatedRepo) {
      throw new LightExtensionError('LIGHT_EXTENSION_REPO_NOT_FOUND', 'Light extension repository was not found');
    }
    return {
      repo: withEntrySummary(repoFromModelLike(updatedRepo), entryModels.map(entryFromModel)),
      status: prepared.compiledEntryCount === 0 ? 'skipped' : 'success',
      entries: [...prepared.compileEntries],
      diagnostics: [...prepared.diagnostics],
    };
  }

  private assertPreparedCompileFingerprint(prepared: LightExtensionPreparedCompileState): void {
    const currentFingerprint = buildPreparedCompileFingerprint(
      prepared.entryPlan.result.entries,
      prepared.compileResults,
      this.compilerBuildIdentity,
    );
    if (currentFingerprint !== prepared.compileFingerprint) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_OUTDATED',
        'Light extension compile inputs changed before the prepared workspace was published',
        { details: { repoId: prepared.entryPlan.repoId } },
      );
    }
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
    const preparedJobs = readyInputs.map((input, ordinal) => ({
      input,
      job: createCompileJob(input, {
        repoId,
        requestId,
        correlationId,
        ordinal,
        compilerBuildIdentity: this.compilerBuildIdentity,
      }),
    }));
    const reusedResults: LightExtensionCompileSuccessResult[] = [];
    const compileJobs: typeof preparedJobs = [];
    for (const preparedJob of preparedJobs) {
      const reused = reuseCompiledEntry(preparedJob.job, preparedJob.input);
      if (reused) {
        reusedResults.push(reused);
      } else {
        compileJobs.push(preparedJob);
      }
    }
    const compileExecutor = this.compileExecutor;
    let compiledResults: LightExtensionCompileResult[];
    if (compileExecutor) {
      compiledResults = await Promise.all(compileJobs.map(({ job }) => compileExecutor.submitWithBackpressure(job)));
    } else {
      // The non-worker compatibility path is intentionally serial so database-backed compile audit hooks remain safe
      // on SQLite. Production compile paths use the bounded isolated worker.
      compiledResults = [];
      for (const { job, input } of compileJobs) {
        compiledResults.push(
          this.compilerBridge
            ? await this.compileEntryWithoutWorker(job, input, ctx)
            : await this.executeCompileJobWithoutWorker(job),
        );
      }
    }
    return {
      results: [...reusedResults, ...compiledResults].sort(
        (left, right) => left.ordinal - right.ordinal || left.entryId.localeCompare(right.entryId),
      ),
      compiledEntryCount: compileJobs.length,
      compiledEntryIds: compileJobs.map(({ job }) => job.entryId),
    };
  }

  private async executeCompileJobWithoutWorker(job: LightExtensionCompileJob): Promise<LightExtensionCompileResult> {
    const { executeLightExtensionCompileJob } = await import('./LightExtensionCompileJobExecutor');
    return executeLightExtensionCompileJob({ job, workerId: 0, attempt: 1, executingThreadId: 0 });
  }

  private async compileEntryWithoutWorker(
    job: LightExtensionCompileJob,
    input: PreparedEntryCompileInput,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionCompileResult> {
    const compiled = await compileLightExtensionValidatedEntry(
      this.compilerBridge,
      {
        repoId: job.repoId,
        entryId: job.entryId,
        operation: 'runtimeCompile',
        entry: {
          kind: job.kind,
          entryName: job.entryName,
          entryPath: job.entryPath,
          descriptorPath: input.entry.descriptorPath,
        },
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

    return this.compilePreparedCandidateInTransaction(candidate, { ...ctx, transaction });
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
    if (ctx.transaction) {
      return this.compileCurrentRuntimeInTransaction(repoId, commitId, ctx);
    }

    return this.db.sequelize.transaction((transaction) =>
      this.compileCurrentRuntimeInTransaction(repoId, commitId, { ...ctx, transaction }),
    );
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
    const prepared = await this.entryService.prepareEntries(repoId, ctx);
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

    const prepared = await this.entryService.reconcilePreparedCandidate(candidate, ctx);

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
    const compiledEntryIds = new Set(compilePreparation.compiledEntryIds);
    await this.recordPublishedCompileAudits(
      successfulResults.filter((result) => compiledEntryIds.has(result.entryId)),
      ctx,
    );
    const compileEntries = successfulResults.map((result) =>
      toSuccessfulCompileEntryResult(result, compiledEntryIds.has(result.entryId)),
    );
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
      status: compilePreparation.compiledEntryCount === 0 ? 'skipped' : 'success',
      entries: compileEntries,
      diagnostics,
    };
  }
}

function isSqliteBusyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as {
    original?: { code?: unknown };
    parent?: { code?: unknown };
  };
  return candidate.original?.code === 'SQLITE_BUSY' || candidate.parent?.code === 'SQLITE_BUSY';
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function reuseCompiledEntry(
  job: LightExtensionCompileJob,
  input: PreparedEntryCompileInput,
): LightExtensionCompileSuccessResult | null {
  const { entry } = input;
  const artifact = entry.runtimeArtifact;
  if (
    entry.compiledInputKey !== input.compileKey ||
    entry.compilerBuildId !== input.inputManifest.compilerBuildId ||
    entry.runtimeVersion !== input.inputManifest.runtimeVersion ||
    !artifact ||
    artifact.version !== input.inputManifest.runtimeVersion ||
    artifact.entryPath !== entry.entryPath ||
    !entry.runtimeCodeHash ||
    !entry.artifactHash
  ) {
    return null;
  }
  const runtimeCodeHash = buildRunJSRuntimeCodeHash(artifact.code);
  const artifactHash = buildRunJSArtifactHash({
    code: artifact.code,
    sourceMap: artifact.sourceMap,
    version: artifact.version,
    entryPath: artifact.entryPath,
    runtimeContract: input.inputManifest.runtimeContract,
  });
  if (runtimeCodeHash !== entry.runtimeCodeHash || artifactHash !== entry.artifactHash) {
    return null;
  }
  return {
    ...compileResultIdentity(job),
    accepted: true,
    artifact: {
      code: artifact.code,
      ...(artifact.sourceMap ? { sourceMap: artifact.sourceMap } : {}),
      version: artifact.version,
      entryPath: artifact.entryPath,
      filesHash: artifact.filesHash,
      diagnostics: sortDiagnostics(artifact.diagnostics || []),
      metadata: artifact.metadata,
    },
    artifactHash,
    runtimeCodeHash,
    diagnostics: sortDiagnostics(artifact.diagnostics || []),
  };
}

function toSuccessfulCompileEntryResult(
  result: LightExtensionCompileSuccessResult,
  compiled: boolean,
): LightExtensionSaveSourceResult['compile']['entries'][number] {
  return {
    entryId: result.entryId,
    entryName: result.entryName,
    kind: result.kind,
    entryPath: result.entryPath,
    status: 'success',
    execution: compiled ? 'compiled' : 'skipped',
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
  result: LightExtensionCompileFailureResult,
): LightExtensionSaveSourceResult['compile']['entries'][number] {
  return {
    entryId: result.entryId,
    entryName: result.entryName,
    kind: result.kind,
    entryPath: result.entryPath,
    status: 'failed',
    execution: 'compiled',
    diagnostics: result.diagnostics,
    failureCode: result.failureCode,
  };
}

function buildPreparedCompileFingerprint(
  entries: readonly LightExtensionEntryRecord[],
  results: readonly LightExtensionCompileSuccessResult[],
  compilerBuildIdentity: LightExtensionCompilerBuildIdentity,
): string {
  const entryInputs = entries
    .map((entry) => ({
      id: entry.id,
      repoId: entry.repoId,
      target: entry.target,
      kind: entry.kind,
      entryName: entry.entryName,
      entryPath: entry.entryPath,
      descriptorPath: entry.descriptorPath,
      settingsSchemaHash: entry.settingsSchemaHash,
      settingsDefaultsHash: entry.settingsDefaultsHash,
      healthStatus: entry.healthStatus,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const compileInputs = results
    .map((result) => ({
      entryId: result.entryId,
      repoId: result.repoId,
      entryName: result.entryName,
      kind: result.kind,
      entryPath: result.entryPath,
      compileKey: result.compileKey,
      filesHash: result.filesHash,
      compilerBuildId: result.compilerBuildId,
      inputManifest: result.inputManifest,
    }))
    .sort((left, right) => left.entryId.localeCompare(right.entryId));

  return sha256Hex(stableSerialize({ compilerBuildIdentity, entryInputs, compileInputs }));
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
        compileFiles: selectLightExtensionEntryCompileFiles(files, entry).sort((left, right) =>
          left.path.localeCompare(right.path),
        ),
      };
    });
}

async function materializeInitialCompileFiles(
  db: Database,
  inputFiles: readonly LightExtensionTreeEntryInput[],
): Promise<RuntimeCompileSourceFile[]> {
  const preparedTree = await new TreeService(db).prepareTree(inputFiles);
  const blobsByHash = new Map(preparedTree.canonicalBlobs.map((blob) => [blob.hash, blob]));

  return preparedTree.entries.map((entry) => {
    const blob = blobsByHash.get(entry.blobHash);
    if (!blob) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        `Initial source file "${entry.path}" has no canonical content`,
      );
    }
    return {
      path: entry.path,
      content: blob.content,
      blobHash: entry.blobHash,
      language: entry.language,
      mode: entry.mode,
    };
  });
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
