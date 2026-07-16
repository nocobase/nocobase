/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { forwardRef, useEffect, useRef, useCallback, useMemo, MutableRefObject } from 'react';
import * as echarts from 'echarts';
import type { EChartsType, EChartsOption } from 'echarts';
import { useEChartsGlobalConfig, useEChartsTheme, mergeOption } from '../../hooks';
import './chartBlock.css';

/**
 * 使用示例：
 *
 * 1. Provider 已在 plugin.tsx 通过 app.use(EChartsConfigProvider) 挂在应用根部，
 *    并从 localStorage 读取 admin 在 settings 页保存的配置。运行时修改走
 *    useSetEChartsGlobalConfig()（settings 页即用此路径）：
 * ```tsx
 * const setConfig = useSetEChartsGlobalConfig();
 * setConfig({ theme: 'nocobase-dark', option: { color: ['#5470c6', '#91cc75'] } });
 * ```
 *
 * 2. 任意 <ECharts> 自动合入全局配置，无需重复编写：
 * ```tsx
 * <ECharts option={{ xAxis: { data: ['A', 'B'] }, series: [{ data: [1, 2] }] }} />
 * ```
 * 最终渲染时，option 自动合并为「全局 color + tooltip + grid + 本地 xAxis + series」。
 * 主题自动跟随 antd 全局主题（dark 用注册的 'nocobase-dark'，light 用 echarts 默认浅色），
 * 也可用 <ECharts theme="custom" /> 显式覆盖。
 *
 * 合并规则：纯对象递归深合并，数组整组替换（不拼接）。
 * 优先级：全局 option < 本地 option；本地 theme prop > 全局 theme > antd 主题推导。
 */

interface Props {
  option: EChartsOption;
  style?: React.CSSProperties;
  className?: string;
  theme?: string;
  onRefReady?: (chart: EChartsType) => void;
  fillHeight?: boolean;
}

const ECharts = forwardRef<EChartsType, Props>(({ option, style, className, theme, onRefReady, fillHeight }, ref) => {
  const chartRef = useRef<HTMLDivElement>(null);
  // inner instance ref
  const instanceRef = useRef<EChartsType | null>(null);
  const resizeObserverRef = useRef<ResizeObserver>();

  const globalConfig = useEChartsGlobalConfig();
  const resolvedTheme = useEChartsTheme(theme);

  // 全局 option 作为底，本地 option 覆盖；useMemo 稳定结果，避免无意义重渲染
  const mergedOption = useMemo(() => mergeOption(globalConfig.option, option), [globalConfig.option, option]);

  // onRefReady 存入 ref，init effect 依赖只跟 resolvedTheme 走，
  // 避免回调 identity 变化触发 echarts 反复 dispose / re-create。
  const onRefReadyRef = useRef(onRefReady);
  onRefReadyRef.current = onRefReady;
  const globalOnRefReadyRef = useRef(globalConfig.onRefReady);
  globalOnRefReadyRef.current = globalConfig.onRefReady;

  const handleRefReady = useCallback((chart: EChartsType) => {
    globalOnRefReadyRef.current?.(chart);
    onRefReadyRef.current?.(chart);
  }, []);

  // 始终持有最新 mergedOption，供 init effect 在「重建实例」后立即补设 option
  const mergedOptionRef = useRef(mergedOption);
  mergedOptionRef.current = mergedOption;

  // forword outside ref
  const setForwardedRef = useCallback(
    (value: EChartsType | null) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(value);
      } else {
        (ref as MutableRefObject<EChartsType | null>).current = value;
      }
    },
    [ref],
  );

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    // clean up old instance
    if (instanceRef.current && typeof (instanceRef.current as any).dispose === 'function') {
      instanceRef.current.dispose();
    }

    // create new instance, and forword
    instanceRef.current = echarts.init(chartRef.current, resolvedTheme);
    setForwardedRef(instanceRef.current);
    // 新建实例后立即补设 option，避免 theme 切换重建实例后出现「有实例无 option」的空窗
    instanceRef.current.setOption(mergedOptionRef.current, true);
    handleRefReady(instanceRef.current);

    resizeObserverRef.current = new ResizeObserver(() => {
      instanceRef.current?.resize?.();
    });
    resizeObserverRef.current.observe(chartRef.current);

    // clean up
    return () => {
      const ins = instanceRef.current;
      if (ins && typeof (ins as any).dispose === 'function') {
        ins.dispose();
      }
      instanceRef.current = null;
      setForwardedRef(null);
      resizeObserverRef.current?.disconnect();
    };
  }, [resolvedTheme, handleRefReady, setForwardedRef]);

  useEffect(() => {
    const ins = instanceRef.current;
    if (ins) {
      ins.setOption(mergedOption, true);
    }
  }, [mergedOption]);

  return (
    <div
      ref={chartRef}
      style={{ width: '100%', height: fillHeight ? '100%' : 400, minHeight: 0, ...style }}
      className={['data-visualization-chart', className].filter(Boolean).join(' ')}
    />
  );
});

export default ECharts;
