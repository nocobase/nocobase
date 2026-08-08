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

import { JS_TEMPLATE_COLLECTIONS, JS_TEMPLATE_SOURCE_MODE } from '../../constants';
import type {
  JsTemplateKind,
  JsTemplateUsageOwnerLocator,
  JsTemplateUsageRebuildItem,
  JsTemplateUsageRebuildInput,
  JsTemplateUsageRebuildResult,
  JsTemplateUsage,
  JsTemplateUsageListInput,
  JsTemplateUsageListResult,
  JsTemplateUsageLocation,
  JsTemplateUsageResolvedStatus,
  JsTemplateRuntimeSourceBinding,
} from '../../shared/types';
import { assertJsTemplateKind } from '../../shared/types';
import { isJsTemplateError, JsTemplateError } from '../../shared/errors';
import {
  createJsTemplateRuntimeSourceBinding,
  isJsTemplateRuntimeSourceBinding,
} from '../../shared/jsTemplateSourceBinding';
import { JsTemplateAuditService } from './JsTemplateAuditService';
import { JsTemplatePermissionService } from './JsTemplatePermissionService';
import type { JsTemplateCanFunction } from './JsTemplatePermissionService';
import { JsTemplateProjectService, type JsTemplateServiceContext } from './JsTemplateProjectService';
import { templateFromModel } from './JsTemplateService';
import {
  JS_BLOCK_USAGE_OWNER_ADAPTER,
  buildUsageOwnerLocator,
  collectUsageOwnerNodes,
  getUsageOwnerAdapterByOwnerKind,
  getUsageOwnerAdapterByUse,
  getUsageOwnerModelUid,
  hashUsageOwnerLocator,
  listUsageOwnerAdapters,
  normalizeUsageOwnerLocator,
  type UsageOwnerAdapter,
  stableJsonHash,
} from './JsTemplateUsageOwnerRegistry';
import { JsTemplateSettingsService } from './JsTemplateSettingsService';
import { getRuntimeSettingsSource, hasUsableRuntimeArtifact } from './runtimeArtifact';

type UsageRefreshScope =
  | { mode: 'skip'; reason: string }
  | { mode: 'templates'; templateIds: string[]; reason: string }
  | { mode: 'project'; reason: string };

