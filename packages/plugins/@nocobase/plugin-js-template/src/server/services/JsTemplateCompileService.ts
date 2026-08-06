/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { stableSerialize } from '@nocobase/runjs';
import { buildRunJSArtifactHash, buildRunJSRuntimeCodeHash, sha256Hex } from '@nocobase/runjs/server';
import { randomUUID } from 'crypto';
import { serialize } from 'node:v8';
import { posix as pathPosix } from 'path';

import {
  JS_TEMPLATE_COLLECTIONS,
  JS_TEMPLATE_ARTIFACT_CONTRACT,
  JS_TEMPLATE_SUPPORTED_KINDS,
  type JsTemplateKind,
} from '../../constants';
import { isJsTemplateError, JsTemplateError } from '../../shared/errors';
import type {
  JsTemplateDiagnostic,
  JsTemplate,
  JsTemplateSaveSourceInput,
  JsTemplateSaveSourceResult,
  JsTemplateTreeEntryInput,
} from '../../shared/types';
import {
  templateFromModel,
  JsTemplateService,
  type JsTemplateReconcilePlan,
  type JsTemplatePreparedTemplates,
} from './JsTemplateService';
import {
  JsTemplateFileService,
  type JsTemplatePreparedSourceCandidate,
  type JsTemplatePreparedSourceSnapshot,
  type JsTemplateReplaceSourceSnapshotInput,
} from './JsTemplateFileService';
import { buildJsTemplateCompileKey, type JsTemplateCompileKeyResult } from './JsTemplateCompileKey';
import {
  JS_TEMPLATE_AUTHORING_SURFACES,
  JS_TEMPLATE_COMPILER_BUILD_IDENTITY,
  compileJsTemplateValidatedTemplate,
  normalizeJsTemplateCompileResult,
  selectJsTemplateCompileFiles,
  validateJsTemplateWorkspace,
  type JsTemplateCompileExecutor,
  type JsTemplateCompileFailureResult,
  type JsTemplateCompileJob,
  type JsTemplateCompileResult,
  type JsTemplateCompileSuccessResult,
  type JsTemplateCompilerBuildIdentity,
} from './JsTemplateCompileContract';
import { JsTemplateAuditService } from './JsTemplateAuditService';
import { assertPreparedCandidateWorkspace, type PreparedCandidateWorkspace } from './PreparedCandidateWorkspace';
import type { JsTemplateServiceContext } from './JsTemplateProjectService';
import { ApplyCompiledTemplatesService } from './ApplyCompiledTemplatesService';
import { JsTemplateValidator, hasErrorDiagnostic, sortDiagnostics } from './JsTemplateValidator';
import { JsTemplateWorkspaceCompilerBridge } from './JsTemplateWorkspaceCompilerBridge';
import { TreeService } from '@nocobase/runjs-workspace/server';

type UsageRefreshService = {
  refreshUsagesForProject: (projectId: string, ctx?: JsTemplateServiceContext, reason?: string) => Promise<unknown>;
};

interface RuntimeCompileSourceFile {
  path: string;
  content?: string;
  blobHash: string;
  language?: string;
  mode?: string;
}

interface PreparedTemplateCompileInput extends JsTemplateCompileKeyResult {
  template: JsTemplate;
  compileFiles: Array<{
    path: string;
    content?: string;
    blobHash: string;
    language?: string;
    mode?: string;
  }>;
}

interface PreparedCompileResults {
  results: JsTemplateCompileResult[];
  compiledTemplateCount: number;
  compiledTemplateIds: string[];
}

export interface JsTemplateCompileServiceOptions {
  auditService?: JsTemplateAuditService;
  compilerBuildIdentity?: JsTemplateCompilerBuildIdentity;
  compileExecutor?: JsTemplateCompileExecutor;
  applyCompiledTemplates?: ApplyCompiledTemplatesService;
  validator?: JsTemplateValidator;
}

interface JsTemplatePreparedCompileState {
  readonly templatePlan: JsTemplateReconcilePlan;
  readonly compileFingerprint: string;
  readonly compileResults: readonly JsTemplateCompileSuccessResult[];
  readonly compileTemplates: ReadonlyArray<JsTemplateSaveSourceResult['compile']['templates'][number]>;
  readonly diagnostics: readonly JsTemplateDiagnostic[];
  readonly compiledTemplateCount: number;
  readonly compiledTemplateIds: readonly string[];
}

export interface JsTemplatePreparedSave extends JsTemplatePreparedCompileState {
  readonly candidate: JsTemplatePreparedSourceCandidate;
}

