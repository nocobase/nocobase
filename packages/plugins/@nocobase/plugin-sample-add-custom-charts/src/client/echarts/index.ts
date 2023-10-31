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
