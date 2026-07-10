/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import { UniqueConstraintError } from '@nocobase/database';
import { VscFileService, VscPermissionHookRegistry } from '@nocobase/plugin-vsc-file';
import { uid } from '@nocobase/utils';
import { randomUUID } from 'crypto';

import {
  LIGHT_EXTENSION_OWNER_TYPE,
  LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES,
  type LightExtensionAclAction,
} from '../../constants';
import { LightExtensionError } from '../../shared/errors';
import type {
  LightExtensionChangeLifecycleInput,
  LightExtensionCreateRepoInput,
  LightExtensionDeleteRepoInput,
  LightExtensionRepoLifecycleStatus,
  LightExtensionRepoRecord,
  LightExtensionTreeEntryInput,
} from '../../shared/types';
import { LightExtensionAuditService } from './LightExtensionAuditService';
import { LightExtensionPermissionService, type LightExtensionCanFunction } from './LightExtensionPermissionService';
import type { ReferenceService } from './ReferenceService';
import { LightExtensionValidator, hasErrorDiagnostic } from './LightExtensionValidator';
import { normalizeVscBridgeError } from './errorContract';

export interface LightExtensionServiceContext {
  actorUserId?: string | null;
  can?: LightExtensionCanFunction;
  requestId?: string;
  requestSource?: string;
  transaction?: Transaction;
}

export interface LightExtensionRepoInternalRecord extends LightExtensionRepoRecord {
  vscRepoId: string;
}

export class LightExtensionRepoService {
  private vscFileService: VscFileService;

  private referenceService?: ReferenceService;

  constructor(
    private readonly db: Database,
    private readonly auditService: LightExtensionAuditService,
    private readonly permissionService: LightExtensionPermissionService,
    permissionHooks?: VscPermissionHookRegistry,
    private readonly validator = new LightExtensionValidator(),
  ) {
    this.useVscPermissionHookRegistry(
      permissionHooks || createLocalLightExtensionPermissionRegistry(permissionService),
    );
  }

  useVscPermissionHookRegistry(permissionHooks: VscPermissionHookRegistry): void {
    this.vscFileService = new VscFileService(this.db, permissionHooks);
  }

  useReferenceService(referenceService: ReferenceService): void {
    this.referenceService = referenceService;
  }

