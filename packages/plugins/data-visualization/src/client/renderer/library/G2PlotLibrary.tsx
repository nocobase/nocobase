import { Area, Bar, Column, DualAxes, Line, Pie, Scatter } from '@ant-design/plots';
import { Charts, commonInit, infer, usePropsFunc } from '../ChartLibrary';
const init = commonInit;

const basicSchema = {
  type: 'object',
  properties: {
    xField: {
      title: '{{t("xField")}}',
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': '{{ useChartFields }}',
      required: true,
    },
    yField: {
      title: '{{t("yField")}}',
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': '{{ useChartFields }}',
      required: true,
    },
    seriesField: {
      title: '{{t("seriesField")}}',
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': '{{ useChartFields }}',
    },
  },
};

const useProps: usePropsFunc = ({ data, fieldProps, general, advanced }) => {
  const meta = {};
  Object.entries(fieldProps).forEach(([key, props]) => {
    meta[key] = {
      formatter: props.transformer,
      alias: props.label,
    };
  });
  return {
    data,
    meta,
    ...general,
    ...advanced,
  };
};

export const G2PlotLibrary: Charts = {
  line: {
    name: 'Line Chart',
    component: Line,
    schema: basicSchema,
    init,
    useProps,
    reference: {
      title: 'Line Chart',
      link: 'https://g2plot.antv.antgroup.com/api/plots/bar',
    },
  },
  area: {
    name: 'Area Chart',
    component: Area,
    schema: basicSchema,
    init,
    useProps,
    reference: {
      title: 'Area Chart',
      link: 'https://g2plot.antv.antgroup.com/api/plots/area',
    },
  },
  column: {
    name: 'Column Chart',
    component: Column,
    schema: basicSchema,
    init,
    useProps,
    reference: {
      title: 'Column Chart',
      link: 'https://g2plot.antv.antgroup.com/api/plots/column',
    },
  },
  bar: {
    name: 'Bar Chart',
    component: Bar,
    schema: basicSchema,
    init: (fields, { measures, dimensions }) => {
      const { xField, yField, seriesField } = infer(fields, { measures, dimensions });
      return {
        general: {
          xField: yField?.value,
          yField: xField?.value,
          seriesField: seriesField?.value,
        },
      };
    },
    useProps,
    reference: {
      title: 'Bar Chart',
      link: 'https://g2plot.antv.antgroup.com/api/plots/bar',
    },
  },
  pie: {
    name: 'Pie Chart',
    component: Pie,
    schema: {
      type: 'object',
      properties: {
        angleField: {
          title: '{{t("angleField")}}',
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          'x-reactions': '{{ useChartFields }}',
          required: true,
        },
        colorField: {
          title: '{{t("colorField")}}',
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
          colorField: xField?.value,
          angleField: yField?.value,
        },
      };
    },
    useProps,
    reference: {
      title: 'Pie Chart',
      link: 'https://g2plot.antv.antgroup.com/api/plots/pie',
    },
  },
  dualAxes: {
    name: 'Dual Axes Chart',
    component: DualAxes,
    useProps: ({ data, fieldProps, general, advanced }) => {
      return {
        ...useProps({ data, fieldProps, general, advanced }),
        data: [data, data],
      };
    },
    schema: {
      type: 'object',
      properties: {
        xField: {
          title: '{{t("xField")}}',
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          'x-reactions': '{{ useChartFields }}',
          required: true,
        },
        yField: {
          title: '{{t("yField")}}',
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
                    minWidth: '200px',
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
              title: '{{t("Add")}}',
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
          xField: xField?.value,
          yField: yFields?.map((f) => f.value).slice(0, 2) || [],
        },
      };
    },
    reference: {
      title: 'Dual Axes Chart',
      link: 'https://g2plot.antv.antgroup.com/api/plots/dual-axes',
    },
  },
  // gauge: {
  //   name: 'Gauge Chart',
  //   component: Gauge,
  // },
  scatter: {
    name: 'Scatter Chart',
    component: Scatter,
    schema: basicSchema,
    init,
    useProps,
    reference: {
      title: 'Scatter Chart',
      link: 'https://g2plot.antv.antgroup.com/api/plots/scatter',
    },
  },
};
