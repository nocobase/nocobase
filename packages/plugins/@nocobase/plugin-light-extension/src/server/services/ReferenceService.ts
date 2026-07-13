/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NoPermissionError, checkFilterParams, createUserProvider, parseJsonTemplate } from '@nocobase/acl';
import type { Database, Filter, Model } from '@nocobase/database';
import { uid } from '@nocobase/utils';
import { randomUUID } from 'crypto';

import type {
  LightExtensionKind,
  LightExtensionReferenceOwnerLocator,
  LightExtensionReferenceRebuildItem,
  LightExtensionReferenceRebuildInput,
  LightExtensionReferenceRebuildResult,
  LightExtensionReferenceRecord,
  LightExtensionReferenceResolvedStatus,
  LightExtensionRuntimeSourceBinding,
} from '../../shared/types';
import { isLightExtensionError } from '../../shared/errors';
import { LightExtensionAuditService } from './LightExtensionAuditService';
import { LightExtensionPermissionService } from './LightExtensionPermissionService';
import type { LightExtensionCanFunction } from './LightExtensionPermissionService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import { entryFromModel } from './LightExtensionEntryService';
import {
  JS_BLOCK_REFERENCE_OWNER_ADAPTER,
  buildReferenceOwnerLocator,
  collectReferenceOwnerNodes,
  getReferenceOwnerAdapterByKind,
  getReferenceOwnerAdapterByOwnerKind,
  getReferenceOwnerAdapterByUse,
  getReferenceOwnerModelUid,
  hashReferenceOwnerLocator,
  listReferenceOwnerAdapters,
  normalizeReferenceOwnerLocator,
  type ReferenceOwnerAdapter,
  stableJsonHash,
} from './ReferenceOwnerRegistry';
import { SettingsResolverService } from './SettingsResolverService';
import { getRuntimeSettingsSource, hasUsableRuntimeArtifact } from './runtimeArtifact';

type FlowModelRepositoryLike = {
  findModelById?: (
    uidValue: string,
    options?: { transaction?: LightExtensionServiceContext['transaction']; includeAsyncNode?: boolean },
  ) => Promise<FlowModelNode | null>;
};

type RepositoryLike = {
  find?: (options?: Record<string, unknown>) => Promise<Model[]>;
  findOne?: (options?: Record<string, unknown>) => Promise<Model | null>;
};

type FlowModelNode = {
  uid?: string;
  use?: string;
  stepParams?: Record<string, unknown>;
  subModels?: Record<string, FlowModelNode | FlowModelNode[] | undefined>;
};

type ReferenceSyncAction =
  | 'flowModels.save'
  | 'flowModels.duplicate'
  | 'flowModels.destroy'
  | 'flowSurfaces.updateSettings'
  | 'flowSurfaces.addBlock'
  | 'flowSurfaces.compose'
  | 'flowSurfaces.applyBlueprint'
  | 'flowSurfaces.removeNode'
  | 'referenceRebuild'
  | string;

type ReferenceServiceContext = LightExtensionServiceContext & {
  currentUser?: unknown;
  state?: Record<string, unknown>;
  timezone?: string;
  scopeRepoId?: string;
  dryRun?: boolean;
  dryRunItems?: LightExtensionReferenceRebuildItem[];
  skipOwnerLocatorHashes?: Set<string>;
};

type ReferencePermissionResult = false | { role?: string; params?: Record<string, unknown> };

type ReferenceUpsertSummary = {
  scanned: number;
  upserted: number;
  removed: number;
  ownerMissing: number;
  statusCounts: Partial<Record<LightExtensionReferenceResolvedStatus, number>>;
  items: LightExtensionReferenceRebuildItem[];
};

type NormalizedJsBlockSource = {
  sourceMode: string;
  sourceBinding?: LightExtensionRuntimeSourceBinding;
  settings: Record<string, unknown>;
};

type ReferenceOwnerSource = {
  adapter: ReferenceOwnerAdapter;
  node: FlowModelNode;
  ownerLocator?: LightExtensionReferenceOwnerLocator;
  source?: NormalizedJsBlockSource;
};

const EMPTY_SETTINGS_HASH = stableJsonHash({});

export class ReferenceService {
  constructor(
    private readonly db: Database,
    private readonly auditService: LightExtensionAuditService,
    private readonly permissionService: LightExtensionPermissionService,
    private readonly settingsResolver = new SettingsResolverService(),
  ) {}

  async syncFlowModelReferencesForNodeTree(
    input: { rootUid: string; action?: ReferenceSyncAction },
    ctx: ReferenceServiceContext = {},
  ): Promise<LightExtensionReferenceRebuildResult> {
    const rootUid = normalizeString(input.rootUid);
    if (!rootUid) {
      return emptyRebuildResult();
    }

    const requestId = ctx.requestId || randomUUID();
    const scopeRepoId = normalizeString(ctx.scopeRepoId);
    const node = await this.loadFlowModelTree(rootUid, ctx);
    if (!node?.uid) {
      return this.markFlowModelReferencesOwnerMissingForUids(
        [rootUid],
        {
          action: input.action || 'flowModels.destroy',
          requestId,
        },
        ctx,
      );
    }

    const summary = emptySummary();
    if (ctx.dryRun && !ctx.dryRunItems) {
      ctx.dryRunItems = [];
    }
    const modelUids = collectModelUids(node);
    const templateOwnerUids = await this.collectTemplateTargetOwnerUids(ctx, new Set(modelUids));
    const seenOwnerHashes = new Set<string>();
    const owners = collectReferenceOwnerNodes(node);
    for (const owner of owners) {
      const modelUid = normalizeString(owner.node.uid);
      if (modelUid) {
        seenOwnerHashes.add(hashOwnerLocator(buildOwnerLocatorForSource(owner, modelUid)));
      }
      if (templateOwnerUids.has(modelUid)) {
        continue;
      }
      await this.syncLightExtensionReference(
        owner,
        input.action || 'flowModels.save',
        requestId,
        ctx,
        summary,
        scopeRepoId,
      );
    }
    await this.removeReferencesForTemplateOwners(
      Array.from(templateOwnerUids),
      input.action || 'flowModels.save',
      requestId,
      ctx,
      summary,
      scopeRepoId,
    );
    await this.removeReferencesForNonAdapterOwners(
      modelUids.filter((modelUid) => !templateOwnerUids.has(modelUid)),
      input.action || 'flowModels.save',
      requestId,
      ctx,
      summary,
      scopeRepoId,
      seenOwnerHashes,
    );
    const missingOwners = await this.markMissingReferenceOwners(
      input.action || 'flowModels.save',
      requestId,
      {
        ...ctx,
        scopeRepoId,
      },
      new Set(modelUids),
    );
    summary.ownerMissing += missingOwners.ownerMissing;
    mergeStatusCounts(summary, missingOwners.statusCounts);
    summary.items.push(...(ctx.dryRunItems || []));

    await this.recordReferenceAuditBestEffort({
      action: 'referenceRebuild',
      result: 'success',
      requestId,
      actorUserId: ctx.actorUserId,
      referenceCount: summary.scanned,
      message: 'Light extension references rebuilt for FlowModel tree',
      details: {
        trigger: input.action,
        rootUidHash: stableJsonHash({
          rootUid,
        }),
        scanned: summary.scanned,
        upserted: summary.upserted,
        removed: summary.removed,
        ownerMissing: summary.ownerMissing,
        statusCounts: summary.statusCounts,
        dryRun: Boolean(ctx.dryRun),
      },
      transaction: ctx.transaction,
    });

    return summaryToResult(summary, Boolean(ctx.dryRun));
  }