  async createRepo(
    input: LightExtensionCreateRepoInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionRepoRecord> {
    const requestId = getRequestId(ctx);
    const normalizedName = normalizeRepoName(input.name);
    const repoId = `ler_${uid()}`;
    const initialFiles = input.initialFiles?.length ? input.initialFiles : undefined;
    this.assertValidInitialFiles(initialFiles);

    return this.withTransaction(ctx.transaction, async (transaction) => {
      await this.assertRepoNameAvailable(input.name.trim(), normalizedName, transaction);

      const vscResult = await this.runVsc(repoId, () =>
        this.vscFileService.createRepository(
          {
            ownerType: LIGHT_EXTENSION_OWNER_TYPE,
            ownerId: repoId,
            name: 'source',
            initialFiles,
            message: input.message || 'Initial light extension source',
            authorId: ctx.actorUserId || null,
            metadata: {
              lightExtensionRepoId: repoId,
              requestId,
            },
          },
          this.createVscContext({
            ctx,
            transaction,
            requestId,
            repoId,
            aclAction: 'create',
            reason: 'create light-extension source repository',
            allowedActions: ['createRepository'],
          }),
        ),
      );

      const record = await this.createRepoRecord(
        {
          id: repoId,
          vscRepoId: vscResult.repository.id,
          name: input.name.trim(),
          normalizedName,
          title: optionalTrim(input.title),
          description: optionalTrim(input.description),
          headCommitId: vscResult.repository.headCommitId || null,
        },
        transaction,
      );
      const repo = repoFromModel(record);

      await this.auditService.recordLifecycleEvent({
        repoId: repo.id,
        action: 'repoCreate',
        result: 'success',
        requestId,
        actorUserId: ctx.actorUserId,
        toStatus: repo.lifecycleStatus,
        message: 'Light extension repository created',
        details: {
          name: repo.name,
          normalizedName: repo.normalizedName,
          headCommitId: repo.headCommitId,
        },
        transaction,
      });

      if (initialFiles && vscResult.initialCommit) {
        await this.auditService.recordFileWrite({
          repoId: repo.id,
          action: 'sourceCreate',
          result: 'success',
          requestId,
          actorUserId: ctx.actorUserId,
          baseCommitId: null,
          commitId: vscResult.initialCommit.id,
          message: 'Initial light extension source committed',
          files: summarizeTreeEntries(initialFiles),
          transaction,
        });
      }

      return repo;
    });
  }

  private assertValidInitialFiles(files: LightExtensionTreeEntryInput[] | undefined): void {
    if (!files) {
      return;
    }

    const diagnostics = this.validator.validateInitialFiles({
      files,
    });
    if (!hasErrorDiagnostic(diagnostics)) {
      return;
    }

    throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Light extension initial source is invalid', {
      status: 422,
      details: {
        diagnostics,
      },
    });
  }

  async listRepos(ctx: LightExtensionServiceContext = {}): Promise<LightExtensionRepoRecord[]> {
    const records = await this.db.getRepository('lightExtensionRepos').find({
      sort: ['name'],
      transaction: ctx.transaction,
    });

    return records.map(repoFromModel);
  }

  async getRepo(repoId: string, ctx: LightExtensionServiceContext = {}): Promise<LightExtensionRepoRecord> {
    return stripInternalRepo(await this.getInternalRepo(repoId, ctx));
  }

  async getInternalRepo(
    repoId: string,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionRepoInternalRecord> {
    const record = await this.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repoId,
      transaction: ctx.transaction,
    });

    if (!record) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_REPO_NOT_FOUND',
        `Light extension repository "${repoId}" was not found`,
      );
    }

    return internalRepoFromModel(record);
  }

  async changeLifecycle(
    input: LightExtensionChangeLifecycleInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionRepoRecord> {
    assertLifecycleStatus(input.lifecycleStatus, 'lifecycleStatus');
    if (input.expectedLifecycleStatus) {
      assertLifecycleStatus(input.expectedLifecycleStatus, 'expectedLifecycleStatus');
    }
    if (typeof input.expectedVersion !== 'undefined') {
      assertVersion(input.expectedVersion, 'expectedVersion');
    }
    if (!input.expectedLifecycleStatus && typeof input.expectedVersion === 'undefined') {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_INVALID_INPUT',
        'expectedLifecycleStatus or expectedVersion is required',
      );
    }
    const requestId = getRequestId(ctx);

    return this.withTransaction(ctx.transaction, async (transaction) => {
      const current = await this.lockInternalRepoForUpdate(input.repoId, { ...ctx, transaction });
      const lifecycleMatches =
        !input.expectedLifecycleStatus || current.lifecycleStatus === input.expectedLifecycleStatus;
      const versionMatches = typeof input.expectedVersion === 'undefined' || current.version === input.expectedVersion;

      if (!lifecycleMatches || !versionMatches) {
        await this.recordLifecycleBlocked({
          repoId: input.repoId,
          requestId,
          ctx,
          fromStatus: current.lifecycleStatus,
          toStatus: input.lifecycleStatus,
          reasonCode: lifecycleMatches ? 'version_mismatch' : 'lifecycle_status_mismatch',
          message: 'Light extension lifecycle change rejected by compare-and-set guard',
          details: {
            expectedLifecycleStatus: input.expectedLifecycleStatus,
            currentLifecycleStatus: current.lifecycleStatus,
            expectedVersion: input.expectedVersion,
            currentVersion: current.version,
          },
        });
        throw new LightExtensionError(
          'LIGHT_EXTENSION_LIFECYCLE_CONFLICT',
          'Light extension lifecycle status changed, please reload before retrying',
          {
            details: {
              repoId: input.repoId,
              expectedLifecycleStatus: input.expectedLifecycleStatus,
              currentLifecycleStatus: current.lifecycleStatus,
              expectedVersion: input.expectedVersion,
              currentVersion: current.version,
            },
          },
        );
      }

      if (current.lifecycleStatus === 'archived' && input.lifecycleStatus !== 'archived') {
        await this.recordLifecycleBlocked({
          repoId: input.repoId,
          requestId,
          ctx,
          fromStatus: current.lifecycleStatus,
          toStatus: input.lifecycleStatus,
          reasonCode: 'repo_archived',
          message: 'Archived light extension repositories cannot be re-enabled',
          details: {
            currentLifecycleStatus: current.lifecycleStatus,
            requestedLifecycleStatus: input.lifecycleStatus,
          },
        });
        throw new LightExtensionError(
          'LIGHT_EXTENSION_REPO_ARCHIVED',
          'Archived light extension repositories cannot be re-enabled',
          {
            details: {
              repoId: input.repoId,
              currentLifecycleStatus: current.lifecycleStatus,
              requestedLifecycleStatus: input.lifecycleStatus,
            },
          },
        );
      }

      if (current.lifecycleStatus === input.lifecycleStatus) {
        await this.auditService.recordLifecycleEvent({
          repoId: input.repoId,
          action: 'repoLifecycleChange',
          result: 'success',
          requestId,
          actorUserId: ctx.actorUserId,
          fromStatus: current.lifecycleStatus,
          toStatus: current.lifecycleStatus,
          message: 'Light extension lifecycle status already matches the requested status',
          details: {
            expectedLifecycleStatus: input.expectedLifecycleStatus,
            expectedVersion: input.expectedVersion,
            currentVersion: current.version,
            unchanged: true,
          },
          transaction,
        });

        return stripInternalRepo(current);
      }

      const repoModel = this.db.getModel<Model<LightExtensionRepoInternalRecord>>('lightExtensionRepos');
      await repoModel.update(
        {
          lifecycleStatus: input.lifecycleStatus,
          version: current.version + 1,
        },
        {
          where: {
            id: input.repoId,
          },
          transaction,
        },
      );

      if (input.lifecycleStatus === 'archived') {
        await this.runVsc(current.id, () =>
          this.vscFileService.archiveRepository(
            {
              repoId: current.vscRepoId,
            },
            this.createVscContext({
              ctx,
              transaction,
              requestId,
              repoId: current.id,
              aclAction: 'archive',
              reason: 'archive light-extension source repository',
              allowedActions: ['archiveRepository'],
            }),
          ),
        );
      }

      const next = await this.getInternalRepo(input.repoId, { ...ctx, transaction });
      await this.referenceService?.refreshReferencesForRepo(input.repoId, {
        ...ctx,
        transaction,
        requestId,
      });
      await this.auditService.recordLifecycleEvent({
        repoId: input.repoId,
        action: 'repoLifecycleChange',
        result: 'success',
        requestId,
        actorUserId: ctx.actorUserId,
        fromStatus: current.lifecycleStatus,
        toStatus: next.lifecycleStatus,
        message: 'Light extension lifecycle status changed',
        details: {
          expectedLifecycleStatus: input.expectedLifecycleStatus,
          expectedVersion: input.expectedVersion,
          version: next.version,
        },
        transaction,
      });

      return stripInternalRepo(next);
    });
  }

  async archiveRepo(
    input: Omit<LightExtensionChangeLifecycleInput, 'lifecycleStatus'>,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionRepoRecord> {
    return this.changeLifecycle(
      {
        ...input,
        lifecycleStatus: 'archived',
      },
      ctx,
    );
  }

  async deleteRepo(
    input: LightExtensionDeleteRepoInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionRepoRecord> {
    const requestId = getRequestId(ctx);

    try {
      return await this.withTransaction(ctx.transaction, async (transaction) => {
        const repo = await this.lockInternalRepoForUpdate(input.repoId, { ...ctx, transaction });
        const referenceCount = await this.countRepoReferences(input.repoId, transaction);

        if (referenceCount > 0) {
          await this.recordDeleteBlockedByReferences(
            input.repoId,
            requestId,
            ctx,
            repo.lifecycleStatus,
            referenceCount,
          );
          throw referenceExistsError(input.repoId, referenceCount);
        }

        await this.runVsc(repo.id, () =>
          this.vscFileService.archiveRepository(
            {
              repoId: repo.vscRepoId,
            },
            this.createVscContext({
              ctx,
              transaction,
              requestId,
              repoId: repo.id,
              aclAction: 'delete',
              reason: 'delete light-extension repository metadata',
              allowedActions: ['archiveRepository'],
            }),
          ),
        );
        await this.db.getRepository('lightExtensionEntries').destroy({
          filter: {
            repoId: input.repoId,
          },
          transaction,
        });
        const finalReferenceCount = await this.countRepoReferences(input.repoId, transaction);
        if (finalReferenceCount > 0) {
          await this.recordDeleteBlockedByReferences(
            input.repoId,
            requestId,
            ctx,
            repo.lifecycleStatus,
            finalReferenceCount,
          );
          throw referenceExistsError(input.repoId, finalReferenceCount);
        }

        await this.db.getRepository('lightExtensionRepos').destroy({
          filterByTk: input.repoId,
          transaction,
        });

        await this.auditService.recordLifecycleEvent({
          repoId: input.repoId,
          action: 'repoDelete',
          result: 'success',
          requestId,
          actorUserId: ctx.actorUserId,
          fromStatus: repo.lifecycleStatus,
          message: 'Light extension repository metadata deleted after archiving source storage',
          transaction,
        });

        return stripInternalRepo(repo);
      });
    } catch (error) {
      if (isReferenceConstraintError(error)) {
        const referenceCount = await this.countRepoReferences(input.repoId);
        await this.recordDeleteBlockedByReferences(input.repoId, requestId, ctx, null, referenceCount);
        throw referenceExistsError(input.repoId, referenceCount);
      }

      throw error;
    }
  }

  private async assertRepoNameAvailable(name: string, normalizedName: string, transaction: Transaction): Promise<void> {
    const conflict = await this.db.getRepository('lightExtensionRepos').findOne({
      filter: {
        $or: [{ name }, { normalizedName }],
      },
      transaction,
    });

    if (!conflict) {
      return;
    }

    throw repoConflictError(name, normalizedName);
  }

  private async createRepoRecord(
    values: {
      id: string;
      vscRepoId: string;
      name: string;
      normalizedName: string;
      title?: string | null;
      description?: string | null;
      headCommitId: string | null;
    },
    transaction: Transaction,
  ): Promise<Model> {
    try {
      return await this.db.getRepository('lightExtensionRepos').create({
        values,
        transaction,
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw repoConflictError(values.name, values.normalizedName);
      }

      throw error;
    }
  }

  private async findInternalRepo(
    repoId: string,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionRepoInternalRecord | null> {
    const record = await this.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repoId,
      transaction: ctx.transaction,
    });

    return record ? internalRepoFromModel(record) : null;
  }

  async lockInternalRepoForUpdate(
    repoId: string,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionRepoInternalRecord> {
    const transaction = ctx.transaction;
    const repoModel = this.db.getModel<Model<LightExtensionRepoInternalRecord>>('lightExtensionRepos');
    const record = await repoModel.findByPk(repoId, {
      transaction,
      lock: transaction?.LOCK.UPDATE,
    });

    if (!record) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_REPO_NOT_FOUND',
        `Light extension repository "${repoId}" was not found`,
      );
    }

    return internalRepoFromModel(record);
  }

  private async countRepoReferences(repoId: string, transaction?: Transaction): Promise<number> {
    return this.db.getRepository('lightExtensionReferences').count({
      filter: {
        repoId,
      },
      transaction,
    });
  }

  private async recordDeleteBlockedByReferences(
    repoId: string,
    requestId: string,
    ctx: LightExtensionServiceContext,
    lifecycleStatus: string | null,
    referenceCount: number,
  ): Promise<void> {
    await this.auditService.recordLifecycleEvent({
      repoId,
      action: 'repoDelete',
      result: 'blocked',
      requestId,
      actorUserId: ctx.actorUserId,
      fromStatus: lifecycleStatus,
      reasonCode: 'references_exist',
      message: 'Light extension repository delete rejected because references exist; archive instead',
      details: {
        referenceCount,
      },
    });
  }

  private async recordLifecycleBlocked(input: {
    repoId: string;
    requestId: string;
    ctx: LightExtensionServiceContext;
    fromStatus: string | null;
    toStatus: string | null;
    reasonCode: string;
    message: string;
    details?: Record<string, unknown>;
  }): Promise<void> {
    await this.auditService.recordLifecycleEvent({
      repoId: input.repoId,
      action: 'repoLifecycleChange',
      result: 'blocked',
      requestId: input.requestId,
      actorUserId: input.ctx.actorUserId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      reasonCode: input.reasonCode,
      message: input.message,
      details: input.details,
    });
  }

  private createVscContext(input: {
    ctx: LightExtensionServiceContext;
    transaction: Transaction;
    requestId: string;
    repoId: string;
    reason: string;
    allowedActions: Parameters<LightExtensionPermissionService['createInternalVscRequestContext']>[0]['allowedActions'];
    aclAction: LightExtensionAclAction;
  }) {
    return {
      transaction: input.transaction,
      authorId: input.ctx.actorUserId || null,
      request: this.permissionService.createInternalVscRequestContext({
        requestId: input.requestId,
        reason: input.reason,
        allowedActions: input.allowedActions,
        actorUserId: input.ctx.actorUserId,
        lightExtensionRepoId: input.repoId,
        aclAction: input.aclAction,
        requestSource: input.ctx.requestSource,
      }),
    };
  }

  private async runVsc<T>(repoId: string, run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      throw normalizeVscBridgeError(error, repoId);
    }
  }

  private async withTransaction<T>(
    transaction: Transaction | undefined,
    run: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    if (transaction) {
      return run(transaction);
    }

    return this.db.sequelize.transaction(run);
  }
}

