/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';
import { isRunJSEntryDependencyManifestPersistable } from '@nocobase/runjs';
import { buildRunJSEntryDependencyManifestFromGraph } from '@nocobase/runjs/compiler';
import { randomUUID } from 'crypto';
import { posix as pathPosix } from 'path';

import { LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT } from '../../constants';
import { LightExtensionError, isLightExtensionError } from '../../shared/errors';
import type {
  LightExtensionCompilePreviewArtifactSummary,
  LightExtensionCompilePreviewEntryResult,
  LightExtensionCompilePreviewResult,
  LightExtensionDiagnostic,
  LightExtensionEntryRecord,
  LightExtensionPulledFile,
  LightExtensionWorkspacePreviewInput,
  LightExtensionWorkspacePreviewResult,
} from '../../shared/types';
import { LightExtensionAuditService } from './LightExtensionAuditService';
import {
  LightExtensionCanonicalWorkspaceBuilder,
  type CanonicalPreviewWorkspace,
  type CanonicalPreviewWorkspaceFile,
} from './LightExtensionCanonicalWorkspace';
import { buildLightExtensionCompileKey } from './LightExtensionCompileKey';
import {
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  type LightExtensionCompilerBuildIdentity,
} from './LightExtensionCompileContract';
import {
  classifyLightExtensionCompileMetricsError,
  combineLightExtensionCompileMetricsRecorders,
  LightExtensionCompileMetricsProbe,
  type LightExtensionCompileMetricsCollector,
} from './LightExtensionCompileMetrics';
import { entryFromModel } from './LightExtensionEntryService';
import { LightExtensionFileService } from './LightExtensionFileService';
import { LightExtensionPermissionService } from './LightExtensionPermissionService';
import {
  LightExtensionPreviewTicketStore,
  type TrustedPreviewTicketEntry,
  type TrustedPreviewTicketIssueInput,
} from './LightExtensionPreviewTicket';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import {
  LightExtensionEntryValidationResult,
  LightExtensionValidator,
  type LightExtensionWorkspaceValidationResult,
  getWorkspaceLevelDiagnostics,
  hasErrorDiagnostic,
  sortDiagnostics,
  toValidatorFiles,
} from './LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from './LightExtensionWorkspaceCompilerBridge';
import { LightExtensionTrustedCompileCacheService } from './LightExtensionTrustedCompileCacheService';

export interface LightExtensionCompilePreviewInput {
  repoId: string;
  entryIds?: string[];
}

interface LightExtensionCompilePreviewTarget {
  entryId: string | null;
  repoId: string;
  target: 'client';
  kind: string;
  entryName: string;
  entryPath: string | null;
  validationEntry?: LightExtensionEntryValidationResult;
  diagnostics: LightExtensionDiagnostic[];
  missingReason?: 'entry_missing' | 'entry_not_found';
}

export interface LightExtensionCompilePreviewServiceOptions {
  canonicalWorkspaceBuilder?: LightExtensionCanonicalWorkspaceBuilder;
  previewTicketStore?: LightExtensionPreviewTicketStore;
  trustedCompileCache?: LightExtensionTrustedCompileCacheService;
  compilerBuildIdentity?: LightExtensionCompilerBuildIdentity;
}

interface TrustedWorkspacePreviewContext {
  workspace: CanonicalPreviewWorkspace;
  baseFiles: readonly LightExtensionPulledFile[];
  baseHeadCommitId: string | null;
  actorId: string;
  ticketStore: LightExtensionPreviewTicketStore;
  compileCache: LightExtensionTrustedCompileCacheService;
  compilerBuildIdentity: LightExtensionCompilerBuildIdentity;
}

export class LightExtensionCompilePreviewService {
  private readonly canonicalWorkspaceBuilder: LightExtensionCanonicalWorkspaceBuilder;

  private readonly options: LightExtensionCompilePreviewServiceOptions;

  constructor(
    private readonly db: Database,
    private readonly auditService: LightExtensionAuditService,
    private readonly fileService: LightExtensionFileService,
    private readonly permissionService: LightExtensionPermissionService,
    private readonly compilerBridge: LightExtensionWorkspaceCompilerBridge,
    private readonly validator = new LightExtensionValidator(),
    private readonly metricsCollector?: LightExtensionCompileMetricsCollector,
    options: LightExtensionCompilePreviewServiceOptions = {},
  ) {
    this.options = options;
    this.canonicalWorkspaceBuilder =
      options.canonicalWorkspaceBuilder || new LightExtensionCanonicalWorkspaceBuilder(db);
  }

