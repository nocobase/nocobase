/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { theme as antdTheme, type ThemeConfig } from 'antd';
import { useEffect, useState } from 'react';
import { useApp } from '../hooks/useApp';

/** 设置中心主题在 `themeConfig` 表里的固定标识，见 plugin-theme-editor 的 builtinThemes */
export const SETTINGS_THEME_UID = 'settings';

const ALGORITHMS = {
  defaultAlgorithm: antdTheme.defaultAlgorithm,
  darkAlgorithm: antdTheme.darkAlgorithm,
  compactAlgorithm: antdTheme.compactAlgorithm,
};

/**
 * 把库里存的 algorithm 名字换成 antd 的算法函数。
 *
 * 主题记录里存的是字符串（JSON 存不下函数），可能是单个也可能是数组。
 *
 * @param {unknown} value 库里存的 algorithm 字段
 * @returns {ThemeConfig['algorithm'] | undefined} antd 算法
 */
function toAlgorithm(value: unknown): ThemeConfig['algorithm'] | undefined {
  const names = (Array.isArray(value) ? value : [value]).filter((name): name is keyof typeof ALGORITHMS =>
    Boolean(name && typeof name === 'string' && ALGORITHMS[name]),
  );

  if (!names.length) {
    return undefined;
  }

  return names.length === 1 ? ALGORITHMS[names[0]] : names.map((name) => ALGORITHMS[name]);
}

/**
 * 读取设置中心主题。
 *
 * 设置中心的外观由 `themeConfig` 里 uid 为 `settings` 的那条记录约束，在主题编辑器里就能改。
 * 读不到（主题编辑器插件没启、老实例还没迁移、请求失败）时返回 `null`，
 * 由调用方回落到代码里的默认中性配色，避免设置中心突然变回一片蓝。
 *
 * @returns {ThemeConfig | null | undefined} 主题配置；`undefined` 表示还没读完
 */
export function useSettingsThemeConfig(): ThemeConfig | null | undefined {
  const app = useApp();
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await app.apiClient.request({
          resource: 'themeConfig',
          action: 'list',
          params: { paginate: false },
        });
        const items: any[] = response?.data?.data || [];
        const matched = items.find((item) => item?.uid === SETTINGS_THEME_UID);
        const config = matched?.config;

        if (cancelled) {
          return;
        }

        if (!config) {
          setThemeConfig(null);
          return;
        }

        setThemeConfig({
          token: config.token,
          components: config.components,
          algorithm: toAlgorithm(config.algorithm),
        });
      } catch (error) {
        if (!cancelled) {
          setThemeConfig(null);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [app.apiClient]);

  return themeConfig;
}
