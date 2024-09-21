/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext, useEffect, useRef } from 'react';
import ReactECharts, { EChartsReactProps } from 'echarts-for-react';
import { ECharts, registerTheme } from 'echarts';
import walden from './themes/walden';
import { ChartRendererContext } from '../../renderer';
import { useSetChartSize } from '../../hooks/chart';

registerTheme('walden', walden);

interface EChartsInstance {
  getEchartsInstance: () => ECharts | undefined;
}

export const EChart = (props: EChartsReactProps['option']) => {
  let instance: EChartsInstance;
  const { size = {}, ...option } = props;
  let { height: fixedHeight } = props;
  if (!fixedHeight && size.type === 'fixed') {
    fixedHeight = size.fixed;
  }
  const { chartRef, chartHeight } = useSetChartSize(size, fixedHeight);

  return (
    <div ref={chartRef} style={chartHeight ? { height: `${chartHeight}px` } : {}}>
      <ReactECharts
        option={option}
        theme={'walden'}
        style={chartHeight ? { height: `${chartHeight}px` } : {}}
        ref={(e) => (instance = e)}
      />
    </div>
  );
};