  async compilePreview(
    input: LightExtensionCompilePreviewInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionCompilePreviewResult> {
    const requestId = ctx.requestId || randomUUID();
    const previewContext = {
      ...ctx,
      requestId,
      requestSource: ctx.requestSource || 'light-extension-compile-preview',
    };

    try {
      await this.permissionService.assertActionAllowed({
        action: 'compilePreview',
        ctx: previewContext,
      });
    } catch (error) {
      await this.recordPreviewPermissionDenied(input.repoId, previewContext, error);
      throw error;
    }

    const pull = await this.fileService.pull(
      {
        repoId: input.repoId,
        includeContent: 'all',
      },
      previewContext,
    );
    const validation = this.validator.validateWorkspace({
      files: toValidatorFiles(pull.files || []),
    });
    const workspaceDiagnostics = getWorkspaceLevelDiagnostics(validation.diagnostics);
    const persistedEntries = await this.listPersistedEntries(input.repoId, previewContext);
    const targets = buildPreviewTargets(input, validation.entries, persistedEntries);

    if (hasErrorDiagnostic(workspaceDiagnostics)) {
      const sortedWorkspaceDiagnostics = sortDiagnostics(workspaceDiagnostics);
      await this.recordPreviewValidationBlocked(input, previewContext, sortedWorkspaceDiagnostics, targets.length);
      const entries = targets.map((target) => buildWorkspaceBlockedEntryResult(target, sortedWorkspaceDiagnostics));
      for (const entry of entries) {
        await this.recordEntryValidationBlocked(entry, previewContext, 'validation_failed');
      }

      return {
        repo: pull.repo,
        commitId: pull.commit?.id || null,
        accepted: false,
        diagnostics: sortUniqueDiagnostics([
          ...sortedWorkspaceDiagnostics,
          ...entries.flatMap((entry) => entry.diagnostics),
        ]),
        entries,
      };
    }

    const entries: LightExtensionCompilePreviewEntryResult[] = [];
    for (const target of targets) {
      if (!target.validationEntry || hasErrorDiagnostic(target.diagnostics)) {
        const failed = buildSkippedEntryResult(target);
        entries.push(failed);
        await this.recordEntryValidationBlocked(failed, previewContext, target.missingReason || 'validation_failed');
        continue;
      }

      const compiled = await this.compilerBridge.compileEntry(
        {
          repoId: input.repoId,
          entryId: target.entryId,
          kind: target.validationEntry.kind,
          entryName: target.validationEntry.entryName,
          entryPath: target.validationEntry.entryPath,
          files: getEntryCompileFiles(pull.files || [], target.validationEntry),
        },
        previewContext,
      );
      entries.push({
        entryId: target.entryId,
        repoId: input.repoId,
        target: 'client',
        kind: target.validationEntry.kind,
        entryName: target.validationEntry.entryName,
        entryPath: target.validationEntry.entryPath,
        status: compiled.accepted ? 'success' : 'failed',
        accepted: compiled.accepted,
        diagnostics: sortDiagnostics([...target.diagnostics, ...compiled.diagnostics]),
        failureCode: compiled.failureCode,
        artifact: compiled.accepted
          ? summarizeArtifact(compiled.artifact, target.validationEntry.entryPath)
          : undefined,
      });
    }

    const diagnostics = sortUniqueDiagnostics([
      ...workspaceDiagnostics,
      ...entries.flatMap((entry) => entry.diagnostics),
    ]);

    return {
      repo: pull.repo,
      commitId: pull.commit?.id || null,
      accepted: !hasErrorDiagnostic(diagnostics) && entries.every((entry) => entry.accepted),
      diagnostics,
      entries,
    };
  }

  async compileWorkspacePreview(
    input: LightExtensionWorkspacePreviewInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionWorkspacePreviewResult> {
    const probe = new LightExtensionCompileMetricsProbe('workspacePreview', this.metricsCollector);
    const compileMetrics = combineLightExtensionCompileMetricsRecorders(ctx.compileMetrics, probe);
    let result: 'success' | 'rejected' | 'failed' | 'outdated' = 'failed';
    try {
      const preview = await this.compileWorkspacePreviewWithMetrics(input, { ...ctx, compileMetrics });
      result = preview.accepted ? 'success' : 'rejected';
      return preview;
    } catch (error) {
      result = classifyLightExtensionCompileMetricsError(error);
      throw error;
    } finally {
      await probe.finish(result);
    }
  }

  private async compileWorkspacePreviewWithMetrics(
    input: LightExtensionWorkspacePreviewInput,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionWorkspacePreviewResult> {
    const requestId = ctx.requestId || randomUUID();
    const previewContext = {
      ...ctx,
      requestId,
      requestSource: ctx.requestSource || 'light-extension-workspace-preview',
    };

    try {
      await this.permissionService.assertActionAllowed({
        action: 'compilePreview',
        ctx: previewContext,
      });
    } catch (error) {
      await this.recordPreviewPermissionDenied(input.repoId, previewContext, error);
      throw error;
    }

    const trustedPreview = input.issueSaveTicket
      ? await this.prepareTrustedWorkspacePreview(input, previewContext)
      : undefined;
    const previewFiles = trustedPreview?.workspace.files || input.files;
    let previewByteSize = 0;
    for (const file of previewFiles) {
      previewByteSize += Buffer.byteLength(file.content, 'utf8');
    }
    previewContext.compileMetrics?.set('repoFileCount', previewFiles.length);
    previewContext.compileMetrics?.set('repoByteSize', previewByteSize);
    previewContext.compileMetrics?.increment('snapshotMaterializationCount');
    const validation = previewContext.compileMetrics
      ? previewContext.compileMetrics.measure('workspaceValidation', () =>
          this.validator.validateWorkspace({
            files: previewFiles.map((file) => ({ ...file })),
          }),
        )
      : this.validator.validateWorkspace({
          files: previewFiles.map((file) => ({ ...file })),
        });
    previewContext.compileMetrics?.set('entryCount', validation.entries.length);
    const targetKind = input.kind;
    const targetEntryPath = input.entryPath?.trim();
    if (!targetKind && !targetEntryPath) {
      previewContext.compileMetrics?.set('affectedEntryCount', validation.entries.length);
      return this.compileWholeWorkspacePreview(input, validation, previewFiles, previewContext, trustedPreview);
    }
    if (!targetKind || !targetEntryPath) {
      previewContext.compileMetrics?.set('affectedEntryCount', 0);
      previewContext.compileMetrics?.increment('skippedEntryCount');
      const diagnostics = [
        {
          code: 'light_extension_preview_target_incomplete',
          severity: 'error',
          message: 'Light extension workspace preview must include both kind and entryPath when targeting an entry',
          path: input.entryPath,
          kind: input.kind,
        } satisfies LightExtensionDiagnostic,
      ];
      return {
        accepted: false,
        httpStatus: 422,
        diagnostics,
        failureCode: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      };
    }

    const workspaceDiagnostics = getWorkspaceLevelDiagnostics(validation.diagnostics);
    const normalizedEntryPath = normalizeSourcePath(targetEntryPath);
    const validationEntry = validation.entries.find(
      (entry) => entry.kind === targetKind && normalizeSourcePath(entry.entryPath) === normalizedEntryPath,
    );
    const entryDiagnostics = validationEntry
      ? validationEntry.diagnostics
      : [
          {
            code: 'entry_not_found',
            severity: 'error',
            message: `Light extension entry source "${normalizedEntryPath}" was not found`,
            path: normalizedEntryPath,
            kind: targetKind,
            entryName: inferEntryName(normalizedEntryPath),
          } satisfies LightExtensionDiagnostic,
        ];
    const validationDiagnostics = sortUniqueDiagnostics([...workspaceDiagnostics, ...entryDiagnostics]);
    previewContext.compileMetrics?.set('affectedEntryCount', validationEntry ? 1 : 0);

    if (!validationEntry || hasErrorDiagnostic(validationDiagnostics)) {
      previewContext.compileMetrics?.increment('skippedEntryCount');
      await this.recordCompileAuditBestEffort({
        repoId: input.repoId,
        entryId: input.entryId,
        target: 'client',
        kind: targetKind,
        name: validationEntry?.entryName || inferEntryName(normalizedEntryPath),
        entryPath: normalizedEntryPath,
        ctx: previewContext,
        result: 'blocked',
        reasonCode: validationEntry ? 'validation_failed' : 'entry_not_found',
        diagnostics: validationDiagnostics,
        message: 'Light extension workspace preview validation failed',
        details: {
          requestSource: previewContext.requestSource,
        },
      });
      return {
        accepted: false,
        httpStatus: 422,
        diagnostics: validationDiagnostics,
        failureCode: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      };
    }

    previewContext.compileMetrics?.increment('compiledEntryCount');
    const compileEntry = () =>
      this.compilerBridge.compileEntry(
        {
          repoId: input.repoId,
          entryId: input.entryId,
          operation: 'compilePreview',
          kind: validationEntry.kind,
          entryName: validationEntry.entryName,
          entryPath: validationEntry.entryPath,
          runtimeVersion: input.runtimeVersion,
          files: getEntryCompileFiles(previewFiles, validationEntry),
        },
        previewContext,
      );
    const compiled = previewContext.compileMetrics
      ? await previewContext.compileMetrics.measureAsync('compileEntries', compileEntry)
      : await compileEntry();
    const diagnostics = sortUniqueDiagnostics([...validationDiagnostics, ...compiled.diagnostics]);

    return {
      accepted: compiled.accepted && !hasErrorDiagnostic(diagnostics),
      httpStatus: compiled.accepted && !hasErrorDiagnostic(diagnostics) ? 200 : 422,
      diagnostics,
      failureCode: compiled.failureCode,
      artifact: compiled.accepted
        ? {
            code: compiled.artifact.code,
            sourceMap: compiled.artifact.sourceMap,
            version: compiled.artifact.version,
            entryPath: compiled.artifact.entryPath || validationEntry.entryPath,
            filesHash: compiled.artifact.filesHash,
            diagnostics,
            metadata: compiled.artifact.metadata,
          }
        : undefined,
    };
  }

  private async compileWholeWorkspacePreview(
    input: LightExtensionWorkspacePreviewInput,
    validation: LightExtensionWorkspaceValidationResult,
    files: readonly CanonicalPreviewWorkspaceFile[] | LightExtensionWorkspacePreviewInput['files'],
    ctx: LightExtensionServiceContext,
    trustedPreview?: TrustedWorkspacePreviewContext,
  ): Promise<LightExtensionWorkspacePreviewResult> {
    const workspaceDiagnostics = getWorkspaceLevelDiagnostics(validation.diagnostics);
    const persistedEntries = await this.listPersistedEntries(input.repoId, ctx);
    const persistedEntryIds = new Map(
      persistedEntries.map((entry) => [`${entry.kind}:${entry.entryName}`, entry.id] as const),
    );
    const entries: LightExtensionCompilePreviewEntryResult[] = [];
    const ticketEntries: TrustedPreviewTicketEntry[] = [];

    for (const validationEntry of validation.entries) {
      const validationDiagnostics = sortUniqueDiagnostics([...workspaceDiagnostics, ...validationEntry.diagnostics]);
      const entryId = persistedEntryIds.get(`${validationEntry.kind}:${validationEntry.entryName}`) || null;
      const persistedEntry = persistedEntries.find(
        (entry) => entry.kind === validationEntry.kind && entry.entryName === validationEntry.entryName,
      );
      if (hasErrorDiagnostic(validationDiagnostics)) {
        ctx.compileMetrics?.increment('skippedEntryCount');
        entries.push({
          entryId,
          repoId: input.repoId,
          target: 'client',
          kind: validationEntry.kind,
          entryName: validationEntry.entryName,
          entryPath: validationEntry.entryPath,
          status: 'failed',
          accepted: false,
          diagnostics: validationDiagnostics,
          failureCode: 'LIGHT_EXTENSION_VALIDATION_FAILED',
        });
        continue;
      }

      ctx.compileMetrics?.increment('compiledEntryCount');
      const runtimeVersion = input.runtimeVersion || persistedEntry?.runtimeVersion || 'v2';
      const compileEntry = () =>
        this.compilerBridge.compileEntry(
          {
            repoId: input.repoId,
            entryId,
            operation: 'compilePreview',
            kind: validationEntry.kind,
            entryName: validationEntry.entryName,
            entryPath: validationEntry.entryPath,
            runtimeVersion,
            files: getEntryCompileFiles(files, validationEntry),
          },
          ctx,
        );
      const compiled = ctx.compileMetrics
        ? await ctx.compileMetrics.measureAsync('compileEntries', compileEntry)
        : await compileEntry();
      const diagnostics = sortUniqueDiagnostics([...validationDiagnostics, ...compiled.diagnostics]);
      const accepted = compiled.accepted && !hasErrorDiagnostic(diagnostics);
      if (accepted && trustedPreview) {
        const compileInput = buildLightExtensionCompileKey({
          entry: {
            target: 'client',
            kind: validationEntry.kind,
            entryPath: validationEntry.entryPath,
            descriptorPath: validationEntry.descriptorPath,
          },
          files: trustedPreview.workspace.files,
          runtimeVersion,
          compilerBuildIdentity: trustedPreview.compilerBuildIdentity,
        });
        if (!compiled.dependencyGraph) {
          throw new Error('RunJS compiler did not return a dependency graph for an accepted preview compile');
        }
        const dependency = buildRunJSEntryDependencyManifestFromGraph({
          compilerBuildId: trustedPreview.compilerBuildIdentity.compilerBuildId,
          entryPath: validationEntry.entryPath,
          files: getEntryCompileFiles(trustedPreview.workspace.files, validationEntry).map((file) => ({
            path: file.path,
            content: file.content || '',
            blobHash: file.blobHash,
          })),
          graph: compiled.dependencyGraph,
        });
        const persistDependencyManifest = isRunJSEntryDependencyManifestPersistable(dependency.manifest);
        const persisted = await trustedPreview.compileCache.persistAcceptedCompile({
          compileKey: compileInput.compileKey,
          filesHash: compileInput.filesHash,
          inputManifest: compileInput.inputManifest,
          artifact: compiled.artifact,
          diagnostics,
          dependencyManifest: persistDependencyManifest ? dependency.manifest : undefined,
          dependencyManifestHash: persistDependencyManifest ? dependency.manifestHash : undefined,
        });
        ticketEntries.push({
          target: 'client',
          kind: validationEntry.kind,
          entryName: validationEntry.entryName,
          entryId,
          entryPath: validationEntry.entryPath,
          compileKey: compileInput.compileKey,
          filesHash: compileInput.filesHash,
          artifactHash: persisted.artifactHash,
          artifactFilesHash: persisted.artifactFilesHash,
          runtimeVersion,
        });
      }
      entries.push({
        entryId,
        repoId: input.repoId,
        target: 'client',
        kind: validationEntry.kind,
        entryName: validationEntry.entryName,
        entryPath: validationEntry.entryPath,
        status: compiled.accepted ? 'success' : 'failed',
        accepted,
        diagnostics,
        failureCode: compiled.failureCode,
        artifact: compiled.accepted ? summarizeArtifact(compiled.artifact, validationEntry.entryPath) : undefined,
      });
    }

    const diagnostics = sortUniqueDiagnostics([
      ...workspaceDiagnostics,
      ...entries.flatMap((entry) => entry.diagnostics),
    ]);
    const accepted = !hasErrorDiagnostic(diagnostics) && entries.every((entry) => entry.accepted);
    const ticket =
      accepted && trustedPreview && ticketEntries.length === validation.entries.length
        ? await trustedPreview.ticketStore.issue(
            buildTicketIssueInput({
              input,
              trustedPreview,
              persistedEntries,
              validation,
              ticketEntries,
              diagnostics,
            }),
          )
        : undefined;

    return {
      accepted,
      httpStatus: accepted ? 200 : entries.some((entry) => entry.accepted) ? 207 : 422,
      diagnostics,
      entries,
      ticket,
      failureCode: accepted
        ? undefined
        : entries.find((entry) => !entry.accepted)?.failureCode || 'LIGHT_EXTENSION_VALIDATION_FAILED',
    };
  }

  private async prepareTrustedWorkspacePreview(
    input: LightExtensionWorkspacePreviewInput,
    ctx: LightExtensionServiceContext,
  ): Promise<TrustedWorkspacePreviewContext> {
    if (input.kind || input.entryPath) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_INVALID_INPUT',
        'Trusted preview tickets are available only for whole-workspace preview',
      );
    }
    if (typeof input.expectedHeadCommitId === 'undefined') {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_INVALID_INPUT',
        'expectedHeadCommitId is required when issueSaveTicket is true',
      );
    }
    if (!ctx.actorUserId) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_PERMISSION_DENIED',
        'Trusted preview tickets require an authenticated actor',
      );
    }
    const ticketStore = this.options.previewTicketStore;
    const compileCache = this.options.trustedCompileCache;
    if (!ticketStore || !compileCache) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_RUNTIME_UNAVAILABLE',
        'Trusted preview ticket service is unavailable',
      );
    }

    const base = await this.fileService.pull(
      {
        repoId: input.repoId,
        includeContent: 'none',
      },
      ctx,
    );
    assertExpectedPreviewHead(input.expectedHeadCommitId, base.repo.headCommitId, input.repoId);
    const workspace = await this.canonicalWorkspaceBuilder.build(input.files);
    return {
      workspace,
      baseFiles: base.files || [],
      baseHeadCommitId: input.expectedHeadCommitId,
      actorId: ctx.actorUserId,
      ticketStore,
      compileCache,
      compilerBuildIdentity:
        this.options.compilerBuildIdentity ||
        (typeof this.compilerBridge.getCompilerBuildIdentity === 'function'
          ? this.compilerBridge.getCompilerBuildIdentity()
          : LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY),
    };
  }

  private async listPersistedEntries(
    repoId: string,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionEntryRecord[]> {
    const records = await this.db.getRepository('lightExtensionEntries').find({
      filter: {
        repoId,
      },
      sort: ['target', 'kind', 'entryName'],
      transaction: ctx.transaction,
    });

    return records.map((record: Model) => entryFromModel(record));
  }

  private async recordPreviewPermissionDenied(
    repoId: string,
    ctx: LightExtensionServiceContext,
    error: unknown,
  ): Promise<void> {
    if (!isLightExtensionError(error)) {
      return;
    }

    await this.recordCompileAuditBestEffort({
      repoId,
      ctx,
      result: 'blocked',
      reasonCode: 'permission_denied',
      diagnostics: [
        {
          code: error.code,
          severity: 'error',
          message: error.message,
        },
      ],
      message: 'Light extension compile preview permission denied',
      details: {
        requestSource: ctx.requestSource,
      },
    });
  }

  private async recordPreviewValidationBlocked(
    input: LightExtensionCompilePreviewInput,
    ctx: LightExtensionServiceContext,
    diagnostics: LightExtensionDiagnostic[],
    entryCount: number,
  ): Promise<void> {
    await this.recordCompileAuditBestEffort({
      repoId: input.repoId,
      ctx,
      result: 'blocked',
      reasonCode: 'validation_failed',
      diagnostics,
      message: 'Light extension compile preview workspace validation failed',
      details: {
        requestSource: ctx.requestSource,
        entryCount,
        selectedEntryCount: input.entryIds?.length,
      },
    });
  }

  private async recordEntryValidationBlocked(
    entry: LightExtensionCompilePreviewEntryResult,
    ctx: LightExtensionServiceContext,
    reasonCode: string,
  ): Promise<void> {
    await this.recordCompileAuditBestEffort({
      repoId: entry.repoId,
      entryId: entry.entryId,
      target: entry.target,
      kind: entry.kind,
      name: entry.entryName,
      entryPath: entry.entryPath || undefined,
      ctx,
      result: 'blocked',
      reasonCode,
      diagnostics: entry.diagnostics,
      message: 'Light extension compile preview entry validation failed',
      details: {
        requestSource: ctx.requestSource,
      },
    });
  }

  private async recordCompileAuditBestEffort(input: {
    repoId: string;
    entryId?: string | null;
    target?: string;
    kind?: string;
    name?: string;
    entryPath?: string;
    ctx: LightExtensionServiceContext;
    result: 'success' | 'blocked';
    reasonCode?: string;
    diagnostics: LightExtensionDiagnostic[];
    message: string;
    details?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const errorCount = input.diagnostics.filter((item) => item.severity === 'error').length;
      const warningCount = input.diagnostics.filter((item) => item.severity === 'warning').length;
      await this.auditService.recordCompileEvent({
        repoId: input.repoId,
        entryId: input.entryId,
        target: input.target,
        kind: input.kind,
        name: input.name,
        action: 'compilePreview',
        result: input.result,
        requestId: input.ctx.requestId || randomUUID(),
        actorUserId: input.ctx.actorUserId,
        entryPath: input.entryPath,
        diagnosticCount: input.diagnostics.length,
        errorCount,
        warningCount,
        diagnostics: input.diagnostics,
        reasonCode: input.reasonCode,
        message: input.message,
        details: input.details,
        transaction: input.ctx.transaction,
      });
    } catch {
      // Preview diagnostics must not depend on audit persistence availability.
    }
  }
}

