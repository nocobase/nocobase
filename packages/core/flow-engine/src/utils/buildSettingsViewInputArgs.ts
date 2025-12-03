/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModel } from '../models';

/**
 * 统一构造设置弹窗 openView 的 inputArgs：
 * - 以当前视图的 inputArgs 为基准
 * - navigation：父视图 navigation 或传入的 navigationOverride
 */
export function buildSettingsViewInputArgs(
  model: FlowModel,
  extra?: Record<string, any>,
  options?: { navigationOverride?: any },
): Record<string, any> {
  const defaults: Record<string, any> = {};
  // 基于当前视图 inputArgs 直接透传，作为唯一来源
  const viewArgs = (model.context.view?.inputArgs || {}) as Record<string, any>;
  Object.assign(defaults, viewArgs);

  // 导航（用于推断“上级弹窗”）
  const nav = options?.navigationOverride ?? model.context.view?.navigation;
  if (nav) {
    defaults.navigation = nav;
  }

  return { ...defaults, ...(extra || {}) };
}
