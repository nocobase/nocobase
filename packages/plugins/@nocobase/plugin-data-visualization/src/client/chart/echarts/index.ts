/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Bar } from './bar';
import { ECharts } from './echarts';
import { Pie } from './pie';

export default [
  new ECharts({
    name: 'line',
    title: 'Line Chart',
    series: { type: 'line' },
  }),
  new ECharts({
    name: 'column',
    title: 'Column Chart',
    series: { type: 'bar' },
  }),
  new ECharts({
    name: 'area',
    title: 'Area Chart',
    series: { type: 'line', areaStyle: {} },
  }),
  new Bar(),
  new Pie(),
];