function buildPreviewTargets(
  input: LightExtensionCompilePreviewInput,
  validationEntries: LightExtensionEntryValidationResult[],
  persistedEntries: LightExtensionEntryRecord[],
): LightExtensionCompilePreviewTarget[] {
  const persistedById = new Map(persistedEntries.map((entry) => [entry.id, entry]));
  const persistedByKey = new Map(persistedEntries.map((entry) => [entryKey(entry), entry]));
  const validationByKey = new Map(validationEntries.map((entry) => [entryKey(entry), entry]));

  if (input.entryIds?.length) {
    return input.entryIds.map((entryId) => {
      const persisted = persistedById.get(entryId);
      if (!persisted) {
        return buildUnknownEntryTarget(input.repoId, entryId);
      }

      const validationEntry = validationByKey.get(entryKey(persisted));
      if (!validationEntry) {
        return buildMissingPersistedEntryTarget(persisted);
      }

      return buildValidationEntryTarget(input.repoId, validationEntry, persisted);
    });
  }

  const targets = validationEntries.map((entry) =>
    buildValidationEntryTarget(input.repoId, entry, persistedByKey.get(entryKey(entry))),
  );
  const validationKeys = new Set(validationEntries.map(entryKey));
  for (const persisted of persistedEntries) {
    if (!validationKeys.has(entryKey(persisted))) {
      targets.push(buildMissingPersistedEntryTarget(persisted));
    }
  }

  return targets.sort((left, right) =>
    [left.target, left.kind, left.entryName, left.entryId || '']
      .join('\u0000')
      .localeCompare([right.target, right.kind, right.entryName, right.entryId || ''].join('\u0000')),
  );
}

