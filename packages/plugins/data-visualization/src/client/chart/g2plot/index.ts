import { Area, Column, Line, Scatter } from '@ant-design/plots';
import { Chart } from '../chart';
import { Bar } from './bar';
import { Pie } from './pie';
import { DualAxes } from './dualAxes';
import { G2PlotChart } from './g2plot';

export default [
  new G2PlotChart('line', 'Line Chart', Line),
  new G2PlotChart('area', 'Area Chart', Area),
  new G2PlotChart('column', 'Column Chart', Column),
  new Bar(),
  new Pie(),
  new DualAxes(),
  new G2PlotChart('scatter', 'Scatter Chart', Scatter),
];