  async markFlowModelReferencesOwnerMissingForNodeTree(
    input: { rootUid: string; action?: ReferenceSyncAction },
    ctx: ReferenceServiceContext = {},
  ): Promise<LightExtensionReferenceRebuildResult> {
    const rootUid = normalizeString(input.rootUid);
    if (!rootUid) {
      return emptyRebuildResult();
    }

    const node = await this.loadFlowModelTree(rootUid, ctx).catch(() => null);
    const uids = node?.uid ? collectModelUids(node) : [rootUid];
    return this.markFlowModelReferencesOwnerMissingForUids(
      uids,
      {
        action: input.action || 'flowModels.destroy',
        requestId: ctx.requestId || randomUUID(),
      },
      ctx,
    );
  }

  async rebuildIndex(
    input: LightExtensionReferenceRebuildInput = {},
    ctx: ReferenceServiceContext = {},
  ): Promise<LightExtensionReferenceRebuildResult> {
    const requestId = ctx.requestId || randomUUID();
    await this.assertReferenceActionAllowed({
      permissionAction: 'updateReferences',
      auditAction: 'referenceRebuild',
      requestId,
      ctx,
      repoId: normalizeString(input.repoId),
      ownerLocatorHash: buildInputOwnerLocatorHash(input),
    });

    const dryRun = Boolean(input.dryRun);
    const rebuildContext: ReferenceServiceContext = {
      ...ctx,
      dryRun,
      dryRunItems: [],
    };
    const scopeRepoId = normalizeString(input.repoId);
    const ownerLocator = normalizeOwnerLocator(input.ownerLocator);
    const rootUid = normalizeString(input.rootUid) || getRebuildRootUid(ownerLocator);
    if (rootUid) {
      return this.syncFlowModelReferencesForNodeTree(
        {
          rootUid,
          action: 'referenceRebuild',
        },
        {
          ...rebuildContext,
          scopeRepoId,
          requestId,
        },
      );
    }
    if (ownerLocator) {
      return emptyRebuildResult(dryRun);
    }

    const summary = emptySummary();
    const records = await this.findAllFlowModelRecords(rebuildContext);
    const templateOwnerUids = await this.collectTemplateTargetOwnerUids(rebuildContext);
    const seenOwnerHashes = new Set<string>();
    for (const record of records) {
      const node = flowModelNodeFromRecord(record);
      const modelUid = normalizeString(node.uid);
      if (!modelUid) {
        continue;
      }
      if (templateOwnerUids.has(modelUid)) {
        continue;
      }
      const adapter = getReferenceOwnerAdapterByUse(node.use || '');
      const owners: ReferenceOwnerSource[] = adapter ? [{ adapter, node }] : [];
      for (const owner of owners) {
        const ownerLocator = buildOwnerLocatorForSource(owner, modelUid);
        seenOwnerHashes.add(hashOwnerLocator(ownerLocator));
        await this.syncLightExtensionReference(
          owner,
          'referenceRebuild',
          requestId,
          rebuildContext,
          summary,
          scopeRepoId,
        );
      }
    }
    await this.removeReferencesForTemplateOwners(
      Array.from(templateOwnerUids),
      'referenceRebuild',
      requestId,
      rebuildContext,
      summary,
      scopeRepoId,
    );

    const references = await this.findReferenceModels(scopeRepoId ? { repoId: scopeRepoId } : {}, rebuildContext);
    const missingOwnerUids: string[] = [];
    for (const reference of references) {
      const ownerLocator = normalizeOwnerLocator(reference.get('ownerLocator'));
      if (!ownerLocator?.modelUid || seenOwnerHashes.has(normalizeString(reference.get('ownerLocatorHash')))) {
        continue;
      }
      missingOwnerUids.push(ownerLocator.modelUid);
    }
    if (missingOwnerUids.length) {
      const ownerMissing = await this.markFlowModelReferencesOwnerMissingForUids(
        missingOwnerUids,
        {
          action: 'referenceRebuild',
          requestId,
        },
        {
          ...rebuildContext,
          scopeRepoId,
          skipOwnerLocatorHashes: seenOwnerHashes,
        },
      );
      summary.ownerMissing += ownerMissing.ownerMissing;
      mergeStatusCounts(summary, ownerMissing.statusCounts);
    }
    summary.items.push(...(rebuildContext.dryRunItems || []));

    await this.recordReferenceAuditBestEffort({
      action: 'referenceRebuild',
      result: 'success',
      requestId,
      actorUserId: rebuildContext.actorUserId,
      referenceCount: summary.scanned,
      message: 'Light extension references rebuilt',
      details: {
        dryRun,
        repoId: scopeRepoId,
        scanned: summary.scanned,
        upserted: summary.upserted,
        removed: summary.removed,
        ownerMissing: summary.ownerMissing,
        ownerHashCount: seenOwnerHashes.size,
        statusCounts: summary.statusCounts,
      },
      transaction: rebuildContext.transaction,
    });

    return summaryToResult(summary, dryRun);
  }

