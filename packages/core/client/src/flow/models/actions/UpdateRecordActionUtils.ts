/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MultiRecordResource, SingleRecordResource, resolveRunJSObjectValues } from '@nocobase/flow-engine';
import { dispatchEventDeep } from '../../utils';

export async function refreshLinkageRulesAfterUpdate(ctx: any) {
  if (typeof ctx?.resource?.refresh === 'function') {
    await ctx.resource.refresh();
  }

  const blockModel = ctx?.blockModel || ctx?.model?.context?.blockModel || ctx?.model;
  const actionModel = ctx?.model;
  const syncRecordAccessor = (model: any) => {
    if (!model?.context?.defineProperty || typeof blockModel?.getCurrentRecord !== 'function') return;
    model.context.defineProperty('record', {
      get: () => blockModel.getCurrentRecord(),
      cache: false,
    });
  };
  syncRecordAccessor(ctx?.model);
  if (ctx?.model?.forks && typeof ctx.model.forks.forEach === 'function') {
    ctx.model.forks.forEach((fork: any) => syncRecordAccessor(fork));
  }

  const dispatchRefresh = async () => {
    if (actionModel) {
      await dispatchEventDeep(actionModel, 'paginationChange');
    }
    if (blockModel && blockModel !== actionModel) {
      await dispatchEventDeep(blockModel, 'paginationChange');
    }
  };

  if (blockModel || actionModel) {
    await dispatchRefresh();
    // Some model contexts (especially action forks) sync record references on the next microtask.
    // Re-dispatch once to ensure linkage rules consume the latest record after refresh.
    await Promise.resolve();
    await dispatchRefresh();
    await new Promise((resolve) => setTimeout(resolve, 120));
    await dispatchRefresh();
  }

  if (typeof blockModel?.getCurrentRecord === 'function') {
    const latestRecord = blockModel.getCurrentRecord();
    if (typeof ctx?.defineProperty === 'function') {
      ctx.defineProperty('record', {
        get: () => blockModel.getCurrentRecord(),
        cache: false,
      });
    } else {
      ctx.record = latestRecord;
    }
  }

  // Ensure the current action button itself re-evaluates linkage rules after update.
  // This directly refreshes button linkage even when event-based refresh misses the current action context.
  const raw = actionModel?.getStepParams?.('buttonSettings', 'linkageRules');
  const resolved = ctx?.resolveJsonTemplate
    ? await ctx.resolveJsonTemplate({ value: [], ...(raw || {}) })
    : { value: [], ...(raw || {}) };
  const actionLinkage = ctx?.getAction?.('actionLinkageRules');
  if (actionLinkage?.handler) {
    await actionLinkage.handler(ctx, resolved);
  }
}

export async function applyUpdateRecordAction(
  ctx: any,
  params: any,
  options?: {
    settingsFlowKey?: string;
  },
) {
  const settingsFlowKey = options?.settingsFlowKey || 'assignSettings';

  // 统一接入二次确认：如果启用则弹窗；未配置时默认不启用
  const savedConfirm = ctx.model.getStepParams(settingsFlowKey, 'confirm');
  const confirmParams = savedConfirm && typeof savedConfirm === 'object' ? savedConfirm : { enable: false };
  await ctx.runAction('confirm', confirmParams);

  let assignedValues: Record<string, any> = {};
  try {
    assignedValues = await resolveRunJSObjectValues(ctx, params?.assignedValues);
  } catch (error) {
    console.error('[UpdateRecordAction] RunJS execution failed', error);
    ctx.message.error(ctx.t('RunJS execution failed'));
    return;
  }

  if (!assignedValues || typeof assignedValues !== 'object' || !Object.keys(assignedValues).length) {
    ctx.message.warning(ctx.t('No assigned fields configured'));
    return;
  }
  const collection = ctx.collection?.name;
  const filterByTk = ctx.collection?.getFilterByTK?.(ctx.record);
  if (!collection || typeof filterByTk === 'undefined' || filterByTk === null) {
    ctx.message.error(ctx.t('Record is required to perform this action'));
    return;
  }
  if (ctx.resource instanceof SingleRecordResource) {
    await ctx.resource.save(assignedValues, params.requestConfig);
  } else if (ctx.resource instanceof MultiRecordResource) {
    await ctx.resource.update(filterByTk, assignedValues, params.requestConfig);
  }

  await refreshLinkageRulesAfterUpdate(ctx);
  ctx.message.success(ctx.t('Saved successfully'));
}
