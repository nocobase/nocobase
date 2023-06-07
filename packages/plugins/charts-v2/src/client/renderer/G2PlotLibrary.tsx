import { Area, Bar, Column, DualAxes, Gauge, Line, Pie, Scatter } from '@ant-design/plots';
import { lang } from '../locale';
import { Charts } from './ChartLibrary';

const basicSchema = {
  type: 'object',
  properties: {
    xField: {
      title: 'xField',
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': '{{ useChartFields }}',
      'x-decorator-props': {
        style: {
          display: 'inline-block',
          width: 'calc(50% - 8px)',
        },
      },
    },
    yField: {
      title: 'yField',
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': '{{ useChartFields }}',
      'x-decorator-props': {
        style: {
          display: 'inline-block',
          width: 'calc(50% - 8px)',
          marginLeft: '16px',
        },
      },
    },
    seriesField: {
      title: 'seriesField',
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': '{{ useChartFields }}',
      'x-decorator-props': {
        style: {
          display: 'inline-block',
          width: 'calc(50% - 8px)',
        },
      },
    },
  },
};

export const G2PlotLibrary: Charts = {
  line: {
    name: lang('Line Chart'),
    component: Line,
    schema: basicSchema,
  },
  area: {
    name: lang('Area Chart'),
    component: Area,
    schema: basicSchema,
  },
  column: {
    name: lang('Column Chart'),
    component: Column,
    schema: basicSchema,
  },
  bar: {
    name: lang('Bar Chart'),
    component: Bar,
    schema: basicSchema,
  },
  pie: {
    name: lang('Pie Chart'),
    component: Pie,
    schema: {
      type: 'object',
      properties: {
        angleField: {
          title: 'angleField',
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          'x-reactions': '{{ useChartFields }}',
          'x-decorator-props': {
            style: {
              display: 'inline-block',
              width: 'calc(50% - 8px)',
            },
          },
        },
        colorField: {
          title: 'colorField',
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          'x-reactions': '{{ useChartFields }}',
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
  dualAxes: {
    name: lang('Dual Axes Chart'),
    component: DualAxes,
    transformer: (data) => {
      return [data, data];
    },
    schema: {
      type: 'object',
      properties: {
        xField: {
          title: 'xField',
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          'x-reactions': '{{ useChartFields }}',
          'x-decorator-props': {
            style: {
              display: 'inline-block',
              width: 'calc(50% - 8px)',
            },
          },
        },
        seriesField: {
          title: 'seriesField',
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          'x-reactions': '{{ useChartFields }}',
          'x-decorator-props': {
            style: {
              display: 'inline-block',
              width: 'calc(50% - 8px)',
              marginLeft: '16px',
            },
          },
        },
        yField: {
          title: 'yField',
          type: 'array',
          'x-decorator': 'FormItem',
          'x-component': 'ArrayItems',
          'x-decorator-props': {
            style: {
              width: 'calc(50% - 8px)',
            },
          },
          items: {
            type: 'void',
            'x-component': 'Space',
            properties: {
              sort: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.SortHandle',
              },
              input: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Select',
                'x-reactions': '{{ useChartFields }}',
                'x-component-props': {
                  style: {
                    'min-width': '200px',
                  },
                },
              },
              remove: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'ArrayItems.Remove',
              },
            },
          },
          properties: {
            add: {
              type: 'void',
              title: lang('Add'),
              'x-component': 'ArrayItems.Addition',
            },
          },
        },
      },
    },
  },
  gauge: {
    name: lang('Gauge Chart'),
    component: Gauge,
  },
  scatter: {
    name: lang('Scatter Chart'),
    component: Scatter,
    schema: basicSchema,
  },
};
