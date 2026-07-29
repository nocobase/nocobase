/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useACLSnippets } from '../acl';
import { useApp } from '../hooks/useApp';
import type { PluginSettingsPageType } from '../PluginSettingsManager';
import { getSettingsGroupKey, groupTopLevelSettings, type SettingsGroupKey } from './groups';
import {
  createSettingsPathMap,
  filterRenderableSettings,
  filterVisibleSettings,
  findFirstInternalSettingsPage,
  matchSettingsRoute,
  PLUGIN_MANAGER_SETTING_NAME,
  sortTopLevelSettings,
} from './utils';

/**
 * 设置中心分组导航的共享状态。
 *
 * 顶栏一级导航和左侧栏二三级菜单都从这里取数据，保证两边永远一致：
 * 同一份可见配置树、同一套分组规则、同一个「当前分组」判定。
 */
export function useSettingsGroups() {
  const app = useApp();
  const location = useLocation();
  const snippets = useACLSnippets();

  const allSettings = useMemo(
    () => filterRenderableSettings(app.pluginSettingsManager.getList(false) as PluginSettingsPageType[]),
    [app.pluginSettingsManager],
  );

  const visibleSettings = useMemo(() => {
    const list = filterVisibleSettings(
      filterRenderableSettings(app.pluginSettingsManager.getList(true) as PluginSettingsPageType[]),
    );
    return sortTopLevelSettings(
      list.filter((item) => item.name !== PLUGIN_MANAGER_SETTING_NAME || snippets.includes('pm')),
    );
  }, [app.pluginSettingsManager, snippets]);

  const groups = useMemo(() => groupTopLevelSettings(visibleSettings), [visibleSettings]);

  const registeredSettingsMapByPath = useMemo(() => createSettingsPathMap(allSettings), [allSettings]);

  const currentSetting = useMemo(
    () => matchSettingsRoute(registeredSettingsMapByPath, location.pathname),
    [location.pathname, registeredSettingsMapByPath],
  );

  const currentTopLevelSetting = useMemo(() => {
    if (!currentSetting) {
      return null;
    }
    return allSettings.find((item) => item.name === currentSetting.topLevelName) || currentSetting;
  }, [allSettings, currentSetting]);

  const activeGroupKey = useMemo<SettingsGroupKey | null>(() => {
    if (!currentTopLevelSetting) {
      return groups[0]?.key ?? null;
    }
    const key = getSettingsGroupKey(currentTopLevelSetting);
    return groups.some((group) => group.key === key) ? key : groups[0]?.key ?? null;
  }, [currentTopLevelSetting, groups]);

  const activeGroup = useMemo(() => groups.find((group) => group.key === activeGroupKey), [activeGroupKey, groups]);
  const activeGroupSettings = activeGroup?.settings ?? [];
  /** 当前分组的分割线位置：画在第几项之后，0 表示不画 */
  const activeGroupLeadCount = activeGroup?.leadCount ?? 0;

  /**
   * 计算某个分组被点击后的落点。
   *
   * @param {string} groupKey 分组 key
   * @returns {string | undefined} 该分组内第一个可内部打开的页面路径
   */
  const getGroupEntryPath = useCallback(
    (groupKey: string) => {
      const group = groups.find((item) => item.key === groupKey);
      if (!group) {
        return undefined;
      }
      return findFirstInternalSettingsPage(group.settings)?.path;
    },
    [groups],
  );

  return {
    activeGroupKey,
    activeGroupLeadCount,
    activeGroupSettings,
    allSettings,
    currentSetting,
    currentTopLevelSetting,
    getGroupEntryPath,
    groups,
    visibleSettings,
  };
}