  async readReferences(
    input: {
      repoId?: string;
      entryId?: string;
      ownerLocator?: Partial<LightExtensionReferenceOwnerLocator>;
    } = {},
    ctx: ReferenceServiceContext = {},
  ): Promise<LightExtensionReferenceRecord[]> {
    const requestId = ctx.requestId || randomUUID();
    await this.assertReferenceActionAllowed({
      permissionAction: 'readReferences',
      auditAction: 'readReferences',
      requestId,
      ctx,
      repoId: normalizeString(input.repoId),
      entryId: normalizeString(input.entryId),
      ownerLocatorHash: buildInputOwnerLocatorHash(input),
    });

    const filter: Record<string, unknown> = {};
    for (const key of ['repoId', 'entryId'] as const) {
      const value = normalizeString(input[key]);
      if (value) {
        filter[key] = value;
      }
    }
    const ownerLocatorHash = buildInputOwnerLocatorHash(input);
    if (ownerLocatorHash) {
      filter.ownerLocatorHash = ownerLocatorHash;
    }

    const records = await this.findReferenceModels(filter, ctx);
    const visible: LightExtensionReferenceRecord[] = [];

    for (const record of records) {
      const reference = referenceFromModel(record);
      if (await this.canReadReferenceOwner(reference.ownerLocator, ctx)) {
        visible.push(reference);
        continue;
      }

      await this.recordReferenceAuditBestEffort({
        repoId: reference.repoId,
        entryId: reference.entryId,
        action: 'readReferences',
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

    return visible;
  }

  async refreshReferencesForRepo(repoId: string, ctx: ReferenceServiceContext = {}): Promise<void> {
    const normalizedRepoId = normalizeString(repoId);
    if (!normalizedRepoId) {
      return;
    }
    const requestId = ctx.requestId || randomUUID();
    const references = await this.findReferenceModels(
      {
        repoId: normalizedRepoId,
      },
      ctx,
    );
    const statusCounts: ReferenceUpsertSummary['statusCounts'] = {};
    let changed = 0;

    for (const reference of references) {
      const current = referenceFromModel(reference);
      const resolution = await this.resolveStoredReferenceResolution(current, ctx);
      statusCounts[resolution.resolvedStatus] = (statusCounts[resolution.resolvedStatus] || 0) + 1;
      if (resolution.resolvedStatus === current.resolvedStatus && resolution.settingsHash === current.settingsHash) {
        continue;
      }
      await reference.update(
        {
          settingsHash: resolution.settingsHash,
          resolvedStatus: resolution.resolvedStatus,
        },
        {
          transaction: ctx.transaction,
        },
      );
      changed += 1;
    }
    await this.recordReferenceAuditBestEffort({
      repoId: normalizedRepoId,
      action: 'referenceRebuild',
      result: 'success',
      requestId,
      actorUserId: ctx.actorUserId,
      referenceCount: references.length,
      message: 'Light extension reference statuses refreshed for repo',
      details: {
        trigger: 'repoLifecycleChange',
        changed,
        statusCounts,
      },
      transaction: ctx.transaction,
    });
  }

  private async syncLightExtensionReference(
    owner: ReferenceOwnerSource,
    action: ReferenceSyncAction,
    requestId: string,
    ctx: ReferenceServiceContext,
    summary: ReferenceUpsertSummary,
    limitRepoId?: string,
  ): Promise<void> {
    const { adapter, node } = owner;
    const modelUid = normalizeString(node.uid);
    if (!modelUid) {
      return;
    }

    let countedScanned = false;
    const countScanned = () => {
      if (!countedScanned) {
        summary.scanned += 1;
        countedScanned = true;
      }
    };
    const ownerLocator = owner.ownerLocator || buildFlowModelOwnerLocator(adapter, modelUid, node.use);
    const ownerLocatorHash = hashOwnerLocator(ownerLocator);
    const source = owner.source || readRunJsSource(node, adapter);
    const scopeRepoId = normalizeString(limitRepoId);
    if (source.sourceMode !== 'light-extension') {
      const removed = await this.removeReferencesForOwner(ownerLocatorHash, action, requestId, ctx, {
        repoId: scopeRepoId,
      });
      if (!scopeRepoId || removed) {
        countScanned();
      }
      summary.removed += removed;
      return;
    }

    if (!source.sourceBinding) {
      const removed = await this.removeReferencesForOwner(ownerLocatorHash, action, requestId, ctx, {
        repoId: scopeRepoId,
        reasonCode: 'source_binding_invalid',
      });
      if (!scopeRepoId || removed) {
        countScanned();
      }
      summary.removed += removed;
      await this.recordReferenceConflict(
        ownerLocator.kind,
        ownerLocatorHash,
        'source_binding_invalid',
        requestId,
        ctx,
        {
          trigger: action,
          modelUidHash: stableJsonHash({ modelUid }),
        },
      );
      return;
    }

    const resolution = await this.resolveReferenceFromBinding(source.sourceBinding, source.settings, ctx, adapter.kind);
    if (scopeRepoId && resolution.repoId !== scopeRepoId) {
      const removed = await this.removeReferencesForOwner(ownerLocatorHash, action, requestId, ctx, {
        repoId: scopeRepoId,
        reasonCode: 'binding_changed',
      });
      if (removed) {
        countScanned();
      }
      summary.removed += removed;
      return;
    }
    countScanned();

    summary.removed += await this.removeStaleReferencesForOwner(
      ownerLocatorHash,
      resolution.repoId,
      resolution.entryId,
      action,
      requestId,
      ctx,
      scopeRepoId,
    );
    await this.upsertReference({
      repoId: resolution.repoId,
      entryId: resolution.entryId,
      kind: adapter.kind,
      ownerLocator,
      ownerLocatorHash,
      settingsHash: resolution.settingsHash,
      resolvedStatus: resolution.resolvedStatus,
      requestId,
      action,
      ctx,
    });
    summary.upserted += 1;
    incrementStatus(summary, resolution.resolvedStatus);

    if (resolution.conflictReason) {
      await this.recordReferenceConflict(
        ownerLocator.kind,
        ownerLocatorHash,
        resolution.conflictReason,
        requestId,
        ctx,
        {
          trigger: action,
          modelUidHash: stableJsonHash({ modelUid }),
          repoId: resolution.repoId,
          entryId: resolution.entryId,
        },
      );
    }
  }

  private async resolveReferenceFromBinding(
    sourceBinding: LightExtensionRuntimeSourceBinding,
    settings: Record<string, unknown>,
    ctx: ReferenceServiceContext,
    expectedKind: LightExtensionKind,
  ): Promise<{
    repoId: string;
    entryId: string;
    settingsHash: string;
    resolvedStatus: LightExtensionReferenceResolvedStatus;
    conflictReason?: string;
  }> {
    const fallback = {
      repoId: sourceBinding.repoId,
      entryId: sourceBinding.entryId,
      settingsHash: stableJsonHash(settings),
    };
    if (sourceBinding.kind !== expectedKind) {
      return {
        ...fallback,
        resolvedStatus: 'binding_outdated',
        conflictReason: 'kind_mismatch',
      };
    }
    const repo = await this.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: sourceBinding.repoId,
      transaction: ctx.transaction,
    });
    if (!repo) {
      return {
        ...fallback,
        resolvedStatus: 'repo_missing',
        conflictReason: 'repo_missing',
      };
    }
    const lifecycleStatus = normalizeString(repo.get('lifecycleStatus'));
    if (lifecycleStatus === 'disabled' || lifecycleStatus === 'archived') {
      return {
        ...fallback,
        resolvedStatus: lifecycleStatus === 'disabled' ? 'repo_disabled' : 'repo_archived',
        conflictReason: lifecycleStatus === 'disabled' ? 'repo_disabled' : 'repo_archived',
      };
    }

    const entry = await this.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: sourceBinding.entryId,
      transaction: ctx.transaction,
    });
    if (!entry) {
      return {
        ...fallback,
        resolvedStatus: 'entry_missing',
        conflictReason: 'entry_missing',
      };
    }
    const entryRepoId = normalizeString(entry.get('repoId'));
    const entryKind = normalizeString(entry.get('kind'));
    const healthStatus = normalizeString(entry.get('healthStatus'));
    if (entryRepoId !== sourceBinding.repoId || entryKind !== sourceBinding.kind) {
      return {
        repoId: entryRepoId || fallback.repoId,
        entryId: normalizeString(entry.get('id')) || fallback.entryId,
        settingsHash: fallback.settingsHash,
        resolvedStatus: 'binding_outdated',
        conflictReason: 'binding_outdated',
      };
    }
    if (healthStatus === 'missing') {
      return {
        ...fallback,
        resolvedStatus: 'entry_missing',
        conflictReason: 'entry_missing',
      };
    }
    if (healthStatus !== 'ready') {
      return {
        ...fallback,
        resolvedStatus: 'runtime_missing',
        conflictReason: 'runtime_missing',
      };
    }