export function repoFromModel(record: Model): LightExtensionRepoRecord {
  return stripInternalRepo(internalRepoFromModel(record));
}

export function internalRepoFromModel(record: Model): LightExtensionRepoInternalRecord {
  return {
    id: record.get('id') as string,
    vscRepoId: record.get('vscRepoId') as string,
    name: record.get('name') as string,
    normalizedName: record.get('normalizedName') as string,
    title: (record.get('title') as string | null) || null,
    description: (record.get('description') as string | null) || null,
    version: normalizeRecordNumber(record.get('version'), 1),
    lifecycleStatus: record.get('lifecycleStatus') as LightExtensionRepoLifecycleStatus,
    healthStatus: record.get('healthStatus') as LightExtensionRepoRecord['healthStatus'],
    headCommitId: (record.get('headCommitId') as string | null) || null,
    lastScannedCommitId: (record.get('lastScannedCommitId') as string | null) || null,
    lastError: (record.get('lastError') as string | null) || null,
    lastScannedAt: normalizeRecordDate(record.get('lastScannedAt')),
    lastCompiledAt: normalizeRecordDate(record.get('lastCompiledAt')),
    createdAt: normalizeRecordDate(record.get('createdAt')),
    updatedAt: normalizeRecordDate(record.get('updatedAt')),
  };
}

