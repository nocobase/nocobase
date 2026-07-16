/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext, useMemo } from 'react';
import mergeWith from 'lodash/mergeWith';
import isPlainObject from 'lodash/isPlainObject';
import * as echarts from 'echarts';
import type { EChartsOption, EChartsType } from 'echarts';
// 必须从 @nocobase/client-v2 取全局主题（v2 运行时），
// 不能从 @nocobase/client（v1）导入 —— v2 客户端禁止反向依赖 v1。
// client-v2 内已有先例：flow/components/CodeEditor.tsx 即如此使用。
import { useGlobalTheme } from '@nocobase/client-v2';

export interface EChartsGlobalConfig {
  /**
   * 全局 ECharts option 配置。
   * 与每个 <ECharts> 的本地 option 做深度合并，全局作为底，本地覆盖。
   * 合并规则（见 mergeOption）：
   *   - 纯对象：递归深合并
   *   - 数组：整组替换（color / series / dataset.source 等不被拼接）
   *   - 原始值：本地覆盖全局
   */
  option?: EChartsOption;
  /**
   * 全局默认 echarts 主题名。
   * 当本地未传 theme 且 antd 非 dark 时，回退到该值（通常为 undefined = echarts 默认浅色）。
   */
  theme?: string;
  /**
   * 全局 onRefReady 回调。
   * 在每个 ECharts 实例初始化后调用，先于本地 onRefReady 执行。
   */
  onRefReady?: (chart: EChartsType) => void;
}

// echarts 没有内建 dark 主题，必须 register 一次才能 echarts.init(el, 'nocobase-dark')。
// 模块级只执行一次。
let darkThemeRegistered = false;
function ensureDarkThemeRegistered() {
  if (darkThemeRegistered) {
    return;
  }
  darkThemeRegistered = true;
  echarts.registerTheme('nocobase-dark', {
    backgroundColor: 'transparent',
    textStyle: { color: '#d0d0d0' },
    title: { textStyle: { color: '#d0d0d0' } },
    legend: { textStyle: { color: '#d0d0d0' } },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.75)',
      borderColor: '#555',
      textStyle: { color: '#fff' },
    },
  });
}

// 模块级执行一次，确保在任何 <ECharts> 实例初始化之前 dark theme 已注册。
// 不能只放在 EChartsConfigProvider 里——无 Provider 时 useEChartsTheme 也会推导出
// 'nocobase-dark'，若未注册则 echarts.init(el, 'nocobase-dark') 会静默回退浅色。
ensureDarkThemeRegistered();

const EChartsConfigContext = createContext<EChartsGlobalConfig | undefined>(undefined);
EChartsConfigContext.displayName = 'EChartsConfigContext';

export interface EChartsConfigProviderProps {
  value: EChartsGlobalConfig;
  children: React.ReactNode;
}

export const EChartsConfigProvider: React.FC<EChartsConfigProviderProps> = ({ value, children }) => {
  // 仅当字段引用变化时才更新 context 值，避免父组件每次 render 都触发全树重渲染。
  // 提示：调用方应 memo 化 value（见下方示例），否则每次 render 仍会重渲消费者。
  const stableValue = useMemo(
    () => value,
    [value.option, value.theme, value.onRefReady],
  );
  return React.createElement(EChartsConfigContext.Provider, { value: stableValue }, children);
};

export function useEChartsGlobalConfig(): EChartsGlobalConfig {
  return useContext(EChartsConfigContext) ?? {};
}

/**
 * 推导最终 echarts 主题名，优先级：
 *   1. 本地 theme prop 显式传入 → 最高
 *   2. 全局 config.theme → 其次
 *   3. 继承 antd 全局主题（useGlobalTheme().isDarkTheme）→ dark 用 'nocobase-dark'，light 用 undefined（echarts 默认浅色）
 *
 * 用 ?? 而非 ||：theme='' 表示「显式清空全局主题」（echarts 对 '' 等同无主题，不报错），
 * 不应被 falsy 回退吞掉；想继承全局就传 undefined。
 */
export function useEChartsTheme(themeProp?: string): string | undefined {
  const { isDarkTheme } = useGlobalTheme();
  const { theme: globalTheme } = useEChartsGlobalConfig();
  return themeProp ?? globalTheme ?? (isDarkTheme ? 'nocobase-dark' : undefined);
}

/**
 * 深度合并 ECharts option。
 *
 * 合并规则：
 *   - 纯对象：递归深合并
 *   - 数组：srcValue（local）整组替换（不拼接）
 *   - 其他原始值：srcValue 覆盖
 *
 * @param base     全局 option（底）
 * @param override 本地 option（覆盖层）
 */
export function mergeOption(base: EChartsOption | undefined, override: EChartsOption): EChartsOption {
  if (!base) {
    return override;
  }
  return mergeWith({}, base, override, (objValue: unknown, srcValue: unknown) => {
    if (Array.isArray(srcValue)) {
      return srcValue;
    }
    if (!isPlainObject(srcValue)) {
      return srcValue;
    }
    return undefined;
  });
}