    const runtimeEntry = entryFromModel(entry);
    if (!hasUsableRuntimeArtifact(runtimeEntry, normalizeString(repo.get('headCommitId')) || null)) {
      return {
        ...fallback,
        resolvedStatus: 'runtime_missing',
        conflictReason: 'runtime_missing',
      };
    }
    const settingsSource = getRuntimeSettingsSource(runtimeEntry);
    const sourceSettings = this.settingsResolver.pruneUnknownSettings(settingsSource, settings);
    const settingsForHash = mergeSettingsForReferenceHash(
      this.settingsResolver.getRuntimeDefaults(settingsSource),
      sourceSettings,
    );
    let resolvedSettings: Record<string, unknown>;
    try {
      resolvedSettings = this.settingsResolver.resolveRuntimeSettings(settingsSource, sourceSettings);
    } catch (error) {
      if (!isLightExtensionError(error) || error.code !== 'LIGHT_EXTENSION_SETTINGS_INVALID') {
        throw error;
      }
      return {
        repoId: runtimeEntry.repoId,
        entryId: runtimeEntry.id,
        settingsHash: stableJsonHash(settingsForHash),
        resolvedStatus: 'settings_invalid',
        conflictReason: 'settings_invalid',
      };
    }

    return {
      repoId: runtimeEntry.repoId,
      entryId: runtimeEntry.id,
      settingsHash: stableJsonHash(resolvedSettings),
      resolvedStatus: 'active',
    };
  }

  private async resolveStoredReferenceResolution(
    reference: LightExtensionReferenceRecord,
    ctx: ReferenceServiceContext,
  ): Promise<{
    settingsHash: string;
    resolvedStatus: LightExtensionReferenceResolvedStatus;
  }> {
    const modelUid = getReferenceOwnerModelUid(reference.ownerLocator);
    const owner = modelUid ? await this.loadFlowModelTree(modelUid, ctx) : null;
    if (!owner) {
      return {
        settingsHash: reference.settingsHash,
        resolvedStatus: 'owner_missing',
      };
    }
    const adapter = getReferenceOwnerAdapterByOwnerKind(reference.ownerKind);
    const source = readReferenceOwnerSource(owner, adapter, reference.ownerLocator);
    const binding = source.sourceBinding;
    if (
      source.sourceMode !== 'light-extension' ||
      !binding ||
      binding.repoId !== reference.repoId ||
      binding.entryId !== reference.entryId ||
      binding.kind !== reference.kind
    ) {
      return {
        settingsHash: stableJsonHash(source.settings),
        resolvedStatus: 'binding_outdated',
      };
    }
    const resolution = await this.resolveReferenceFromBinding(binding, source.settings, ctx, reference.kind);
    return {
      settingsHash: resolution.settingsHash,
      resolvedStatus: resolution.resolvedStatus,
    };
  }

  private async upsertReference(input: {
    repoId: string;
    entryId: string;
    kind: LightExtensionKind;
    ownerLocator: LightExtensionReferenceOwnerLocator;
    ownerLocatorHash: string;
    settingsHash: string;
    resolvedStatus: LightExtensionReferenceResolvedStatus;
    requestId: string;
    action: ReferenceSyncAction;
    ctx: ReferenceServiceContext;
  }): Promise<void> {
    const repository = this.db.getRepository('lightExtensionReferences');
    const values = {
      repoId: input.repoId,
      entryId: input.entryId,
      kind: input.kind,
      ownerKind: input.ownerLocator.kind,
      ownerLocator: input.ownerLocator,
      ownerLocatorHash: input.ownerLocatorHash,
      settingsHash: input.settingsHash,
      resolvedStatus: input.resolvedStatus,
    };
    if (input.ctx.dryRun) {
      pushDryRunItem(input.ctx, {
        action: 'upsert',
        kind: input.kind,
        ownerKind: input.ownerLocator.kind,
        ownerLocatorHash: input.ownerLocatorHash,
        repoId: input.repoId,
        entryId: input.entryId,
        resolvedStatus: input.resolvedStatus,
      });
      return;
    }
    const existing = await repository.findOne({
      filter: {
        ownerLocatorHash: input.ownerLocatorHash,
        repoId: input.repoId,
        entryId: input.entryId,
      },
      transaction: input.ctx.transaction,
    });

    if (existing) {
      await existing.update(values, {
        transaction: input.ctx.transaction,
      });
    } else {
      await repository.create({
        values: {
          id: `lef_${uid()}`,
          ...values,
        },
        transaction: input.ctx.transaction,
      });
    }

    await this.recordReferenceAuditBestEffort({
      repoId: input.repoId,
      entryId: input.entryId,
      action: 'referenceUpsert',
      result: 'success',
      requestId: input.requestId,
      actorUserId: input.ctx.actorUserId,
      ownerKind: input.ownerLocator.kind,
      ownerLocatorHash: input.ownerLocatorHash,
      resolvedStatus: input.resolvedStatus,
      settingsHash: input.settingsHash,
      message: 'Light extension reference upserted',
      details: {
        trigger: input.action,
      },
      transaction: input.ctx.transaction,
    });
  }

  private async removeStaleReferencesForOwner(
    ownerLocatorHash: string,
    repoId: string,
    entryId: string,
    action: ReferenceSyncAction,
    requestId: string,
    ctx: ReferenceServiceContext,
    scopeRepoId?: string,
  ): Promise<number> {
    const references = await this.findReferenceModels(
      {
        ownerLocatorHash,
        ...(scopeRepoId ? { repoId: scopeRepoId } : {}),
      },
      ctx,
    );
    let removed = 0;
    for (const reference of references) {
      if (reference.get('repoId') === repoId && reference.get('entryId') === entryId) {
        continue;
      }
      if (ctx.dryRun) {
        pushDryRunItem(ctx, {
          action: 'remove',
          kind: normalizeReferenceKind(reference.get('kind')),
          ownerKind: normalizeOwnerKind(reference.get('ownerKind')),
          ownerLocatorHash,
          repoId: normalizeString(reference.get('repoId')),
          entryId: normalizeString(reference.get('entryId')),
          resolvedStatus: normalizeStatus(reference.get('resolvedStatus')),
          reasonCode: 'binding_changed',
        });
        removed += 1;
        continue;
      }
      await this.db.getRepository('lightExtensionReferences').destroy({
        filterByTk: reference.get('id'),
        transaction: ctx.transaction,
      });
      removed += 1;
      await this.recordReferenceAuditBestEffort({
        repoId: normalizeString(reference.get('repoId')),
        entryId: normalizeString(reference.get('entryId')),
        action: 'referenceRemove',
        result: 'success',
        requestId,
        actorUserId: ctx.actorUserId,
        ownerKind: normalizeOwnerKind(reference.get('ownerKind')),
        ownerLocatorHash,
        reasonCode: 'binding_changed',
        message: 'Stale light extension reference removed for owner',
        details: {
          trigger: action,
        },
        transaction: ctx.transaction,
      });
    }
    return removed;
  }

  private async removeReferencesForOwner(
    ownerLocatorHash: string,
    action: ReferenceSyncAction,
    requestId: string,
    ctx: ReferenceServiceContext,
    options: { repoId?: string; reasonCode?: string } = {},
  ): Promise<number> {
    const references = await this.findReferenceModels(
      {
        ownerLocatorHash,
        ...(options.repoId ? { repoId: options.repoId } : {}),
      },
      ctx,
    );
    for (const reference of references) {
      if (ctx.dryRun) {
        pushDryRunItem(ctx, {
          action: 'remove',
          kind: normalizeReferenceKind(reference.get('kind')),
          ownerKind: normalizeOwnerKind(reference.get('ownerKind')),
          ownerLocatorHash,
          repoId: normalizeString(reference.get('repoId')),
          entryId: normalizeString(reference.get('entryId')),
          resolvedStatus: normalizeStatus(reference.get('resolvedStatus')),
          reasonCode: options.reasonCode || 'source_mode_inline',
        });
        continue;
      }
      await this.db.getRepository('lightExtensionReferences').destroy({
        filterByTk: reference.get('id'),
        transaction: ctx.transaction,
      });
      await this.recordReferenceAuditBestEffort({
        repoId: normalizeString(reference.get('repoId')),
        entryId: normalizeString(reference.get('entryId')),
        action: 'referenceRemove',
        result: 'success',
        requestId,
        actorUserId: ctx.actorUserId,
        ownerKind: normalizeOwnerKind(reference.get('ownerKind')),
        ownerLocatorHash,
        reasonCode: options.reasonCode || 'source_mode_inline',
        message: 'Light extension reference removed for inline source',
        details: {
          trigger: action,
        },
        transaction: ctx.transaction,
      });
    }
    return references.length;
  }

  private async removeReferencesForNonAdapterOwners(
    uids: string[],
    action: ReferenceSyncAction,
    requestId: string,
    ctx: ReferenceServiceContext,
    summary: ReferenceUpsertSummary,
    scopeRepoId?: string,
    seenOwnerHashes: Set<string> = new Set(),
  ): Promise<void> {
    const ownerUids = Array.from(new Set(uids.map((item) => normalizeString(item)).filter(Boolean)));
    for (const modelUid of ownerUids) {
      for (const ownerLocatorHash of buildActiveOwnerLocatorHashes(modelUid)) {
        if (seenOwnerHashes.has(ownerLocatorHash)) {
          continue;
        }
        const removed = await this.removeReferencesForOwner(ownerLocatorHash, action, requestId, ctx, {
          repoId: scopeRepoId,
          reasonCode: 'owner_not_reference_adapter',
        });
        if (removed) {
          summary.scanned += 1;
        }
        summary.removed += removed;
      }
    }
  }

  private async removeReferencesForTemplateOwners(
    uids: string[],
    action: ReferenceSyncAction,
    requestId: string,
    ctx: ReferenceServiceContext,
    summary: ReferenceUpsertSummary,
    scopeRepoId?: string,
  ): Promise<void> {
    const ownerUids = Array.from(new Set(uids.map((item) => normalizeString(item)).filter(Boolean)));
    for (const modelUid of ownerUids) {
      for (const ownerLocatorHash of buildActiveOwnerLocatorHashes(modelUid)) {
        const removed = await this.removeReferencesForOwner(ownerLocatorHash, action, requestId, ctx, {
          repoId: scopeRepoId,
          reasonCode: 'owner_is_template_target',
        });
        if (removed) {
          summary.scanned += 1;
        }
        summary.removed += removed;
      }
    }
  }

  private async markFlowModelReferencesOwnerMissingForUids(
    uids: string[],
    input: { action: ReferenceSyncAction; requestId: string },
    ctx: ReferenceServiceContext,
  ): Promise<LightExtensionReferenceRebuildResult> {
    const ownerUids = new Set(uids.map((item) => normalizeString(item)).filter(Boolean));
    const summary = emptySummary();
    const references = await this.findReferenceModels(
      ctx.scopeRepoId ? { repoId: normalizeString(ctx.scopeRepoId) } : {},
      ctx,
    );
    for (const reference of references) {
      const ownerLocator = normalizeOwnerLocator(reference.get('ownerLocator'));
      const modelUid = normalizeString(ownerLocator?.modelUid);
      if (!modelUid || !ownerUids.has(modelUid) || reference.get('resolvedStatus') === 'owner_missing') {
        continue;
      }
      const ownerLocatorHash = normalizeString(reference.get('ownerLocatorHash'));
      if (ownerLocatorHash && ctx.skipOwnerLocatorHashes?.has(ownerLocatorHash)) {
        continue;
      }
      if (ctx.dryRun) {
        pushDryRunItem(ctx, {
          action: 'owner_missing',
          kind: normalizeReferenceKind(reference.get('kind')),
          ownerKind: normalizeOwnerKind(reference.get('ownerKind')),
          ownerLocatorHash,
          repoId: normalizeString(reference.get('repoId')),
          entryId: normalizeString(reference.get('entryId')),
          resolvedStatus: 'owner_missing',
        });
        summary.ownerMissing += 1;
        incrementStatus(summary, 'owner_missing');
        continue;
      }
      await reference.update(
        {
          resolvedStatus: 'owner_missing',
        },
        {
          transaction: ctx.transaction,
        },
      );
      summary.ownerMissing += 1;
      incrementStatus(summary, 'owner_missing');
      await this.recordReferenceAuditBestEffort({
        repoId: normalizeString(reference.get('repoId')),
        entryId: normalizeString(reference.get('entryId')),
        action: 'referenceOwnerMissing',
        result: 'success',
        requestId: input.requestId,
        actorUserId: ctx.actorUserId,
        ownerKind: normalizeOwnerKind(reference.get('ownerKind')),
        ownerLocatorHash,
        resolvedStatus: 'owner_missing',
        message: 'Light extension reference owner is missing',
        details: {
          trigger: input.action,
        },
        transaction: ctx.transaction,
      });
    }
    summary.items.push(...(ctx.dryRunItems || []));
    return summaryToResult(summary, Boolean(ctx.dryRun));
  }

  private async markMissingReferenceOwners(
    action: ReferenceSyncAction,
    requestId: string,
    ctx: ReferenceServiceContext,
    knownExistingOwnerUids: Set<string> = new Set(),
  ): Promise<LightExtensionReferenceRebuildResult> {
    const references = await this.findReferenceModels(
      ctx.scopeRepoId ? { repoId: normalizeString(ctx.scopeRepoId) } : {},
      ctx,
    );
    const missingOwnerUids: string[] = [];
    for (const reference of references) {
      const ownerLocator = normalizeOwnerLocator(reference.get('ownerLocator'));
      const modelUid = normalizeString(ownerLocator?.modelUid);
      if (!modelUid) {
        continue;
      }
      if (knownExistingOwnerUids.has(modelUid)) {
        continue;
      }
      const owner = await this.db.getRepository('flowModels').findOne({
        filterByTk: modelUid,
        transaction: ctx.transaction,
      });
      if (!owner) {
        missingOwnerUids.push(modelUid);
      }
    }

    if (!missingOwnerUids.length) {
      return emptyRebuildResult();
    }

    return this.markFlowModelReferencesOwnerMissingForUids(
      missingOwnerUids,
      {
        action,
        requestId,
      },
      ctx,
    );
  }

  async canReadReferenceOwner(
    ownerLocator: LightExtensionReferenceOwnerLocator,
    ctx: ReferenceServiceContext,
  ): Promise<boolean> {
    const modelUid = getReferenceOwnerModelUid(ownerLocator);
    if (!modelUid) {
      return false;
    }

    if (isRootContext(ctx)) {
      return true;
    }

    if (await this.canReadOwnerByAccessibleDesktopRoute(modelUid, ctx)) {
      return true;
    }

    if (!ctx.can) {
      return true;
    }

    const permission = await resolveCan(ctx.can, {
      resource: 'flowModels',
      action: 'findOne',
    });
    if (!permission) {
      return false;
    }
    if (isRootPermission(permission)) {
      return true;
    }
    if (!permission.params?.filter) {
      return false;
    }

    const filter = await this.parsePermissionFilter('flowModels', permission.params?.filter, ctx);
    const record = await this.db.getRepository('flowModels').findOne({
      filterByTk: modelUid,
      ...(filter ? { filter } : {}),
      transaction: ctx.transaction,
    });
    return Boolean(record);
  }

  private async canReadOwnerByAccessibleDesktopRoute(modelUid: string, ctx: ReferenceServiceContext): Promise<boolean> {
    const currentRoles = getCurrentRoleNames(ctx.state);
    if (!currentRoles.length) {
      return false;
    }
    if (currentRoles.includes('root')) {
      return true;
    }

    const routeIds = await this.findRouteIdsForOwnerUid(modelUid, ctx);
    if (!routeIds.length) {
      return false;
    }

    const rolesRepository = this.getRepositoryIfExists('roles');
    if (!rolesRepository?.find) {
      return false;
    }

    const roleRecords = await rolesRepository.find({
      filterByTk: currentRoles,
      appends: ['desktopRoutes'],
      transaction: ctx.transaction,
    });
    const accessibleRouteIds = new Set<string>();
    for (const role of roleRecords) {
      for (const route of await normalizeMaybePromiseArray(role.get('desktopRoutes'))) {
        const routeId = normalizeRouteId(route);
        if (routeId) {
          accessibleRouteIds.add(routeId);
        }
      }
    }

    return routeIds.some((routeId) => accessibleRouteIds.has(routeId));
  }

  private async findRouteIdsForOwnerUid(modelUid: string, ctx: ReferenceServiceContext): Promise<string[]> {
    const desktopRoutesRepository = this.getRepositoryIfExists('desktopRoutes');
    if (!desktopRoutesRepository?.find) {
      return [];
    }

    const ancestorUids = await this.findFlowModelAncestorUids(modelUid, ctx);
    if (!ancestorUids.length) {
      return [];
    }

    const routes = await desktopRoutesRepository.find({
      filter: {
        schemaUid: {
          $in: ancestorUids,
        },
      },
      transaction: ctx.transaction,
    });
    return routes.map((route) => normalizeRouteId(route)).filter(Boolean);
  }

  private async findFlowModelAncestorUids(modelUid: string, ctx: ReferenceServiceContext): Promise<string[]> {
    const treePathRepository = this.getRepositoryIfExists('flowModelTreePath');
    if (!treePathRepository?.find) {
      return [modelUid];
    }
    const treePaths = await treePathRepository.find({
      filter: {
        descendant: modelUid,
      },
      transaction: ctx.transaction,
    });
    const ancestors = treePaths.map((treePath) => normalizeString(treePath.get('ancestor'))).filter(Boolean);
    return ancestors.length ? Array.from(new Set(ancestors)) : [modelUid];
  }

  private async collectTemplateTargetOwnerUids(
    ctx: ReferenceServiceContext,
    candidateUids?: Set<string>,
  ): Promise<Set<string>> {
    const templateRepository = this.getRepositoryIfExists('flowModelTemplates');
    if (!templateRepository?.find) {
      return new Set();
    }
    const templates = await templateRepository.find({
      transaction: ctx.transaction,
    });
    const ownerUids = new Set<string>();
    for (const template of templates) {
      const targetUid = normalizeString(template.get('targetUid'));
      if (!targetUid) {
        continue;
      }
      for (const ownerUid of await this.findFlowModelDescendantUids(targetUid, ctx)) {
        if (!candidateUids || candidateUids.has(ownerUid)) {
          ownerUids.add(ownerUid);
        }
      }
    }
    return ownerUids;
  }

  private async findFlowModelDescendantUids(rootUid: string, ctx: ReferenceServiceContext): Promise<string[]> {
    const treePathRepository = this.getRepositoryIfExists('flowModelTreePath');
    if (!treePathRepository?.find) {
      return [rootUid];
    }
    const treePaths = await treePathRepository.find({
      filter: {
        ancestor: rootUid,
      },
      transaction: ctx.transaction,
    });
    const descendants = treePaths.map((treePath) => normalizeString(treePath.get('descendant'))).filter(Boolean);
    return descendants.length ? Array.from(new Set(descendants)) : [rootUid];
  }

  private getRepositoryIfExists(name: string): RepositoryLike | null {
    try {
      if (typeof this.db.getCollection === 'function' && !this.db.getCollection(name)) {
        return null;
      }
      return this.db.getRepository(name) as unknown as RepositoryLike;
    } catch {
      return null;
    }
  }

  private async parsePermissionFilter(
    resource: string,
    filter: unknown,
    ctx: ReferenceServiceContext,
  ): Promise<Filter | undefined> {
    if (!filter) {
      return undefined;
    }
    try {
      checkFilterParams(this.db.getCollection(resource), filter);
      const parsedFilter =
        (await parseJsonTemplate(filter, {
          state: ctx.state || {},
          timezone: ctx.timezone,
          userProvider: createUserProvider({
            db: this.db,
            currentUser: ctx.currentUser,
          }),
        })) ?? filter;
      return parsedFilter as Filter;
    } catch (error) {
      if (error instanceof NoPermissionError) {
        return { id: '__light_extension_reference_owner_not_visible__' };
      }
      throw error;
    }
  }

  private async loadFlowModelTree(uidValue: string, ctx: ReferenceServiceContext): Promise<FlowModelNode | null> {
    const repository = this.db.getCollection('flowModels')?.repository as FlowModelRepositoryLike | undefined;
    if (!repository?.findModelById) {
      return null;
    }
    return repository.findModelById(uidValue, {
      transaction: ctx.transaction,
      includeAsyncNode: true,
    });
  }

  private async findAllFlowModelRecords(ctx: ReferenceServiceContext): Promise<Model[]> {
    const repository = this.db.getRepository('flowModels');
    return repository.find({
      transaction: ctx.transaction,
    });
  }

  private async findReferenceModels(filter: Record<string, unknown>, ctx: ReferenceServiceContext): Promise<Model[]> {
    return this.db.getRepository('lightExtensionReferences').find({
      filter,
      sort: ['repoId', 'entryId', 'ownerLocatorHash'],
      transaction: ctx.transaction,
    });
  }

  private async assertReferenceActionAllowed(input: {
    permissionAction: 'readReferences' | 'updateReferences';
    auditAction: Parameters<LightExtensionAuditService['recordReferenceEvent']>[0]['action'];
    requestId: string;
    ctx: ReferenceServiceContext;
    repoId?: string;
    entryId?: string;
    ownerLocatorHash?: string;
  }): Promise<void> {
    try {
      await this.permissionService.assertActionAllowed({
        action: input.permissionAction,
        ctx: input.ctx,
      });
    } catch (error) {
      if (isLightExtensionError(error) && error.code === 'LIGHT_EXTENSION_PERMISSION_DENIED') {
        await this.recordReferenceAuditBestEffort({
          repoId: input.repoId,
          entryId: input.entryId,
          action: input.auditAction,
          result: 'denied',
          requestId: input.requestId,
          actorUserId: input.ctx.actorUserId,
          ownerLocatorHash: input.ownerLocatorHash,
          reasonCode: 'permission_denied',
          message: 'Light extension reference action permission denied',
          transaction: input.ctx.transaction,
        });
      }
      throw error;
    }
  }

  private async recordReferenceConflict(
    ownerKind: LightExtensionReferenceOwnerLocator['kind'],
    ownerLocatorHash: string,
    reasonCode: string,
    requestId: string,
    ctx: ReferenceServiceContext,
    details?: Record<string, unknown>,
  ): Promise<void> {
    await this.recordReferenceAuditBestEffort({
      action: 'referenceConflict',
      result: 'blocked',
      requestId,
      actorUserId: ctx.actorUserId,
      ownerKind,
      ownerLocatorHash,
      reasonCode,
      message: 'Light extension reference conflict detected',
      details,
      transaction: ctx.transaction,
    });
  }

  private async recordReferenceAuditBestEffort(
    input: Parameters<LightExtensionAuditService['recordReferenceEvent']>[0],
  ): Promise<void> {
    try {
      await this.auditService.recordReferenceEvent(input);
    } catch {
      // Reference writes and permission denials must not depend on audit persistence availability.
    }
  }
}

