/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';
import { createHash, randomUUID } from 'crypto';

import { LightExtensionError, isLightExtensionError } from '../../shared/errors';
import type {
  LightExtensionBulkUpgradeInput,
  LightExtensionBulkUpgradeItemResult,
  LightExtensionBulkUpgradeItemStatus,
  LightExtensionBulkUpgradeResult,
  LightExtensionFlowModelOwnerLocator,
  LightExtensionReferenceImpactInput,
  LightExtensionReferenceImpactItem,
  LightExtensionReferenceImpactResult,
  LightExtensionReferenceRecord,
  LightExtensionRuntimeSourceBinding,
  LightExtensionSettingsValidationIssue,
  LightExtensionSourceBindingVersionPolicy,
} from '../../shared/types';
import { LightExtensionAuditService } from './LightExtensionAuditService';
import { LightExtensionPermissionService } from './LightExtensionPermissionService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import {
  LightExtensionPublicationRecord,
  publicationFromModel,
  toPublicationMetadata,
} from './LightExtensionPublicationService';
import { SettingsResolverService } from './SettingsResolverService';

type FlowModelNode = {
  uid?: string;
  use?: string;
  stepParams?: Record<string, unknown>;
  subModels?: Record<string, FlowModelNode | FlowModelNode[] | undefined>;
};

type JsSettings = {
  sourceMode?: string;
  sourceBinding?: LightExtensionRuntimeSourceBinding;
  settings: Record<string, unknown>;
};

type SettingsValidationResult = {
  compatible: boolean;
  settingsHash?: string;
  issues: LightExtensionSettingsValidationIssue[];
};

type UpgradeEvaluation = {
  reference: LightExtensionReferenceRecord;
  ownerModel: Model | null;
  options: Record<string, unknown>;
  jsSettings: JsSettings | null;
  validation: SettingsValidationResult;
  blockedReason?: string;
};

type BulkUpgradeServiceContext = LightExtensionServiceContext & {
  currentUser?: unknown;
  state?: Record<string, unknown>;
  timezone?: string;
};

type ReferenceVisibilityService = {
  canReadReferenceOwner: (
    ownerLocator: LightExtensionFlowModelOwnerLocator,
    ctx: BulkUpgradeServiceContext,
  ) => Promise<boolean>;
};

type RepositoryWithConditionalUpdate = {
  update: (options: {
    values: Record<string, unknown>;
    filter?: Record<string, unknown>;
    filterByTk?: string;
    transaction?: BulkUpgradeServiceContext['transaction'];
  }) => Promise<unknown[] | number | unknown>;
};

type ModelWithConditionalUpdate = {
  update: (
    values: Record<string, unknown>,
    options: {
      where: Record<string, unknown>;
      transaction?: BulkUpgradeServiceContext['transaction'];
    },
  ) => Promise<[number] | [number, unknown[]] | number>;
};

type CollectionWithModelUpdate = {
  model?: ModelWithConditionalUpdate;
};

const JS_BLOCK_USE = 'JSBlockModel';
const OWNER_KIND = 'flowModel.step';
const EMPTY_SUMMARY: Record<LightExtensionBulkUpgradeItemStatus, number> = {
  upgraded: 0,
  conflict: 0,
  incompatible: 0,
  skipped: 0,
  missing: 0,
};

export class BulkUpgradeService {
  constructor(
    private readonly db: Database,
    private readonly auditService: LightExtensionAuditService,
    private readonly permissionService: LightExtensionPermissionService,
    private readonly settingsResolver = new SettingsResolverService(),
    private readonly referenceVisibilityService?: ReferenceVisibilityService,
  ) {}