export function stripInternalRepo(repo: LightExtensionRepoInternalRecord): LightExtensionRepoRecord {
  const { vscRepoId: _vscRepoId, ...publicRepo } = repo;
  return publicRepo;
}

function getRequestId(ctx: LightExtensionServiceContext): string {
  return ctx.requestId || randomUUID();
}

function normalizeRepoName(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!normalized) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Repository name is required');
  }

  return normalized;
}

function repoConflictError(name: string, normalizedName: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_REPO_CONFLICT', 'Light extension repository name already exists', {
    details: {
      name,
      normalizedName,
    },
  });
}

function referenceExistsError(repoId: string, referenceCount: number): LightExtensionError {
  return new LightExtensionError(
    'LIGHT_EXTENSION_REFERENCE_EXISTS',
    'Light extension repository is referenced; archive it instead of deleting it',
    {
      details: {
        repoId,
        referenceCount,
      },
    },
  );
}

function isReferenceConstraintError(error: unknown): boolean {
  return error instanceof Error && error.name === 'SequelizeForeignKeyConstraintError';
}

function optionalTrim(value: string | null | undefined): string | null | undefined {
  if (typeof value === 'undefined' || value === null) {
    return value;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function assertLifecycleStatus(value: string, label: string): asserts value is LightExtensionRepoLifecycleStatus {
  if (!(LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES as readonly string[]).includes(value)) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', `Invalid ${label}`);
  }
}

function assertVersion(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', `${label} must be a positive integer`);
  }
}

function summarizeTreeEntries(files: LightExtensionTreeEntryInput[]) {
  return files.map((file) => ({
    path: file.path,
    operation: 'upsert',
    size: file.size ?? file.content?.length,
    language: file.language,
  }));
}

function normalizeRecordDate(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return typeof value === 'string' ? value : null;
}

function normalizeRecordNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function createLocalLightExtensionPermissionRegistry(
  permissionService: LightExtensionPermissionService,
): VscPermissionHookRegistry {
  const permissionHooks = new VscPermissionHookRegistry();
  permissionHooks.register(permissionService.createVscPermissionHook());

  return permissionHooks;
}
