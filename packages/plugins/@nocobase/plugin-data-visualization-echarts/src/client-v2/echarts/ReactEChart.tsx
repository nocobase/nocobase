/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { forwardRef, useCallback } from 'react';
import ReactECharts, { EChartsReactProps } from 'echarts-for-react';
import { ECharts } from 'echarts';
import { useSetChartSize } from '@nocobase/plugin-data-visualization/client-v2';
import { useGlobalTheme } from '@nocobase/client-v2';

interface EChartsInstance {
  getEchartsInstance: () => ECharts | undefined;
}

type EChartProps = EChartsReactProps['option'] & {
  onRefReady?: (chart: ECharts) => void;
};

export const EChart = forwardRef<ECharts, EChartProps>((props, ref) => {
  const { size = {}, lightTheme = 'walden', darkTheme = 'defaultDark', onRefReady, ...option } = props;
  let { height: fixedHeight } = props;
  if (!fixedHeight && size.type === 'fixed') {
    fixedHeight = size.fixed;
  }
  const { chartRef, chartHeight } = useSetChartSize(size, fixedHeight);
  const { isDarkTheme } = useGlobalTheme();
  const setForwardedRef = useCallback(
    (chart: ECharts | undefined) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(chart || null);
      } else {
        ref.current = chart || null;
      }
    },
    [ref],
  );
  const handleRef = useCallback(
    (instance: EChartsInstance | null) => {
      const chart = instance?.getEchartsInstance();
      setForwardedRef(chart);
      if (chart) {
        onRefReady?.(chart);
      }
    },
    [onRefReady, setForwardedRef],
  );

  return (
    <div ref={chartRef} style={{ height: `${chartHeight || 400}px` }}>
      <ReactECharts
        option={option}
        theme={isDarkTheme ? darkTheme : lightTheme}
        style={{ height: `${chartHeight || 400}px` }}
        ref={handleRef}
      />
    </div>
  );
});