  async analyzeImpact(
    input: LightExtensionReferenceImpactInput,
    ctx: BulkUpgradeServiceContext = {},
  ): Promise<LightExtensionReferenceImpactResult> {
    const requestId = ctx.requestId || randomUUID();
    assertImpactInput(input);
    await this.assertActionAllowed({
      action: 'readReferences',
      auditAction: 'referenceImpact',
      requestId,
      ctx,
      publicationId: input.toPublicationId,
    });
    await this.assertActionAllowed({
      action: 'usePublication',
      auditAction: 'referenceImpact',
      requestId,
      ctx,
      publicationId: input.toPublicationId,
    });

    const toPublication = await this.loadPublication(input.toPublicationId, ctx);
    const references = await this.findReferences(input, ctx);
    const items: LightExtensionReferenceImpactItem[] = [];

    for (const reference of references) {
      if (!(await this.canAccessReference(reference, ctx))) {
        await this.recordReferenceVisibilityDenied(reference, toPublication.id, 'referenceImpact', requestId, ctx);
        continue;
      }
      const evaluation = await this.evaluateReference(reference, toPublication, ctx);
      items.push({
        reference,
        targetPublicationId: toPublication.id,
        settingsValidation: evaluation.validation,
        ...(evaluation.blockedReason ? { upgradeBlockedReason: evaluation.blockedReason } : {}),
      });
    }

    await this.recordReferenceAuditBestEffort({
      repoId: toPublication.repoId,
      entryId: toPublication.entryId,
      publicationId: toPublication.id,
      action: 'referenceImpact',
      result: 'success',
      requestId,
      actorUserId: ctx.actorUserId,
      referenceCount: items.length,
      message: 'Light extension reference impact analyzed',
      details: {
        total: items.length,
        incompatible: items.filter((item) => !item.settingsValidation.compatible).length,
        skipped: items.filter((item) => item.upgradeBlockedReason).length,
      },
      transaction: ctx.transaction,
    });

    return {
      toPublication: toPublicationMetadata(toPublication),
      references: items,
      summary: buildImpactSummary(items),
    };
  }

  async bulkUpgrade(
    input: LightExtensionBulkUpgradeInput,
    ctx: BulkUpgradeServiceContext = {},
  ): Promise<LightExtensionBulkUpgradeResult> {
    return this.withTransaction(ctx.transaction, (transaction) =>
      this.bulkUpgradeInternal(input, {
        ...ctx,
        transaction,
      }),
    );
  }

