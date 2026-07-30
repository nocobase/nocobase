/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 判断当前跑的是不是设置中心那个壳。
 *
 * 插件用它来决定某个入口要不要出现在设置中心里，不用 import `SettingsApplication`
 * 本身——那会让插件反向依赖壳的实现。
 *
 * @param {any} app 应用实例
 * @returns {boolean} 是设置中心返回 true
 */
export function isSettingsApp(app?: any): boolean {
  return Boolean(app?.isSettingsApp);
}
