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
import { RemoteSyncError, VscFileService, VscPermissionHookRegistry } from '../vsc-file/public-api';
import { uid } from '@nocobase/utils';
import { createHash, randomUUID } from 'crypto';

import {
  LIGHT_EXTENSION_OWNER_TYPE,
  LIGHT_EXTENSION_REPO_LIFECYCLE_STATUSES,
  type LightExtensionAclAction,
} from '../../constants';
import { createDefaultLightExtensionTemplate } from '../../shared/default-template';
import { LightExtensionError, mapRemoteSyncErrorToLightExtension } from '../../shared/errors';
import type {
  LightExtensionChangeLifecycleInput,
  LightExtensionCreateRepoInput,
  LightExtensionDeleteRepoInput,
  LightExtensionRepoLifecycleStatus,
  LightExtensionRepoRecord,
  LightExtensionTreeEntryInput,
  LightExtensionUpdateRepoInput,
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
  /** @internal */
  deferredRejectedPushAudits?: Array<() => Promise<void>>;
  /** @internal */
  deferSuccessfulCompileAudit?: boolean;
}

export interface LightExtensionRepoInternalRecord extends LightExtensionRepoRecord {
  vscRepoId: string;
  applicationName: string | null;
}

export interface LightExtensionRemoteSyncLifecycleGate {
  assertRepositoryIdle(repoId: string, transaction?: Transaction): Promise<void>;
}

export interface LightExtensionCreateMetadata {
  name: string;
  normalizedName: string;
  title: string | null | undefined;
  description: string | null | undefined;
}

export interface LightExtensionCreateRepoOptions {
  repoId?: string;
}

export class LightExtensionRepoService {
  private vscFileService: VscFileService;

  private referenceService?: ReferenceService;

  private remoteSyncLifecycleGate?: LightExtensionRemoteSyncLifecycleGate;

