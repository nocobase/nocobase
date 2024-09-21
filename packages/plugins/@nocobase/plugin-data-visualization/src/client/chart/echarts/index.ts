/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Bar } from './bar';
import { EChart } from './echart';
import { Pie } from './pie';
import walden from './themes/walden';

EChart.registerTheme('walden', walden);

export default [
  new EChart({
    name: 'line',
    title: 'Line Chart',
    series: { type: 'line' },
    config: ['smooth', 'isStack'],
  }),
  new EChart({
    name: 'column',
    title: 'Column Chart',
    series: { type: 'bar' },
    config: ['isStack'],
  }),
  new EChart({
    name: 'area',
    title: 'Area Chart',
    series: { type: 'line', areaStyle: {} },
    config: ['smooth', 'isStack'],
  }),
  new Bar(),
  new Pie(),
  new EChart({
    name: 'scatter',
    title: 'Scatter Chart',
    series: { type: 'scatter', areaStyle: {} },
  }),
];
