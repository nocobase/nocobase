/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';
import { posix as pathPosix } from 'path';

import { LightExtensionError } from '../../shared/errors';
import type {
  LightExtensionDiagnostic,
  LightExtensionEntryRecord,
  LightExtensionPublishEntryResult,
  LightExtensionPublishResult,
} from '../../shared/types';
import { LightExtensionAuditService } from './LightExtensionAuditService';
import { entryFromModel } from './LightExtensionEntryScanner';
import { LightExtensionFileService } from './LightExtensionFileService';
import { LightExtensionPermissionService } from './LightExtensionPermissionService';
import { LightExtensionPublicationService, toPublicationMetadata } from './LightExtensionPublicationService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import {
  LightExtensionEntryValidationResult,
  LightExtensionValidator,
  getWorkspaceLevelDiagnostics,
  hasErrorDiagnostic,
  sortDiagnostics,
  toValidatorFiles,
} from './LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from './LightExtensionWorkspaceCompilerBridge';

export interface LightExtensionPublishInput {
  repoId: string;
  entryIds: string[];
  commitId: string;
  clientRequestId: string;
  activate?: boolean;
  expectedCurrentPublicationIdByEntry?: Record<string, string | null>;
}

interface PublishTarget {
  requestedEntryId: string;
  entry: LightExtensionEntryRecord | null;
  validationEntry: LightExtensionEntryValidationResult | null;
  diagnostics: LightExtensionDiagnostic[];
  reasonCode?: string;
}

export class LightExtensionPublishService {
  constructor(
    private readonly db: Database,
    private readonly fileService: LightExtensionFileService,
    private readonly permissionService: LightExtensionPermissionService,
    private readonly compilerBridge: LightExtensionWorkspaceCompilerBridge,
    private readonly publicationService: LightExtensionPublicationService,
    private readonly validator = new LightExtensionValidator(),
    private readonly auditService?: LightExtensionAuditService,
  ) {}