function buildValidationEntryTarget(
  repoId: string,
  validationEntry: LightExtensionEntryValidationResult,
  persisted?: LightExtensionEntryRecord,
): LightExtensionCompilePreviewTarget {
  return {
    entryId: persisted?.id || null,
    repoId,
    target: 'client',
    kind: validationEntry.kind,
    entryName: validationEntry.entryName,
    entryPath: validationEntry.entryPath,
    validationEntry,
    diagnostics: validationEntry.diagnostics,
  };
}

function buildMissingPersistedEntryTarget(entry: LightExtensionEntryRecord): LightExtensionCompilePreviewTarget {
  const diagnostic = {
    code: 'entry_missing',
    severity: 'error',
    message: 'Entry source files were not found during compile preview',
    path: entry.entryPath,
    kind: entry.kind,
    entryName: entry.entryName,
  } satisfies LightExtensionDiagnostic;

  return {
    entryId: entry.id,
    repoId: entry.repoId,
    target: 'client',
    kind: entry.kind,
    entryName: entry.entryName,
    entryPath: entry.entryPath,
    diagnostics: [diagnostic],
    missingReason: 'entry_missing',
  };
}

function buildUnknownEntryTarget(repoId: string, entryId: string): LightExtensionCompilePreviewTarget {
  const diagnostic = {
    code: 'entry_not_found',
    severity: 'error',
    message: `Light extension entry "${entryId}" was not found`,
    entryName: entryId,
  } satisfies LightExtensionDiagnostic;

  return {
    entryId,
    repoId,
    target: 'client',
    kind: 'unknown',
    entryName: entryId,
    entryPath: null,
    diagnostics: [diagnostic],
    missingReason: 'entry_not_found',
  };
}

