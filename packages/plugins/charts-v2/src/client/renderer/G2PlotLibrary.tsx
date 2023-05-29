import { Area, Bar, Column, DualAxes, Gauge, Line, Pie, Scatter } from '@ant-design/plots';
import { lang } from '../locale';
import { Charts } from './ChartLibrary';

export const G2PlotLibrary: Charts = {
  line: {
    name: lang('Line Chart'),
    component: Line,
    schema: {
      type: 'object',
      properties: {
        xField: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          title: 'xField',
          'x-decorator-props': {
            style: {
              display: 'inline-block',
              width: 'calc(50% - 8px)',
            },
          },
        },
        yField: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          title: 'yField',
          'x-decorator-props': {
            style: {
              display: 'inline-block',
              width: 'calc(50% - 8px)',
              marginLeft: '16px',
            },
          },
        },
      },
    },
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