  async publish(
    input: LightExtensionPublishInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionPublishResult> {
    assertPublishInput(input);
    await this.permissionService.assertActionAllowed({
      action: 'publish',
      ctx,
    });
    if (input.activate) {
      await this.permissionService.assertActionAllowed({
        action: 'activatePublication',
        ctx,
      });
    }

    const pull = await this.fileService.pullCommit(
      {
        repoId: input.repoId,
        commitId: input.commitId,
        includeContent: 'all',
      },
      {
        ...ctx,
        requestSource: ctx.requestSource || 'light-extension-publish',
      },
    );
    const repoConflict = buildRepoConflictDiagnostics(pull.repo.lifecycleStatus);
    const validation = this.validator.validateWorkspace({
      files: toValidatorFiles(pull.files || []),
    });
    const workspaceDiagnostics = getWorkspaceLevelDiagnostics(validation.diagnostics);
    const persistedEntries = await this.listPersistedEntries(input.repoId, ctx);
    const targets = buildPublishTargets(input, validation.entries, persistedEntries, repoConflict);
    const entryResults: LightExtensionPublishEntryResult[] = [];

    if (pull.commit?.id && pull.commit.id !== input.commitId) {
      const diagnostic = conflictDiagnostic('commit_mismatch', `Requested commit "${input.commitId}" was not loaded`);
      for (const target of targets) {
        entryResults.push(buildConflictResult(target, [diagnostic], 'commit_mismatch'));
      }
      return buildPublishResult(pull.repo, input, entryResults, workspaceDiagnostics);
    }

    if (hasErrorDiagnostic(workspaceDiagnostics)) {
      const sortedWorkspaceDiagnostics = sortDiagnostics(workspaceDiagnostics);
      for (const target of targets) {
        if (!target.entry) {
          entryResults.push(
            buildSkippedResult({
              ...target,
              diagnostics: sortDiagnostics([...target.diagnostics, ...sortedWorkspaceDiagnostics]),
              reasonCode: target.reasonCode || 'validation_failed',
            }),
          );
          continue;
        }

        entryResults.push(
          buildConflictOrFailedResult(
            {
              ...target,
              diagnostics: sortDiagnostics([...target.diagnostics, ...sortedWorkspaceDiagnostics]),
              reasonCode: target.reasonCode || 'validation_failed',
            },
            sortDiagnostics([...target.diagnostics, ...sortedWorkspaceDiagnostics]),
          ),
        );
      }

      return buildPublishResult(pull.repo, input, entryResults, sortedWorkspaceDiagnostics);
    }

    for (const target of targets) {
      if (!target.entry) {
        entryResults.push(buildSkippedResult(target));
        continue;
      }
      const lifecycleDiagnostics = getEntryLifecycleDiagnostics(target.entry);
      const targetDiagnostics = sortDiagnostics([...target.diagnostics, ...lifecycleDiagnostics]);
      if (hasErrorDiagnostic(targetDiagnostics) || !target.validationEntry) {
        entryResults.push(buildConflictOrFailedResult(target, targetDiagnostics));
        continue;
      }

      const compiled = await this.compilerBridge.compileEntry(
        {
          repoId: input.repoId,
          entryId: target.entry.id,
          kind: target.validationEntry.kind,
          entryName: target.validationEntry.entryName,
          entryPath: target.validationEntry.entryPath,
          files: getEntryCompileFiles(pull.files || [], target.validationEntry),
        },
        {
          ...ctx,
          requestSource: ctx.requestSource || 'light-extension-publish',
        },
      );
      if (!compiled.accepted) {
        entryResults.push({
          entryId: target.entry.id,
          entryName: target.entry.entryName,
          kind: target.entry.kind,
          status: 'failed',
          diagnostics: compiled.diagnostics,
          reasonCode: compiled.failureCode || 'compile_failed',
        });
        continue;
      }

      try {
        const publication = await this.withTransaction(ctx.transaction, async (transaction) => {
          const publishContext: LightExtensionServiceContext = {
            ...ctx,
            requestSource: ctx.requestSource || 'light-extension-publish',
            transaction,
          };

          await this.assertPublishLifecycleStillAllowed(input.repoId, target.entry.id, transaction);
          const publication = await this.publicationService.createOrGetPublicationWithStatus(
            {
              repoId: input.repoId,
              entryId: target.entry.id,
              commitId: input.commitId,
              entryPath: target.validationEntry.entryPath,
              kind: target.validationEntry.kind,
              surfaceStyle: compiled.surface.surfaceStyle,
              runtimeVersion: compiled.artifact.version,
              artifact: compiled.artifact,
              settingsSchemaSnapshot: target.validationEntry.settingsSchema,
              diagnostics: compiled.diagnostics,
            },
            publishContext,
          );

          if (input.activate) {
            await this.publicationService.activatePublication(
              {
                entryId: target.entry.id,
                toPublicationId: publication.publication.id,
                expectedCurrentPublicationId: getExpectedCurrentPublicationId(input, target.entry.id),
              },
              publishContext,
            );
          }

          return publication;
        });

        entryResults.push({
          entryId: target.entry.id,
          entryName: target.entry.entryName,
          kind: target.entry.kind,
          status: publication.created ? 'created' : 'reused',
          publication: toPublicationMetadata(publication.publication),
          diagnostics: [],
        });
      } catch (error) {
        if (!(error instanceof LightExtensionError)) {
          throw error;
        }

        entryResults.push(buildServiceErrorResult(target, error));
      }
    }

    const result = buildPublishResult(pull.repo, input, entryResults, workspaceDiagnostics);

    if (entryResults.some((entry) => entry.status === 'created' || entry.status === 'reused')) {
      await this.db.getRepository('lightExtensionRepos').update({
        filterByTk: input.repoId,
        values: {
          lastPublishedAt: new Date(),
        },
        transaction: ctx.transaction,
      });
    }

    await this.recordPublishAudit(result, ctx);

    return result;
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

  private async assertPublishLifecycleStillAllowed(
    repoId: string,
    entryId: string,
    transaction: LightExtensionServiceContext['transaction'],
  ): Promise<void> {
    const repo = await this.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repoId,
      transaction,
      lock: transaction?.LOCK?.UPDATE,
    });
    const repoStatus = repo ? String(repo.get('lifecycleStatus')) : 'missing';
    if (repoStatus !== 'enabled') {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_LIFECYCLE_CONFLICT',
        `Repository lifecycle status is "${repoStatus}"`,
      );
    }

