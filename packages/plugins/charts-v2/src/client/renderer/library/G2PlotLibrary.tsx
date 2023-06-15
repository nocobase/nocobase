import { Area, Bar, Column, DualAxes, Gauge, Line, Pie, Scatter } from '@ant-design/plots';
import { lang } from '../../locale';
import { ChartProps, Charts, usePropsFunc } from '../ChartLibrary';

const basicSchema = {
  type: 'object',
  properties: {
    xField: {
      title: lang('xField'),
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
      title: lang('yField'),
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
      title: lang('seriesField'),
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

const commonInit: ChartProps['initConfig'] = (fields, { measures, dimensions }) => {
  if (!measures?.length || !dimensions?.length) {
    return {};
  }
  const xField = fields.find((f) => f.name === dimensions[0].field);
  const yField = fields.find((f) => f.name === measures[0].field);
  return {
    general: {
      xField: xField?.label,
      yField: yField?.label,
    },
  };
};

export const G2PlotLibrary: Charts = {
  line: {
    name: lang('Line Chart'),
    component: Line,
    schema: basicSchema,
    initConfig: commonInit,
  },
  area: {
    name: lang('Area Chart'),
    component: Area,
    schema: basicSchema,
    initConfig: commonInit,
  },
  column: {
    name: lang('Column Chart'),
    component: Column,
    schema: basicSchema,
    initConfig: commonInit,
  },
  bar: {
    name: lang('Bar Chart'),
    component: Bar,
    schema: basicSchema,
    initConfig: (fields, { measures, dimensions }) => {
      if (!measures?.length || !dimensions?.length) {
        return {};
      }
      const xField = fields.find((f) => f.name === measures[0].field);
      const yField = fields.find((f) => f.name === dimensions[0].field);
      return {
        general: {
          xField: xField?.label,
          yField: yField?.label,
        },
      };
    },
  },
  pie: {
    name: lang('Pie Chart'),
    component: Pie,
    schema: {
      type: 'object',
      properties: {
        angleField: {
          title: lang('angleField'),
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
          title: lang('colorField'),
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
    initConfig: (fields, { measures, dimensions }) => {
      if (!measures?.length || !dimensions?.length) {
        return {};
      }
      const angleField = fields.find((f) => f.name === measures[0].field);
      const colorField = fields.find((f) => f.name === dimensions[0].field);
      return {
        general: {
          angleField: angleField?.label,
          colorField: colorField?.label,
        },
      };
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
          title: lang('xField'),
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
          title: lang('seriesField'),
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
          title: lang('yField'),
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
    initConfig: (fields, { measures, dimensions }) => {
      if (!measures?.length || measures.length < 2 || !dimensions?.length) {
        return {};
      }
      const xField = fields.find((f) => f.name === dimensions[0].field);
      const yField1 = fields.find((f) => f.name === measures[0].field);
      const yField2 = fields.find((f) => f.name === measures[1].field);
      return {
        general: {
          xField: xField?.label,
          yField: [yField1?.label, yField2?.label],
        },
      };
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
    initConfig: commonInit,
  },
};

export const useG2PlotProps: usePropsFunc = ({ data, meta, general, advanced }) => {
  return {
    data,
    meta,
    ...general,
    ...advanced,
  };
};
