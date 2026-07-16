/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import mergeWith from 'lodash/mergeWith';
import isPlainObject from 'lodash/isPlainObject';
import type { EChartsOption, EChartsType } from 'echarts';
// 必须从 @nocobase/client-v2 取全局主题（v2 运行时），
// 不能从 @nocobase/client（v1）导入 —— v2 客户端禁止反向依赖 v1。
// client-v2 内已有先例：flow/components/CodeEditor.tsx 即如此使用。
import { useGlobalTheme } from '@nocobase/client-v2';
import { ECHARTS_DARK_THEME, ensureEChartsThemesRegistered } from '../flow/echarts/echartsThemes';
import { loadStoredEChartsConfig, saveStoredEChartsConfig } from '../flow/echarts/echartsConfigStorage';

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

// dark / vintage / macarons 等具名主题必须在任何 <ECharts> init 之前注册，
// 否则 echarts.init(el, name) 会静默回退浅色。模块级执行一次。
ensureEChartsThemesRegistered();

interface EChartsConfigContextValue {
  config: EChartsGlobalConfig;
  setConfig: (next: EChartsGlobalConfig) => void;
}

const EChartsConfigContext = createContext<EChartsConfigContextValue | undefined>(undefined);
EChartsConfigContext.displayName = 'EChartsConfigContext';

export interface EChartsConfigProviderProps {
  children: React.ReactNode;
}

/**
 * 运行时全局 ECharts 配置 Provider。
 *
 * 有状态（uncontrolled）：内部用 useState 持有 config，初始值从 localStorage 读取
 * （用户级个性化配置，真值即 localStorage）。暴露 setConfig 供 settings 页写入，
 * setConfig 会同步写回 localStorage 并更新内部 state，使全树 <ECharts> 立即重渲染。
 *
 * 用法（应用根部注入一次；plugin.tsx 已通过 app.use 挂载）：
 * ```tsx
 * <EChartsConfigProvider>
 *   <App />
 * </EChartsConfigProvider>
 * ```
 */
export const EChartsConfigProvider: React.FC<EChartsConfigProviderProps> = ({ children }) => {
  const [config, setConfigState] = useState<EChartsGlobalConfig>(
    () => loadStoredEChartsConfig() ?? {},
  );

  const setConfig = useCallback((next: EChartsGlobalConfig) => {
    setConfigState(next);
    saveStoredEChartsConfig(next);
  }, []);

  const value = useMemo<EChartsConfigContextValue>(() => ({ config, setConfig }), [config, setConfig]);

  return React.createElement(EChartsConfigContext.Provider, { value }, children);
};

/** 读取当前全局 ECharts 配置（无 Provider 时返回空对象，向后兼容）。 */
export function useEChartsGlobalConfig(): EChartsGlobalConfig {
  return useContext(EChartsConfigContext)?.config ?? {};
}

/**
 * 获取修改全局配置的 setter（settings 页用）。
 * 无 Provider 时返回一个 no-op，不抛错。
 */
export function useSetEChartsGlobalConfig(): (next: EChartsGlobalConfig) => void {
  const ctx = useContext(EChartsConfigContext);
  return ctx?.setConfig ?? noop;
}

const noop: (next: EChartsGlobalConfig) => void = () => {};

/**
 * 推导最终 echarts 主题名，优先级：
 *   1. 本地 theme prop 显式传入 → 最高
 *   2. 全局 config.theme → 其次
 *   3. 继承 antd 全局主题（useGlobalTheme().isDarkTheme）→ dark 用 ECHARTS_DARK_THEME，light 用 undefined
 *
 * 用 ?? 而非 ||：theme='' 表示「显式清空全局主题」（echarts 对 '' 等同无主题，不报错），
 * 不应被 falsy 回退吞掉；想继承全局就传 undefined。
 */
export function useEChartsTheme(themeProp?: string): string | undefined {
  const { isDarkTheme } = useGlobalTheme();
  const { theme: globalTheme } = useEChartsGlobalConfig();
  return themeProp ?? globalTheme ?? (isDarkTheme ? ECHARTS_DARK_THEME : undefined);
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