async function resolveCan(
  can: LightExtensionCanFunction,
  input: { resource: string; action: string },
): Promise<ReferencePermissionResult> {
  const permission = await can(input);
  if (permission === false || permission === null || typeof permission === 'undefined') {
    return false;
  }
  if (typeof permission === 'object') {
    return permission as { role?: string; params?: Record<string, unknown> };
  }
  return {};
}

function isRootContext(ctx: ReferenceServiceContext): boolean {
  return getCurrentRoleNames(ctx.state).includes('root');
}

function isRootPermission(permission: ReferencePermissionResult): boolean {
  return Boolean(permission && permission.role === 'root');
}

function getCurrentRoleNames(state?: Record<string, unknown>): string[] {
  const currentRoles = state?.currentRoles;
  if (Array.isArray(currentRoles)) {
    return currentRoles.map((role) => normalizeString(role)).filter(Boolean);
  }
  const currentRole = normalizeString(state?.currentRole);
  return currentRole ? [currentRole] : [];
}

async function normalizeMaybePromiseArray(value: unknown): Promise<unknown[]> {
  const resolved = await value;
  if (Array.isArray(resolved)) {
    return resolved;
  }
  return resolved ? [resolved] : [];
}

function normalizeRouteId(route: unknown): string {
  if (!route) {
    return '';
  }
  if (typeof route === 'string' || typeof route === 'number') {
    return String(route);
  }
  if (!isPlainRecord(route)) {
    return '';
  }
  const get = route.get;
  if (typeof get === 'function') {
    return normalizeString(get.call(route, 'id'));
  }
  return normalizeString(route.id);
}

