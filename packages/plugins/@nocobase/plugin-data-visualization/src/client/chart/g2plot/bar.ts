/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Bar as G2PlotBar } from '@ant-design/plots';
import { G2PlotChart } from './g2plot';
import { ChartType } from '../chart';

export class Bar extends G2PlotChart {
  constructor() {
    super({
      name: 'bar',
      title: 'Bar Chart',
      Component: G2PlotBar,
      config: ['isGroup', 'isStack', 'isPercent', 'size'],
    });
  }

  init: ChartType['init'] = (fields, { measures, dimensions }) => {
    const { xField, yField, seriesField } = this.infer(fields, { measures, dimensions });
    return {
      general: {
        xField: yField?.value,
        yField: xField?.value,
        seriesField: seriesField?.value,
      },
    };
  };
}
