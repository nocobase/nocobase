import { Area, Bar, Column, DualAxes, Gauge, Line, Pie, Scatter } from '@ant-design/plots';
import { lang } from '../locale';
import { Charts } from './ChartLibrary';

export const G2PlotLibrary: Charts = {
  line: {
    name: lang('Line Chart'),
    component: Line,
  },
  area: {
    name: lang('Area Chart'),
    component: Area,
  },
  column: {
    name: lang('Column Chart'),
    component: Column,
  },
  bar: {
    name: lang('Bar Chart'),
    component: Bar,
  },
  pie: {
    name: lang('Pie Chart'),
    component: Pie,
  },
  dualAxes: {
    name: lang('Dual Axes Chart'),
    component: DualAxes,
  },
  gauge: {
    name: lang('Gauge Chart'),
    component: Gauge,
  },
  scatter: {
    name: lang('Scatter Chart'),
    component: Scatter,
  },
};
