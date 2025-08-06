/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { forwardRef, useEffect, useRef, MutableRefObject } from 'react';
import * as echarts from 'echarts';
import type { EChartsType, EChartsOption } from 'echarts';

interface Props {
  option: EChartsOption;
  style?: React.CSSProperties;
  className?: string;
  theme?: string;
  onRefReady?: (chart: EChartsType) => void;
}

const ECharts = forwardRef<EChartsType, Props>(({ option, style, className, theme, onRefReady }, ref) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = ref as MutableRefObject<EChartsType | null>;
  const resizeObserverRef = useRef<ResizeObserver>();

  useEffect(() => {
    if (!chartRef.current || !instanceRef) {
      return;
    }

    instanceRef.current = echarts.init(chartRef.current, theme);
    onRefReady?.(instanceRef.current);

    resizeObserverRef.current = new ResizeObserver(() => {
      instanceRef.current?.resize();
    });
    resizeObserverRef.current.observe(chartRef.current);

    return () => {
      instanceRef.current?.dispose();
      resizeObserverRef.current?.disconnect();
    };
  }, [theme, instanceRef, onRefReady]);

  useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.setOption(option, true);
    }
  }, [option, instanceRef]);

  return <div ref={chartRef} style={{ width: '100%', height: 400, ...style }} className={className} />;
});

export default ECharts;