    const entry = await this.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: entryId,
      transaction,
      lock: transaction?.LOCK?.UPDATE,
    });
    if (!entry) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_ENTRY_NOT_FOUND',
        `Light extension entry "${entryId}" was not found`,
      );
    }
    if (String(entry.get('repoId')) !== repoId) {
      throw new LightExtensionError('LIGHT_EXTENSION_LIFECYCLE_CONFLICT', 'Entry does not belong to the repository');
    }

    const entryStatus = String(entry.get('healthStatus'));
    if (entryStatus === 'missing' || entryStatus === 'disabled' || entryStatus === 'archived') {
      throw new LightExtensionError('LIGHT_EXTENSION_LIFECYCLE_CONFLICT', `Entry health status is "${entryStatus}"`);
    }
  }

  private async recordPublishAudit(
    result: LightExtensionPublishResult,
    ctx: LightExtensionServiceContext,
  ): Promise<void> {
    if (!this.auditService) {
      return;
    }

    try {
      const errorCount = result.diagnostics.filter((item) => item.severity === 'error').length;
      const warningCount = result.diagnostics.filter((item) => item.severity === 'warning').length;
      await this.auditService.recordPublishEvent({
        repoId: result.repo.id,
        action: 'publish',
        result:
          result.status === 'success' ? 'success' : result.status === 'partial_success' ? 'partial_success' : 'blocked',
        requestId: ctx.requestId || result.clientRequestId,
        actorUserId: ctx.actorUserId,
        commitId: result.commitId,
        clientRequestId: result.clientRequestId,
        entryResults: result.entryResults.map((entry) => ({
          entryId: entry.entryId,
          status: entry.status,
          reasonCode: entry.reasonCode,
          publicationId: entry.publication?.id,
        })),
        diagnosticCount: result.diagnostics.length,
        errorCount,
        warningCount,
        diagnostics: result.diagnostics,
        message:
          result.status === 'success'
            ? 'Light extension publish completed'
            : 'Light extension publish completed with blocked entries',
        reasonCode: result.status === 'success' ? undefined : result.status,
        transaction: ctx.transaction,
      });
    } catch {
      // Publish result must not depend on audit persistence availability.
    }
  }

  private async withTransaction<T>(
    transaction: LightExtensionServiceContext['transaction'],
    run: (transaction: NonNullable<LightExtensionServiceContext['transaction']> | undefined) => Promise<T>,
  ): Promise<T> {
    if (transaction) {
      return run(transaction);
    }

    const sequelize = (
      this.db as unknown as {
        sequelize?: {
          transaction: <R>(
            run: (transaction: NonNullable<LightExtensionServiceContext['transaction']>) => Promise<R>,
          ) => Promise<R>;
        };
      }
    ).sequelize;

    if (!sequelize?.transaction) {
      return run(undefined);
    }

    return sequelize.transaction(run);
  }
}

function assertPublishInput(input: LightExtensionPublishInput): void {
  if (!input.repoId || !input.commitId || !input.clientRequestId) {
    throw new LightExtensionError(
      'LIGHT_EXTENSION_INVALID_INPUT',
      'repoId, commitId, and clientRequestId are required',
    );
  }
  if (!Array.isArray(input.entryIds) || input.entryIds.length === 0 || input.entryIds.some((id) => !id)) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'entryIds is required');
  }
  if (input.activate && !input.expectedCurrentPublicationIdByEntry) {
    throw new LightExtensionError(
      'LIGHT_EXTENSION_INVALID_INPUT',
      'expectedCurrentPublicationIdByEntry is required when activate is true',
    );
  }
  if (input.activate) {
    for (const entryId of input.entryIds) {
      if (!Object.prototype.hasOwnProperty.call(input.expectedCurrentPublicationIdByEntry, entryId)) {
        throw new LightExtensionError(
          'LIGHT_EXTENSION_INVALID_INPUT',
          `expectedCurrentPublicationIdByEntry must include "${entryId}" when activate is true`,
        );
      }

      const expectedCurrentPublicationId = input.expectedCurrentPublicationIdByEntry[entryId];
      if (expectedCurrentPublicationId !== null && typeof expectedCurrentPublicationId !== 'string') {
        throw new LightExtensionError(
          'LIGHT_EXTENSION_INVALID_INPUT',
          `expectedCurrentPublicationIdByEntry.${entryId} must be a string or null`,
        );
      }
    }
  }
}