function readRunJsSource(node: FlowModelNode, adapter?: ReferenceOwnerAdapter): NormalizedJsBlockSource {
  const settingsKey = adapter?.settingsKey || 'jsSettings';
  const rawSettings = node.stepParams?.[settingsKey];
  const settings = isPlainRecord(rawSettings) ? rawSettings : {};
  const runJs = isPlainRecord(settings.runJs) ? settings.runJs : {};
  const sourceModeStep = isPlainRecord(settings.sourceMode) ? settings.sourceMode : {};
  const sourceBindingStep = isPlainRecord(settings.sourceBinding) ? settings.sourceBinding : {};
  const sourceMode =
    normalizeString(settings.sourceMode) ||
    normalizeString(sourceModeStep.sourceMode) ||
    normalizeString(sourceBindingStep.sourceMode) ||
    normalizeString(runJs.sourceMode) ||
    'inline';
  const sourceBinding =
    normalizeSourceBinding(settings.sourceBinding) ||
    normalizeSourceBinding(sourceBindingStep.sourceBinding) ||
    normalizeSourceBinding(runJs.sourceBinding);
  const sourceSettings = normalizeFirstSettings(runJs.settings, settings.settings, sourceBindingStep.settings);
  return {
    sourceMode,
    sourceBinding,
    settings: sourceSettings,
  };
}

