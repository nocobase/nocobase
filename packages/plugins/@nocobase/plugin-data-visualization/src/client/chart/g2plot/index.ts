/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Pie } from './pie';
import { DualAxes } from './dualAxes';
import { G2PlotChart } from './g2plot';

import { lazy } from '@nocobase/client';
// import { Area, Column, Line, Scatter, Bar } from '@ant-design/plots';
const { Area, Column, Line, Scatter, Bar } = lazy(
  () => import('@ant-design/plots'),
  'Area',
  'Column',
  'Line',
  'Scatter',
  'Bar',
);

export default [
  new G2PlotChart({
    name: 'line',
    title: 'Line',
    Component: Line,
    config: ['smooth', 'isStack'],
  }),
  new G2PlotChart({
    name: 'area',
    title: 'Area',
    Component: Area,
    config: [
      'smooth',
      {
        configType: 'boolean',
        name: 'isStack',
        title: 'isStack',
        defaultValue: true,
      },
      'isPercent',
    ],
  }),
  new G2PlotChart({
    name: 'column',
    title: 'Column',
    Component: Column,
    config: ['isGroup', 'isStack', 'isPercent'],
  }),
  new G2PlotChart({
    name: 'bar',
    title: 'Bar',
    Component: Bar,
    config: ['isGroup', 'isStack', 'isPercent'],
  }),
  new Pie(),
  new DualAxes(),
  new G2PlotChart({ name: 'scatter', title: 'Scatter', Component: Scatter }),
];