function buildPublishTargets(
  input: LightExtensionPublishInput,
  validationEntries: LightExtensionEntryValidationResult[],
  persistedEntries: LightExtensionEntryRecord[],
  repoConflict: LightExtensionDiagnostic[],
): PublishTarget[] {
  const persistedById = new Map(persistedEntries.map((entry) => [entry.id, entry]));
  const validationByKey = new Map(validationEntries.map((entry) => [entryKey(entry), entry]));

  return input.entryIds.map((entryId) => {
    const entry = persistedById.get(entryId) || null;
    if (!entry) {
      return {
        requestedEntryId: entryId,
        entry,
        validationEntry: null,
        diagnostics: [
          {
            code: 'entry_not_found',
            severity: 'error',
            message: `Light extension entry "${entryId}" was not found`,
            entryName: entryId,
          },
        ],
        reasonCode: 'entry_not_found',
      };
    }

    const validationEntry = validationByKey.get(entryKey(entry)) || null;
    if (!validationEntry) {
      return {
        requestedEntryId: entryId,
        entry,
        validationEntry,
        diagnostics: [
          ...repoConflict,
          {
            code: 'entry_missing',
            severity: 'error',
            message: 'Entry source files were not found during publish',
            path: entry.entryPath,
            kind: entry.kind,
            entryName: entry.entryName,
          },
        ],
        reasonCode: 'entry_missing',
      };
    }

    return {
      requestedEntryId: entryId,
      entry,
      validationEntry,
      diagnostics: [...repoConflict, ...validationEntry.diagnostics],
    };
  });
}

function buildRepoConflictDiagnostics(lifecycleStatus: string): LightExtensionDiagnostic[] {
  if (lifecycleStatus === 'enabled') {
    return [];
  }

  return [conflictDiagnostic('repo_lifecycle_conflict', `Repository lifecycle status is "${lifecycleStatus}"`)];
}

function getEntryLifecycleDiagnostics(entry: LightExtensionEntryRecord): LightExtensionDiagnostic[] {
  if (entry.healthStatus === 'ready' || entry.healthStatus === 'failed') {
    return [];
  }

  return [
    {
      code: 'entry_lifecycle_conflict',
      severity: 'error',
      message: `Entry health status is "${entry.healthStatus}"`,
      path: entry.entryPath,
      kind: entry.kind,
      entryName: entry.entryName,
    },
  ];
}

function buildSkippedResult(target: PublishTarget): LightExtensionPublishEntryResult {
  const diagnostic = target.diagnostics[0];
  return {
    entryId: target.requestedEntryId,
    entryName: diagnostic?.entryName || 'unknown',
    kind: 'unknown',
    status: 'skipped',
    diagnostics: sortDiagnostics(target.diagnostics),
    reasonCode: target.reasonCode || 'entry_not_found',
  };
}

function buildConflictOrFailedResult(
  target: PublishTarget,
  diagnostics: LightExtensionDiagnostic[],
): LightExtensionPublishEntryResult {
  if (!target.entry) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Publish target entry is required');
  }

  const hasConflict = diagnostics.some((item) => item.code.includes('conflict') || item.code === 'entry_missing');
  return {
    entryId: target.entry.id,
    entryName: target.entry.entryName,
    kind: target.entry.kind,
    status: hasConflict ? 'conflict' : 'failed',
    diagnostics: sortDiagnostics(diagnostics),
    reasonCode: target.reasonCode || (hasConflict ? 'lifecycle_conflict' : 'validation_failed'),
  };
}

