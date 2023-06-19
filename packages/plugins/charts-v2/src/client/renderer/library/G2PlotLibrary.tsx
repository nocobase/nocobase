import { Area, Bar, Column, DualAxes, Gauge, Line, Pie, Scatter } from '@ant-design/plots';
import { lang } from '../../locale';
import { Charts, commonInit, infer, usePropsFunc } from '../ChartLibrary';
const init = commonInit;

const basicSchema = {
  type: 'object',
  properties: {
    xField: {
      title: lang('xField'),
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': '{{ useChartFields }}',
      required: true,
    },
    yField: {
      title: lang('yField'),
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': '{{ useChartFields }}',
      required: true,
    },
    seriesField: {
      title: lang('seriesField'),
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': '{{ useChartFields }}',
    },
  },
};

const useProps: usePropsFunc = ({ data, meta, general, advanced }) => {
  return {
    data,
    meta,
    ...general,
    ...advanced,
  };
};

export const G2PlotLibrary: Charts = {
  line: {
    name: lang('Line Chart'),
    component: Line,
    schema: basicSchema,
    init,
    useProps,
  },
  area: {
    name: lang('Area Chart'),
    component: Area,
    schema: basicSchema,
    init,
    useProps,
  },
  column: {
    name: lang('Column Chart'),
    component: Column,
    schema: basicSchema,
    init,
    useProps,
  },
  bar: {
    name: lang('Bar Chart'),
    component: Bar,
    schema: basicSchema,
    init: (fields, { measures, dimensions }) => {
      const { xField, yField, seriesField } = infer(fields, { measures, dimensions });
      return {
        general: {
          xField: yField?.label,
          yField: xField?.label,
          seriesField: seriesField?.label,
        },
      };
    },
    useProps,
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
          required: true,
        },
        colorField: {
          title: lang('colorField'),
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          'x-reactions': '{{ useChartFields }}',
          required: true,
        },
      },
    },
    init: (fields, { measures, dimensions }) => {
      const { xField, yField } = infer(fields, { measures, dimensions });
      return {
        general: {
          colorField: xField?.label,
          angleField: yField?.label,
        },
      };
    },
    useProps,
  },
  dualAxes: {
    name: lang('Dual Axes Chart'),
    component: DualAxes,
    useProps: ({ data, meta, general, advanced }) => {
      return {
        data: [data, data],
        meta,
        ...general,
        ...advanced,
      };
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
          required: true,
        },
        yField: {
          title: lang('yField'),
          type: 'array',
          'x-decorator': 'FormItem',
          'x-component': 'ArrayItems',
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
                required: true,
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
    init: (fields, { measures, dimensions }) => {
      const { xField, yFields } = infer(fields, { measures, dimensions });
      return {
        general: {
          xField: xField?.label,
          yField: yFields?.map((f) => f.label) || [],
        },
      };
    },
  },
  // gauge: {
  //   name: lang('Gauge Chart'),
  //   component: Gauge,
  // },
  scatter: {
    name: lang('Scatter Chart'),
    component: Scatter,
    schema: basicSchema,
    init,
    useProps,
  },
};
