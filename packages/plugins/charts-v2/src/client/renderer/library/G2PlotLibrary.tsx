import { Area, Bar, Column, DualAxes, Gauge, Line, Pie, Scatter } from '@ant-design/plots';
import { lang } from '../../locale';
import { ChartProps, Charts, commonInit, infer, usePropsFunc } from '../ChartLibrary';
import { FieldOption } from '../../hooks';
import { QueryProps } from '../ChartRendererProvider';

const basicSchema = {
  type: 'object',
  properties: {
    xField: {
      title: lang('xField'),
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': '{{ useChartFields }}',
    },
    yField: {
      title: lang('yField'),
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': '{{ useChartFields }}',
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

export const G2PlotLibrary: Charts = {
  line: {
    name: lang('Line Chart'),
    component: Line,
    schema: basicSchema,
    init: commonInit,
  },
  area: {
    name: lang('Area Chart'),
    component: Area,
    schema: basicSchema,
    init: commonInit,
  },
  column: {
    name: lang('Column Chart'),
    component: Column,
    schema: basicSchema,
    init: commonInit,
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
        },
        colorField: {
          title: lang('colorField'),
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          'x-reactions': '{{ useChartFields }}',
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
    init: commonInit,
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
