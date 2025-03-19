/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { G2PlotChart } from './g2plot';
import { ChartType } from '../chart';
import { lazy } from '@nocobase/client';
// import { Bar as G2PlotBar } from '@ant-design/plots';
const { Bar: G2PlotBar } = lazy(() => import('@ant-design/plots'), 'Bar');

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
