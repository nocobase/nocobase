/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import ReactECharts, { EChartsReactProps } from 'echarts-for-react';
import { ECharts } from 'echarts';
import { useSetChartSize } from '@nocobase/plugin-data-visualization/client';
import { useGlobalTheme } from '@nocobase/client';

interface EChartsInstance {
  getEchartsInstance: () => ECharts | undefined;
}

export const EChart = (props: EChartsReactProps['option']) => {
  let instance: EChartsInstance;
  const { size = {}, lightTheme = 'walden', darkTheme = 'defaultDark', ...option } = props;
  let { height: fixedHeight } = props;
  if (!fixedHeight && size.type === 'fixed') {
    fixedHeight = size.fixed;
  }
  const { chartRef, chartHeight } = useSetChartSize(size, fixedHeight);
  const { isDarkTheme } = useGlobalTheme();

  return (
    <div ref={chartRef} style={{ height: `${chartHeight || 400}px` }}>
      <ReactECharts
        option={option}
        theme={isDarkTheme ? darkTheme : lightTheme}
        style={{ height: `${chartHeight || 400}px` }}
        ref={(e) => (instance = e)}
      />
    </div>
  );
};