export interface JsTemplatePreparedInitialWorkspace extends JsTemplatePreparedCompileState {
  readonly projectId: string;
}

export interface JsTemplatePreparedRemoteSnapshot {
  readonly source: JsTemplatePreparedSourceSnapshot;
  readonly preparedSave: JsTemplatePreparedSave | null;
}

export interface JsTemplateInitialWorkspaceApplyResult {
  project: JsTemplateSaveSourceResult['project'];
  status: JsTemplateSaveSourceResult['compile']['status'];
  templates: JsTemplateSaveSourceResult['compile']['templates'];
  diagnostics: JsTemplateDiagnostic[];
}

export class JsTemplateCompileService {
  private usageService?: UsageRefreshService;

  private readonly configuredCompilerBuildIdentity?: JsTemplateCompilerBuildIdentity;

  private readonly compileExecutor?: JsTemplateCompileExecutor;

  private readonly applyCompiledTemplates: ApplyCompiledTemplatesService;

  private readonly preparedSaves = new WeakSet<object>();

  private readonly preparedInitialWorkspaces = new WeakSet<object>();

  private readonly validator: JsTemplateValidator;

  private readonly auditService?: JsTemplateAuditService;

  constructor(
    private readonly db: Database,
    private readonly fileService: JsTemplateFileService,
    private readonly templateService: JsTemplateService,
    private readonly compilerBridge: JsTemplateWorkspaceCompilerBridge,
    options: JsTemplateCompileServiceOptions = {},
  ) {
    this.configuredCompilerBuildIdentity = options.compilerBuildIdentity;
    this.compileExecutor = options.compileExecutor;
    this.auditService = options.auditService;
    this.applyCompiledTemplates = options.applyCompiledTemplates || ApplyCompiledTemplatesService.forDatabase(db);
    this.validator = options.validator || new JsTemplateValidator();
  }

  useJsTemplateUsageService(usageService: UsageRefreshService): void {
    this.usageService = usageService;
  }

  private get compilerBuildIdentity(): JsTemplateCompilerBuildIdentity {
    return (
      this.configuredCompilerBuildIdentity ||
      (typeof this.compilerBridge.getCompilerBuildIdentity === 'function'
        ? this.compilerBridge.getCompilerBuildIdentity()
        : JS_TEMPLATE_COMPILER_BUILD_IDENTITY)
    );
  }

  async saveSource(
    input: JsTemplateSaveSourceInput,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplateSaveSourceResult> {
    if (ctx.transaction) {
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_ERROR',
        'saveSource cannot compile inside an existing transaction; use prepareSaveSource and commitPreparedSave',
      );
    }
    try {
      const prepared = await this.prepareSaveSource(input, ctx);
      for (let attempt = 0; ; attempt += 1) {
        try {
          return await this.db.sequelize.transaction(async (transaction) => {
            const transactionContext = {
              ...ctx,
              transaction,
            };
            const result = await this.commitPreparedSave(prepared, transactionContext);
            await this.recordSaveSuccessAudit(result.project.id, prepared.compileResults, transactionContext);
            return result;
          });
        } catch (error) {
          if (this.db.sequelize.getDialect() !== 'sqlite' || !isSqliteBusyError(error) || attempt >= 2) {
            throw error;
          }
          await delay(100);
        }
      }
    } catch (error) {
      await this.recordSaveFailureAudit(input.projectId, ctx, error);
      throw error;
    }
  }