function buildServiceErrorResult(target: PublishTarget, error: LightExtensionError): LightExtensionPublishEntryResult {
  if (!target.entry) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Publish target entry is required');
  }

  const reasonCode = toReasonCode(error);
  return {
    entryId: target.entry.id,
    entryName: target.entry.entryName,
    kind: target.entry.kind,
    status: error.status === 409 ? 'conflict' : 'failed',
    diagnostics: [
      {
        code: reasonCode,
        severity: 'error',
        message: error.message,
        path: target.entry.entryPath,
        kind: target.entry.kind,
        entryName: target.entry.entryName,
        details: error.details,
      },
    ],
    reasonCode,
  };
}

function buildConflictResult(
  target: PublishTarget,
  diagnostics: LightExtensionDiagnostic[],
  reasonCode: string,
): LightExtensionPublishEntryResult {
  return {
    entryId: target.entry?.id || reasonCode,
    entryName: target.entry?.entryName || reasonCode,
    kind: target.entry?.kind || 'unknown',
    status: 'conflict',
    diagnostics,
    reasonCode,
  };
}

function buildPublishResult(
  repo: LightExtensionPublishResult['repo'],
  input: LightExtensionPublishInput,
  entryResults: LightExtensionPublishEntryResult[],
  workspaceDiagnostics: LightExtensionDiagnostic[],
): LightExtensionPublishResult {
  const successCount = entryResults.filter((entry) => entry.status === 'created' || entry.status === 'reused').length;
  const status = successCount === entryResults.length ? 'success' : successCount > 0 ? 'partial_success' : 'failed';
  const diagnostics = sortDiagnostics([...workspaceDiagnostics, ...entryResults.flatMap((entry) => entry.diagnostics)]);

  return {
    repo,
    commitId: input.commitId,
    clientRequestId: input.clientRequestId,
    status,
    httpStatus: status === 'success' ? 200 : status === 'partial_success' ? 207 : 422,
    entryResults,
    diagnostics,
  };
}

function getExpectedCurrentPublicationId(input: LightExtensionPublishInput, entryId: string): string | null {
  const expectedCurrentPublicationId = input.expectedCurrentPublicationIdByEntry?.[entryId];
  if (expectedCurrentPublicationId !== null && typeof expectedCurrentPublicationId !== 'string') {
    throw new LightExtensionError(
      'LIGHT_EXTENSION_INVALID_INPUT',
      `expectedCurrentPublicationIdByEntry.${entryId} must be a string or null`,
    );
  }

  return expectedCurrentPublicationId;
}

function getEntryCompileFiles(
  files: NonNullable<Awaited<ReturnType<LightExtensionFileService['pull']>>['files']>,
  entry: LightExtensionEntryValidationResult,
) {
  const rootPath = getEntryRootPath(entry);

  return files
    .filter(
      (file) => file.path === rootPath || file.path.startsWith(`${rootPath}/`) || file.path.startsWith('src/shared/'),
    )
    .map((file) => ({
      path: file.path,
      content: file.content,
      language: file.language,
    }));
}

function getEntryRootPath(entry: LightExtensionEntryValidationResult): string {
  const normalized = pathPosix.normalize(entry.entryPath.trim()).replace(/^\.\/+/, '');
  return pathPosix.extname(normalized) ? pathPosix.dirname(normalized) : normalized;
}

function conflictDiagnostic(code: string, message: string): LightExtensionDiagnostic {
  return {
    code,
    severity: 'error',
    message,
  };
}

function toReasonCode(error: LightExtensionError): string {
  return error.code.replace(/^LIGHT_EXTENSION_/, '').toLowerCase();
}

function entryKey(entry: { target?: string; kind: string; entryName: string }): string {
  return `${entry.target || 'client'}:${entry.kind}:${entry.entryName}`;
}