function buildSkippedEntryResult(target: LightExtensionCompilePreviewTarget): LightExtensionCompilePreviewEntryResult {
  return {
    entryId: target.entryId,
    repoId: target.repoId,
    target: target.target,
    kind: target.kind,
    entryName: target.entryName,
    entryPath: target.entryPath,
    status: 'skipped',
    accepted: false,
    diagnostics: sortDiagnostics(target.diagnostics),
  };
}

function buildWorkspaceBlockedEntryResult(
  target: LightExtensionCompilePreviewTarget,
  workspaceDiagnostics: LightExtensionDiagnostic[],
): LightExtensionCompilePreviewEntryResult {
  return {
    entryId: target.entryId,
    repoId: target.repoId,
    target: target.target,
    kind: target.kind,
    entryName: target.entryName,
    entryPath: target.entryPath,
    status: target.validationEntry ? 'failed' : 'skipped',
    accepted: false,
    diagnostics: sortDiagnostics([...target.diagnostics, ...workspaceDiagnostics]),
    failureCode: 'LIGHT_EXTENSION_VALIDATION_FAILED',
  };
}

function getEntryCompileFiles(
  files: readonly (Pick<LightExtensionPulledFile, 'content' | 'path'> &
    Partial<Pick<LightExtensionPulledFile, 'blobHash' | 'language'>>)[],
  entry: LightExtensionEntryValidationResult,
) {
  const rootPath = getEntryRootPath(entry);

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
    }));
}

