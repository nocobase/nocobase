/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { EChartsGlobalConfig } from '../../hooks/useEChartsGlobalConfig';

/**
 * ECharts 全局配置的持久化。
 *
 * 这是**用户级个性化配置**（不是平台级 admin 设置），真值即 localStorage：
 *   - 每个用户在自己浏览器里保存，互不共享；
 *   - 保存后刷新仍在，settings 页通过 useSetEChartsGlobalConfig() 即时刷新图表。
 *
 * 仅持久化可序列化字段（theme / option），onRefReady 这类函数不落盘。
 */

const STORAGE_KEY = 'nocobase:plugin-data-visualization:echarts-global-config';

type PersistedConfig = Pick<EChartsGlobalConfig, 'theme' | 'option'>;

export function loadStoredEChartsConfig(): PersistedConfig | undefined {
  if (typeof window === 'undefined' || !window.localStorage) {
    return undefined;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as PersistedConfig;
    }
    return undefined;
  } catch {
    // 损坏的 JSON / 隐私模式禁读等，静默降级为无持久化
    return undefined;
  }
}

export function saveStoredEChartsConfig(config: EChartsGlobalConfig): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('localStorage is not available');
  }
  const persisted: PersistedConfig = { theme: config.theme, option: config.option };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
}