  constructor(
    private readonly db: Database,
    private readonly auditService: LightExtensionAuditService,
    private readonly permissionService: LightExtensionPermissionService,
    permissionHooks?: VscPermissionHookRegistry,
    private readonly validator = new LightExtensionValidator(),
    private readonly applicationName = 'main',
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

  useRemoteSyncLifecycleGate(gate: LightExtensionRemoteSyncLifecycleGate): void {
    this.remoteSyncLifecycleGate = gate;
  }

  getValidator(): LightExtensionValidator {
    return this.validator;
  }

  async createRepo(
    input: LightExtensionCreateRepoInput,
    ctx: LightExtensionServiceContext = {},
    options: LightExtensionCreateRepoOptions = {},
  ): Promise<LightExtensionRepoRecord> {
    const requestId = getRequestId(ctx);
    const metadata = this.normalizeCreateMetadata(input);
    const repoId = options.repoId || `ler_${uid()}`;
    const initialFiles = input.initialFiles?.length ? input.initialFiles : createDefaultLightExtensionTemplate();
    this.assertValidInitialFiles(initialFiles);

    return this.withTransaction(ctx.transaction, async (transaction) => {
      await this.assertRepoNameAvailable(metadata.name, metadata.normalizedName, transaction);

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
          applicationName: this.requireApplicationName(),
          name: metadata.name,
          normalizedName: metadata.normalizedName,
          title: metadata.title,
          description: metadata.description,
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

      if (vscResult.initialCommit) {
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

  async getOrCreateApplicationDefaultRepo(
    applicationName: string,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionRepoRecord> {
    this.assertCurrentApplication(applicationName);
    const identity = buildApplicationDefaultLightExtensionIdentity(applicationName);
    const existing = await this.findInternalRepo(identity.repoId, ctx);
    if (existing) {
      return stripInternalRepo(existing);
    }

    const requestId = getRequestId(ctx);
    const initialFiles = createDefaultLightExtensionTemplate();
    this.assertValidInitialFiles(initialFiles);
    try {
      return await this.withTransaction(ctx.transaction, async (transaction) => {
        const current = await this.findInternalRepo(identity.repoId, { ...ctx, transaction });
        if (current) {
          return stripInternalRepo(current);
        }
        const vscResult = await this.runVsc(identity.repoId, () =>
          this.vscFileService.ensureRepository(
            {
              ownerType: LIGHT_EXTENSION_OWNER_TYPE,
              ownerId: identity.repoId,
              name: 'source',
              initialFiles,
              message: 'Initialize application light extensions',
              authorId: ctx.actorUserId || null,
              metadata: {
                lightExtensionRepoId: identity.repoId,
                applicationName,
                defaultRepository: true,
                requestId,
              },
            },
            this.createVscContext({
              ctx,
              transaction,
              requestId,
              repoId: identity.repoId,
              aclAction: 'create',
              reason: 'create application default light-extension repository',
              allowedActions: ['createRepository'],
            }),
          ),
        );
        const record = await this.createRepoRecord(
          {
            id: identity.repoId,
            vscRepoId: vscResult.repository.id,
            applicationName: this.requireApplicationName(),
            name: identity.name,
            normalizedName: identity.name,
            title: identity.title,
            description: null,
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
          message: 'Application default light extension repository created',
          details: {
            applicationName,
            defaultRepository: true,
            headCommitId: repo.headCommitId,
          },
          transaction,
        });

        return repo;
      });
    } catch (error) {
      if (
        error instanceof UniqueConstraintError ||
        (error instanceof LightExtensionError && error.code === 'LIGHT_EXTENSION_REPO_CONFLICT')
      ) {
        const concurrent = await this.findInternalRepo(identity.repoId, ctx);
        if (concurrent) {
          return stripInternalRepo(concurrent);
        }
      }
      if (this.db.sequelize.getDialect() === 'sqlite' && isSqliteBusyError(error)) {
        for (let attempt = 0; attempt < 50; attempt += 1) {
          await delay(100);
          try {
            const concurrent = await this.findInternalRepo(identity.repoId, ctx);
            if (concurrent) {
              return stripInternalRepo(concurrent);
            }
          } catch (lookupError) {
            if (!isSqliteBusyError(lookupError)) {
              throw lookupError;
            }
          }
        }
      }
      throw error;
    }
  }

  normalizeCreateMetadata(
    input: Pick<LightExtensionCreateRepoInput, 'name' | 'title' | 'description'>,
  ): LightExtensionCreateMetadata {
    const name = input.name.trim();
    return {
      name,
      normalizedName: normalizeRepoName(name),
      title: optionalTrim(input.title),
      description: optionalTrim(input.description),
    };
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
    return this.withTransaction(ctx.transaction, async (transaction) => {
      await this.claimLegacyApplicationRepos(transaction);
      const records = await this.db.getRepository('lightExtensionRepos').find({
        filter: { applicationName: this.requireApplicationName() },
        sort: ['name'],
        transaction,
      });
      const repoIds = records.map((record) => String(record.get('id')));
      const entryRecords = repoIds.length
        ? await this.db.getRepository('lightExtensionEntries').find({
            filter: { repoId: { $in: repoIds } },
            transaction,
          })
        : [];
      const entrySummary = new Map<string, { count: number; kinds: Record<string, number> }>();
      for (const entry of entryRecords) {
        if (entry.get('healthStatus') === 'missing') {
          continue;
        }
        const repoId = String(entry.get('repoId'));
        const kind = String(entry.get('kind'));
        const summary = entrySummary.get(repoId) || { count: 0, kinds: {} };
        summary.count += 1;
        summary.kinds[kind] = (summary.kinds[kind] || 0) + 1;
        entrySummary.set(repoId, summary);
      }

      return records.map((record) => {
        const repo = repoFromModel(record);
        const summary = entrySummary.get(repo.id);
        return {
          ...repo,
          entryCount: summary?.count || 0,
          entryKinds: summary?.kinds || {},
        };
      });
    });
  }

  async assertApplicationOwnership(
    repoId: string,
    applicationName: string,
    ctx: LightExtensionServiceContext = {},
  ): Promise<void> {
    this.assertCurrentApplication(applicationName);
    await this.getInternalRepo(repoId, ctx);
  }

  async getRepo(repoId: string, ctx: LightExtensionServiceContext = {}): Promise<LightExtensionRepoRecord> {
    return stripInternalRepo(await this.getInternalRepo(repoId, ctx));
  }

  async updateRepo(
    input: LightExtensionUpdateRepoInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionRepoRecord> {
    const title = optionalTrim(input.title);
    if (!title) {
      throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Light extension title is required');
    }
    const requestId = getRequestId(ctx);

    return this.withTransaction(ctx.transaction, async (transaction) => {
      const current = await this.lockInternalRepoForUpdate(input.repoId, { ...ctx, transaction });

      const description = optionalTrim(input.description);
      if (current.title === title && current.description === description) {
        return stripInternalRepo(current);
      }
      const repoModel = this.db.getModel<Model<LightExtensionRepoInternalRecord>>('lightExtensionRepos');
      await repoModel.update(
        {
          title,
          description,
        },
        {
          where: {
            id: input.repoId,
          },
          transaction,
        },
      );

      const next = await this.getInternalRepo(input.repoId, { ...ctx, transaction });
      await this.auditService.recordLifecycleEvent({
        repoId: input.repoId,
        action: 'repoUpdate',
        result: 'success',
        requestId,
        actorUserId: ctx.actorUserId,
        message: 'Light extension repository metadata updated',
        details: {
          titleChanged: current.title !== next.title,
          descriptionChanged: current.description !== next.description,
        },
        transaction,
      });

      return stripInternalRepo(next);
    });
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
    await this.claimOrAssertApplicationOwnership(record, ctx.transaction);
    return internalRepoFromModel(record);
  }

  async changeLifecycle(
    input: LightExtensionChangeLifecycleInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionRepoRecord> {
    assertLifecycleStatus(input.lifecycleStatus, 'lifecycleStatus');
    const requestId = getRequestId(ctx);

    try {
      return await this.withTransaction(ctx.transaction, async (transaction) => {
        const current = await this.lockInternalRepoForUpdate(input.repoId, { ...ctx, transaction });

        if (input.lifecycleStatus === 'archived') {
          await this.assertRemoteSyncIdle(current.vscRepoId, transaction);
        }

        if (current.lifecycleStatus === 'archived' && input.lifecycleStatus !== 'archived') {
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
        await this.referenceService?.refreshReferencesForRepo(
          input.repoId,
          {
            ...ctx,
            transaction,
            requestId,
          },
          'repo_lifecycle_change',
        );
        await this.auditService.recordLifecycleEvent({
          repoId: input.repoId,
          action: 'repoLifecycleChange',
          result: 'success',
          requestId,
          actorUserId: ctx.actorUserId,
          fromStatus: current.lifecycleStatus,
          toStatus: next.lifecycleStatus,
          message: 'Light extension lifecycle status changed',
          transaction,
        });

        return stripInternalRepo(next);
      });
    } catch (error) {
      if (error instanceof LightExtensionError && error.code === 'LIGHT_EXTENSION_REPO_ARCHIVED') {
        const current = await this.getInternalRepo(input.repoId, ctx);
        await this.recordLifecycleBlocked({
          repoId: input.repoId,
          requestId,
          ctx,
          fromStatus: current.lifecycleStatus,
          toStatus: input.lifecycleStatus,
          reasonCode: 'repo_archived',
          message: 'Archived light extension repositories cannot be re-enabled',
          details: error.details,
          transaction: ctx.transaction,
        });
      }
      throw error;
    }
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
        await this.assertRemoteSyncIdle(repo.vscRepoId, transaction);
        const referenceCount = await this.countRepoReferences(input.repoId, transaction);

        if (referenceCount > 0) {
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
      if (error instanceof LightExtensionError && error.code === 'LIGHT_EXTENSION_REFERENCE_EXISTS') {
        const repo = await this.getInternalRepo(input.repoId, ctx);
        const referenceCount = await this.countRepoReferences(input.repoId, ctx.transaction);
        await this.recordDeleteBlockedByReferences(
          input.repoId,
          requestId,
          ctx,
          repo.lifecycleStatus,
          referenceCount,
          ctx.transaction,
        );
        throw error;
      }
      if (isReferenceConstraintError(error)) {
        const referenceCount = await this.countRepoReferences(input.repoId);
        await this.recordDeleteBlockedByReferences(input.repoId, requestId, ctx, null, referenceCount, ctx.transaction);
        throw referenceExistsError(input.repoId, referenceCount);
      }

      throw error;
    }
  }

  private async assertRepoNameAvailable(name: string, normalizedName: string, transaction: Transaction): Promise<void> {
    const conflict = await this.db.getRepository('lightExtensionRepos').findOne({
      filter: {
        applicationName: this.requireApplicationName(),
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
      applicationName: string;
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
    if (record) {
      await this.claimOrAssertApplicationOwnership(record, ctx.transaction);
    }
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
    await this.claimOrAssertApplicationOwnership(record, transaction);
    return internalRepoFromModel(record);
  }

  private requireApplicationName(): string {
    const applicationName = this.applicationName.trim();
    if (!applicationName) {
      throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Application identity is required');
    }
    return applicationName;
  }

  private assertCurrentApplication(applicationName: string): void {
    if (applicationName.trim() === this.requireApplicationName()) {
      return;
    }
    throw new LightExtensionError(
      'LIGHT_EXTENSION_PERMISSION_DENIED',
      'Light extension repository belongs to another application',
    );
  }

  private async claimLegacyApplicationRepos(transaction: Transaction): Promise<void> {
    await this.db.getModel<Model>('lightExtensionRepos').update(
      { applicationName: this.requireApplicationName() },
      {
        where: { applicationName: null },
        transaction,
      },
    );
  }

  private async claimOrAssertApplicationOwnership(record: Model, transaction?: Transaction): Promise<void> {
    const applicationName = record.get('applicationName');
    if (applicationName === this.requireApplicationName()) {
      return;
    }
    if (applicationName === null || typeof applicationName === 'undefined' || applicationName === '') {
      await record.update({ applicationName: this.requireApplicationName() }, { transaction });
      return;
    }
    throw new LightExtensionError(
      'LIGHT_EXTENSION_PERMISSION_DENIED',
      'Light extension repository belongs to another application',
      {
        details: {
          repoId: String(record.get('id')),
        },
      },
    );
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
    transaction?: Transaction,
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
      transaction,
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
    transaction?: Transaction;
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
      transaction: input.transaction,
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

  private async assertRemoteSyncIdle(vscRepoId: string, transaction: Transaction): Promise<void> {
    if (!this.remoteSyncLifecycleGate) {
      return;
    }
    try {
      await this.remoteSyncLifecycleGate.assertRepositoryIdle(vscRepoId, transaction);
    } catch (error) {
      if (error instanceof RemoteSyncError) {
        throw mapRemoteSyncErrorToLightExtension(error);
      }
      throw error;
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
    applicationName: (record.get('applicationName') as string | null) || null,
    name: record.get('name') as string,
    normalizedName: record.get('normalizedName') as string,
    title: (record.get('title') as string | null) || null,
    description: (record.get('description') as string | null) || null,
    lifecycleStatus: record.get('lifecycleStatus') as LightExtensionRepoLifecycleStatus,
    healthStatus: record.get('healthStatus') as LightExtensionRepoRecord['healthStatus'],
    headCommitId: (record.get('headCommitId') as string | null) || null,
    lastCompiledAt: normalizeRecordDate(record.get('lastCompiledAt')),
    createdAt: normalizeRecordDate(record.get('createdAt')),
    updatedAt: normalizeRecordDate(record.get('updatedAt')),
  };
}

export function stripInternalRepo(repo: LightExtensionRepoInternalRecord): LightExtensionRepoRecord {
  const { vscRepoId: _vscRepoId, applicationName: _applicationName, ...publicRepo } = repo;
  return publicRepo;
}

function getRequestId(ctx: LightExtensionServiceContext): string {
  return ctx.requestId || randomUUID();
}

export function buildApplicationDefaultLightExtensionIdentity(applicationName: string): {
  repoId: string;
  name: string;
  title: string;
} {
  const normalizedApplicationName = applicationName.trim();
  if (!normalizedApplicationName) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Application identity is required');
  }
  const identityHash = createHash('sha256').update(normalizedApplicationName).digest('hex');
  return {
    repoId: `ler_app_${identityHash.slice(0, 24)}`,
    name: `application-extensions-${identityHash.slice(0, 12)}`,
    title: 'Application extensions',
  };
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
    'Light extension repository is referenced and cannot be deleted',
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

function createLocalLightExtensionPermissionRegistry(
  permissionService: LightExtensionPermissionService,
): VscPermissionHookRegistry {
  const permissionHooks = new VscPermissionHookRegistry();
  permissionHooks.register(permissionService.createVscPermissionHook());

  return permissionHooks;
}
