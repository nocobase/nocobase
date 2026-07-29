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
export type SettingsGroupKey = 'applications' | 'plugins' | 'system';

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
 * 顶栏只留两个独立入口 + 一个「系统设置」大分组。
 *
 * 应用和插件管理是日常高频、且各自只有一个页面，铺成一级入口；
 * 其余配置全部收进系统设置，靠左栏和顶栏悬浮下拉展开。
 */
export const SETTINGS_GROUPS: SettingsGroupDefinition[] = [
  { key: 'applications', title: 'Applications', primary: 'multi-portal' },
  { key: 'plugins', title: 'Plugin manager', primary: 'plugin-manager' },
  { key: 'system', title: 'System settings' },
];

export const DEFAULT_SETTINGS_GROUP: SettingsGroupKey = 'system';

/**
 * 系统设置分组里排在最前面的四项。
 *
 * 这四个是体量最大的功能模块，和后面的零散配置之间用一条分割线隔开。
 */
export const SYSTEM_GROUP_LEAD_NAMES = ['data-source-manager', 'users-permissions', 'workflow', 'ai'];

/**
 * 内置配置项到分组的映射。
 *
 * key 为 `pluginSettingsManager.addMenuItem` 时传入的 `key`；
 * 没列出来的一律落到系统设置，第三方插件不改代码也能出现。
 */
const BUILTIN_SETTINGS_GROUP_MAP: Record<string, SettingsGroupKey> = {
  'multi-portal': 'applications',
  'plugin-manager': 'plugins',
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
 * 把系统设置分组重排成「四个主模块 + 其余」。
 *
 * @param {PluginSettingsPageType[]} members 系统设置分组下的配置项
 * @returns {{ settings: PluginSettingsPageType[]; leadCount: number }} 重排后的列表，以及分割线该画在第几项之后
 */
function orderSystemGroup(members: PluginSettingsPageType[]) {
  const lead = SYSTEM_GROUP_LEAD_NAMES.map((name) => members.find((item) => item.name === name)).filter(
    Boolean,
  ) as PluginSettingsPageType[];
  const leadNames = new Set(lead.map((item) => item.name));
  const rest = members.filter((item) => !leadNames.has(item.name));

  return { settings: [...lead, ...rest], leadCount: rest.length ? lead.length : 0 };
}

/**
 * 按分组切分顶级配置项，并丢掉没有任何配置项的空分组。
 *
 * `leadCount` 大于 0 时表示这一组要在第 `leadCount` 项之后画一条分割线。
 *
 * @param {PluginSettingsPageType[]} settings 已排序的顶级配置项
 * @returns 非空分组
 */
export function groupTopLevelSettings(settings: readonly PluginSettingsPageType[] = []) {
  return SETTINGS_GROUPS.map((group) => {
    const members = settings.filter((setting) => getSettingsGroupKey(setting) === group.key);

    if (group.key === 'system') {
      return { ...group, ...orderSystemGroup(members) };
    }

    const primaryIndex = group.primary ? members.findIndex((item) => item.name === group.primary) : -1;

    return {
      ...group,
      leadCount: 0,
      settings:
        primaryIndex > 0
          ? [members[primaryIndex], ...members.slice(0, primaryIndex), ...members.slice(primaryIndex + 1)]
          : members,
    };
  }).filter((group) => group.settings.length > 0);
}
