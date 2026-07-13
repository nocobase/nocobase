/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';
import { randomUUID } from 'crypto';
import { posix as pathPosix } from 'path';

import { isLightExtensionError } from '../../shared/errors';
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
import { entryFromModel } from './LightExtensionEntryService';
import { LightExtensionFileService } from './LightExtensionFileService';
import { LightExtensionPermissionService } from './LightExtensionPermissionService';
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

export class LightExtensionCompilePreviewService {
  constructor(
    private readonly db: Database,
    private readonly auditService: LightExtensionAuditService,
    private readonly fileService: LightExtensionFileService,
    private readonly permissionService: LightExtensionPermissionService,
    private readonly compilerBridge: LightExtensionWorkspaceCompilerBridge,
    private readonly validator = new LightExtensionValidator(),
  ) {}

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

    const validation = this.validator.validateWorkspace({
      files: input.files.map((file) => ({ ...file })),
    });
    const targetKind = input.kind;
    const targetEntryPath = input.entryPath?.trim();
    if (!targetKind && !targetEntryPath) {
      return this.compileWholeWorkspacePreview(input, validation, previewContext);
    }
    if (!targetKind || !targetEntryPath) {
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

    if (!validationEntry || hasErrorDiagnostic(validationDiagnostics)) {
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
        diagnostics: validationDiagnostics,
        failureCode: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      };
    }

    const compiled = await this.compilerBridge.compileEntry(
      {
        repoId: input.repoId,
        entryId: input.entryId,
        operation: 'compilePreview',
        kind: validationEntry.kind,
        entryName: validationEntry.entryName,
        entryPath: validationEntry.entryPath,
        runtimeVersion: input.runtimeVersion,
        files: getEntryCompileFiles(input.files, validationEntry),
      },
      previewContext,
    );
    const diagnostics = sortUniqueDiagnostics([...validationDiagnostics, ...compiled.diagnostics]);

    return {
      accepted: compiled.accepted && !hasErrorDiagnostic(diagnostics),
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
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionWorkspacePreviewResult> {
    const workspaceDiagnostics = getWorkspaceLevelDiagnostics(validation.diagnostics);
    const persistedEntries = await this.listPersistedEntries(input.repoId, ctx);
    const persistedEntryIds = new Map(
      persistedEntries.map((entry) => [`${entry.kind}:${entry.entryName}`, entry.id] as const),
    );
    const entries: LightExtensionCompilePreviewEntryResult[] = [];

    for (const validationEntry of validation.entries) {
      const validationDiagnostics = sortUniqueDiagnostics([...workspaceDiagnostics, ...validationEntry.diagnostics]);
      const entryId = persistedEntryIds.get(`${validationEntry.kind}:${validationEntry.entryName}`) || null;
      if (hasErrorDiagnostic(validationDiagnostics)) {
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

      const compiled = await this.compilerBridge.compileEntry(
        {
          repoId: input.repoId,
          entryId,
          operation: 'compilePreview',
          kind: validationEntry.kind,
          entryName: validationEntry.entryName,
          entryPath: validationEntry.entryPath,
          runtimeVersion: input.runtimeVersion,
          files: getEntryCompileFiles(input.files, validationEntry),
        },
        ctx,
      );
      const diagnostics = sortUniqueDiagnostics([...validationDiagnostics, ...compiled.diagnostics]);
      entries.push({
        entryId,
        repoId: input.repoId,
        target: 'client',
        kind: validationEntry.kind,
        entryName: validationEntry.entryName,
        entryPath: validationEntry.entryPath,
        status: compiled.accepted ? 'success' : 'failed',
        accepted: compiled.accepted && !hasErrorDiagnostic(diagnostics),
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

    return {
      accepted,
      diagnostics,
      entries,
      failureCode: accepted
        ? undefined
        : entries.find((entry) => !entry.accepted)?.failureCode || 'LIGHT_EXTENSION_VALIDATION_FAILED',
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
  files: Array<
    Pick<LightExtensionPulledFile, 'content' | 'path'> & Partial<Pick<LightExtensionPulledFile, 'language'>>
  >,
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
      language: file.language,
    }));
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