function readReferenceOwnerSource(
  node: FlowModelNode,
  adapter: ReferenceOwnerAdapter | undefined,
  _ownerLocator: LightExtensionReferenceOwnerLocator,
): NormalizedJsBlockSource {
  return readRunJsSource(node, adapter);
}

function normalizeSourceBinding(value: unknown): LightExtensionRuntimeSourceBinding | undefined {
  if (!isPlainRecord(value)) {
    return undefined;
  }
  const type = normalizeString(value.type);
  const repoId = normalizeString(value.repoId);
  const entryId = normalizeString(value.entryId);
  const kind = normalizeString(value.kind);
  if (type !== 'light-extension-entry' || !repoId || !entryId || !kind) {
    return undefined;
  }
  return {
    type,
    repoId,
    entryId,
    kind,
  };
}

function normalizeSettings(value: unknown): Record<string, unknown> {
  return isPlainRecord(value) ? cloneRecord(value) : {};
}

function normalizeFirstSettings(...values: unknown[]): Record<string, unknown> {
  for (const value of values) {
    if (isPlainRecord(value)) {
      return normalizeSettings(value);
    }
  }
  return {};
}

function buildFlowModelOwnerLocator(
  adapter: ReferenceOwnerAdapter,
  modelUid: string,
  modelUse?: string,
  hostPath?: Array<string | number>,
): LightExtensionReferenceOwnerLocator {
  return buildReferenceOwnerLocator(adapter, modelUid, modelUse, hostPath);
}

function buildOwnerLocatorForSource(
  owner: ReferenceOwnerSource,
  modelUid: string,
): LightExtensionReferenceOwnerLocator {
  return owner.ownerLocator || buildFlowModelOwnerLocator(owner.adapter, modelUid, owner.node.use);
}

function normalizeOwnerLocator(value: unknown): LightExtensionReferenceOwnerLocator | null {
  return normalizeReferenceOwnerLocator(value);
}

function hashOwnerLocator(ownerLocator: LightExtensionReferenceOwnerLocator): string {
  return hashReferenceOwnerLocator(ownerLocator);
}

function collectModelUids(node: FlowModelNode | null | undefined, bucket: string[] = []): string[] {
  if (!node || typeof node !== 'object') {
    return bucket;
  }
  const modelUid = normalizeString(node.uid);
  if (modelUid) {
    bucket.push(modelUid);
  }
  for (const value of Object.values(node.subModels || {})) {
    for (const child of Array.isArray(value) ? value : value ? [value] : []) {
      collectModelUids(child, bucket);
    }
  }
  return bucket;
}

