/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Area, Column, Line, Scatter, Bar } from '@ant-design/plots';
import { Pie } from './pie';
import { DualAxes } from './dualAxes';
import { G2PlotChart } from './g2plot';

export default [
  new G2PlotChart({
    name: 'line',
    title: 'Line Chart',
    Component: Line,
    config: ['smooth', 'isStack'],
  }),
  new G2PlotChart({
    name: 'area',
    title: 'Area Chart',
    Component: Area,
    config: [
      'smooth',
      {
        settingType: 'boolean',
        name: 'isStack',
        title: 'isStack',
        defaultValue: true,
      },
      'isPercent',
    ],
  }),
  new G2PlotChart({
    name: 'column',
    title: 'Column Chart',
    Component: Column,
    config: ['isGroup', 'isStack', 'isPercent'],
  }),
  new G2PlotChart({
    name: 'bar',
    title: 'Bar Chart',
    Component: Bar,
    config: ['isGroup', 'isStack', 'isPercent'],
  }),
  new Pie(),
  new DualAxes(),
  new G2PlotChart({ name: 'scatter', title: 'Scatter Chart', Component: Scatter }),
];