function buildTicketIssueInput(input: {
  input: LightExtensionWorkspacePreviewInput;
  trustedPreview: TrustedWorkspacePreviewContext;
  persistedEntries: LightExtensionEntryRecord[];
  validation: LightExtensionWorkspaceValidationResult;
  ticketEntries: TrustedPreviewTicketEntry[];
  diagnostics: LightExtensionDiagnostic[];
}): TrustedPreviewTicketIssueInput {
  const validationIdentities = input.validation.entries.map(toTrustedEntryIdentity).sort(compareTrustedIdentities);
  const validationIdentityKeys = new Set(validationIdentities.map(trustedIdentityKey));
  const removedEntries = input.persistedEntries
    .filter((entry) => !validationIdentityKeys.has(trustedIdentityKey(entry)))
    .map(toTrustedEntryIdentity)
    .sort(compareTrustedIdentities);
  const changedPaths = collectChangedPaths(input.trustedPreview.baseFiles, input.trustedPreview.workspace.files);
  return {
    repoId: input.input.repoId,
    baseHeadCommitId: input.trustedPreview.baseHeadCommitId,
    actorId: input.trustedPreview.actorId,
    workspaceDigest: input.trustedPreview.workspace.workspaceDigest,
    candidateTreeHash: input.trustedPreview.workspace.treeHash,
    compilerBuildId: input.trustedPreview.compilerBuildIdentity.compilerBuildId,
    runtimeContract: LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
    compilePlan: {
      changedFileCount: changedPaths.length,
      affectedEntryCount: validationIdentities.length,
      compileCandidates: validationIdentities,
      metadataOnlyEntries: [],
      removedEntries,
    },
    entries: [...input.ticketEntries].sort(compareTrustedIdentities),
    diagnostics: input.diagnostics.map((diagnostic) => ({
      code: diagnostic.code,
      severity: diagnostic.severity,
      path: diagnostic.path,
      kind: diagnostic.kind,
      entryName: diagnostic.entryName,
    })),
  };
}

