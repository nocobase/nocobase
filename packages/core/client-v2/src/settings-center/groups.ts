/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { PluginSettingsPageType } from '../PluginSettingsManager';

/**
 * Settings 顶层分组。
 *
 * 顶栏铺一级（分组），左侧栏铺该分组下的二级 / 三级菜单。
 * 分组归属优先取配置项自身的 `group` 字段，其次落到内置映射表，最后兜底到 `system`，
 * 因此第三方插件不改代码也能出现在设置中心里。
 */
export type SettingsGroupKey = 'applications' | 'plugins' | 'data' | 'access' | 'automation' | 'ai' | 'system';

export type SettingsGroupDefinition = {
  key: SettingsGroupKey;
  /** 未翻译的分组标题，交由调用方过 i18n */
  title: string;
  /**
   * 分组的门面配置项。
   *
   * 它会被排到该分组的第一位，并作为点击顶栏分组时的落点；
   * 不存在（插件没装 / 无权限）时自然退回到分组内的第一项。
   */
  primary?: string;
};

/**
 * 顶栏铺六个独立入口 + 一个「其他设置」兜底分组。
 *
 * 前六个各自只有一个配置项、且都是日常高频，直接当一级入口（标题取配置项自己的名字，
 * 顺带继承插件的翻译）；其余零散配置全部收进其他设置，靠左栏和悬浮下拉展开。
 *
 * 兜底分组不叫「系统设置」：它下面本来就有一个同名的配置项（站点标题、logo 那个），
 * 分组和子项重名会让人以为点进去是同一个东西。
 */
export const SETTINGS_GROUPS: SettingsGroupDefinition[] = [
  { key: 'applications', title: 'Applications', primary: 'multi-portal' },
  { key: 'data', title: 'Data sources', primary: 'data-source-manager' },
  { key: 'access', title: 'Users & Permissions', primary: 'users-permissions' },
  { key: 'automation', title: 'Workflow', primary: 'workflow' },
  { key: 'ai', title: 'AI employees', primary: 'ai' },
  { key: 'plugins', title: 'Plugin manager', primary: 'plugin-manager' },
  { key: 'system', title: 'Other settings' },
];

export const DEFAULT_SETTINGS_GROUP: SettingsGroupKey = 'system';

/**
 * 内置配置项到分组的映射。
 *
 * key 为 `pluginSettingsManager.addMenuItem` 时传入的 `key`；
 * 没列出来的一律落到其他设置，第三方插件不改代码也能出现。
 */
const BUILTIN_SETTINGS_GROUP_MAP: Record<string, SettingsGroupKey> = {
  'multi-portal': 'applications',
  'plugin-manager': 'plugins',
  'data-source-manager': 'data',
  'users-permissions': 'access',
  workflow: 'automation',
  ai: 'ai',
};

/**
 * 解析某个顶级配置项所属的分组。
 *
 * @param {PluginSettingsPageType | null | undefined} setting 顶级配置项
 * @returns {SettingsGroupKey} 分组 key
 */
export function getSettingsGroupKey(setting?: PluginSettingsPageType | null): SettingsGroupKey {
  if (!setting) {
    return DEFAULT_SETTINGS_GROUP;
  }

  const declared = (setting as PluginSettingsPageType & { group?: string }).group;
  if (declared && SETTINGS_GROUPS.some((group) => group.key === declared)) {
    return declared as SettingsGroupKey;
  }

  return BUILTIN_SETTINGS_GROUP_MAP[setting.name] || DEFAULT_SETTINGS_GROUP;
}

/**
 * 按分组切分顶级配置项，并丢掉没有任何配置项的空分组。
 *
 * @param {PluginSettingsPageType[]} settings 已排序的顶级配置项
 * @returns 非空分组
 */
export function groupTopLevelSettings(settings: readonly PluginSettingsPageType[] = []) {
  return SETTINGS_GROUPS.map((group) => {
    const members = settings.filter((setting) => getSettingsGroupKey(setting) === group.key);
    const primaryIndex = group.primary ? members.findIndex((item) => item.name === group.primary) : -1;

    return {
      ...group,
      settings:
        primaryIndex > 0
          ? [members[primaryIndex], ...members.slice(0, primaryIndex), ...members.slice(primaryIndex + 1)]
          : members,
    };
  }).filter((group) => group.settings.length > 0);
}
