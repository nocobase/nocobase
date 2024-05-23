/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import ReactECharts, { EChartsReactProps } from 'echarts-for-react';
import { ECharts } from 'echarts';

interface EChartsInstance {
  getEchartsInstance: () => ECharts | undefined;
}

export const EChart = (props: EChartsReactProps['option']) => {
  let instance: EChartsInstance;

  useEffect(() => {
    if (!instance) {
      return;
    }
    instance.getEchartsInstance().resize();
  }, [instance]);

  return <ReactECharts option={props} ref={(e) => (instance = e)} />;
};
