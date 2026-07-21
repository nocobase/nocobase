/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';
import { sha256Hex, stableSerialize } from '@nocobase/runjs';
import { randomUUID } from 'crypto';
import { posix as pathPosix } from 'path';

import { LightExtensionError, isLightExtensionError } from '../../shared/errors';
import {
  createLightExtensionProblemFactory,
  sortLightExtensionProblems,
  uniqueLightExtensionProblems,
} from '../../shared/problems';
import type {
  LightExtensionCompilePreviewArtifactSummary,
  LightExtensionCompilePreviewEntryResult,
  LightExtensionCompilePreviewResult,
  LightExtensionProblem,
  LightExtensionEntryRecord,
  LightExtensionPulledFile,
  LightExtensionWorkspacePreviewInput,
  LightExtensionWorkspacePreviewResult,
} from '../../shared/types';
import { LightExtensionAuditService } from './LightExtensionAuditService';
import type { LightExtensionCompileExecutor } from './LightExtensionCompileContract';
import { entryFromModel } from './LightExtensionEntryService';
import { LightExtensionFileService } from './LightExtensionFileService';
import { LightExtensionPermissionService } from './LightExtensionPermissionService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import {
  LightExtensionEntryValidationResult,
  LightExtensionValidator,
  type LightExtensionWorkspaceValidationResult,
  getWorkspaceLevelProblems,
  hasErrorProblem,
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
  problems: LightExtensionProblem[];
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
    private readonly compileExecutor?: LightExtensionCompileExecutor,
  ) {}

  async compilePreview(
    input: LightExtensionCompilePreviewInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionCompilePreviewResult> {
    const requestId = ctx.requestId || randomUUID();
    const previewContext: LightExtensionServiceContext = {
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
    const snapshotId = buildWorkspaceSnapshotId(pull.files || []);
    previewContext.snapshotId = snapshotId;
    const createProblem = createLightExtensionProblemFactory({
      snapshotId,
      requestId,
      source: 'server',
      phase: 'compile',
    });
    const validation = this.validator.validateWorkspace({
      files: toValidatorFiles(pull.files || []),
      snapshotId,
      requestId,
    });
    const workspaceProblems = getWorkspaceLevelProblems(validation.problems);
    const persistedEntries = await this.listPersistedEntries(input.repoId, previewContext);
    const targets = buildPreviewTargets(input, validation.entries, persistedEntries, createProblem);

    if (hasErrorProblem(workspaceProblems)) {
      const sortedWorkspaceProblems = sortLightExtensionProblems(workspaceProblems);
      await this.recordPreviewValidationBlocked(input, previewContext, sortedWorkspaceProblems, targets.length);
      const entries = targets.map((target) => buildWorkspaceBlockedEntryResult(target, sortedWorkspaceProblems));
      for (const entry of entries) {
        await this.recordEntryValidationBlocked(entry, previewContext, 'validation_failed');
      }

      return {
        repo: pull.repo,
        commitId: pull.commit?.id || null,
        accepted: false,
        problems: sortUniqueProblems([...sortedWorkspaceProblems, ...entries.flatMap((entry) => entry.problems)]),
        entries,
      };
    }

    const entries: LightExtensionCompilePreviewEntryResult[] = [];
    for (const target of targets) {
      if (!target.validationEntry || hasErrorProblem(target.problems)) {
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
        this.compileExecutor,
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
        problems: sortLightExtensionProblems([...target.problems, ...compiled.problems]),
        failureCode: compiled.failureCode,
        artifact: compiled.accepted
          ? summarizeArtifact(compiled.artifact, target.validationEntry.entryPath)
          : undefined,
      });
    }

    const problems = sortUniqueProblems([...workspaceProblems, ...entries.flatMap((entry) => entry.problems)]);

    return {
      repo: pull.repo,
      commitId: pull.commit?.id || null,
      accepted: !hasErrorProblem(problems) && entries.every((entry) => entry.accepted),
      problems,
      entries,
    };
  }

  async compileWorkspacePreview(
    input: LightExtensionWorkspacePreviewInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionWorkspacePreviewResult> {
    const requestId = ctx.requestId || randomUUID();
    const previewContext: LightExtensionServiceContext = {
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

    const repo = await this.getWorkspaceCheckRepo(input.repoId, previewContext);
    const baseHeadCommitId = repo.headCommitId;
    if (input.expectedHeadCommitId !== baseHeadCommitId) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_OUTDATED',
        'Light extension workspace check source head is outdated',
        {
          details: {
            repoId: input.repoId,
            expectedHeadCommitId: input.expectedHeadCommitId,
            currentHeadCommitId: baseHeadCommitId,
          },
        },
      );
    }

    const previewFiles = input.files;
    const snapshotId = buildWorkspaceSnapshotId(previewFiles);
    previewContext.snapshotId = snapshotId;
    const createProblem = createLightExtensionProblemFactory({
      snapshotId,
      requestId,
      source: 'server',
      phase: 'compile',
    });
    const validation = this.validator.validateWorkspace({
      files: previewFiles.map((file) => ({ ...file })),
      snapshotId,
      requestId,
    });
    const agentProblems = buildAgentWorkspaceProblems(previewFiles, validation.entries, createProblem);
    const targetKind = input.kind;
    const targetEntryPath = input.entryPath?.trim();
    if (!targetKind && !targetEntryPath && !input.entryId) {
      return this.compileWholeWorkspacePreview(
        input,
        validation,
        previewFiles,
        previewContext,
        baseHeadCommitId,
        agentProblems,
      );
    }
    if (!targetKind || !targetEntryPath || !input.entryId) {
      const problems = [
        ...agentProblems,
        createProblem({
          code: 'light_extension_preview_target_incomplete',
          severity: 'error',
          message:
            'Light extension workspace preview must include entryId, kind, and entryPath when targeting an entry',
          path: input.entryPath,
          kind: input.kind,
        }),
      ];
      return {
        baseHeadCommitId,
        snapshotId,
        requestId,
        accepted: false,
        problems,
        failureCode: 'LIGHT_EXTENSION_VALIDATION_FAILED',
        entries: [],
      };
    }

    const workspaceProblems = sortUniqueProblems([...getWorkspaceLevelProblems(validation.problems), ...agentProblems]);
    const normalizedEntryPath = normalizeSourcePath(targetEntryPath);
    const persistedEntries = await this.listPersistedEntries(input.repoId, previewContext);
    const persistedEntry = persistedEntries.find((entry) => entry.id === input.entryId);
    const targetIdentityProblems: LightExtensionProblem[] = [];
    if (!persistedEntry) {
      targetIdentityProblems.push(
        createProblem({
          code: 'entry_not_found',
          severity: 'error',
          message: `Light extension entry "${input.entryId}" was not found in repository "${input.repoId}"`,
          path: normalizedEntryPath,
          kind: targetKind,
          entryName: inferEntryName(normalizedEntryPath),
        }),
      );
    } else {
      if (persistedEntry.kind !== targetKind) {
        targetIdentityProblems.push(
          createProblem({
            code: 'light_extension_preview_target_kind_mismatch',
            severity: 'error',
            message: 'Light extension workspace preview target kind does not match the persisted entry',
            path: normalizedEntryPath,
            kind: targetKind,
            entryName: persistedEntry.entryName,
            details: { expectedKind: persistedEntry.kind, requestedKind: targetKind },
          }),
        );
      }
      if (normalizeSourcePath(persistedEntry.entryPath) !== normalizedEntryPath) {
        targetIdentityProblems.push(
          createProblem({
            code: 'light_extension_preview_target_path_mismatch',
            severity: 'error',
            message: 'Light extension workspace preview target path does not match the persisted entry',
            path: normalizedEntryPath,
            kind: targetKind,
            entryName: persistedEntry.entryName,
            details: { expectedEntryPath: persistedEntry.entryPath, requestedEntryPath: normalizedEntryPath },
          }),
        );
      }
    }
    const validationEntry = validation.entries.find(
      (entry) => entry.kind === targetKind && normalizeSourcePath(entry.entryPath) === normalizedEntryPath,
    );
    const entryProblems = validationEntry
      ? validationEntry.problems
      : [
          createProblem({
            code: 'entry_not_found',
            severity: 'error',
            message: `Light extension entry source "${normalizedEntryPath}" was not found`,
            path: normalizedEntryPath,
            kind: targetKind,
            entryName: inferEntryName(normalizedEntryPath),
          }),
        ];
    const validationProblems = sortUniqueProblems([...workspaceProblems, ...targetIdentityProblems, ...entryProblems]);
    if (!validationEntry || hasErrorProblem(validationProblems)) {
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
        problems: validationProblems,
        message: 'Light extension workspace preview validation failed',
        details: {
          requestSource: previewContext.requestSource,
        },
      });
      return {
        baseHeadCommitId,
        snapshotId,
        requestId,
        accepted: false,
        problems: validationProblems,
        failureCode: 'LIGHT_EXTENSION_VALIDATION_FAILED',
        entries: [
          {
            entryId: input.entryId || null,
            repoId: input.repoId,
            target: 'client',
            kind: targetKind,
            entryName: validationEntry?.entryName || inferEntryName(normalizedEntryPath),
            entryPath: normalizedEntryPath,
            status: validationEntry ? 'failed' : 'skipped',
            accepted: false,
            problems: validationProblems,
            failureCode: 'LIGHT_EXTENSION_VALIDATION_FAILED',
          },
        ],
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
        files: getEntryCompileFiles(previewFiles, validationEntry),
      },
      previewContext,
      this.compileExecutor,
    );
    const problems = sortUniqueProblems([...validationProblems, ...compiled.problems]);

    return {
      baseHeadCommitId,
      snapshotId,
      requestId,
      accepted: compiled.accepted && !hasErrorProblem(problems),
      problems,
      failureCode: compiled.failureCode,
      artifact: compiled.accepted
        ? {
            code: compiled.artifact.code,
            sourceMap: compiled.artifact.sourceMap,
            version: compiled.artifact.version,
            entryPath: compiled.artifact.entryPath || validationEntry.entryPath,
            filesHash: compiled.artifact.filesHash,
            metadata: compiled.artifact.metadata,
          }
        : undefined,
      entries: [
        {
          entryId: input.entryId || null,
          repoId: input.repoId,
          target: 'client',
          kind: validationEntry.kind,
          entryName: validationEntry.entryName,
          entryPath: validationEntry.entryPath,
          status: compiled.accepted ? 'success' : 'failed',
          accepted: compiled.accepted && !hasErrorProblem(problems),
          problems,
          failureCode: compiled.failureCode,
          artifact: compiled.accepted ? summarizeArtifact(compiled.artifact, validationEntry.entryPath) : undefined,
        },
      ],
    };
  }

  private async compileWholeWorkspacePreview(
    input: LightExtensionWorkspacePreviewInput,
    validation: LightExtensionWorkspaceValidationResult,
    files: LightExtensionWorkspacePreviewInput['files'],
    ctx: LightExtensionServiceContext,
    baseHeadCommitId: string | null,
    agentProblems: LightExtensionProblem[],
  ): Promise<LightExtensionWorkspacePreviewResult> {
    const workspaceProblems = sortUniqueProblems([...getWorkspaceLevelProblems(validation.problems), ...agentProblems]);
    const persistedEntries = await this.listPersistedEntries(input.repoId, ctx);
    const persistedEntryIds = new Map(
      persistedEntries.map((entry) => [`${entry.kind}:${entry.entryName}`, entry.id] as const),
    );
    const entries: LightExtensionCompilePreviewEntryResult[] = [];

    for (const validationEntry of validation.entries) {
      const validationProblems = sortUniqueProblems([...workspaceProblems, ...validationEntry.problems]);
      const entryId = persistedEntryIds.get(`${validationEntry.kind}:${validationEntry.entryName}`) || null;
      const persistedEntry = persistedEntries.find(
        (entry) => entry.kind === validationEntry.kind && entry.entryName === validationEntry.entryName,
      );
      if (hasErrorProblem(validationProblems)) {
        entries.push({
          entryId,
          repoId: input.repoId,
          target: 'client',
          kind: validationEntry.kind,
          entryName: validationEntry.entryName,
          entryPath: validationEntry.entryPath,
          status: 'failed',
          accepted: false,
          problems: validationProblems,
          failureCode: 'LIGHT_EXTENSION_VALIDATION_FAILED',
        });
        continue;
      }

      const runtimeVersion = input.runtimeVersion || persistedEntry?.runtimeVersion || 'v2';
      const compiled = await this.compilerBridge.compileEntry(
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
        this.compileExecutor,
      );
      const problems = sortUniqueProblems([...validationProblems, ...compiled.problems]);
      const accepted = compiled.accepted && !hasErrorProblem(problems);
      entries.push({
        entryId,
        repoId: input.repoId,
        target: 'client',
        kind: validationEntry.kind,
        entryName: validationEntry.entryName,
        entryPath: validationEntry.entryPath,
        status: compiled.accepted ? 'success' : 'failed',
        accepted,
        problems,
        failureCode: compiled.failureCode,
        artifact: compiled.accepted ? summarizeArtifact(compiled.artifact, validationEntry.entryPath) : undefined,
      });
    }

    const problems = sortUniqueProblems([...workspaceProblems, ...entries.flatMap((entry) => entry.problems)]);
    const accepted = !hasErrorProblem(problems) && entries.every((entry) => entry.accepted);
    return {
      baseHeadCommitId,
      snapshotId: validation.snapshotId,
      requestId: validation.requestId,
      accepted,
      problems,
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

  private async getWorkspaceCheckRepo(
    repoId: string,
    ctx: LightExtensionServiceContext,
  ): Promise<{ headCommitId: string | null }> {
    const repo = await this.db.getRepository('lightExtensionRepos').findOne({
      filter: { id: repoId },
      fields: ['id', 'headCommitId', 'lifecycleStatus'],
      transaction: ctx.transaction,
    });
    if (!repo) {
      throw new LightExtensionError('LIGHT_EXTENSION_REPO_NOT_FOUND', `Light extension repo "${repoId}" was not found`);
    }
    if (repo.get('lifecycleStatus') === 'archived') {
      throw new LightExtensionError('LIGHT_EXTENSION_REPO_ARCHIVED', `Light extension repo "${repoId}" is archived`);
    }
    return { headCommitId: (repo.get('headCommitId') as string | null) || null };
  }

  private async recordPreviewPermissionDenied(
    repoId: string,
    ctx: LightExtensionServiceContext,
    error: unknown,
  ): Promise<void> {
    if (!isLightExtensionError(error)) {
      return;
    }

    const createProblem = createLightExtensionProblemFactory({
      snapshotId: ctx.snapshotId || `permission:${repoId}`,
      requestId: ctx.requestId || randomUUID(),
      source: 'server',
      phase: 'permission',
    });
    await this.recordCompileAuditBestEffort({
      repoId,
      ctx,
      result: 'blocked',
      reasonCode: 'permission_denied',
      problems: [
        createProblem({
          code: error.code,
          severity: 'error',
          message: error.message,
        }),
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
    problems: LightExtensionProblem[],
    entryCount: number,
  ): Promise<void> {
    await this.recordCompileAuditBestEffort({
      repoId: input.repoId,
      ctx,
      result: 'blocked',
      reasonCode: 'validation_failed',
      problems,
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
      problems: entry.problems,
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
    problems: LightExtensionProblem[];
    message: string;
    details?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const errorCount = input.problems.filter((item) => item.severity === 'error').length;
      const warningCount = input.problems.filter((item) => item.severity === 'warning').length;
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
        problemCount: input.problems.length,
        errorCount,
        warningCount,
        problems: input.problems,
        reasonCode: input.reasonCode,
        message: input.message,
        details: input.details,
        transaction: input.ctx.transaction,
      });
    } catch {
      // Preview problems must not depend on audit persistence availability.
    }
  }
}

function buildPreviewTargets(
  input: LightExtensionCompilePreviewInput,
  validationEntries: LightExtensionEntryValidationResult[],
  persistedEntries: LightExtensionEntryRecord[],
  createProblem: ReturnType<typeof createLightExtensionProblemFactory>,
): LightExtensionCompilePreviewTarget[] {
  const persistedById = new Map(persistedEntries.map((entry) => [entry.id, entry]));
  const persistedByKey = new Map(persistedEntries.map((entry) => [entryKey(entry), entry]));
  const validationByKey = new Map(validationEntries.map((entry) => [entryKey(entry), entry]));

  if (input.entryIds?.length) {
    return input.entryIds.map((entryId) => {
      const persisted = persistedById.get(entryId);
      if (!persisted) {
        return buildUnknownEntryTarget(input.repoId, entryId, createProblem);
      }

      const validationEntry = validationByKey.get(entryKey(persisted));
      if (!validationEntry) {
        return buildMissingPersistedEntryTarget(persisted, createProblem);
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
      targets.push(buildMissingPersistedEntryTarget(persisted, createProblem));
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
    problems: validationEntry.problems,
  };
}

function buildMissingPersistedEntryTarget(
  entry: LightExtensionEntryRecord,
  createProblem: ReturnType<typeof createLightExtensionProblemFactory>,
): LightExtensionCompilePreviewTarget {
  const problem = createProblem({
    code: 'entry_missing',
    severity: 'error',
    message: 'Entry source files were not found during compile preview',
    path: entry.entryPath,
    kind: entry.kind,
    entryName: entry.entryName,
  });

  return {
    entryId: entry.id,
    repoId: entry.repoId,
    target: 'client',
    kind: entry.kind,
    entryName: entry.entryName,
    entryPath: entry.entryPath,
    problems: [problem],
    missingReason: 'entry_missing',
  };
}

function buildUnknownEntryTarget(
  repoId: string,
  entryId: string,
  createProblem: ReturnType<typeof createLightExtensionProblemFactory>,
): LightExtensionCompilePreviewTarget {
  const problem = createProblem({
    code: 'entry_not_found',
    severity: 'error',
    message: `Light extension entry "${entryId}" was not found`,
    entryName: entryId,
  });

  return {
    entryId,
    repoId,
    target: 'client',
    kind: 'unknown',
    entryName: entryId,
    entryPath: null,
    problems: [problem],
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
    problems: sortLightExtensionProblems(target.problems),
  };
}

function buildWorkspaceBlockedEntryResult(
  target: LightExtensionCompilePreviewTarget,
  workspaceProblems: LightExtensionProblem[],
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
    problems: sortLightExtensionProblems([...target.problems, ...workspaceProblems]),
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

function sortUniqueProblems(problems: LightExtensionProblem[]): LightExtensionProblem[] {
  return uniqueLightExtensionProblems(problems);
}

function buildWorkspaceSnapshotId(
  files: readonly {
    path: string;
    content?: string;
    encoding?: 'utf8' | 'base64';
    language?: string;
    mode?: string;
  }[],
) {
  return sha256Hex(
    stableSerialize(
      files
        .map((file) => ({
          path: normalizeSourcePath(file.path),
          content: file.content || '',
          encoding: file.encoding || 'utf8',
          language: file.language || '',
          mode: file.mode || '',
        }))
        .sort((left, right) => stableSerialize(left).localeCompare(stableSerialize(right))),
    ),
  );
}

function buildAgentWorkspaceProblems(
  files: LightExtensionWorkspacePreviewInput['files'],
  entries: LightExtensionEntryValidationResult[],
  createProblem: ReturnType<typeof createLightExtensionProblemFactory>,
): LightExtensionProblem[] {
  const problems: LightExtensionProblem[] = [];
  for (const file of files) {
    const path = normalizeSourcePath(file.path);
    if (file.encoding === 'base64') {
      problems.push(
        createProblem({
          phase: 'policy',
          code: 'light_extension_agent_base64_not_supported',
          severity: 'error',
          message: 'Light extension workspace checks accept UTF-8 source files only',
          path,
        }),
      );
    }
    if (path === 'src/client/js-portals' || path.startsWith('src/client/js-portals/')) {
      problems.push(
        createProblem({
          phase: 'policy',
          code: 'light_extension_agent_portal_not_supported',
          severity: 'error',
          message: 'Light extension workspace checks do not support JS Portal source files',
          path,
        }),
      );
    }
  }
  for (const entry of entries) {
    if (entry.kind === 'js-block' || entry.kind === 'js-page') {
      continue;
    }
    problems.push(
      createProblem({
        phase: 'policy',
        code: 'light_extension_agent_kind_not_supported',
        severity: 'error',
        message: 'Light extension workspace checks support JS Block and JS Page entries only',
        path: entry.entryPath,
        kind: entry.kind,
        entryName: entry.entryName,
      }),
    );
  }
  return sortUniqueProblems(problems);
}

function normalizeSourcePath(path: string): string {
  return pathPosix.normalize(path.trim()).replace(/^\.\/+/, '');
}

function inferEntryName(path: string): string {
  const normalized = normalizeSourcePath(path);
  const segments = normalized.split('/');
  return segments.length >= 2 ? segments[segments.length - 2] : normalized;
}
