import { Area, Column, Line, Scatter } from '@ant-design/plots';
import { Bar } from './bar';
import { Pie } from './pie';
import { DualAxes } from './dualAxes';
import { G2PlotChart } from './g2plot';

export default [
  new G2PlotChart({
    name: 'line',
    title: 'Line Chart',
    component: Line,
    config: ['smooth', 'isStack'],
  }),
  new G2PlotChart({
    name: 'area',
    title: 'Area Chart',
    component: Area,
    config: [
      'smooth',
      {
        property: 'isStack',
        defaultValue: true,
      },
      'isPercent',
    ],
  }),
  new G2PlotChart({
    name: 'column',
    title: 'Column Chart',
    component: Column,
    config: ['isGroup', 'isStack', 'isPercent'],
  }),
  new Bar(),
  new Pie(),
  new DualAxes(),
  new G2PlotChart({ name: 'scatter', title: 'Scatter Chart', component: Scatter }),
];
