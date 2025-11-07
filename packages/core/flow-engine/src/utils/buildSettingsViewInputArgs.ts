/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel } from '../models';
import { inferRecordRef } from './variablesParams';

/**
 * 统一构造设置弹窗 openView 的 inputArgs：
 * - collectionName/dataSourceKey/filterByTk：优先从 model.context 推断；否则回退父视图 inputArgs
 * - sourceId：优先从 resource.getSourceId()；否则回退父视图 inputArgs
 * - associationName：来自 association.resourceName 或 resource.getResourceName()
 * - navigation：父视图 navigation 或传入的 navigationOverride
 */
export function buildSettingsViewInputArgs(
  model: FlowModel,
  extra?: Record<string, any>,
  options?: { navigationOverride?: any },
): Record<string, any> {
  const defaults: Record<string, any> = {};

  try {
    // 1) 当前记录/集合
    const ref = inferRecordRef((model as any).context);
    if (ref?.collection) {
      defaults.collectionName = ref.collection;
      defaults.dataSourceKey = ref.dataSourceKey || 'main';
      defaults.filterByTk = ref.filterByTk;
    }

    // 2) 回退父视图 inputArgs（如在抽屉/页面中）
    const parentArgs = (model as any)?.context?.view?.inputArgs || {};
    if (!defaults.collectionName && parentArgs?.collectionName) {
      defaults.collectionName = parentArgs.collectionName;
      defaults.dataSourceKey = parentArgs.dataSourceKey || defaults.dataSourceKey || 'main';
    }
    if (defaults.filterByTk == null && parentArgs?.filterByTk != null) {
      defaults.filterByTk = parentArgs.filterByTk;
    }
    if (defaults.sourceId == null && parentArgs?.sourceId != null) {
      defaults.sourceId = parentArgs.sourceId;
    }

    // 3) 导航（用于推断“上级弹窗”）
    const nav = options?.navigationOverride ?? (model as any)?.context?.view?.navigation;
    if (nav) {
      defaults.navigation = nav;
    }

    // 4) 直接从资源读取 sourceId（优先级高于父视图）
    const sid = (model as any)?.context?.resource?.getSourceId?.();
    if (sid !== undefined && sid !== null && String(sid) !== '') {
      defaults.sourceId = sid;
    }

    // 5) 关联名（用于“上级记录”）
    const assocName =
      (model as any)?.context?.association?.resourceName || (model as any)?.context?.resource?.getResourceName?.();
    if (typeof assocName === 'string' && assocName) {
      defaults.associationName = assocName;
    }
  } catch (_) {
    // 忽略推断异常
  }

  return { ...defaults, ...(extra || {}) };
}