  private async bulkUpgradeInternal(
    input: LightExtensionBulkUpgradeInput,
    ctx: BulkUpgradeServiceContext,
  ): Promise<LightExtensionBulkUpgradeResult> {
    const requestId = ctx.requestId || randomUUID();
    assertBulkUpgradeInput(input);
    await this.assertActionAllowed({
      action: 'updateReferences',
      auditAction: 'referenceBulkUpgrade',
      requestId,
      ctx,
      publicationId: input.toPublicationId,
      referenceCount: input.referenceIds.length,
    });
    await this.assertActionAllowed({
      action: 'usePublication',
      auditAction: 'referenceBulkUpgrade',
      requestId,
      ctx,
      publicationId: input.toPublicationId,
      referenceCount: input.referenceIds.length,
    });

    const toPublication = await this.loadPublication(input.toPublicationId, ctx);
    const references = await this.findReferences(
      { referenceIds: input.referenceIds, toPublicationId: input.toPublicationId },
      ctx,
    );
    const referencesById = new Map(references.map((reference) => [reference.id, reference]));
    const items: LightExtensionBulkUpgradeItemResult[] = [];

    for (const referenceId of input.referenceIds) {
      const reference = referencesById.get(referenceId);
      if (!reference) {
        items.push({
          referenceId,
          status: 'missing',
          reasonCode: 'reference_missing',
        });
        await this.recordBulkUpgradeBlocked(toPublication, requestId, ctx, {
          referenceId,
          reasonCode: 'reference_missing',
        });
        continue;
      }

      if (!(await this.canAccessReference(reference, ctx))) {
        items.push({
          referenceId,
          status: 'skipped',
          reasonCode: 'owner_not_visible',
        });
        await this.recordReferenceVisibilityDenied(reference, toPublication.id, 'referenceBulkUpgrade', requestId, ctx);
        continue;
      }

      const conflictReason = getOptimisticConflictReason(reference, input);
      if (conflictReason) {
        items.push({
          referenceId,
          status: 'conflict',
          publicationId: reference.publicationId,
          settingsHash: reference.settingsHash,
          reasonCode: conflictReason,
        });
        await this.recordBulkUpgradeBlocked(toPublication, requestId, ctx, {
          reference,
          reasonCode: conflictReason,
        });
        continue;
      }

      const evaluation = await this.evaluateReference(reference, toPublication, ctx);
      if (evaluation.blockedReason) {
        items.push({
          referenceId,
          status: 'skipped',
          publicationId: reference.publicationId,
          settingsHash: reference.settingsHash,
          reasonCode: evaluation.blockedReason,
        });
        await this.recordBulkUpgradeBlocked(toPublication, requestId, ctx, {
          reference,
          reasonCode: evaluation.blockedReason,
        });
        continue;
      }
      const liveConflictReason = await this.getLiveOwnerConflictReason(reference, evaluation, ctx);
      if (liveConflictReason) {
        items.push({
          referenceId,
          status: 'conflict',
          publicationId: reference.publicationId,
          settingsHash: reference.settingsHash,
          reasonCode: liveConflictReason,
        });
        await this.recordBulkUpgradeBlocked(toPublication, requestId, ctx, {
          reference,
          reasonCode: liveConflictReason,
        });
        continue;
      }
      if (!evaluation.validation.compatible) {
        items.push({
          referenceId,
          status: 'incompatible',
          publicationId: reference.publicationId,
          settingsHash: reference.settingsHash,
          reasonCode: 'settings_invalid',
          issues: evaluation.validation.issues,
        });
        await this.recordBulkUpgradeBlocked(toPublication, requestId, ctx, {
          reference,
          reasonCode: 'settings_invalid',
          details: {
            issueCount: evaluation.validation.issues.length,
            issuePaths: evaluation.validation.issues.map((issue) => issue.path),
          },
        });
        continue;
      }

      const referenceUpdated = await this.updateReferenceRecord(
        reference,
        toPublication,
        evaluation.validation.settingsHash || reference.settingsHash,
        ctx,
      );
      if (!referenceUpdated) {
        items.push({
          referenceId,
          status: 'conflict',
          publicationId: reference.publicationId,
          settingsHash: reference.settingsHash,
          reasonCode: 'reference_changed',
        });
        await this.recordBulkUpgradeBlocked(toPublication, requestId, ctx, {
          reference,
          reasonCode: 'reference_changed',
        });
        continue;
      }
      await this.updateReferenceOwnerBinding(evaluation, toPublication, ctx);
      items.push({
        referenceId,
        status: 'upgraded',
        publicationId: toPublication.id,
        settingsHash: evaluation.validation.settingsHash,
      });
      await this.recordReferenceAuditBestEffort({
        repoId: toPublication.repoId,
        entryId: toPublication.entryId,
        publicationId: toPublication.id,
        action: 'referenceBulkUpgrade',
        result: 'success',
        requestId,
        actorUserId: ctx.actorUserId,
        ownerKind: reference.ownerKind,
        ownerLocatorHash: reference.ownerLocatorHash,
        settingsHash: evaluation.validation.settingsHash,
        message: 'Light extension reference upgraded',
        details: {
          referenceId,
          fromPublicationId: reference.publicationId,
          toPublicationId: toPublication.id,
        },
        transaction: ctx.transaction,
      });
    }

    return {
      toPublication: toPublicationMetadata(toPublication),
      items,
      summary: summarizeBulkUpgrade(items),
    };
  }

  private async evaluateReference(
    reference: LightExtensionReferenceRecord,
    toPublication: LightExtensionPublicationRecord,
    ctx: BulkUpgradeServiceContext,
  ): Promise<UpgradeEvaluation> {
    const blockedReason = getReferenceUpgradeBlockedReason(reference, toPublication);
    const ownerModel = blockedReason ? null : await this.findOwnerModel(reference.ownerLocator.modelUid, ctx);
    const options = ownerModel ? parseOptions(ownerModel.get('options')) : {};
    const jsSettings = ownerModel ? readJsSettings(options) : null;
    const validation =
      jsSettings && !blockedReason
        ? validateSettingsForPublication(this.settingsResolver, toPublication, jsSettings.settings)
        : {
            compatible: false,
            issues: [],
          };

    return {
      reference,
      ownerModel,
      options,
      jsSettings,
      validation,
      blockedReason: blockedReason || getOwnerBlockedReason(ownerModel, jsSettings),
    };
  }