  async prepareSaveSource(
    input: JsTemplateSaveSourceInput,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplatePreparedSave> {
    return this.prepareSaveSourceInternal(input, ctx);
  }

  private async prepareSaveSourceInternal(
    input: JsTemplateSaveSourceInput,
    ctx: JsTemplateServiceContext,
  ): Promise<JsTemplatePreparedSave> {
    if (ctx.transaction) {
      throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'Save preparation must run outside a database transaction');
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
    input: JsTemplateReplaceSourceSnapshotInput,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplatePreparedRemoteSnapshot> {
    if (ctx.transaction) {
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_ERROR',
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
    input: { projectId: string; files: readonly JsTemplateTreeEntryInput[] },
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplatePreparedInitialWorkspace> {
    if (ctx.transaction) {
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_ERROR',
        'Initial workspace preparation must run outside a database transaction',
      );
    }
    const files = await materializeInitialCompileFiles(this.db, input.files);
    const validation = validateJsTemplateWorkspace(this.validator, files);
    if (hasErrorDiagnostic(validation.diagnostics)) {
      throw new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', 'JS Template initial source is invalid', {
        status: 422,
        details: { diagnostics: validation.diagnostics },
      });
    }
    const templatePlan = await this.templateService.planReconcileTemplates(input.projectId, validation.templates, null);
    const compileState = await this.prepareCompileState(
      input.projectId,
      templatePlan,
      validation.diagnostics,
      files,
      ctx,
    );
    const prepared: JsTemplatePreparedInitialWorkspace = Object.freeze({
      projectId: input.projectId,
      ...compileState,
    });
    this.preparedInitialWorkspaces.add(prepared);
    return prepared;
  }

  private async prepareSaveFromCandidate(
    candidate: JsTemplatePreparedSourceCandidate,
    ctx: JsTemplateServiceContext,
  ): Promise<JsTemplatePreparedSave> {
    const templatePlan = await this.templateService.planReconcileTemplates(
      candidate.project.id,
      candidate.validation.templates,
      candidate.expectedHeadCommitId,
    );
    const compileState = await this.prepareCompileState(
      candidate.project.id,
      templatePlan,
      candidate.validation.diagnostics,
      candidate.vscPreparedPush.candidate.files,
      ctx,
    );
    const prepared: JsTemplatePreparedSave = Object.freeze({ candidate, ...compileState });
    this.preparedSaves.add(prepared);
    return prepared;
  }

  private async prepareCompileState(
    projectId: string,
    templatePlan: JsTemplateReconcilePlan,
    validationDiagnostics: readonly JsTemplateDiagnostic[],
    files: readonly RuntimeCompileSourceFile[],
    ctx: JsTemplateServiceContext,
  ): Promise<JsTemplatePreparedCompileState> {
    const readyInputs = prepareTemplateCompileInputs(templatePlan.result.templates, files, this.compilerBuildIdentity);
    const compilePreparation = await this.prepareCompileResults(projectId, readyInputs, ctx);
    const diagnostics = sortDiagnostics([
      ...validationDiagnostics,
      ...compilePreparation.results.flatMap((result) => result.diagnostics),
    ]);
    const failures = compilePreparation.results.filter((result) => !result.accepted);
    if (failures.length > 0) {
      throw new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', 'JS Template source cannot be compiled', {
        status: 422,
        details: {
          projectId,
          diagnostics,
          templates: failures.map(toFailedCompileTemplateResult),
        },
      });
    }
    const successfulResults = compilePreparation.results as JsTemplateCompileSuccessResult[];
    const compiledTemplateIds = new Set(compilePreparation.compiledTemplateIds);
    const compileTemplates = successfulResults.map((result) =>
      toSuccessfulCompileTemplateResult(result, compiledTemplateIds.has(result.templateId)),
    );
    return Object.freeze({
      templatePlan,
      compileFingerprint: buildPreparedCompileFingerprint(
        templatePlan.result.templates,
        successfulResults,
        this.compilerBuildIdentity,
      ),
      compileResults: Object.freeze(successfulResults.map((result) => Object.freeze(result))),
      compileTemplates: Object.freeze(compileTemplates),
      diagnostics: Object.freeze(diagnostics),
      compiledTemplateCount: compilePreparation.compiledTemplateCount,
      compiledTemplateIds: Object.freeze([...compilePreparation.compiledTemplateIds]),
    });
  }

  async commitPreparedSave(
    prepared: JsTemplatePreparedSave,
    ctx: JsTemplateServiceContext,
  ): Promise<JsTemplateSaveSourceResult> {
    const transaction = ctx.transaction;
    if (!transaction) {
      throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'A transaction is required to commit a save');
    }
    if (!prepared || !this.preparedSaves.has(prepared)) {
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_ERROR',
        'Prepared save must be created by this runtime compile service instance',
      );
    }
    this.assertPreparedCompileFingerprint(prepared);
    const candidate = await this.fileService.commitSourceCandidate(prepared.candidate, ctx);
    await this.templateService.applyReconcilePlan(prepared.templatePlan, transaction);
    await this.applyCompiledTemplates.applyCompiledTemplates(
      {
        commitId: candidate.commit.id,
        results: prepared.compileResults,
      },
      transaction,
    );
    await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).update({
      filterByTk: candidate.project.id,
      values: {
        healthStatus: 'ready',
        ...(prepared.compiledTemplateCount > 0 ? { lastCompiledAt: new Date() } : {}),
      },
      transaction,
    });
    await this.usageService?.refreshUsagesForProject(candidate.project.id, ctx, 'source_committed');
    const [projectRecord, templateModels] = await Promise.all([
      this.db
        .getRepository(JS_TEMPLATE_COLLECTIONS.projects)
        .findOne({ filterByTk: candidate.project.id, transaction }),
      this.db
        .getRepository(JS_TEMPLATE_COLLECTIONS.templates)
        .find({ filter: { projectId: candidate.project.id }, transaction }),
    ]);
    const templates = templateModels.map(templateFromModel);
    return {
      project: withTemplateSummary(projectRecord ? projectFromModelLike(projectRecord) : candidate.project, templates),
      commit: candidate.commit,
      tree: candidate.tree,
      compile: {
        status: prepared.compiledTemplateCount === 0 ? 'skipped' : 'success',
        templates: [...prepared.compileTemplates],
      },
      diagnostics: [...prepared.diagnostics],
    };
  }

  async applyPreparedInitialWorkspace(
    prepared: JsTemplatePreparedInitialWorkspace,
    commitId: string,
    ctx: JsTemplateServiceContext,
  ): Promise<JsTemplateInitialWorkspaceApplyResult> {
    const transaction = ctx.transaction;
    if (!transaction) {
      throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'A transaction is required to apply an initial workspace');
    }
    if (!prepared || !this.preparedInitialWorkspaces.has(prepared)) {
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_ERROR',
        'Prepared initial workspace must be created by this runtime compile service instance',
      );
    }
    this.assertPreparedCompileFingerprint(prepared);
    const projectRecord = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).findOne({
      filterByTk: prepared.projectId,
      transaction,
    });
    if (!projectRecord || projectRecord.get('headCommitId') !== commitId) {
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_OUTDATED',
        'JS Template initial source changed before compiled artifacts were applied',
        { details: { projectId: prepared.projectId, expectedHeadCommitId: commitId } },
      );
    }
    await this.templateService.applyReconcilePlan(prepared.templatePlan, transaction);
    await this.applyCompiledTemplates.applyCompiledTemplates(
      {
        commitId,
        results: prepared.compileResults,
      },
      transaction,
    );
    await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).update({
      filterByTk: prepared.projectId,
      values: {
        healthStatus: 'ready',
        ...(prepared.compiledTemplateCount > 0 ? { lastCompiledAt: new Date() } : {}),
      },
      transaction,
    });
    await this.usageService?.refreshUsagesForProject(prepared.projectId, ctx, 'source_committed');
    const [updatedProjectRecord, templateModels] = await Promise.all([
      this.db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).findOne({ filterByTk: prepared.projectId, transaction }),
      this.db
        .getRepository(JS_TEMPLATE_COLLECTIONS.templates)
        .find({ filter: { projectId: prepared.projectId }, transaction }),
    ]);
    if (!updatedProjectRecord) {
      throw new JsTemplateError('JS_TEMPLATE_PROJECT_NOT_FOUND', 'JS Template project was not found');
    }
    return {
      project: withTemplateSummary(projectFromModelLike(updatedProjectRecord), templateModels.map(templateFromModel)),
      status: prepared.compiledTemplateCount === 0 ? 'skipped' : 'success',
      templates: [...prepared.compileTemplates],
      diagnostics: [...prepared.diagnostics],
    };
  }

  private assertPreparedCompileFingerprint(prepared: JsTemplatePreparedCompileState): void {
    const currentFingerprint = buildPreparedCompileFingerprint(
      prepared.templatePlan.result.templates,
      prepared.compileResults,
      this.compilerBuildIdentity,
    );
    if (currentFingerprint !== prepared.compileFingerprint) {
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_OUTDATED',
        'JS Template compile inputs changed before the prepared workspace was committed',
        { details: { projectId: prepared.templatePlan.projectId } },
      );
    }
  }

  private async recordSaveSuccessAudit(
    projectId: string,
    results: readonly JsTemplateCompileResult[],
    ctx: JsTemplateServiceContext,
  ): Promise<void> {
    if (!this.auditService) {
      return;
    }
    const diagnostics = sortDiagnostics(results.flatMap((result) => result.diagnostics));
    const template = results.length === 1 ? results[0] : undefined;
    await this.auditService.recordCompileEvent({
      projectId,
      templateId: template?.templateId,
      target: 'client',
      kind: template?.kind,
      name: template?.templateName,
      action: 'runtimeCompile',
      result: 'success',
      requestId: template?.requestId || ctx.requestId || randomUUID(),
      actorUserId: ctx.actorUserId,
      entryPath: template?.entryPath,
      runtimeVersion: template?.inputManifest.runtimeVersion,
      diagnosticCount: diagnostics.length,
      errorCount: diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length,
      warningCount: diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length,
      diagnostics,
      message: 'JS Template workspace compiled',
      details: {
        requestSource: ctx.requestSource,
        templateCount: results.length,
        templates: results.map((result) => ({
          templateId: result.templateId,
          templateName: result.templateName,
          kind: result.kind,
          accepted: result.accepted,
        })),
      },
      transaction: ctx.transaction,
    });
  }

  private async recordSaveFailureAudit(
    projectId: string,
    ctx: JsTemplateServiceContext,
    error: unknown,
  ): Promise<void> {
    if (!this.auditService) {
      return;
    }
    try {
      await this.auditService.recordCompileEvent({
        projectId,
        target: 'client',
        action: 'runtimeCompile',
        result: 'blocked',
        requestId: ctx.requestId || randomUUID(),
        actorUserId: ctx.actorUserId,
        diagnosticCount: 0,
        errorCount: 0,
        warningCount: 0,
        message: 'JS Template save rejected',
        reasonCode: isJsTemplateError(error) ? error.code : 'save_failed',
        details: {
          requestSource: ctx.requestSource,
        },
      });
    } catch {
      // The original Save failure must not depend on audit persistence availability.
    }
  }

  private async prepareCompileResults(
    projectId: string,
    readyInputs: PreparedTemplateCompileInput[],
    ctx: JsTemplateServiceContext,
  ): Promise<PreparedCompileResults> {
    const requestId = ctx.requestId || randomUUID();
    const correlationId = randomUUID();
    const preparedJobs = readyInputs.map((input, ordinal) => ({
      input,
      job: createCompileJob(input, {
        projectId,
        requestId,
        correlationId,
        ordinal,
        compilerBuildIdentity: this.compilerBuildIdentity,
      }),
    }));
    const reusedResults: JsTemplateCompileSuccessResult[] = [];
    const compileJobs: typeof preparedJobs = [];
    for (const preparedJob of preparedJobs) {
      const reused = reuseCompiledTemplate(preparedJob.job, preparedJob.input);
      if (reused) {
        reusedResults.push(reused);
      } else {
        compileJobs.push(preparedJob);
      }
    }
    const compileExecutor = this.compileExecutor;
    let compiledResults: JsTemplateCompileResult[];
    if (compileExecutor) {
      compiledResults = await Promise.all(compileJobs.map(({ job }) => compileExecutor.submitWithBackpressure(job)));
    } else {
      // The direct executor path is intentionally serial. Production compile paths use the bounded isolated worker.
      compiledResults = [];
      for (const { job, input } of compileJobs) {
        compiledResults.push(
          this.compilerBridge
            ? await this.compileTemplateWithoutWorker(job, input)
            : await this.executeCompileJobWithoutWorker(job),
        );
      }
    }
    return {
      results: [...reusedResults, ...compiledResults].sort(
        (left, right) => left.ordinal - right.ordinal || left.templateId.localeCompare(right.templateId),
      ),
      compiledTemplateCount: compileJobs.length,
      compiledTemplateIds: compileJobs.map(({ job }) => job.templateId),
    };
  }

  private async executeCompileJobWithoutWorker(job: JsTemplateCompileJob): Promise<JsTemplateCompileResult> {
    const { executeJsTemplateCompileJob } = await import('./JsTemplateCompileJobExecutor');
    return executeJsTemplateCompileJob({ job, workerId: 0, attempt: 1, executingThreadId: 0 });
  }

  private async compileTemplateWithoutWorker(
    job: JsTemplateCompileJob,
    input: PreparedTemplateCompileInput,
  ): Promise<JsTemplateCompileResult> {
    const compiled = await compileJsTemplateValidatedTemplate(this.compilerBridge, {
      projectId: job.projectId,
      templateId: job.templateId,
      operation: 'runtimeCompile',
      template: {
        kind: job.kind,
        templateName: job.templateName,
        entryPath: job.entryPath,
        descriptorPath: input.template.descriptorPath,
      },
      runtimeVersion: job.runtimeVersion,
      files: input.compileFiles,
    });
    return normalizeJsTemplateCompileResult(job, compiled, {
      workerId: 0,
      threadId: 0,
      attempt: 1,
      queueDurationMs: 0,
      runDurationMs: 0,
    });
  }

  async compilePreparedCandidate(
    candidate: PreparedCandidateWorkspace,
    ctx: JsTemplateServiceContext,
  ): Promise<
    Pick<JsTemplateSaveSourceResult['compile'], 'status' | 'templates'> & {
      project: JsTemplateSaveSourceResult['project'];
      diagnostics: JsTemplateDiagnostic[];
    }
  > {
    const transaction = ctx.transaction;
    if (!transaction) {
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_ERROR',
        'A transaction is required to compile a prepared candidate workspace',
      );
    }

    return this.compilePreparedCandidateInTransaction(candidate, { ...ctx, transaction });
  }

  async compileCurrentRuntime(
    projectId: string,
    commitId: string,
    ctx: JsTemplateServiceContext = {},
  ): Promise<
    Pick<JsTemplateSaveSourceResult['compile'], 'status' | 'templates'> & {
      project: JsTemplateSaveSourceResult['project'];
      diagnostics: JsTemplateDiagnostic[];
    }
  > {
    if (ctx.transaction) {
      return this.compileCurrentRuntimeInTransaction(projectId, commitId, ctx);
    }

    return this.db.sequelize.transaction((transaction) =>
      this.compileCurrentRuntimeInTransaction(projectId, commitId, { ...ctx, transaction }),
    );
  }

  private async compileCurrentRuntimeInTransaction(
    projectId: string,
    commitId: string,
    ctx: JsTemplateServiceContext,
  ): Promise<
    Pick<JsTemplateSaveSourceResult['compile'], 'status' | 'templates'> & {
      project: JsTemplateSaveSourceResult['project'];
      diagnostics: JsTemplateDiagnostic[];
    }
  > {
    const prepared = await this.templateService.prepareTemplates(projectId, ctx);
    if (prepared.commitId !== commitId) {
      throw new Error(
        `JS Template project head changed before compile: expected=${commitId}, actual=${prepared.commitId}`,
      );
    }
    const pull = await this.fileService.pullCommit(
      {
        projectId,
        commitId,
        includeContent: 'all',
      },
      {
        ...ctx,
        requestSource: ctx.requestSource || 'js-template-runtime-compile',
      },
    );

    return this.compilePreparedTemplates(projectId, commitId, prepared, pull.files || [], ctx);
  }

  private async compilePreparedCandidateInTransaction(
    candidate: PreparedCandidateWorkspace,
    ctx: JsTemplateServiceContext,
  ): Promise<
    Pick<JsTemplateSaveSourceResult['compile'], 'status' | 'templates'> & {
      project: JsTemplateSaveSourceResult['project'];
      diagnostics: JsTemplateDiagnostic[];
    }
  > {
    const transaction = ctx.transaction;
    if (!transaction) {
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_ERROR',
        'A transaction is required to compile a prepared candidate workspace',
      );
    }
    assertPreparedCandidateWorkspace(candidate, {
      transaction,
      projectId: candidate.project.id,
      commitId: candidate.commit.id,
    });

    const prepared = await this.templateService.reconcilePreparedCandidate(candidate, ctx);

    return this.compilePreparedTemplates(candidate.project.id, candidate.commit.id, prepared, candidate.files, ctx);
  }

  private async compilePreparedTemplates(
    projectId: string,
    commitId: string,
    prepared: JsTemplatePreparedTemplates,
    files: readonly RuntimeCompileSourceFile[],
    ctx: JsTemplateServiceContext,
  ): Promise<
    Pick<JsTemplateSaveSourceResult['compile'], 'status' | 'templates'> & {
      project: JsTemplateSaveSourceResult['project'];
      diagnostics: JsTemplateDiagnostic[];
    }
  > {
    const readyInputs = prepareTemplateCompileInputs(prepared.templates, files, this.compilerBuildIdentity);
    const compilePreparation = await this.prepareCompileResults(projectId, readyInputs, ctx);
    const diagnostics = sortDiagnostics([
      ...prepared.diagnostics,
      ...compilePreparation.results.flatMap((template) => template.diagnostics),
    ]);
    const failures = compilePreparation.results.filter((template) => !template.accepted);
    if (failures.length > 0) {
      throw new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', 'JS Template source cannot be compiled', {
        status: 422,
        details: {
          projectId,
          commitId,
          diagnostics,
          templates: failures.map(toFailedCompileTemplateResult),
        },
      });
    }
    const successfulResults = compilePreparation.results as JsTemplateCompileSuccessResult[];
    await this.applyCompiledTemplates.applyCompiledTemplates(
      {
        commitId,
        results: successfulResults,
      },
      ctx.transaction,
    );
    const compiledTemplateIds = new Set(compilePreparation.compiledTemplateIds);
    const compileTemplates = successfulResults.map((result) =>
      toSuccessfulCompileTemplateResult(result, compiledTemplateIds.has(result.templateId)),
    );
    await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).update({
      filterByTk: projectId,
      values: {
        healthStatus: 'ready',
        ...(compilePreparation.compiledTemplateCount > 0 ? { lastCompiledAt: new Date() } : {}),
      },
      transaction: ctx.transaction,
    });

    const [projectRecord, templateModels] = await Promise.all([
      this.db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).findOne({
        filterByTk: projectId,
        transaction: ctx.transaction,
      }),
      this.db
        .getRepository(JS_TEMPLATE_COLLECTIONS.templates)
        .find({ filter: { projectId }, transaction: ctx.transaction }),
    ]);

    return {
      project: withTemplateSummary(
        projectRecord ? projectFromModelLike(projectRecord) : prepared.project,
        templateModels.map(templateFromModel),
      ),
      status: compilePreparation.compiledTemplateCount === 0 ? 'skipped' : 'success',
      templates: compileTemplates,
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
  input: PreparedTemplateCompileInput,
  context: {
    projectId: string;
    requestId: string;
    correlationId: string;
    ordinal: number;
    compilerBuildIdentity: JsTemplateCompilerBuildIdentity;
  },
): JsTemplateCompileJob {
  if (!isSupportedKind(input.template.kind)) {
    throw new TypeError(`Unsupported js-template kind: ${input.template.kind}`);
  }
  return {
    jobId: randomUUID(),
    requestId: context.requestId,
    correlationId: context.correlationId,
    projectId: context.projectId,
    templateId: input.template.id,
    templateName: input.template.templateName,
    ordinal: context.ordinal,
    compileKey: input.compileKey,
    filesHash: input.filesHash,
    kind: input.template.kind,
    entryPath: input.template.entryPath,
    runtimeVersion: input.inputManifest.runtimeVersion,
    surface: JS_TEMPLATE_AUTHORING_SURFACES[input.template.kind],
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

function compileResultIdentity(job: JsTemplateCompileJob) {
  return {
    jobId: job.jobId,
    requestId: job.requestId,
    correlationId: job.correlationId,
    projectId: job.projectId,
    templateId: job.templateId,
    templateName: job.templateName,
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

function reuseCompiledTemplate(
  job: JsTemplateCompileJob,
  input: PreparedTemplateCompileInput,
): JsTemplateCompileSuccessResult | null {
  const { template } = input;
  const artifact = template.runtimeArtifact;
  if (
    template.compiledInputKey !== input.compileKey ||
    template.compilerBuildId !== input.inputManifest.compilerBuildId ||
    template.runtimeVersion !== input.inputManifest.runtimeVersion ||
    !artifact ||
    artifact.runtimeVersion !== input.inputManifest.runtimeVersion ||
    artifact.entryPath !== template.entryPath ||
    !template.runtimeCodeHash ||
    !template.artifactHash
  ) {
    return null;
  }
  const runtimeCodeHash = buildRunJSRuntimeCodeHash(artifact.code);
  const artifactHash = buildRunJSArtifactHash({
    code: artifact.code,
    sourceMap: artifact.sourceMap,
    version: artifact.runtimeVersion,
    entryPath: artifact.entryPath,
    runtimeContract: input.inputManifest.runtimeContract,
  });
  if (runtimeCodeHash !== template.runtimeCodeHash || artifactHash !== template.artifactHash) {
    return null;
  }
  return {
    ...compileResultIdentity(job),
    accepted: true,
    artifact: {
      code: artifact.code,
      ...(artifact.sourceMap ? { sourceMap: artifact.sourceMap } : {}),
      version: artifact.runtimeVersion,
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

function toSuccessfulCompileTemplateResult(
  result: JsTemplateCompileSuccessResult,
  compiled: boolean,
): JsTemplateSaveSourceResult['compile']['templates'][number] {
  return {
    templateId: result.templateId,
    templateName: result.templateName,
    kind: result.kind,
    entryPath: result.entryPath,
    status: 'success',
    execution: compiled ? 'compiled' : 'skipped',
    diagnostics: result.diagnostics,
    artifact: {
      runtimeVersion: result.artifact.version,
      entryPath: result.artifact.entryPath || result.entryPath,
      filesHash: result.artifact.filesHash,
      metadata: normalizeRecord(result.artifact.metadata),
    },
  };
}

function toFailedCompileTemplateResult(
  result: JsTemplateCompileFailureResult,
): JsTemplateSaveSourceResult['compile']['templates'][number] {
  return {
    templateId: result.templateId,
    templateName: result.templateName,
    kind: result.kind,
    entryPath: result.entryPath,
    status: 'failed',
    execution: 'compiled',
    diagnostics: result.diagnostics,
    failureCode: result.failureCode,
  };
}

function buildPreparedCompileFingerprint(
  templates: readonly JsTemplate[],
  results: readonly JsTemplateCompileSuccessResult[],
  compilerBuildIdentity: JsTemplateCompilerBuildIdentity,
): string {
  const templateInputs = templates
    .map((template) => ({
      id: template.id,
      projectId: template.projectId,
      target: template.target,
      kind: template.kind,
      templateName: template.templateName,
      entryPath: template.entryPath,
      descriptorPath: template.descriptorPath,
      settingsSchemaHash: template.settingsSchemaHash,
      settingsDefaultsHash: template.settingsDefaultsHash,
      healthStatus: template.healthStatus,
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const compileInputs = results
    .map((result) => ({
      templateId: result.templateId,
      projectId: result.projectId,
      templateName: result.templateName,
      kind: result.kind,
      entryPath: result.entryPath,
      compileKey: result.compileKey,
      filesHash: result.filesHash,
      compilerBuildId: result.compilerBuildId,
      inputManifest: result.inputManifest,
    }))
    .sort((left, right) => left.templateId.localeCompare(right.templateId));

  return sha256Hex(stableSerialize({ compilerBuildIdentity, templateInputs, compileInputs }));
}

function prepareTemplateCompileInputs(
  templates: JsTemplate[],
  files: readonly RuntimeCompileSourceFile[],
  compilerBuildIdentity: JsTemplateCompilerBuildIdentity,
): PreparedTemplateCompileInput[] {
  return templates
    .filter((template) => template.healthStatus === 'ready' && isSupportedKind(template.kind))
    .map((template) => {
      const compileKey = buildJsTemplateCompileKey({
        template,
        files,
        runtimeVersion: template.runtimeVersion || 'v2',
        compilerBuildIdentity,
      });
      return {
        ...compileKey,
        template,
        compileFiles: selectJsTemplateCompileFiles(files, template).sort((left, right) =>
          left.path.localeCompare(right.path),
        ),
      };
    });
}

async function materializeInitialCompileFiles(
  db: Database,
  inputFiles: readonly JsTemplateTreeEntryInput[],
): Promise<RuntimeCompileSourceFile[]> {
  const preparedTree = await new TreeService(db).prepareTree(inputFiles);
  const blobsByHash = new Map(preparedTree.canonicalBlobs.map((blob) => [blob.hash, blob]));

  return preparedTree.entries.map((entry) => {
    const blob = blobsByHash.get(entry.blobHash);
    if (!blob) {
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_ERROR',
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

function isSupportedKind(kind: string): kind is JsTemplateKind {
  return (JS_TEMPLATE_SUPPORTED_KINDS as readonly string[]).includes(kind);
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

function projectFromModelLike(record: { get: (key: string) => unknown }): JsTemplateSaveSourceResult['project'] {
  return {
    id: String(record.get('id')),
    name: String(record.get('name')),
    normalizedName: String(record.get('normalizedName')),
    title: nullableString(record.get('title')),
    description: nullableString(record.get('description')),
    lifecycleStatus: record.get('lifecycleStatus') as JsTemplateSaveSourceResult['project']['lifecycleStatus'],
    healthStatus: record.get('healthStatus') as JsTemplateSaveSourceResult['project']['healthStatus'],
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

function withTemplateSummary(
  project: JsTemplateSaveSourceResult['project'],
  templates: JsTemplate[],
): JsTemplateSaveSourceResult['project'] {
  const activeTemplates = templates.filter((template) => template.healthStatus !== 'missing');
  const templateKinds: NonNullable<JsTemplateSaveSourceResult['project']['templateKinds']> = {};
  for (const template of activeTemplates) {
    if (!isSupportedKind(template.kind)) {
      continue;
    }
    templateKinds[template.kind] = (templateKinds[template.kind] || 0) + 1;
  }
  return {
    ...project,
    templateCount: activeTemplates.length,
    templateKinds,
  };
}
