/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsType, EChartsOption } from 'echarts';

interface Props {
  option: EChartsOption;
  style?: React.CSSProperties;
  className?: string;
  theme?: string;
  onEvents?: {
    [eventName: string]: (params: any, chart: EChartsType) => void;
  };
}

const ECharts: React.FC<Props> = ({ option, style, className, theme, onEvents }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<EChartsType | null>(null);
  const resizeObserverRef = useRef<ResizeObserver>();

  useEffect(() => {
    if (!chartRef.current) return;

    instanceRef.current = echarts.init(chartRef.current, theme);

    // 绑定事件
    if (onEvents) {
      Object.entries(onEvents).forEach(([eventName, handler]) => {
        instanceRef.current.on(eventName, (params) => handler(params, instanceRef.current));
      });
    }

    resizeObserverRef.current = new ResizeObserver(() => {
      instanceRef.current?.resize();
    });
    resizeObserverRef.current.observe(chartRef.current);

    return () => {
      instanceRef.current?.dispose();
      resizeObserverRef.current?.disconnect();
    };
  }, [theme, onEvents]);

  useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.setOption(option, true);
    }
  }, [option]);

  return <div ref={chartRef} style={{ width: '100%', height: 400, ...style }} className={className} />;
};

export default ECharts;
