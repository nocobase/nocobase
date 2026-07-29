/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { PluginSettingsPageType } from '../PluginSettingsManager';
import { useSettingsGroups } from './useSettingsGroups';
import { hasOwnSettingsPage } from './utils';

const RECENT_STORAGE_KEY = 'nb-settings-recent';
const RECENT_MAX = 5;

export type SettingsSearchItem = {
  /** 配置项名称，同时用作最近访问的存储标识 */
  name: string;
  title: string;
  /** 分组名 + 上级菜单名，用于在结果里给出上下文 */
  breadcrumb: string;
  path: string;
  /** 外链配置项跳转到站外 */
  link?: string;
  icon?: ReactNode;
  /** 预先拼好并转小写的匹配文本 */
  searchText: string;
};

/**
 * 读取最近访问过的配置项名称。
 *
 * 存的是名称而不是整个配置项：插件卸载、改名、权限收回之后，解析不到的记录会自然消失。
 *
 * @returns {string[]} 由近到远的配置项名称
 */
function readRecentNames(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed)) {
      return [];
    }
    // 存量数据可能是别的版本写的，统一在读取处去重并截断，别让脏数据一直传下去。
    return [...new Set(parsed.filter((item): item is string => typeof item === 'string' && !!item))].slice(
      0,
      RECENT_MAX,
    );
  } catch (error) {
    return [];
  }
}

/**
 * 把一次访问记到最近列表最前面。
 *
 * @param {string} name 配置项名称
 * @returns {string[]} 写入后的名称列表
 */
function writeRecentName(name: string): string[] {
  const next = [name, ...readRecentNames().filter((item) => item !== name)].slice(0, RECENT_MAX);

  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    // 隐私模式下 localStorage 会抛异常，最近访问是锦上添花，静默降级即可。
  }

  return next;
}

/**
 * 取配置项标题的纯文本形式。
 *
 * `title` 类型上是 ReactNode，实际都是 i18n 出来的字符串；拿不到字符串时退回名称。
 *
 * @param {PluginSettingsPageType} setting 配置项
 * @returns {string} 可用于展示和匹配的标题
 */
function getSettingTitleText(setting: PluginSettingsPageType): string {
  return typeof setting.title === 'string' ? setting.title : setting.name;
}

/**
 * 设置中心的搜索与最近访问。
 *
 * 一级分组只剩五个、二三级收进左侧栏之后，深层页面变得不好够；这里把整棵可见配置树拍平成
 * 一份可搜索的清单，并记住最近去过的几个，作为搜索框的空态。
 *
 * @returns 搜索清单、匹配函数、最近访问项，以及记录访问的回调
 */
export function useSettingsSearch() {
  const { t } = useTranslation();
  const { groups, currentSetting } = useSettingsGroups();
  const [recentNames, setRecentNames] = useState<string[]>(() => readRecentNames());

  const items = useMemo<SettingsSearchItem[]>(() => {
    const result: SettingsSearchItem[] = [];

    const walk = (setting: PluginSettingsPageType, groupTitle: string, ancestorTitles: string[]) => {
      const title = getSettingTitleText(setting);
      const selfHasPage = hasOwnSettingsPage(setting);

      if (selfHasPage) {
        // 上级里跟自己同名的那一层（典型是承载默认内容的 index 子页）没有信息量，去掉。
        const breadcrumb = [groupTitle, ...ancestorTitles.filter((item) => item !== title)].join(' / ');

        result.push({
          name: setting.name,
          title,
          breadcrumb,
          path: setting.path,
          link: setting.link,
          icon: setting.icon,
          searchText: [title, breadcrumb, setting.name].join(' ').toLowerCase(),
        });
      }

      const childAncestors = [...ancestorTitles, title];
      setting.children?.forEach((child) => {
        const childSetting = child as PluginSettingsPageType;

        // 插件常用一个与菜单同名的 index 子页承载默认内容（`addPageTabItem({ key: 'index' })`），
        // 它和菜单本身指向同一件事，只在菜单没有自己的页面时才需要作为入口出现。
        if (selfHasPage && getSettingTitleText(childSetting) === title) {
          return;
        }

        walk(childSetting, groupTitle, childAncestors);
      });
    };

    groups.forEach((group) => {
      const groupTitle = t(group.title);
      group.settings.forEach((setting) => walk(setting, groupTitle, []));
    });

    return result;
  }, [groups, t]);

  const search = useCallback(
    (keyword: string) => {
      const normalized = keyword.trim().toLowerCase();

      if (!normalized) {
        return [];
      }

      // 空格分词后全部命中才算匹配，方便用「用户 角色」这种写法逐步收窄。
      const terms = normalized.split(/\s+/);
      return items.filter((item) => terms.every((term) => item.searchText.includes(term)));
    },
    [items],
  );

  const recentItems = useMemo(
    () => recentNames.map((name) => items.find((item) => item.name === name)).filter(Boolean) as SettingsSearchItem[],
    [items, recentNames],
  );

  // 当前停留的页面即为一次访问；由所在页面自身触发，避免每个入口都要记一次。
  useEffect(() => {
    if (!currentSetting?.name) {
      return;
    }
    setRecentNames(writeRecentName(currentSetting.name));
  }, [currentSetting?.name]);

  return { items, recentItems, search };
}