type FlowModelRepositoryLike = {
  findModelById?: (
    uidValue: string,
    options?: { transaction?: JsTemplateServiceContext['transaction']; includeAsyncNode?: boolean },
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
  flowRegistry?: Record<string, unknown>;
  subModels?: Record<string, FlowModelNode | FlowModelNode[] | undefined>;
};

type UsageSyncAction =
  | 'flowModels.save'
  | 'flowModels.duplicate'
  | 'flowModels.destroy'
  | 'flowSurfaces.updateSettings'
  | 'flowSurfaces.addBlock'
  | 'flowSurfaces.compose'
  | 'flowSurfaces.applyBlueprint'
  | 'flowSurfaces.removeNode'
  | 'usageRebuild'
  | string;

interface JsTemplateUsageVisibilityScanMetrics {
  usagePageCalls: number;
  visibilityResolutions: number;
  maxRetainedBatches: number;
  maxRetainedUsageRecords: number;
  maxRetainedLocations: number;
}

const USAGE_VISIBILITY_SCAN_METRICS = Symbol.for('nocobase.js-template.usage-visibility-scan-metrics');

type JsTemplateUsageVisibilityScanContext = {
  [USAGE_VISIBILITY_SCAN_METRICS]?: JsTemplateUsageVisibilityScanMetrics;
};

type JsTemplateUsageServiceContext = JsTemplateServiceContext & {
  currentUser?: unknown;
  state?: Record<string, unknown>;
  timezone?: string;
  scopeProjectId?: string;
  dryRun?: boolean;
  dryRunItems?: JsTemplateUsageRebuildItem[];
  skipOwnerLocatorHashes?: Set<string>;
};

type UsagePermissionResult = false | { role?: string; params?: Record<string, unknown> };

type UsageOwnerVisibility = {
  unrestricted: boolean;
  filter?: Filter;
  accessibleRouteIds?: Set<string>;
};

type UsageUpsertSummary = {
  scanned: number;
  upserted: number;
  removed: number;
  ownerMissing: number;
  statusCounts: Partial<Record<JsTemplateUsageResolvedStatus, number>>;
  items: JsTemplateUsageRebuildItem[];
};

export interface UsageRefreshResult {
  mode: UsageRefreshScope['mode'];
  reason: string;
  targetTemplateCount: number;
  usageCount: number;
  changed: number;
  statusCounts: Partial<Record<JsTemplateUsageResolvedStatus, number>>;
}

type NormalizedJsBlockSource = {
  sourceMode: string;
  sourceBinding?: JsTemplateRuntimeSourceBinding;
  settings: Record<string, unknown>;
};

type UsageOwnerSource = {
  adapter: UsageOwnerAdapter;
  node: FlowModelNode;
  ownerLocator?: JsTemplateUsageOwnerLocator;
  source?: NormalizedJsBlockSource;
};

const EMPTY_SETTINGS_HASH = stableJsonHash({});
const USAGE_VISIBILITY_BATCH_SIZE = 100;
const USAGE_VISIBILITY_BATCH_CONCURRENCY = 4;

export class JsTemplateUsageService {
  constructor(
    private readonly db: Database,
    private readonly auditService: JsTemplateAuditService,
    private readonly permissionService: JsTemplatePermissionService,
    private readonly projectService: JsTemplateProjectService,
    private readonly settingsResolver = new JsTemplateSettingsService(),
  ) {}

  async syncFlowModelUsagesForNodeTree(
    input: { rootUid: string; action?: UsageSyncAction },
    ctx: JsTemplateUsageServiceContext = {},
  ): Promise<JsTemplateUsageRebuildResult> {
    const rootUid = normalizeString(input.rootUid);
    if (!rootUid) {
      return emptyRebuildResult();
    }

    const requestId = ctx.requestId || randomUUID();
    if (!ctx.transaction && !ctx.dryRun) {
      return this.db.sequelize.transaction((transaction) =>
        this.syncFlowModelUsagesForNodeTree(input, {
          ...ctx,
          requestId,
          transaction,
        }),
      );
    }
    const scopeProjectId = normalizeString(ctx.scopeProjectId);
    const node = await this.loadFlowModelTree(rootUid, ctx);
    if (!node?.uid) {
      return this.markFlowModelUsagesOwnerMissingForUids(
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
    const owners: UsageOwnerSource[] = collectUsageOwnerNodes(node).map((owner) => ({
      ...owner,
      source: readRunJsSource(owner.node, owner.adapter),
    }));
    await this.lockAuthoringBindingProjects(owners, input.action || 'flowModels.save', ctx);
    for (const owner of owners) {
      const modelUid = normalizeString(owner.node.uid);
      if (modelUid) {
        seenOwnerHashes.add(hashOwnerLocator(buildOwnerLocatorForSource(owner, modelUid)));
      }
      if (templateOwnerUids.has(modelUid)) {
        continue;
      }
      await this.syncJsTemplateUsage(owner, input.action || 'flowModels.save', requestId, ctx, summary, scopeProjectId);
    }
    await this.removeUsagesForTemplateOwners(
      Array.from(templateOwnerUids),
      input.action || 'flowModels.save',
      requestId,
      ctx,
      summary,
      scopeProjectId,
    );
    await this.removeUnseenUsagesForOwners(
      modelUids.filter((modelUid) => !templateOwnerUids.has(modelUid)),
      input.action || 'flowModels.save',
      requestId,
      ctx,
      summary,
      scopeProjectId,
      seenOwnerHashes,
      'owner_no_longer_usages_extension',
    );
    const missingOwners = await this.markMissingUsageOwners(
      input.action || 'flowModels.save',
      requestId,
      {
        ...ctx,
        scopeProjectId,
      },
      new Set(modelUids),
    );
    summary.ownerMissing += missingOwners.ownerMissing;
    mergeStatusCounts(summary, missingOwners.statusCounts);
    summary.items.push(...(ctx.dryRunItems || []));

    await this.recordUsageAuditBestEffort({
      action: 'usageRebuild',
      result: 'success',
      requestId,
      actorUserId: ctx.actorUserId,
      usageCount: summary.scanned,
      message: 'JS Template usages rebuilt for FlowModel tree',
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

  async markFlowModelUsagesOwnerMissingForNodeTree(
    input: { rootUid: string; action?: UsageSyncAction },
    ctx: JsTemplateUsageServiceContext = {},
  ): Promise<JsTemplateUsageRebuildResult> {
    const rootUid = normalizeString(input.rootUid);
    if (!rootUid) {
      return emptyRebuildResult();
    }

    const node = await this.loadFlowModelTree(rootUid, ctx).catch(() => null);
    const uids = node?.uid ? collectModelUids(node) : [rootUid];
    return this.markFlowModelUsagesOwnerMissingForUids(
      uids,
      {
        action: input.action || 'flowModels.destroy',
        requestId: ctx.requestId || randomUUID(),
      },
      ctx,
    );
  }

  async rebuildUsages(
    input: JsTemplateUsageRebuildInput = {},
    ctx: JsTemplateUsageServiceContext = {},
  ): Promise<JsTemplateUsageRebuildResult> {
    const requestId = ctx.requestId || randomUUID();
    await this.assertUsageActionAllowed({
      permissionAction: 'updateUsages',
      auditAction: 'usageRebuild',
      requestId,
      ctx,
      projectId: normalizeString(input.projectId),
      ownerLocatorHash: buildInputOwnerLocatorHash(input),
    });

    const dryRun = Boolean(input.dryRun);
    const rebuildContext: JsTemplateUsageServiceContext = {
      ...ctx,
      dryRun,
      dryRunItems: [],
    };
    const scopeProjectId = normalizeString(input.projectId);
    const ownerLocator = normalizeOwnerLocator(input.ownerLocator);
    const rootUid = normalizeString(input.rootUid) || getRebuildRootUid(ownerLocator);
    if (rootUid) {
      return this.syncFlowModelUsagesForNodeTree(
        {
          rootUid,
          action: 'usageRebuild',
        },
        {
          ...rebuildContext,
          scopeProjectId,
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
    const existingModelUids = new Set<string>();
    for (const record of records) {
      const node = flowModelNodeFromRecord(record);
      const modelUid = normalizeString(node.uid);
      if (!modelUid) {
        continue;
      }
      existingModelUids.add(modelUid);
      if (templateOwnerUids.has(modelUid)) {
        continue;
      }
      const adapter = getUsageOwnerAdapterByUse(node.use || '');
      const owners: UsageOwnerSource[] = adapter ? [{ adapter, node }] : [];
      for (const owner of owners) {
        const ownerLocator = buildOwnerLocatorForSource(owner, modelUid);
        seenOwnerHashes.add(hashOwnerLocator(ownerLocator));
        await this.syncJsTemplateUsage(owner, 'usageRebuild', requestId, rebuildContext, summary, scopeProjectId);
      }
    }
    await this.removeUsagesForTemplateOwners(
      Array.from(templateOwnerUids),
      'usageRebuild',
      requestId,
      rebuildContext,
      summary,
      scopeProjectId,
    );
    await this.removeUnseenUsagesForOwners(
      Array.from(existingModelUids).filter((modelUid) => !templateOwnerUids.has(modelUid)),
      'usageRebuild',
      requestId,
      rebuildContext,
      summary,
      scopeProjectId,
      seenOwnerHashes,
      'owner_no_longer_usages_extension',
    );

    const usages = await this.findUsageModels(scopeProjectId ? { projectId: scopeProjectId } : {}, rebuildContext);
    const missingOwnerUids: string[] = [];
    for (const usage of usages) {
      const ownerLocator = normalizeOwnerLocator(usage.get('ownerLocator'));
      if (
        !ownerLocator?.modelUid ||
        existingModelUids.has(ownerLocator.modelUid) ||
        seenOwnerHashes.has(normalizeString(usage.get('ownerLocatorHash')))
      ) {
        continue;
      }
      missingOwnerUids.push(ownerLocator.modelUid);
    }
    if (missingOwnerUids.length) {
      const ownerMissing = await this.markFlowModelUsagesOwnerMissingForUids(
        missingOwnerUids,
        {
          action: 'usageRebuild',
          requestId,
        },
        {
          ...rebuildContext,
          scopeProjectId,
          skipOwnerLocatorHashes: seenOwnerHashes,
        },
      );
      summary.ownerMissing += ownerMissing.ownerMissing;
      mergeStatusCounts(summary, ownerMissing.statusCounts);
    }
    summary.items.push(...(rebuildContext.dryRunItems || []));

    await this.recordUsageAuditBestEffort({
      action: 'usageRebuild',
      result: 'success',
      requestId,
      actorUserId: rebuildContext.actorUserId,
      usageCount: summary.scanned,
      message: 'JS Template usages rebuilt',
      details: {
        dryRun,
        projectId: scopeProjectId,
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

  async listUsages(
    input: JsTemplateUsageListInput,
    ctx: JsTemplateUsageServiceContext = {},
  ): Promise<JsTemplateUsageListResult> {
    const normalizedInput = normalizeUsageListInput(input);
    const requestId = ctx.requestId || randomUUID();
    await this.assertUsageActionAllowed({
      permissionAction: 'readUsages',
      auditAction: 'listUsages',
      requestId,
      ctx,
      templateId: normalizedInput.templateId,
    });
    await this.assertTemplateApplicationOwnership(normalizedInput.templateId, ctx);

    const filter = {
      templateId: normalizedInput.templateId,
      resolvedStatus: { $ne: 'owner_missing' },
    };
    const [effectiveCount, visibility] = await Promise.all([
      this.countEffectiveUsages(normalizedInput.templateId, ctx),
      this.resolveUsageOwnerVisibility(ctx),
    ]);
    const start = (normalizedInput.page - 1) * normalizedInput.pageSize;
    const visibilityScanMetrics = resetVisibilityScanMetrics(getVisibilityScanMetrics(ctx));
    let data: JsTemplateUsageLocation[] = [];
    let count = 0;
    let hiddenCount = 0;
    let projectId: string | undefined;

    if (visibility.unrestricted) {
      if (visibilityScanMetrics) {
        visibilityScanMetrics.usagePageCalls += 1;
        visibilityScanMetrics.visibilityResolutions += 1;
      }
      const records = await this.findUsageModelsPage(filter, ctx, normalizedInput.pageSize, start);
      const usages = records.map(usageFromModel);
      data = await this.resolveVisibleUsageLocations(usages, ctx, visibility);
      recordVisibilityRetention(visibilityScanMetrics, 1, usages.length, data.length);
      count = effectiveCount;
      projectId = usages[0]?.projectId;
    } else {
      const offsets = Array.from(
        { length: Math.ceil(effectiveCount / USAGE_VISIBILITY_BATCH_SIZE) },
        (_, index) => index * USAGE_VISIBILITY_BATCH_SIZE,
      );
      const visiblePage: JsTemplateUsageLocation[] = [];
      let visibleCount = 0;
      await consumeWithConcurrencyInOrder(
        offsets,
        USAGE_VISIBILITY_BATCH_CONCURRENCY,
        async (offset): Promise<{ usages: JsTemplateUsage[]; visible: JsTemplateUsageLocation[] }> => {
          if (visibilityScanMetrics) {
            visibilityScanMetrics.usagePageCalls += 1;
          }
          const records = await this.findUsageModelsPage(filter, ctx, USAGE_VISIBILITY_BATCH_SIZE, offset);
          const usages = records.map(usageFromModel);
          if (visibilityScanMetrics) {
            visibilityScanMetrics.visibilityResolutions += 1;
          }
          return {
            usages,
            visible: await this.resolveVisibleUsageLocations(usages, ctx, visibility),
          };
        },
        (batch) => {
          projectId ||= batch.usages[0]?.projectId;
          hiddenCount += batch.usages.length - batch.visible.length;
          for (const location of batch.visible) {
            if (visibleCount >= start && visibleCount < start + normalizedInput.pageSize) {
              visiblePage.push(location);
            }
            visibleCount += 1;
          }
        },
        (batch) => ({ usageRecords: batch.usages.length, locations: batch.visible.length }),
        visibilityScanMetrics,
      );
      count = visibleCount;
      data = visiblePage;
    }

    if (hiddenCount > 0) {
      await this.recordUsageAuditBestEffort({
        projectId,
        templateId: normalizedInput.templateId,
        action: 'listUsages',
        result: 'denied',
        requestId,
        actorUserId: ctx.actorUserId,
        usageCount: hiddenCount,
        reasonCode: 'owner_not_visible',
        message: 'Some JS Template usage owners are not visible to the reader',
        transaction: ctx.transaction,
      });
    }

    return {
      data,
      meta: {
        page: normalizedInput.page,
        pageSize: normalizedInput.pageSize,
        count,
        totalPage: count === 0 ? 0 : Math.ceil(count / normalizedInput.pageSize),
        effectiveCount,
        hiddenCount,
      },
    };
  }

  async countEffectiveUsages(templateId: string, ctx: JsTemplateServiceContext = {}): Promise<number> {
    const normalizedTemplateId = normalizeString(templateId);
    if (!normalizedTemplateId) {
      throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'templateId must be a non-empty string');
    }
    return this.db.getRepository(JS_TEMPLATE_COLLECTIONS.usages).count({
      filter: {
        templateId: normalizedTemplateId,
        resolvedStatus: { $ne: 'owner_missing' },
      },
      transaction: ctx.transaction,
    });
  }

  private async assertTemplateApplicationOwnership(
    templateId: string,
    ctx: JsTemplateUsageServiceContext,
  ): Promise<void> {
    const template = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.templates).findOne({
      filterByTk: templateId,
      transaction: ctx.transaction,
    });
    if (!template) {
      throw new JsTemplateError('JS_TEMPLATE_NOT_FOUND', `JS Template "${templateId}" was not found`);
    }
    const projectId = normalizeString(template.get('projectId'));
    if (!projectId) {
      throw new JsTemplateError('JS_TEMPLATE_NOT_FOUND', `JS Template "${templateId}" was not found`);
    }
    await this.projectService.getProject(projectId, ctx);
  }

  private async lockAuthoringBindingProjects(
    owners: UsageOwnerSource[],
    action: UsageSyncAction,
    ctx: JsTemplateUsageServiceContext,
  ): Promise<void> {
    if (action === 'usageRebuild' || ctx.dryRun) {
      return;
    }
    const projectIds = Array.from(
      new Set(
        owners
          .map((owner) => owner.source?.sourceBinding?.projectId)
          .map(normalizeString)
          .filter(Boolean),
      ),
    ).sort();
    for (const projectId of projectIds) {
      try {
        await this.projectService.lockInternalProjectForUpdate(projectId, ctx);
      } catch (error) {
        if (
          isJsTemplateError(error) &&
          (error.code === 'JS_TEMPLATE_PROJECT_NOT_FOUND' || error.code === 'JS_TEMPLATE_PERMISSION_DENIED')
        ) {
          throw bindingTargetOutdated(projectId);
        }
        throw error;
      }
    }
  }

  async refreshUsages(
    input: { projectId: string; plan: UsageRefreshScope },
    ctx: JsTemplateUsageServiceContext = {},
  ): Promise<UsageRefreshResult> {
    const normalizedProjectId = normalizeString(input.projectId);
    if (!normalizedProjectId) {
      return emptyUsageRefreshResult('skip', 'project_id_missing');
    }
    const normalizedPlan = normalizeUsageRefreshScope(input.plan);
    if (normalizedPlan.mode === 'skip') {
      return emptyUsageRefreshResult('skip', normalizedPlan.reason);
    }

    const targetTemplateIds = normalizedPlan.mode === 'templates' ? normalizedPlan.templateIds : [];
    const usages = await this.findUsageModels(
      normalizedPlan.mode === 'templates'
        ? { projectId: normalizedProjectId, templateId: { $in: targetTemplateIds } }
        : { projectId: normalizedProjectId },
      ctx,
    );
    const statusCounts: UsageUpsertSummary['statusCounts'] = {};
    let changed = 0;
    let targetTemplateCount = normalizedPlan.mode === 'templates' ? targetTemplateIds.length : 0;

    if (usages.length > 0) {
      const [project, templates] = await Promise.all([
        this.db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).findOne({
          filterByTk: normalizedProjectId,
          transaction: ctx.transaction,
        }),
        this.db.getRepository(JS_TEMPLATE_COLLECTIONS.templates).find({
          filter:
            normalizedPlan.mode === 'templates'
              ? { projectId: normalizedProjectId, id: { $in: targetTemplateIds } }
              : { projectId: normalizedProjectId },
          transaction: ctx.transaction,
        }),
      ]);
      if (normalizedPlan.mode === 'project') {
        targetTemplateCount = templates.length;
      }
      const templateById = new Map<string, Model>(
        templates.map((template: Model): [string, Model] => [normalizeString(template.get('id')), template]),
      );
      const ownerLoads = new Map<string, Promise<FlowModelNode | null>>();
      const loadOwner = (modelUid: string) => {
        const cached = ownerLoads.get(modelUid);
        if (cached) {
          return cached;
        }
        const loaded = this.loadFlowModelTree(modelUid, ctx);
        ownerLoads.set(modelUid, loaded);
        return loaded;
      };

      for (const usage of usages) {
        const current = usageFromModel(usage);
        const resolution = await this.resolveStoredUsageFromCache(current, project, templateById, loadOwner);
        statusCounts[resolution.resolvedStatus] = (statusCounts[resolution.resolvedStatus] || 0) + 1;
        if (resolution.resolvedStatus === current.resolvedStatus && resolution.settingsHash === current.settingsHash) {
          continue;
        }
        await usage.update(
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
    }

    const result: UsageRefreshResult = {
      mode: normalizedPlan.mode,
      reason: normalizedPlan.reason,
      targetTemplateCount,
      usageCount: usages.length,
      changed,
      statusCounts,
    };
    return result;
  }

  async refreshUsagesForProject(
    projectId: string,
    ctx: JsTemplateUsageServiceContext = {},
    reason = 'project_lifecycle_change',
  ): Promise<UsageRefreshResult> {
    return this.refreshUsages(
      {
        projectId,
        plan: {
          mode: 'project',
          reason,
        },
      },
      ctx,
    );
  }

  private async syncJsTemplateUsage(
    owner: UsageOwnerSource,
    action: UsageSyncAction,
    requestId: string,
    ctx: JsTemplateUsageServiceContext,
    summary: UsageUpsertSummary,
    limitProjectId?: string,
  ): Promise<void> {
    if (!ctx.transaction && !ctx.dryRun) {
      await this.db.sequelize.transaction(async (transaction) =>
        this.syncJsTemplateUsage(owner, action, requestId, { ...ctx, transaction }, summary, limitProjectId),
      );
      return;
    }

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
    const scopeProjectId = normalizeString(limitProjectId);
    if (source.sourceMode !== JS_TEMPLATE_SOURCE_MODE) {
      if (action !== 'usageRebuild' && action !== 'jsTemplates.detachToInline') {
        const existingUsage = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.usages).findOne({
          filter: {
            ownerLocatorHash,
            resolvedStatus: { $ne: 'owner_missing' },
          },
          transaction: ctx.transaction,
        });
        if (existingUsage) {
          throw new JsTemplateError(
            'JS_TEMPLATE_CONFLICT',
            'A JS Template Host must be detached through the canonical detach-to-inline operation',
          );
        }
      }
      const removed = await this.removeUsagesForOwner(ownerLocatorHash, action, requestId, ctx, {
        projectId: scopeProjectId,
      });
      if (!scopeProjectId || removed) {
        countScanned();
      }
      summary.removed += removed;
      return;
    }

    if (!source.sourceBinding) {
      const removed = await this.removeUsagesForOwner(ownerLocatorHash, action, requestId, ctx, {
        projectId: scopeProjectId,
        reasonCode: 'source_binding_invalid',
      });
      if (!scopeProjectId || removed) {
        countScanned();
      }
      summary.removed += removed;
      await this.recordUsageConflict(ownerLocator.kind, ownerLocatorHash, 'source_binding_invalid', requestId, ctx, {
        trigger: action,
        modelUidHash: stableJsonHash({ modelUid }),
      });
      return;
    }

    const resolution = await this.resolveUsageFromBinding(
      source.sourceBinding,
      source.settings,
      ctx,
      adapter.kind,
      action !== 'usageRebuild' && !ctx.dryRun,
    );
    if (scopeProjectId && resolution.projectId !== scopeProjectId) {
      const removed = await this.removeUsagesForOwner(ownerLocatorHash, action, requestId, ctx, {
        projectId: scopeProjectId,
        reasonCode: 'binding_changed',
      });
      if (removed) {
        countScanned();
      }
      summary.removed += removed;
      return;
    }
    countScanned();

    summary.removed += await this.removeStaleUsagesForOwner(
      ownerLocatorHash,
      resolution.projectId,
      resolution.templateId,
      action,
      requestId,
      ctx,
      scopeProjectId,
    );
    await this.upsertUsage({
      projectId: resolution.projectId,
      templateId: resolution.templateId,
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
      await this.recordUsageConflict(ownerLocator.kind, ownerLocatorHash, resolution.conflictReason, requestId, ctx, {
        trigger: action,
        modelUidHash: stableJsonHash({ modelUid }),
        projectId: resolution.projectId,
        templateId: resolution.templateId,
      });
    }
  }

  private async resolveUsageFromBinding(
    sourceBinding: JsTemplateRuntimeSourceBinding,
    settings: Record<string, unknown>,
    ctx: JsTemplateUsageServiceContext,
    expectedKind: JsTemplateKind,
    rejectOutdatedTarget = false,
  ): Promise<{
    projectId: string;
    templateId: string;
    settingsHash: string;
    resolvedStatus: JsTemplateUsageResolvedStatus;
    conflictReason?: string;
  }> {
    if (sourceBinding.kind !== expectedKind) {
      if (rejectOutdatedTarget) {
        throw bindingTargetOutdated(sourceBinding.projectId, sourceBinding.templateId);
      }
      return {
        projectId: sourceBinding.projectId,
        templateId: sourceBinding.templateId,
        settingsHash: stableJsonHash(settings),
        resolvedStatus: 'binding_outdated',
        conflictReason: 'kind_mismatch',
      };
    }
    const project = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).findOne({
      filterByTk: sourceBinding.projectId,
      transaction: ctx.transaction,
      ...(ctx.transaction ? { lock: ctx.transaction.LOCK.UPDATE } : {}),
    });
    const template = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.templates).findOne({
      filterByTk: sourceBinding.templateId,
      transaction: ctx.transaction,
    });
    if (
      rejectOutdatedTarget &&
      (!project ||
        !template ||
        normalizeString(template.get('projectId')) !== sourceBinding.projectId ||
        normalizeString(template.get('kind')) !== sourceBinding.kind)
    ) {
      throw bindingTargetOutdated(sourceBinding.projectId, sourceBinding.templateId);
    }
    return this.resolveUsageFromLoadedModels(sourceBinding, settings, project, template);
  }

  private resolveUsageFromLoadedModels(
    sourceBinding: JsTemplateRuntimeSourceBinding,
    settings: Record<string, unknown>,
    project: Model | null,
    template: Model | null,
  ): {
    projectId: string;
    templateId: string;
    settingsHash: string;
    resolvedStatus: JsTemplateUsageResolvedStatus;
    conflictReason?: string;
  } {
    const fallback = {
      projectId: sourceBinding.projectId,
      templateId: sourceBinding.templateId,
      settingsHash: stableJsonHash(settings),
    };
    if (!project) {
      return {
        ...fallback,
        resolvedStatus: 'project_missing',
        conflictReason: 'project_missing',
      };
    }
    const lifecycleStatus = normalizeString(project.get('lifecycleStatus'));
    if (lifecycleStatus === 'disabled' || lifecycleStatus === 'archived') {
      return {
        ...fallback,
        resolvedStatus: lifecycleStatus === 'disabled' ? 'project_disabled' : 'project_archived',
        conflictReason: lifecycleStatus === 'disabled' ? 'project_disabled' : 'project_archived',
      };
    }
    if (!template) {
      return {
        ...fallback,
        resolvedStatus: 'template_missing',
        conflictReason: 'template_missing',
      };
    }
    const templateProjectId = normalizeString(template.get('projectId'));
    const templateKind = normalizeString(template.get('kind'));
    const healthStatus = normalizeString(template.get('healthStatus'));
    if (templateProjectId !== sourceBinding.projectId || templateKind !== sourceBinding.kind) {
      return {
        projectId: templateProjectId || fallback.projectId,
        templateId: normalizeString(template.get('id')) || fallback.templateId,
        settingsHash: fallback.settingsHash,
        resolvedStatus: 'binding_outdated',
        conflictReason: 'binding_outdated',
      };
    }
    if (healthStatus === 'missing') {
      return {
        ...fallback,
        resolvedStatus: 'template_missing',
        conflictReason: 'template_missing',
      };
    }
    if (healthStatus !== 'ready') {
      return {
        ...fallback,
        resolvedStatus: 'runtime_missing',
        conflictReason: 'runtime_missing',
      };
    }

    const runtimeTemplate = templateFromModel(template);
    if (!hasUsableRuntimeArtifact(runtimeTemplate, normalizeString(project.get('headCommitId')) || null)) {
      return {
        ...fallback,
        resolvedStatus: 'runtime_missing',
        conflictReason: 'runtime_missing',
      };
    }
    const settingsSource = getRuntimeSettingsSource(runtimeTemplate);
    const sourceSettings = this.settingsResolver.pruneUnknownSettings(settingsSource, settings);
    const settingsForHash = mergeSettingsForUsageHash(
      this.settingsResolver.getRuntimeDefaults(settingsSource),
      sourceSettings,
    );
    let resolvedSettings: Record<string, unknown>;
    try {
      resolvedSettings = this.settingsResolver.resolveRuntimeSettings(settingsSource, sourceSettings);
    } catch (error) {
      if (!isJsTemplateError(error) || error.code !== 'JS_TEMPLATE_SETTINGS_INVALID') {
        throw error;
      }
      return {
        projectId: runtimeTemplate.projectId,
        templateId: runtimeTemplate.id,
        settingsHash: stableJsonHash(settingsForHash),
        resolvedStatus: 'settings_invalid',
        conflictReason: 'settings_invalid',
      };
    }

    return {
      projectId: runtimeTemplate.projectId,
      templateId: runtimeTemplate.id,
      settingsHash: stableJsonHash(resolvedSettings),
      resolvedStatus: 'active',
    };
  }

  private async resolveStoredUsageFromCache(
    usage: JsTemplateUsage,
    project: Model | null,
    templatesById: ReadonlyMap<string, Model>,
    loadOwner: (modelUid: string) => Promise<FlowModelNode | null>,
  ): Promise<{
    settingsHash: string;
    resolvedStatus: JsTemplateUsageResolvedStatus;
  }> {
    const modelUid = getUsageOwnerModelUid(usage.ownerLocator);
    const owner = modelUid ? await loadOwner(modelUid) : null;
    if (!owner) {
      return {
        settingsHash: usage.settingsHash,
        resolvedStatus: 'owner_missing',
      };
    }
    const adapter = getUsageOwnerAdapterByOwnerKind(usage.ownerKind);
    const source = readUsageOwnerSource(owner, adapter);
    const binding = source.sourceBinding;
    if (
      source.sourceMode !== JS_TEMPLATE_SOURCE_MODE ||
      !binding ||
      binding.projectId !== usage.projectId ||
      binding.templateId !== usage.templateId ||
      binding.kind !== usage.kind
    ) {
      return {
        settingsHash: stableJsonHash(source.settings),
        resolvedStatus: 'binding_outdated',
      };
    }
    const resolution = this.resolveUsageFromLoadedModels(
      binding,
      source.settings,
      project,
      templatesById.get(binding.templateId) || null,
    );
    return {
      settingsHash: resolution.settingsHash,
      resolvedStatus: resolution.resolvedStatus,
    };
  }

  private async upsertUsage(input: {
    projectId: string;
    templateId: string;
    kind: JsTemplateKind;
    ownerLocator: JsTemplateUsageOwnerLocator;
    ownerLocatorHash: string;
    settingsHash: string;
    resolvedStatus: JsTemplateUsageResolvedStatus;
    requestId: string;
    action: UsageSyncAction;
    ctx: JsTemplateUsageServiceContext;
  }): Promise<void> {
    const repository = this.db.getRepository(JS_TEMPLATE_COLLECTIONS.usages);
    const values = {
      projectId: input.projectId,
      templateId: input.templateId,
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
        projectId: input.projectId,
        templateId: input.templateId,
        resolvedStatus: input.resolvedStatus,
      });
      return;
    }
    const existing = await repository.findOne({
      filter: {
        ownerLocatorHash: input.ownerLocatorHash,
        projectId: input.projectId,
        templateId: input.templateId,
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
          id: `jtu_${uid()}`,
          ...values,
        },
        transaction: input.ctx.transaction,
      });
    }
  }

  private async removeStaleUsagesForOwner(
    ownerLocatorHash: string,
    projectId: string,
    templateId: string,
    _action: UsageSyncAction,
    _requestId: string,
    ctx: JsTemplateUsageServiceContext,
    scopeProjectId?: string,
  ): Promise<number> {
    const usages = await this.findUsageModels(
      {
        ownerLocatorHash,
        ...(scopeProjectId ? { projectId: scopeProjectId } : {}),
      },
      ctx,
    );
    let removed = 0;
    for (const usage of usages) {
      if (usage.get('projectId') === projectId && usage.get('templateId') === templateId) {
        continue;
      }
      if (ctx.dryRun) {
        pushDryRunItem(ctx, {
          action: 'remove',
          kind: normalizeUsageKind(usage.get('kind')),
          ownerKind: normalizeOwnerKind(usage.get('ownerKind')),
          ownerLocatorHash,
          projectId: normalizeString(usage.get('projectId')),
          templateId: normalizeString(usage.get('templateId')),
          resolvedStatus: normalizeStatus(usage.get('resolvedStatus')),
          reasonCode: 'binding_changed',
        });
        removed += 1;
        continue;
      }
      await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.usages).destroy({
        filterByTk: usage.get('id'),
        transaction: ctx.transaction,
      });
      removed += 1;
    }
    return removed;
  }

  private async removeUsagesForOwner(
    ownerLocatorHash: string,
    _action: UsageSyncAction,
    _requestId: string,
    ctx: JsTemplateUsageServiceContext,
    options: { projectId?: string; reasonCode?: string } = {},
  ): Promise<number> {
    const usages = await this.findUsageModels(
      {
        ownerLocatorHash,
        ...(options.projectId ? { projectId: options.projectId } : {}),
      },
      ctx,
    );
    for (const usage of usages) {
      if (ctx.dryRun) {
        pushDryRunItem(ctx, {
          action: 'remove',
          kind: normalizeUsageKind(usage.get('kind')),
          ownerKind: normalizeOwnerKind(usage.get('ownerKind')),
          ownerLocatorHash,
          projectId: normalizeString(usage.get('projectId')),
          templateId: normalizeString(usage.get('templateId')),
          resolvedStatus: normalizeStatus(usage.get('resolvedStatus')),
          reasonCode: options.reasonCode || 'source_mode_inline',
        });
        continue;
      }
      await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.usages).destroy({
        filterByTk: usage.get('id'),
        transaction: ctx.transaction,
      });
    }
    return usages.length;
  }

  private async removeUsagesForTemplateOwners(
    uids: string[],
    action: UsageSyncAction,
    requestId: string,
    ctx: JsTemplateUsageServiceContext,
    summary: UsageUpsertSummary,
    scopeProjectId?: string,
  ): Promise<void> {
    await this.removeUnseenUsagesForOwners(
      uids,
      action,
      requestId,
      ctx,
      summary,
      scopeProjectId,
      new Set(),
      'owner_is_template_target',
    );
  }

  private async removeUnseenUsagesForOwners(
    uids: string[],
    action: UsageSyncAction,
    requestId: string,
    ctx: JsTemplateUsageServiceContext,
    summary: UsageUpsertSummary,
    scopeProjectId: string | undefined,
    seenOwnerHashes: Set<string>,
    reasonCode: string,
  ): Promise<void> {
    const ownerUids = new Set(uids.map((item) => normalizeString(item)).filter(Boolean));
    if (!ownerUids.size) {
      return;
    }
    const usages = await this.findUsageModels(scopeProjectId ? { projectId: scopeProjectId } : {}, ctx);
    const removedOwnerHashes = new Set<string>();
    for (const usage of usages) {
      const ownerLocator = normalizeOwnerLocator(usage.get('ownerLocator'));
      const ownerLocatorHash = normalizeString(usage.get('ownerLocatorHash'));
      if (
        !ownerLocator?.modelUid ||
        !ownerUids.has(ownerLocator.modelUid) ||
        !ownerLocatorHash ||
        seenOwnerHashes.has(ownerLocatorHash) ||
        removedOwnerHashes.has(ownerLocatorHash)
      ) {
        continue;
      }
      removedOwnerHashes.add(ownerLocatorHash);
      const removed = await this.removeUsagesForOwner(ownerLocatorHash, action, requestId, ctx, {
        projectId: scopeProjectId,
        reasonCode,
      });
      if (removed) {
        summary.scanned += 1;
      }
      summary.removed += removed;
    }
  }

  private async markFlowModelUsagesOwnerMissingForUids(
    uids: string[],
    input: { action: UsageSyncAction; requestId: string },
    ctx: JsTemplateUsageServiceContext,
  ): Promise<JsTemplateUsageRebuildResult> {
    const ownerUids = new Set(uids.map((item) => normalizeString(item)).filter(Boolean));
    const summary = emptySummary();
    const usages = await this.findUsageModels(
      ctx.scopeProjectId ? { projectId: normalizeString(ctx.scopeProjectId) } : {},
      ctx,
    );
    for (const usage of usages) {
      const ownerLocator = normalizeOwnerLocator(usage.get('ownerLocator'));
      const modelUid = normalizeString(ownerLocator?.modelUid);
      if (!modelUid || !ownerUids.has(modelUid) || usage.get('resolvedStatus') === 'owner_missing') {
        continue;
      }
      const ownerLocatorHash = normalizeString(usage.get('ownerLocatorHash'));
      if (ownerLocatorHash && ctx.skipOwnerLocatorHashes?.has(ownerLocatorHash)) {
        continue;
      }
      if (ctx.dryRun) {
        pushDryRunItem(ctx, {
          action: 'owner_missing',
          kind: normalizeUsageKind(usage.get('kind')),
          ownerKind: normalizeOwnerKind(usage.get('ownerKind')),
          ownerLocatorHash,
          projectId: normalizeString(usage.get('projectId')),
          templateId: normalizeString(usage.get('templateId')),
          resolvedStatus: 'owner_missing',
        });
        summary.ownerMissing += 1;
        incrementStatus(summary, 'owner_missing');
        continue;
      }
      await usage.update(
        {
          resolvedStatus: 'owner_missing',
        },
        {
          transaction: ctx.transaction,
        },
      );
      summary.ownerMissing += 1;
      incrementStatus(summary, 'owner_missing');
    }
    summary.items.push(...(ctx.dryRunItems || []));
    return summaryToResult(summary, Boolean(ctx.dryRun));
  }

  private async markMissingUsageOwners(
    action: UsageSyncAction,
    requestId: string,
    ctx: JsTemplateUsageServiceContext,
    knownExistingOwnerUids: Set<string> = new Set(),
  ): Promise<JsTemplateUsageRebuildResult> {
    const usages = await this.findUsageModels(
      ctx.scopeProjectId ? { projectId: normalizeString(ctx.scopeProjectId) } : {},
      ctx,
    );
    const missingOwnerUids: string[] = [];
    for (const usage of usages) {
      const ownerLocator = normalizeOwnerLocator(usage.get('ownerLocator'));
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

    return this.markFlowModelUsagesOwnerMissingForUids(
      missingOwnerUids,
      {
        action,
        requestId,
      },
      ctx,
    );
  }

  private async resolveUsageOwnerVisibility(ctx: JsTemplateUsageServiceContext): Promise<UsageOwnerVisibility> {
    if (isRootContext(ctx) || !ctx.can) {
      return { unrestricted: true };
    }
    const permission = await resolveCan(ctx.can, {
      resource: 'flowModels',
      action: 'findOne',
    });
    if (permission && isRootPermission(permission)) {
      return { unrestricted: true };
    }
    if (!permission || !permission.params?.filter) {
      return {
        unrestricted: false,
        accessibleRouteIds: await this.loadCurrentRoleRouteIds(ctx),
      };
    }
    return {
      unrestricted: false,
      filter: await this.parsePermissionFilter('flowModels', permission.params.filter, ctx),
      accessibleRouteIds: await this.loadCurrentRoleRouteIds(ctx),
    };
  }

  private async resolveVisibleUsageLocations(
    usages: JsTemplateUsage[],
    ctx: JsTemplateUsageServiceContext,
    visibility: UsageOwnerVisibility,
  ): Promise<JsTemplateUsageLocation[]> {
    const modelUids = Array.from(
      new Set(usages.map((usage) => getUsageOwnerModelUid(usage.ownerLocator)).filter(Boolean)),
    );
    if (modelUids.length === 0) {
      return [];
    }

    const flowModelsRepository = this.db.getRepository('flowModels');
    const [ownerRecords, accessibleRoutes] = await Promise.all([
      flowModelsRepository.find({
        filter: { uid: { $in: modelUids } },
        fields: ['uid', 'options'],
        transaction: ctx.transaction,
      }),
      this.loadAccessibleUsageRoutes(modelUids, ctx, visibility),
    ]);
    const ownerByUid = new Map<string, Model>(
      ownerRecords
        .map((record): [string, Model] => [normalizeFlowModelUid(record), record])
        .filter(([modelUid]) => Boolean(modelUid)),
    );
    const visibleModelUids = new Set(accessibleRoutes.keys());

    if (visibility.unrestricted) {
      modelUids.forEach((modelUid) => visibleModelUids.add(modelUid));
    } else if (visibility.filter) {
      const matchedOwners = await flowModelsRepository.find({
        filter: {
          $and: [{ uid: { $in: modelUids } }, visibility.filter],
        },
        fields: ['uid'],
        transaction: ctx.transaction,
      });
      matchedOwners.forEach((record) => visibleModelUids.add(normalizeFlowModelUid(record)));
    }

    return usages.flatMap((usage): JsTemplateUsageLocation[] => {
      const modelUid = getUsageOwnerModelUid(usage.ownerLocator);
      if (!modelUid || !visibleModelUids.has(modelUid)) {
        return [];
      }
      const ownerTitle = resolveUsageOwnerTitle(usage, ownerByUid.get(modelUid));
      const route = accessibleRoutes.get(modelUid);
      return [
        {
          ...usage,
          ownerTitle,
          locationTitle: route?.title || ownerTitle,
          routeId: route?.id || null,
        },
      ];
    });
  }

  private async loadAccessibleUsageRoutes(
    modelUids: string[],
    ctx: JsTemplateUsageServiceContext,
    visibility: UsageOwnerVisibility,
  ): Promise<Map<string, { id: string; title: string }>> {
    const desktopRoutesRepository = this.getRepositoryIfExists('desktopRoutes');
    if (!desktopRoutesRepository?.find) {
      return new Map();
    }

    const ancestorsByModelUid = new Map(modelUids.map((modelUid) => [modelUid, new Set([modelUid])]));
    const treePathRepository = this.getRepositoryIfExists('flowModelTreePath');
    if (treePathRepository?.find) {
      const treePaths = await treePathRepository.find({
        filter: { descendant: { $in: modelUids } },
        fields: ['ancestor', 'descendant'],
        transaction: ctx.transaction,
      });
      for (const treePath of treePaths) {
        const descendant = normalizeString(treePath.get('descendant'));
        const ancestor = normalizeString(treePath.get('ancestor'));
        if (descendant && ancestor && ancestorsByModelUid.has(descendant)) {
          ancestorsByModelUid.get(descendant)?.add(ancestor);
        }
      }
    }

    const ancestorUids = Array.from(new Set(Array.from(ancestorsByModelUid.values()).flatMap((uids) => [...uids])));
    const routes = await desktopRoutesRepository.find({
      filter: { schemaUid: { $in: ancestorUids } },
      fields: ['id', 'schemaUid', 'title'],
      transaction: ctx.transaction,
    });
    const accessibleRouteIds = visibility.unrestricted
      ? new Set(routes.map(normalizeRouteId).filter(Boolean))
      : visibility.accessibleRouteIds || new Set<string>();
    const routesBySchemaUid = new Map<string, Model[]>();
    for (const route of routes) {
      const routeId = normalizeRouteId(route);
      const schemaUid = normalizeString(route.get('schemaUid'));
      if (!routeId || !schemaUid || !accessibleRouteIds.has(routeId)) {
        continue;
      }
      const candidates = routesBySchemaUid.get(schemaUid) || [];
      candidates.push(route);
      routesBySchemaUid.set(schemaUid, candidates);
    }

    const accessibleByModelUid = new Map<string, { id: string; title: string }>();
    for (const [modelUid, ancestors] of ancestorsByModelUid) {
      const route = [...ancestors].flatMap((ancestor) => routesBySchemaUid.get(ancestor) || [])[0];
      if (!route) {
        continue;
      }
      accessibleByModelUid.set(modelUid, {
        id: normalizeRouteId(route),
        title: normalizeString(route.get('title')) || modelUid,
      });
    }
    return accessibleByModelUid;
  }

  private async loadCurrentRoleRouteIds(ctx: JsTemplateUsageServiceContext): Promise<Set<string>> {
    const currentRoles = getCurrentRoleNames(ctx.state);
    if (currentRoles.length === 0) {
      return new Set();
    }
    const rolesRepository = this.getRepositoryIfExists('roles');
    if (!rolesRepository?.find) {
      return new Set();
    }
    const roleRecords = await rolesRepository.find({
      filterByTk: currentRoles,
      appends: ['desktopRoutes'],
      transaction: ctx.transaction,
    });
    const routeLists = await Promise.all(
      roleRecords.map((role) => normalizeMaybePromiseArray(role.get('desktopRoutes'))),
    );
    return new Set(routeLists.flat().map(normalizeRouteId).filter(Boolean));
  }

  private async collectTemplateTargetOwnerUids(
    ctx: JsTemplateUsageServiceContext,
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

  private async findFlowModelDescendantUids(rootUid: string, ctx: JsTemplateUsageServiceContext): Promise<string[]> {
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
    ctx: JsTemplateUsageServiceContext,
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
        return { id: '__js_template_usage_owner_not_visible__' };
      }
      throw error;
    }
  }

  private async loadFlowModelTree(uidValue: string, ctx: JsTemplateUsageServiceContext): Promise<FlowModelNode | null> {
    const repository = this.db.getCollection('flowModels')?.repository as FlowModelRepositoryLike | undefined;
    if (!repository?.findModelById) {
      return null;
    }
    return repository.findModelById(uidValue, {
      transaction: ctx.transaction,
      includeAsyncNode: true,
    });
  }

  private async findAllFlowModelRecords(ctx: JsTemplateUsageServiceContext): Promise<Model[]> {
    const repository = this.db.getRepository('flowModels');
    return repository.find({
      transaction: ctx.transaction,
    });
  }

  private async findUsageModels(filter: Record<string, unknown>, ctx: JsTemplateUsageServiceContext): Promise<Model[]> {
    return this.db.getRepository(JS_TEMPLATE_COLLECTIONS.usages).find({
      filter,
      sort: ['projectId', 'templateId', 'ownerLocatorHash'],
      transaction: ctx.transaction,
    });
  }

  private async findUsageModelsPage(
    filter: Record<string, unknown>,
    ctx: JsTemplateUsageServiceContext,
    limit: number,
    offset: number,
  ): Promise<Model[]> {
    return this.db.getRepository(JS_TEMPLATE_COLLECTIONS.usages).find({
      filter,
      sort: ['projectId', 'templateId', 'ownerLocatorHash'],
      limit,
      offset,
      transaction: ctx.transaction,
    });
  }

  private async assertUsageActionAllowed(input: {
    permissionAction: 'readUsages' | 'updateUsages';
    auditAction: Parameters<JsTemplateAuditService['recordUsageEvent']>[0]['action'];
    requestId: string;
    ctx: JsTemplateUsageServiceContext;
    projectId?: string;
    templateId?: string;
    ownerLocatorHash?: string;
  }): Promise<void> {
    try {
      await this.permissionService.assertActionAllowed({
        action: input.permissionAction,
        ctx: input.ctx,
      });
    } catch (error) {
      if (isJsTemplateError(error) && error.code === 'JS_TEMPLATE_PERMISSION_DENIED') {
        await this.recordUsageAuditBestEffort({
          projectId: input.projectId,
          templateId: input.templateId,
          action: input.auditAction,
          result: 'denied',
          requestId: input.requestId,
          actorUserId: input.ctx.actorUserId,
          ownerLocatorHash: input.ownerLocatorHash,
          reasonCode: 'permission_denied',
          message: 'JS Template usage action permission denied',
          transaction: input.ctx.transaction,
        });
      }
      throw error;
    }
  }

  private async recordUsageConflict(
    ownerKind: JsTemplateUsageOwnerLocator['kind'],
    ownerLocatorHash: string,
    reasonCode: string,
    requestId: string,
    ctx: JsTemplateUsageServiceContext,
    details?: Record<string, unknown>,
  ): Promise<void> {
    await this.recordUsageAuditBestEffort({
      action: 'usageConflict',
      result: 'blocked',
      requestId,
      actorUserId: ctx.actorUserId,
      ownerKind,
      ownerLocatorHash,
      reasonCode,
      message: 'JS Template usage conflict detected',
      details,
      transaction: ctx.transaction,
    });
  }

  private async recordUsageAuditBestEffort(
    input: Parameters<JsTemplateAuditService['recordUsageEvent']>[0],
  ): Promise<void> {
    try {
      await this.auditService.recordUsageEvent(input);
    } catch {
      // Usage writes and permission denials must not depend on audit persistence availability.
    }
  }
}

async function consumeWithConcurrencyInOrder<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
  consume: (result: R, index: number) => void | Promise<void>,
  getRetention: (result: R) => { usageRecords: number; locations: number },
  metrics?: JsTemplateUsageVisibilityScanMetrics,
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  type SettledResult = { status: 'fulfilled'; value: R } | { status: 'rejected'; reason: unknown };
  const pending = new Map<number, Promise<SettledResult>>();
  let nextToSchedule = 0;
  let retainedBatches = 0;
  let retainedUsageRecords = 0;
  let retainedLocations = 0;

  const schedule = (index: number) => {
    const result: Promise<SettledResult> = mapper(items[index], index).then(
      (value): SettledResult => {
        const retained = getRetention(value);
        retainedBatches += 1;
        retainedUsageRecords += retained.usageRecords;
        retainedLocations += retained.locations;
        recordVisibilityRetention(metrics, retainedBatches, retainedUsageRecords, retainedLocations);
        return { status: 'fulfilled', value };
      },
      (reason: unknown): SettledResult => ({ status: 'rejected', reason }),
    );
    pending.set(index, result);
  };

  while (nextToSchedule < Math.min(concurrency, items.length)) {
    schedule(nextToSchedule);
    nextToSchedule += 1;
  }

  for (let index = 0; index < items.length; index += 1) {
    const pendingResult = pending.get(index);
    if (!pendingResult) {
      throw new Error(`Missing ordered concurrent result at index ${index}`);
    }
    pending.delete(index);
    const settled = await pendingResult;
    if (settled.status === 'rejected') {
      throw settled.reason;
    }
    const retained = getRetention(settled.value);
    try {
      await consume(settled.value, index);
    } finally {
      retainedBatches -= 1;
      retainedUsageRecords -= retained.usageRecords;
      retainedLocations -= retained.locations;
    }
    if (nextToSchedule < items.length) {
      schedule(nextToSchedule);
      nextToSchedule += 1;
    }
  }
}

function resetVisibilityScanMetrics(
  metrics?: JsTemplateUsageVisibilityScanMetrics,
): JsTemplateUsageVisibilityScanMetrics | undefined {
  if (!metrics) {
    return undefined;
  }
  metrics.usagePageCalls = 0;
  metrics.visibilityResolutions = 0;
  metrics.maxRetainedBatches = 0;
  metrics.maxRetainedUsageRecords = 0;
  metrics.maxRetainedLocations = 0;
  return metrics;
}

function getVisibilityScanMetrics(
  ctx: JsTemplateUsageServiceContext,
): JsTemplateUsageVisibilityScanMetrics | undefined {
  return (ctx as JsTemplateUsageServiceContext & JsTemplateUsageVisibilityScanContext)[USAGE_VISIBILITY_SCAN_METRICS];
}

function recordVisibilityRetention(
  metrics: JsTemplateUsageVisibilityScanMetrics | undefined,
  batches: number,
  usageRecords: number,
  locations: number,
): void {
  if (!metrics) {
    return;
  }
  metrics.maxRetainedBatches = Math.max(metrics.maxRetainedBatches, batches);
  metrics.maxRetainedUsageRecords = Math.max(metrics.maxRetainedUsageRecords, usageRecords);
  metrics.maxRetainedLocations = Math.max(metrics.maxRetainedLocations, locations);
}

async function resolveCan(
  can: JsTemplateCanFunction,
  input: { resource: string; action: string },
): Promise<UsagePermissionResult> {
  const permission = await can(input);
  if (permission === false || permission === null || typeof permission === 'undefined') {
    return false;
  }
  if (typeof permission === 'object') {
    return permission as { role?: string; params?: Record<string, unknown> };
  }
  return {};
}

function isRootContext(ctx: JsTemplateUsageServiceContext): boolean {
  return getCurrentRoleNames(ctx.state).includes('root');
}

function isRootPermission(permission: UsagePermissionResult): boolean {
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
  const routeId = typeof get === 'function' ? get.call(route, 'id') : route.id;
  return typeof routeId === 'number' ? String(routeId) : normalizeString(routeId);
}

function normalizeFlowModelUid(record: Model): string {
  const options = parseOptions(record.get('options'));
  return normalizeString(record.get('uid') || record.get('name') || options.uid);
}

function resolveUsageOwnerTitle(usage: JsTemplateUsage, owner?: Model): string {
  const options = owner ? parseOptions(owner.get('options')) : {};
  const props = isPlainRecord(options.props) ? options.props : {};
  const adapter = getUsageOwnerAdapterByOwnerKind(usage.ownerKind);
  return (
    normalizeString(options.title) ||
    normalizeString(props.title) ||
    normalizeString(options.name) ||
    adapter?.title ||
    getUsageOwnerModelUid(usage.ownerLocator) ||
    usage.ownerKind
  );
}

function readRunJsSource(node: FlowModelNode, adapter?: UsageOwnerAdapter): NormalizedJsBlockSource {
  const settingsKey = adapter?.settingsKey || 'jsSettings';
  const rawSettings = node.stepParams?.[settingsKey];
  const settings = isPlainRecord(rawSettings) ? rawSettings : {};
  const runJs = isPlainRecord(settings.runJs) ? settings.runJs : {};
  const sourceMode = normalizeString(runJs.sourceMode) || 'inline';
  const sourceBinding = normalizeSourceBinding(runJs.sourceBinding);
  const sourceSettings = normalizeFirstSettings(runJs.settings);
  return {
    sourceMode,
    sourceBinding,
    settings: sourceSettings,
  };
}

function readUsageOwnerSource(node: FlowModelNode, adapter: UsageOwnerAdapter | undefined): NormalizedJsBlockSource {
  return readRunJsSource(node, adapter);
}

function normalizeSourceBinding(value: unknown): JsTemplateRuntimeSourceBinding | undefined {
  if (!isJsTemplateRuntimeSourceBinding(value)) {
    return undefined;
  }
  const projectId = normalizeString(value.projectId);
  const templateId = normalizeString(value.templateId);
  if (!projectId || !templateId) {
    return undefined;
  }
  return createJsTemplateRuntimeSourceBinding({
    projectId,
    templateId,
    kind: value.kind,
  });
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
  adapter: UsageOwnerAdapter,
  modelUid: string,
  modelUse?: string,
): JsTemplateUsageOwnerLocator {
  return buildUsageOwnerLocator(adapter, modelUid, modelUse);
}

function buildOwnerLocatorForSource(owner: UsageOwnerSource, modelUid: string): JsTemplateUsageOwnerLocator {
  return owner.ownerLocator || buildFlowModelOwnerLocator(owner.adapter, modelUid, owner.node.use);
}

function normalizeOwnerLocator(value: unknown): JsTemplateUsageOwnerLocator | null {
  return normalizeUsageOwnerLocator(value);
}

function hashOwnerLocator(ownerLocator: JsTemplateUsageOwnerLocator): string {
  return hashUsageOwnerLocator(ownerLocator);
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

function usageFromModel(record: Model): JsTemplateUsage {
  const ownerLocator =
    normalizeOwnerLocator(record.get('ownerLocator')) || buildFlowModelOwnerLocator(JS_BLOCK_USAGE_OWNER_ADAPTER, '');
  return {
    id: normalizeString(record.get('id')),
    projectId: normalizeString(record.get('projectId')),
    templateId: normalizeString(record.get('templateId')),
    kind: normalizeUsageKind(record.get('kind')),
    ownerKind: normalizeOwnerKind(record.get('ownerKind')),
    ownerLocator,
    ownerLocatorHash: normalizeString(record.get('ownerLocatorHash')),
    settingsHash: normalizeString(record.get('settingsHash')) || EMPTY_SETTINGS_HASH,
    resolvedStatus: normalizeStatus(record.get('resolvedStatus')),
    createdAt: normalizeDate(record.get('createdAt')),
    updatedAt: normalizeDate(record.get('updatedAt')),
  };
}

function normalizeStatus(value: unknown): JsTemplateUsageResolvedStatus {
  const normalized = normalizeString(value);
  const statuses: JsTemplateUsageResolvedStatus[] = [
    'active',
    'binding_outdated',
    'project_missing',
    'project_disabled',
    'project_archived',
    'template_missing',
    'owner_missing',
    'settings_invalid',
    'runtime_missing',
  ];
  return statuses.includes(normalized as JsTemplateUsageResolvedStatus)
    ? (normalized as JsTemplateUsageResolvedStatus)
    : 'runtime_missing';
}

function normalizeUsageKind(value: unknown): JsTemplateKind {
  return assertJsTemplateKind(value);
}

function normalizeOwnerKind(value: unknown): JsTemplateUsage['ownerKind'] {
  const normalized = normalizeString(value);
  const adapter = normalized ? listUsageOwnerAdapters().find((item) => item.ownerKind === normalized) : null;
  return adapter?.ownerKind || JS_BLOCK_USAGE_OWNER_ADAPTER.ownerKind;
}

function normalizeUsageListInput(input: JsTemplateUsageListInput): JsTemplateUsageListInput {
  const templateId = normalizeString(input.templateId);
  if (!templateId) {
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'templateId must be a non-empty string');
  }
  if (!Number.isInteger(input.page) || input.page < 1) {
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'page must be an integer greater than zero');
  }
  if (!Number.isInteger(input.pageSize) || input.pageSize < 1 || input.pageSize > 100) {
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'pageSize must be an integer between 1 and 100');
  }
  return {
    templateId,
    page: input.page,
    pageSize: input.pageSize,
  };
}

function bindingTargetOutdated(projectId: string, templateId?: string): JsTemplateError {
  return new JsTemplateError(
    'JS_TEMPLATE_BINDING_OUTDATED',
    'The JS Template binding target changed before the Host could be saved',
    {
      details: {
        projectId,
        ...(templateId ? { templateId } : {}),
      },
    },
  );
}

function normalizeUsageRefreshScope(plan: UsageRefreshScope): UsageRefreshScope {
  if (plan.mode !== 'templates') {
    return plan;
  }
  const templateIds = [...new Set(plan.templateIds.map(normalizeString).filter(Boolean))].sort();
  if (templateIds.length === 0) {
    return {
      mode: 'skip',
      reason: plan.reason,
    };
  }
  return {
    ...plan,
    templateIds,
  };
}

function emptyUsageRefreshResult(mode: UsageRefreshResult['mode'], reason: string): UsageRefreshResult {
  return {
    mode,
    reason,
    targetTemplateCount: 0,
    usageCount: 0,
    changed: 0,
    statusCounts: {},
  };
}

function emptySummary(): UsageUpsertSummary {
  return {
    scanned: 0,
    upserted: 0,
    removed: 0,
    ownerMissing: 0,
    statusCounts: {},
    items: [],
  };
}

function emptyRebuildResult(dryRun = false): JsTemplateUsageRebuildResult {
  return summaryToResult(emptySummary(), dryRun);
}

function summaryToResult(summary: UsageUpsertSummary, dryRun = false): JsTemplateUsageRebuildResult {
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

function pushDryRunItem(ctx: JsTemplateUsageServiceContext, item: JsTemplateUsageRebuildItem): void {
  if (!ctx.dryRun) {
    return;
  }
  if (!ctx.dryRunItems) {
    ctx.dryRunItems = [];
  }
  ctx.dryRunItems.push(item);
}

function dedupeRebuildItems(items: JsTemplateUsageRebuildItem[]): JsTemplateUsageRebuildItem[] {
  const seen = new Set<string>();
  const output: JsTemplateUsageRebuildItem[] = [];
  for (const item of items) {
    const key = `${item.action}:${item.ownerLocatorHash}:${item.projectId || ''}:${item.templateId || ''}:${
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

function incrementStatus(summary: UsageUpsertSummary, status: JsTemplateUsageResolvedStatus): void {
  summary.statusCounts[status] = (summary.statusCounts[status] || 0) + 1;
}

function mergeStatusCounts(
  summary: UsageUpsertSummary,
  statusCounts: JsTemplateUsageRebuildResult['statusCounts'],
): void {
  for (const [status, count] of Object.entries(statusCounts)) {
    const normalizedStatus = normalizeStatus(status);
    summary.statusCounts[normalizedStatus] = (summary.statusCounts[normalizedStatus] || 0) + (count || 0);
  }
}

function buildInputOwnerLocatorHash(input: {
  ownerLocator?: Partial<JsTemplateUsageOwnerLocator>;
}): string | undefined {
  const ownerLocator = normalizeOwnerLocator(input.ownerLocator);
  if (ownerLocator) {
    return hashOwnerLocator(ownerLocator);
  }
  const modelUid = normalizeString(input.ownerLocator?.modelUid);
  return modelUid ? hashOwnerLocator(buildFlowModelOwnerLocator(JS_BLOCK_USAGE_OWNER_ADAPTER, modelUid)) : undefined;
}

function getRebuildRootUid(ownerLocator: JsTemplateUsageOwnerLocator | null): string {
  if (!ownerLocator) {
    return '';
  }
  const adapter = getUsageOwnerAdapterByOwnerKind(ownerLocator.kind);
  if (!adapter) {
    return '';
  }
  return normalizeString(ownerLocator.modelUid);
}

function mergeSettingsForUsageHash(
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const output = cloneRecord(defaults);

  for (const [key, value] of Object.entries(overrides)) {
    const currentValue = output[key];
    if (isPlainRecord(currentValue) && isPlainRecord(value)) {
      output[key] = mergeSettingsForUsageHash(currentValue, value);
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