function flowModelNodeFromRecord(record: Model): FlowModelNode {
  const options = parseOptions(record.get('options'));
  const modelUid = normalizeString(record.get('uid') || record.get('name') || options.uid);
  return {
    ...options,
    uid: modelUid,
    use: normalizeString(options.use),
    stepParams: isPlainRecord(options.stepParams) ? options.stepParams : {},
  };
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

function referenceFromModel(record: Model): LightExtensionReferenceRecord {
  const ownerLocator =
    normalizeOwnerLocator(record.get('ownerLocator')) ||
    buildFlowModelOwnerLocator(JS_BLOCK_REFERENCE_OWNER_ADAPTER, '');
  return {
    id: normalizeString(record.get('id')),
    repoId: normalizeString(record.get('repoId')),
    entryId: normalizeString(record.get('entryId')),
    kind: normalizeReferenceKind(record.get('kind')),
    ownerKind: normalizeOwnerKind(record.get('ownerKind')),
    ownerLocator,
    ownerLocatorHash: normalizeString(record.get('ownerLocatorHash')),
    settingsHash: normalizeString(record.get('settingsHash')) || EMPTY_SETTINGS_HASH,
    resolvedStatus: normalizeStatus(record.get('resolvedStatus')),
    createdAt: normalizeDate(record.get('createdAt')),
    updatedAt: normalizeDate(record.get('updatedAt')),
  };
}

function normalizeStatus(value: unknown): LightExtensionReferenceResolvedStatus {
  const normalized = normalizeString(value);
  const statuses: LightExtensionReferenceResolvedStatus[] = [
    'active',
    'binding_outdated',
    'repo_missing',
    'repo_disabled',
    'repo_archived',
    'entry_missing',
    'owner_missing',
    'settings_invalid',
    'runtime_missing',
  ];
  return statuses.includes(normalized as LightExtensionReferenceResolvedStatus)
    ? (normalized as LightExtensionReferenceResolvedStatus)
    : 'runtime_missing';
}

function normalizeReferenceKind(value: unknown): LightExtensionKind {
  const normalized = normalizeString(value);
  const adapter = normalized ? listReferenceOwnerAdapters().find((item) => item.kind === normalized) : null;
  return adapter?.kind || JS_BLOCK_REFERENCE_OWNER_ADAPTER.kind;
}

function normalizeOwnerKind(value: unknown): LightExtensionReferenceRecord['ownerKind'] {
  const normalized = normalizeString(value);
  const adapter = normalized ? listReferenceOwnerAdapters().find((item) => item.ownerKind === normalized) : null;
  return adapter?.ownerKind || JS_BLOCK_REFERENCE_OWNER_ADAPTER.ownerKind;
}

function emptySummary(): ReferenceUpsertSummary {
  return {
    scanned: 0,
    upserted: 0,
    removed: 0,
    ownerMissing: 0,
    statusCounts: {},
    items: [],
  };
}

function emptyRebuildResult(dryRun = false): LightExtensionReferenceRebuildResult {
  return summaryToResult(emptySummary(), dryRun);
}

function summaryToResult(summary: ReferenceUpsertSummary, dryRun = false): LightExtensionReferenceRebuildResult {
  return {
    ...(dryRun ? { dryRun: true } : {}),
    scanned: summary.scanned,
    upserted: summary.upserted,
    removed: summary.removed,
    ownerMissing: summary.ownerMissing,
    statusCounts: { ...summary.statusCounts },
    ...(summary.items.length ? { items: dedupeRebuildItems(summary.items) } : {}),
  };
}

function pushDryRunItem(ctx: ReferenceServiceContext, item: LightExtensionReferenceRebuildItem): void {
  if (!ctx.dryRun) {
    return;
  }
  if (!ctx.dryRunItems) {
    ctx.dryRunItems = [];
  }
  ctx.dryRunItems.push(item);
}

function dedupeRebuildItems(items: LightExtensionReferenceRebuildItem[]): LightExtensionReferenceRebuildItem[] {
  const seen = new Set<string>();
  const output: LightExtensionReferenceRebuildItem[] = [];
  for (const item of items) {
    const key = `${item.action}:${item.ownerLocatorHash}:${item.repoId || ''}:${item.entryId || ''}:${
      item.reasonCode || ''
    }`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(item);
  }
  return output;
}

function incrementStatus(summary: ReferenceUpsertSummary, status: LightExtensionReferenceResolvedStatus): void {
  summary.statusCounts[status] = (summary.statusCounts[status] || 0) + 1;
}

function mergeStatusCounts(
  summary: ReferenceUpsertSummary,
  statusCounts: LightExtensionReferenceRebuildResult['statusCounts'],
): void {
  for (const [status, count] of Object.entries(statusCounts)) {
    const normalizedStatus = normalizeStatus(status);
    summary.statusCounts[normalizedStatus] = (summary.statusCounts[normalizedStatus] || 0) + (count || 0);
  }
}

function buildActiveOwnerLocatorHashes(modelUid: string): string[] {
  return listReferenceOwnerAdapters()
    .map((adapterContract) => getReferenceOwnerAdapterByKind(adapterContract.kind))
    .filter((adapter): adapter is ReferenceOwnerAdapter => Boolean(adapter))
    .flatMap((adapter) => {
      const modelUses = adapter.modelUses?.length ? adapter.modelUses : [adapter.modelUse].filter(Boolean);
      return modelUses.map((modelUse) => hashOwnerLocator(buildFlowModelOwnerLocator(adapter, modelUid, modelUse)));
    });
}

function buildInputOwnerLocatorHash(input: {
  ownerLocator?: Partial<LightExtensionReferenceOwnerLocator>;
}): string | undefined {
  const ownerLocator = normalizeOwnerLocator(input.ownerLocator);
  if (ownerLocator) {
    return hashOwnerLocator(ownerLocator);
  }
  const modelUid = normalizeString(input.ownerLocator?.modelUid);
  return modelUid
    ? hashOwnerLocator(buildFlowModelOwnerLocator(JS_BLOCK_REFERENCE_OWNER_ADAPTER, modelUid))
    : undefined;
}

function getRebuildRootUid(ownerLocator: LightExtensionReferenceOwnerLocator | null): string {
  if (!ownerLocator) {
    return '';
  }
  const adapter = getReferenceOwnerAdapterByOwnerKind(ownerLocator.kind);
  if (!adapter) {
    return '';
  }
  return normalizeString(ownerLocator.modelUid);
}

function mergeSettingsForReferenceHash(
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const output = cloneRecord(defaults);

  for (const [key, value] of Object.entries(overrides)) {
    const currentValue = output[key];
    if (isPlainRecord(currentValue) && isPlainRecord(value)) {
      output[key] = mergeSettingsForReferenceHash(currentValue, value);
    } else {
      output[key] = cloneJsonValue(value);
    }
  }

  return output;
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function normalizeDate(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  return null;
}

function cloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function cloneJsonValue(value: unknown): unknown {
  if (typeof value === 'undefined') {
    return undefined;
  }
  return JSON.parse(JSON.stringify(value));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