function collectChangedPaths(
  baseFiles: readonly Pick<LightExtensionPulledFile, 'path' | 'blobHash' | 'language' | 'mode'>[],
  candidateFiles: readonly Pick<CanonicalPreviewWorkspaceFile, 'path' | 'blobHash' | 'language' | 'mode'>[],
): string[] {
  const baseByPath = new Map(baseFiles.map((file) => [file.path, file] as const));
  const candidateByPath = new Map(candidateFiles.map((file) => [file.path, file] as const));
  const paths = new Set([...baseByPath.keys(), ...candidateByPath.keys()]);
  return [...paths]
    .filter((path) => {
      const base = baseByPath.get(path);
      const candidate = candidateByPath.get(path);
      return (
        !base ||
        !candidate ||
        base.blobHash !== candidate.blobHash ||
        base.language !== candidate.language ||
        base.mode !== candidate.mode
      );
    })
    .sort();
}

function toTrustedEntryIdentity(entry: { target?: string; kind: string; entryName: string }) {
  return {
    target: 'client' as const,
    kind: entry.kind as TrustedPreviewTicketEntry['kind'],
    entryName: entry.entryName,
  };
}

function compareTrustedIdentities(
  left: { target: string; kind: string; entryName: string },
  right: { target: string; kind: string; entryName: string },
): number {
  return trustedIdentityKey(left).localeCompare(trustedIdentityKey(right));
}