  private async updateReferenceOwnerBinding(
    evaluation: UpgradeEvaluation,
    toPublication: LightExtensionPublicationRecord,
    ctx: BulkUpgradeServiceContext,
  ): Promise<void> {
    if (!evaluation.ownerModel || !evaluation.jsSettings) {
      throw new LightExtensionError('LIGHT_EXTENSION_LIFECYCLE_CONFLICT', 'Reference owner is not upgradable');
    }
    const nextOptions = cloneRecord(evaluation.options);
    const stepParams = isPlainRecord(nextOptions.stepParams) ? cloneRecord(nextOptions.stepParams) : {};
    const jsSettings = isPlainRecord(stepParams.jsSettings) ? cloneRecord(stepParams.jsSettings) : {};
    jsSettings.sourceMode = 'light-extension';
    jsSettings.sourceBinding = {
      ...evaluation.jsSettings.sourceBinding,
      type: 'light-extension-entry',
      repoId: toPublication.repoId,
      entryId: toPublication.entryId,
      kind: toPublication.kind,
      publicationId: toPublication.id,
      versionPolicy: 'pinned',
    };
    stepParams.jsSettings = jsSettings;
    nextOptions.stepParams = stepParams;
    await evaluation.ownerModel.update(
      {
        options: nextOptions,
      },
      {
        transaction: ctx.transaction,
      },
    );
  }

  private async updateReferenceRecord(
    reference: LightExtensionReferenceRecord,
    toPublication: LightExtensionPublicationRecord,
    settingsHash: string,
    ctx: BulkUpgradeServiceContext,
  ): Promise<boolean> {
    const values = {
      repoId: toPublication.repoId,
      entryId: toPublication.entryId,
      publicationId: toPublication.id,
      versionPolicy: 'pinned',
      settingsHash,
      resolvedStatus: await this.resolvePublicationRuntimeStatus(toPublication, ctx),
    };
    const where = {
      id: reference.id,
      publicationId: reference.publicationId,
      settingsHash: reference.settingsHash,
    };
    const collection = this.getCollectionWithModelUpdate('lightExtensionReferences');
    if (collection?.model?.update) {
      const result = await collection.model.update(values, {
        where,
        transaction: ctx.transaction,
      });
      return getUpdatedCount(result) > 0;
    }

    const repository = this.db.getRepository('lightExtensionReferences') as unknown as RepositoryWithConditionalUpdate;
    const result = await repository.update({
      values,
      filterByTk: reference.id,
      filter: where,
      transaction: ctx.transaction,
    });

    return getUpdatedCount(result) > 0;
  }

