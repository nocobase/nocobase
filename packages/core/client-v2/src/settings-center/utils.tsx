/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Outlet } from 'react-router-dom';
import type { PluginSettingsPageType } from '../PluginSettingsManager';

export const ADMIN_SETTINGS_LAYOUT_MODEL_UID = 'admin-settings-layout-model';
export const PLUGIN_MANAGER_SETTING_NAME = 'plugin-manager';
export const SYSTEM_SETTINGS_SETTING_NAME = 'system-settings';

/**
 * 判断配置项是否拥有可直接渲染的页面。
 *
 * @param {PluginSettingsPageType | null | undefined} setting 当前配置项
 * @returns {boolean} 是否可直接打开
 */
export function hasOwnSettingsPage(setting?: PluginSettingsPageType | null) {
  if (!setting) {
    return false;
  }

  return !!setting.link || !!setting.componentLoader || (!!setting.Component && setting.Component !== Outlet);
}

/**
 * 递归移除没有页面也没有子项的占位配置。
 *
 * @param {PluginSettingsPageType[]} settings 原始配置树
 * @returns {PluginSettingsPageType[]} 过滤后的配置树
 */
export function filterRenderableSettings(settings: readonly PluginSettingsPageType[] = []): PluginSettingsPageType[] {
  return settings
    .map((setting) => {
      const children = filterRenderableSettings(setting.children || []);

      if (!hasOwnSettingsPage(setting) && children.length === 0) {
        return null;
      }

      return {
        ...setting,
        children: children.length ? children : undefined,
      };
    })
    .filter(Boolean) as PluginSettingsPageType[];
}

/**
 * 过滤出可用于导航展示的 settings。
 *
 * 该过程会移除 hidden 项，并继续清理没有可见页面的空 menu。
 *
 * @param {PluginSettingsPageType[]} settings 原始配置树
 * @returns {PluginSettingsPageType[]} 可见配置树
 */
export function filterVisibleSettings(settings: readonly PluginSettingsPageType[] = []): PluginSettingsPageType[] {
  return settings
    .filter((setting) => !setting.hidden)
    .map((setting) => {
      const children = filterVisibleSettings((setting.children || []) as PluginSettingsPageType[]);

      if (!hasOwnSettingsPage(setting) && children.length === 0) {
        return null;
      }

      return {
        ...setting,
        children: children.length ? children : undefined,
      };
    })
    .filter(Boolean) as PluginSettingsPageType[];
}

/**
 * 对顶级 settings 菜单做稳定排序。
 *
 * @param {PluginSettingsPageType[]} settings 顶级配置项
 * @returns {PluginSettingsPageType[]} 排序后的顶级配置项
 */
export function sortTopLevelSettings(settings: PluginSettingsPageType[] = []) {
  return [...settings].sort((a, b) => {
    if (a.name === SYSTEM_SETTINGS_SETTING_NAME && b.name !== SYSTEM_SETTINGS_SETTING_NAME) {
      return -1;
    }
    if (b.name === SYSTEM_SETTINGS_SETTING_NAME && a.name !== SYSTEM_SETTINGS_SETTING_NAME) {
      return 1;
    }
    if ((a.sort || 0) !== (b.sort || 0)) {
      return (a.sort || 0) - (b.sort || 0);
    }
    return (a.name || '').localeCompare(b.name || '');
  });
}

/**
 * 将 settings 树压平为路径索引，供动态路由匹配使用。
 *
 * @param {PluginSettingsPageType[]} settings 过滤后的配置树
 * @returns {Record<string, PluginSettingsPageType>} 路径索引
 */
export function createSettingsPathMap(settings: readonly PluginSettingsPageType[] = []) {
  const pathMap: Record<string, PluginSettingsPageType> = {};

  const traverse = (items: readonly PluginSettingsPageType[]) => {
    items.forEach((item) => {
      pathMap[item.path] = item;
      if (item.children?.length) {
        traverse(item.children);
      }
    });
  };

  traverse(settings);

  return pathMap;
}

/**
 * 按路径查找当前命中的配置项，支持 `:param` 动态段。
 *
 * @param {Record<string, PluginSettingsPageType>} data 路径索引
 * @param {string} url 当前地址
 * @returns {PluginSettingsPageType | null} 命中的配置项
 */