function trustedIdentityKey(entry: { target?: string; kind: string; entryName: string }): string {
  return `${entry.target || 'client'}\0${entry.kind}\0${entry.entryName}`;
}

function assertExpectedPreviewHead(
  expectedHeadCommitId: string | null,
  currentHeadCommitId: string | null,
  repoId: string,
): void {
  if (expectedHeadCommitId === currentHeadCommitId) {
    return;
  }
  throw new LightExtensionError(
    'LIGHT_EXTENSION_SOURCE_OUTDATED',
    'Light extension source changed after the workspace was opened',
    {
      details: {
        repoId,
        expectedHeadCommitId,
        currentHeadCommitId,
      },
    },
  );
}

function getEntryRootPath(entry: LightExtensionEntryValidationResult): string {
  const normalized = normalizeSourcePath(entry.entryPath);
  return pathPosix.extname(normalized) ? pathPosix.dirname(normalized) : normalized;
}

function summarizeArtifact(
  input: {
    version: string;
    entryPath?: string;
    filesHash?: string;
    metadata?: Record<string, unknown>;
  },
  fallbackEntryPath: string,
): LightExtensionCompilePreviewArtifactSummary {
  return {
    version: input.version,
    entryPath: input.entryPath || fallbackEntryPath,
    filesHash: input.filesHash,
    metadata: input.metadata,
  };
}

function entryKey(entry: { target?: string; kind: string; entryName: string }): string {
  return `${entry.target || 'client'}:${entry.kind}:${entry.entryName}`;
}

function sortUniqueDiagnostics(diagnostics: LightExtensionDiagnostic[]): LightExtensionDiagnostic[] {
  const unique = new Map<string, LightExtensionDiagnostic>();
  for (const item of diagnostics) {
    unique.set(diagnosticKey(item), item);
  }

  return sortDiagnostics([...unique.values()]);
}

function diagnosticKey(input: LightExtensionDiagnostic): string {
  return [
    input.code,
    input.severity,
    input.path || '',
    input.kind || '',
    input.entryName || '',
    input.line || '',
    input.column || '',
  ].join('\u0000');
}

function normalizeSourcePath(path: string): string {
  return pathPosix.normalize(path.trim()).replace(/^\.\/+/, '');
}

function inferEntryName(path: string): string {
  const normalized = normalizeSourcePath(path);
  const segments = normalized.split('/');
  return segments.length >= 2 ? segments[segments.length - 2] : normalized;
}
