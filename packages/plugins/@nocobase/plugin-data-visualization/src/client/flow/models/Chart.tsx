/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import ECharts from './ECharts';
import { Empty } from 'antd';
import { EChartsOption } from 'echarts';

export interface ChartOptions {
  option: EChartsOption;
  dataSource: any;
}

export const Chart: React.FC<ChartOptions> = ({ option, dataSource }) => {
  if (!option) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'Please configure chart'} />;
  }

  return (
    <ECharts
      option={{
        dataset: {
          source: dataSource || [],
        },
        ...option,
      }}
    />
  );
};