export function matchSettingsRoute(data: Record<string, PluginSettingsPageType>, url: string) {
  const paths = Object.keys(data);

  if (data[url]) {
    return data[url];
  }

  for (const pattern of paths) {
    const regexPattern = pattern.replace(/:[^/]+/g, '([^/]+)');
    if (url.match(new RegExp(`^${regexPattern}$`))) {
      return data[pattern];
    }
  }

  return null;
}

/**
 * 用实际路由参数替换 settings path 中的动态段。
 *
 * @param {string} urlTemplate 原始 settings 路由模板
 * @param {Record<string, string>} params 当前路由参数
 * @returns {string} 替换后的目标地址
 */
export function replaceRouteParams(urlTemplate: string, params?: Record<string, string>) {
  return urlTemplate.replace(/:\w+/g, (match) => {
    const paramName = match.substring(1);
    return params?.[paramName] || match;
  });
}

/**
 * 递归查找某个配置项树中的第一个内部页面。
 *
 * @param {PluginSettingsPageType[]} settings 配置树
 * @returns {PluginSettingsPageType | null} 第一个可内部打开的页面
 */
export function findFirstInternalSettingsPage(
  settings: readonly PluginSettingsPageType[] = [],
): PluginSettingsPageType | null {
  for (const setting of settings) {
    if (setting.children?.length) {
      const firstChild = findFirstInternalSettingsPage(setting.children);
      if (firstChild) {
        return firstChild;
      }
    }

    if (hasOwnSettingsPage(setting) && !setting.link) {
      return setting;
    }
  }

  return null;
}

/**
 * 查找指定名称的配置项。
 *
 * @param {PluginSettingsPageType[]} settings 配置树
 * @param {string} name 配置项名称
 * @returns {PluginSettingsPageType | null} 命中的配置项
 */
export function findSettingsByName(
  settings: readonly PluginSettingsPageType[] = [],
  name: string,
): PluginSettingsPageType | null {
  for (const setting of settings) {
    if (setting.name === name) {
      return setting;
    }
    if (setting.children?.length) {
      const child = findSettingsByName(setting.children, name);
      if (child) {
        return child;
      }
    }
  }

  return null;
}

/**
 * 为 settings 首页计算默认落点。
 *
 * @param {PluginSettingsPageType[]} settings 当前可访问配置树
 * @returns {string | undefined} 默认跳转路径
 */
export function getDefaultSettingsPath(settings: readonly PluginSettingsPageType[] = []) {
  const preferredNames = [SYSTEM_SETTINGS_SETTING_NAME, PLUGIN_MANAGER_SETTING_NAME];

  for (const name of preferredNames) {
    const preferred = findSettingsByName(settings, name);
    if (!preferred) {
      continue;
    }

    if (hasOwnSettingsPage(preferred) && !preferred.link) {
      return preferred.path;
    }

    const preferredChildPath = findFirstInternalSettingsPage(preferred.children as PluginSettingsPageType[])?.path;
    if (preferredChildPath) {
      return preferredChildPath;
    }
  }

  return findFirstInternalSettingsPage(settings)?.path;
}

/**
 * 把 settings 结构转换成 antd Menu items。
 *
 * @param {PluginSettingsPageType[]} settings 目标配置项
 * @returns {any[] | undefined} Menu items
 */
export function getMenuItems(settings: readonly PluginSettingsPageType[] = []) {
  const pinnedList = settings.filter((item) => item.isPinned && !item.hidden);
  const otherList = settings.filter((item) => !item.isPinned && !item.hidden);
  const items: any[] = [];

  if (pinnedList.length) {
    items.push(...pinnedList, { type: 'divider' });
  }

  if (otherList.length) {
    items.push(...otherList);
  }

  if (items.length === 0) {
    return undefined;
  }

  return items.map((item: any) => {
    if (item.type === 'divider') {
      return { type: 'divider' };
    }

    return {
      key: item.name,
      label: item.label,
      title: item.title,
      icon: item.icon,
      children: item.children?.length ? getMenuItems(item.children) : undefined,
    };
  });
}
