/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useGlobalTheme } from '@nocobase/client-v2';
import { useSetChartSize } from '@nocobase/plugin-data-visualization/client-v2';
import React from 'react';
import ReactECharts from 'echarts-for-react';

export const EChartRenderer = ({ option, height = 400, size = {} }: { option: any; height?: number; size?: any }) => {
  const { isDarkTheme } = useGlobalTheme();
  const { chartRef, chartHeight } = useSetChartSize(size, height);

  return (
    <div ref={chartRef} style={{ height: chartHeight }}>
      <ReactECharts
        option={option}
        theme={isDarkTheme ? 'dark' : undefined}
        style={{ width: '100%', height: chartHeight }}
        notMerge
      />
    </div>
  );
};