  private async resolvePublicationRuntimeStatus(
    publication: LightExtensionPublicationRecord,
    ctx: BulkUpgradeServiceContext,
  ): Promise<LightExtensionReferenceRecord['resolvedStatus']> {
    const repo = await this.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: publication.repoId,
      transaction: ctx.transaction,
    });
    if (!repo) {
      return 'repo_missing';
    }
    const lifecycleStatus = normalizeString(repo.get('lifecycleStatus'));
    if (lifecycleStatus === 'disabled') {
      return 'repo_disabled';
    }
    if (lifecycleStatus === 'archived') {
      return 'repo_archived';
    }
    const entry = await this.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: publication.entryId,
      transaction: ctx.transaction,
    });
    if (!entry) {
      return 'entry_missing';
    }
    if (
      normalizeString(entry.get('repoId')) !== publication.repoId ||
      normalizeString(entry.get('kind')) !== publication.kind ||
      normalizeString(entry.get('healthStatus')) !== 'ready'
    ) {
      return 'entry_missing';
    }
    return 'active';
  }

  private async findReferences(
    input: LightExtensionReferenceImpactInput | { referenceIds: string[]; toPublicationId: string },
    ctx: BulkUpgradeServiceContext,
  ): Promise<LightExtensionReferenceRecord[]> {
    const filter: Record<string, unknown> = {};
    const referenceIds = Array.isArray(input.referenceIds)
      ? input.referenceIds.map((item) => normalizeString(item)).filter(Boolean)
      : [];
    if (referenceIds.length) {
      filter.id = {
        $in: referenceIds,
      };
    } else {
      const listInput = input as LightExtensionReferenceImpactInput;
      for (const key of ['repoId', 'entryId', 'publicationId'] as const) {
        const value = normalizeString(listInput[key]);
        if (value) {
          filter[key] = value;
        }
      }
    }

    const records = await this.db.getRepository('lightExtensionReferences').find({
      filter,
      sort: ['repoId', 'entryId', 'ownerLocatorHash'],
      transaction: ctx.transaction,
    });
    return records.map(referenceFromModel);
  }

  private async findOwnerModel(modelUid: string, ctx: BulkUpgradeServiceContext): Promise<Model | null> {
    const uidValue = normalizeString(modelUid);
    if (!uidValue) {
      return null;
    }
    return this.db.getRepository('flowModels').findOne({
      filterByTk: uidValue,
      transaction: ctx.transaction,
      lock: getTransactionUpdateLock(ctx.transaction),
    });
  }

  private async loadPublication(
    publicationId: string,
    ctx: BulkUpgradeServiceContext,
  ): Promise<LightExtensionPublicationRecord> {
    const record = await this.db.getRepository('lightExtensionEntryPublications').findOne({
      filterByTk: publicationId,
      transaction: ctx.transaction,
    });
    if (!record) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_PUBLICATION_NOT_FOUND',
        `Light extension publication "${publicationId}" was not found`,
      );
    }
    return publicationFromModel(record);
  }

  private async assertActionAllowed(input: {
    action: 'readReferences' | 'updateReferences' | 'usePublication';
    auditAction: 'referenceImpact' | 'referenceBulkUpgrade';
    requestId: string;
    ctx: BulkUpgradeServiceContext;
    publicationId: string;
    referenceCount?: number;
  }): Promise<void> {
    try {
      await this.permissionService.assertActionAllowed({
        action: input.action,
        ctx: input.ctx,
      });
    } catch (error) {
      if (isLightExtensionError(error) && error.code === 'LIGHT_EXTENSION_PERMISSION_DENIED') {
        await this.recordReferenceAuditBestEffort({
          publicationId: input.publicationId,
          action: input.auditAction,
          result: 'denied',
          requestId: input.requestId,
          actorUserId: input.ctx.actorUserId,
          referenceCount: input.referenceCount,
          reasonCode: 'permission_denied',
          message: 'Light extension reference action permission denied',
          details: {
            permissionAction: input.action,
          },
          transaction: input.ctx.transaction,
        });
      }
      throw error;
    }
  }

  private async recordBulkUpgradeBlocked(
    publication: LightExtensionPublicationRecord,
    requestId: string,
    ctx: BulkUpgradeServiceContext,
    input: {
      reference?: LightExtensionReferenceRecord;
      referenceId: string;
      reasonCode: string;
      details?: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.recordReferenceAuditBestEffort({
      repoId: publication.repoId,
      entryId: publication.entryId,
      publicationId: publication.id,
      action: 'referenceBulkUpgrade',
      result: 'blocked',
      requestId,
      actorUserId: ctx.actorUserId,
      ownerKind: input.reference?.ownerKind,
      ownerLocatorHash: input.reference?.ownerLocatorHash,
      settingsHash: input.reference?.settingsHash,
      reasonCode: input.reasonCode,
      message: 'Light extension reference upgrade blocked',
      details: {
        referenceId: input.referenceId,
        ...(input.details || {}),
      },
      transaction: ctx.transaction,
    });
  }

  private async recordReferenceAuditBestEffort(
    input: Parameters<LightExtensionAuditService['recordReferenceEvent']>[0],
  ): Promise<void> {
    try {
      await this.auditService.recordReferenceEvent(input);
    } catch {
      // Reference updates and denials must not depend on audit persistence availability.
    }
  }

  private async getLiveOwnerConflictReason(
    reference: LightExtensionReferenceRecord,
    evaluation: UpgradeEvaluation,
    ctx: BulkUpgradeServiceContext,
  ): Promise<string | undefined> {
    const sourceBinding = evaluation.jsSettings?.sourceBinding;
    if (!sourceBinding) {
      return 'source_binding_missing';
    }
    if (sourceBinding.versionPolicy !== 'pinned') {
      return 'version_policy_not_pinned';
    }
    if (sourceBinding.publicationId !== reference.publicationId) {
      return 'publication_changed';
    }
    if (
      sourceBinding.repoId !== reference.repoId ||
      sourceBinding.entryId !== reference.entryId ||
      sourceBinding.kind !== reference.kind
    ) {
      return 'binding_changed';
    }

    const livePublication = await this.loadPublication(sourceBinding.publicationId, ctx).catch((error) => {
      if (isLightExtensionError(error) && error.code === 'LIGHT_EXTENSION_PUBLICATION_NOT_FOUND') {
        return null;
      }
      throw error;
    });
    if (!livePublication) {
      return 'publication_changed';
    }
    const liveValidation = validateSettingsForPublication(
      this.settingsResolver,
      livePublication,
      evaluation.jsSettings.settings,
    );
    if (!liveValidation.compatible || liveValidation.settingsHash !== reference.settingsHash) {
      return 'settings_changed';
    }

    return undefined;
  }

  private async canAccessReference(
    reference: LightExtensionReferenceRecord,
    ctx: BulkUpgradeServiceContext,
  ): Promise<boolean> {
    if (!this.referenceVisibilityService) {
      return true;
    }
    return this.referenceVisibilityService.canReadReferenceOwner(reference.ownerLocator, ctx);
  }

  private async recordReferenceVisibilityDenied(
    reference: LightExtensionReferenceRecord,
    targetPublicationId: string,
    action: 'referenceImpact' | 'referenceBulkUpgrade',
    requestId: string,
    ctx: BulkUpgradeServiceContext,
  ): Promise<void> {
    await this.recordReferenceAuditBestEffort({
      repoId: reference.repoId,
      entryId: reference.entryId,
      publicationId: targetPublicationId,
      action,
      result: 'denied',
      requestId,
      actorUserId: ctx.actorUserId,
      ownerKind: reference.ownerKind,
      ownerLocatorHash: reference.ownerLocatorHash,
      reasonCode: 'owner_not_visible',
      message: 'Light extension reference owner is not visible to the reader',
      transaction: ctx.transaction,
    });
  }

  private getCollectionWithModelUpdate(name: string): CollectionWithModelUpdate | null {
    try {
      const collection = this.db.getCollection(name) as CollectionWithModelUpdate | null;
      return collection?.model?.update ? collection : null;
    } catch {
      return null;
    }
  }

  private async withTransaction<T>(
    transaction: BulkUpgradeServiceContext['transaction'],
    run: (transaction: NonNullable<BulkUpgradeServiceContext['transaction']> | undefined) => Promise<T>,
  ): Promise<T> {
    if (transaction) {
      return run(transaction);
    }

    const sequelize = (
      this.db as unknown as {
        sequelize?: {
          transaction: <R>(
            run: (transaction: NonNullable<BulkUpgradeServiceContext['transaction']>) => Promise<R>,
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

function assertImpactInput(input: LightExtensionReferenceImpactInput): void {
  if (!normalizeString(input.toPublicationId)) {
    throw invalidInput('toPublicationId is required');
  }
}

function assertBulkUpgradeInput(input: LightExtensionBulkUpgradeInput): void {
  if (!normalizeString(input.toPublicationId)) {
    throw invalidInput('toPublicationId is required');
  }
  if (!Array.isArray(input.referenceIds) || input.referenceIds.length === 0) {
    throw invalidInput('referenceIds are required');
  }
  for (const referenceId of input.referenceIds) {
    if (!normalizeString(referenceId)) {
      throw invalidInput('referenceIds must be non-empty strings');
    }
    if (!Object.prototype.hasOwnProperty.call(input.expectedPublicationIdByReference || {}, referenceId)) {
      throw invalidInput('expectedPublicationIdByReference is required for every selected reference');
    }
    if (!Object.prototype.hasOwnProperty.call(input.expectedSettingsHashByReference || {}, referenceId)) {
      throw invalidInput('expectedSettingsHashByReference is required for every selected reference');
    }
  }
}

function getReferenceUpgradeBlockedReason(
  reference: LightExtensionReferenceRecord,
  toPublication: LightExtensionPublicationRecord,
): string | undefined {
  if (reference.versionPolicy !== 'pinned') {
    return 'version_policy_not_pinned';
  }
  if (reference.repoId !== toPublication.repoId || reference.entryId !== toPublication.entryId) {
    return 'target_publication_mismatch';
  }
  if (reference.kind !== toPublication.kind) {
    return 'kind_mismatch';
  }
  return undefined;
}

function getOwnerBlockedReason(ownerModel: Model | null, jsSettings: JsSettings | null): string | undefined {
  if (!ownerModel) {
    return 'owner_missing';
  }
  if (!jsSettings?.sourceBinding) {
    return 'source_binding_missing';
  }
  if (jsSettings.sourceBinding.versionPolicy !== 'pinned') {
    return 'version_policy_not_pinned';
  }
  return undefined;
}

function getOptimisticConflictReason(
  reference: LightExtensionReferenceRecord,
  input: LightExtensionBulkUpgradeInput,
): string | undefined {
  const expectedPublicationId = input.expectedPublicationIdByReference?.[reference.id];
  if (expectedPublicationId !== reference.publicationId) {
    return 'publication_changed';
  }
  const expectedSettingsHash = input.expectedSettingsHashByReference?.[reference.id];
  if (expectedSettingsHash !== reference.settingsHash) {
    return 'settings_changed';
  }
  return undefined;
}

function validateSettingsForPublication(
  settingsResolver: SettingsResolverService,
  publication: LightExtensionPublicationRecord,
  settings: Record<string, unknown>,
): SettingsValidationResult {
  try {
    const resolved = settingsResolver.resolvePublicationSettings(publication, settings);
    return {
      compatible: true,
      settingsHash: stableJsonHash(resolved),
      issues: [],
    };
  } catch (error) {
    if (!isLightExtensionError(error) || error.code !== 'LIGHT_EXTENSION_SETTINGS_INVALID') {
      throw error;
    }
    return {
      compatible: false,
      issues: normalizeValidationIssues(error.details?.issues),
    };
  }
}

function readJsSettings(options: Record<string, unknown>): JsSettings | null {
  const stepParams = isPlainRecord(options.stepParams) ? options.stepParams : {};
  const jsSettings = isPlainRecord(stepParams.jsSettings) ? stepParams.jsSettings : {};
  const runJs = isPlainRecord(jsSettings.runJs) ? jsSettings.runJs : {};
  const sourceMode = normalizeString(jsSettings.sourceMode) || normalizeString(runJs.sourceMode) || 'inline';
  const sourceBinding = normalizeSourceBinding(jsSettings.sourceBinding || runJs.sourceBinding);
  if (sourceMode !== 'light-extension' || !sourceBinding) {
    return null;
  }
  return {
    sourceMode,
    sourceBinding,
    settings: normalizeSettings(jsSettings.settings || runJs.settings),
  };
}

function normalizeSourceBinding(value: unknown): LightExtensionRuntimeSourceBinding | undefined {
  if (!isPlainRecord(value)) {
    return undefined;
  }
  const type = normalizeString(value.type);
  const repoId = normalizeString(value.repoId);
  const entryId = normalizeString(value.entryId);
  const kind = normalizeString(value.kind);
  const publicationId = normalizeString(value.publicationId);
  if (type !== 'light-extension-entry' || !repoId || !entryId || !kind || !publicationId) {
    return undefined;
  }
  return {
    type,
    repoId,
    entryId,
    kind,
    publicationId,
    versionPolicy: normalizeVersionPolicy(value.versionPolicy),
  };
}

function normalizeSettings(value: unknown): Record<string, unknown> {
  return isPlainRecord(value) ? cloneRecord(value) : {};
}

function normalizeValidationIssues(value: unknown): LightExtensionSettingsValidationIssue[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (isPlainRecord(item) ? item : null))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => ({
      path: normalizeString(item.path) || '$',
      code: normalizeString(item.code) || 'settings_invalid',
      message: normalizeString(item.message) || 'Settings value is invalid',
      ...(isPlainRecord(item.details) ? { details: cloneRecord(item.details) } : {}),
    }));
}

function buildImpactSummary(
  items: LightExtensionReferenceImpactItem[],
): LightExtensionReferenceImpactResult['summary'] {
  const skipped = items.filter((item) => item.upgradeBlockedReason).length;
  const incompatible = items.filter((item) => !item.upgradeBlockedReason && !item.settingsValidation.compatible).length;
  return {
    total: items.length,
    upgradable: items.length - skipped - incompatible,
    incompatible,
    skipped,
  };
}

function summarizeBulkUpgrade(
  items: LightExtensionBulkUpgradeItemResult[],
): Record<LightExtensionBulkUpgradeItemStatus, number> {
  const summary = { ...EMPTY_SUMMARY };
  for (const item of items) {
    summary[item.status] += 1;
  }
  return summary;
}

function getUpdatedCount(result: unknown[] | number | unknown): number {
  if (Array.isArray(result)) {
    if (typeof result[0] === 'number') {
      return result[0];
    }
    return result.length;
  }
  if (typeof result === 'number') {
    return result;
  }
  return result ? 1 : 0;
}

function referenceFromModel(record: Model): LightExtensionReferenceRecord {
  const ownerLocator = normalizeOwnerLocator(record.get('ownerLocator')) || buildFlowModelOwnerLocator('');
  return {
    id: normalizeString(record.get('id')),
    repoId: normalizeString(record.get('repoId')),
    entryId: normalizeString(record.get('entryId')),
    publicationId: normalizeString(record.get('publicationId')) || null,
    kind: 'js-block',
    ownerKind: OWNER_KIND,
    ownerLocator,
    ownerLocatorHash: normalizeString(record.get('ownerLocatorHash')),
    versionPolicy: normalizeVersionPolicy(record.get('versionPolicy')),
    settingsHash: normalizeString(record.get('settingsHash')),
    resolvedStatus: normalizeStatus(record.get('resolvedStatus')),
    createdAt: normalizeDate(record.get('createdAt')),
    updatedAt: normalizeDate(record.get('updatedAt')),
  };
}

function normalizeOwnerLocator(value: unknown): LightExtensionFlowModelOwnerLocator | null {
  if (!isPlainRecord(value)) {
    return null;
  }
  const modelUid = normalizeString(value.modelUid);
  if (value.kind !== OWNER_KIND || !modelUid) {
    return null;
  }
  return buildFlowModelOwnerLocator(modelUid);
}

function buildFlowModelOwnerLocator(modelUid: string): LightExtensionFlowModelOwnerLocator {
  return {
    kind: OWNER_KIND,
    modelUid,
    use: JS_BLOCK_USE,
    stepPath: ['stepParams', 'jsSettings'],
  };
}

function normalizeStatus(value: unknown): LightExtensionReferenceRecord['resolvedStatus'] {
  const normalized = normalizeString(value);
  const statuses: Array<LightExtensionReferenceRecord['resolvedStatus']> = [
    'active',
    'binding_outdated',
    'repo_missing',
    'repo_disabled',
    'repo_archived',
    'entry_missing',
    'publication_missing',
    'owner_missing',
    'settings_invalid',
    'no_active_publication',
  ];
  return statuses.includes(normalized as LightExtensionReferenceRecord['resolvedStatus'])
    ? (normalized as LightExtensionReferenceRecord['resolvedStatus'])
    : 'publication_missing';
}

function normalizeVersionPolicy(value: unknown): LightExtensionSourceBindingVersionPolicy {
  return value === 'follow-active' ? 'follow-active' : 'pinned';
}

function getTransactionUpdateLock(transaction: BulkUpgradeServiceContext['transaction']): unknown {
  if (!transaction) {
    return undefined;
  }
  const lock = (transaction as { LOCK?: { UPDATE?: unknown } }).LOCK?.UPDATE;
  return lock || true;
}

function parseOptions(value: unknown): Record<string, unknown> {
  if (isPlainRecord(value)) {
    return cloneRecord(value);
  }
  if (typeof value !== 'string' || !value.trim()) {
    return {};
  }
  try {
    const parsed = JSON.parse(value);
    return isPlainRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function stableJsonHash(value: unknown): string {
  return `sha256:${createHash('sha256').update(stableSerialize(value)).digest('hex')}`;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (isPlainRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }

  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
}

function cloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeDate(value: unknown): string | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return typeof value === 'string' ? value : null;
}

function invalidInput(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message, {
    status: 422,
    details: {
      reasonCode: 'invalid_input',
    },
  });
}
