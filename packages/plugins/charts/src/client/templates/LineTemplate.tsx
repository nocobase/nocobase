import JSON5 from 'json5';

const chartConfig = {
  yField: '{{metric}}',
  xField: '{{dimension}}',
  seriesField: '{{category}}',
  xAxis: {
    //type: 'time',
  },
  yAxis: {
    // label: {
    //   formatter: '{{(v) => `${v}`.replace(/\d{1,3}(?=(\d{3})+$)/g, (s) => `${s},`)}}',
    // },
  },
};

export const lineTemplate = {
  description: '1 「Time」 or 「Order Noun」 field, 1 「Value」 field',
  type: 'Line',
  title: 'Line',
  iconId: 'icon-line',
  group: 2,
  renderComponent: 'G2Plot',
  defaultChartOptions: chartConfig,
  configurableProperties: {
    type: 'void',
    properties: {
      dimension: {
        required: true,
        type: 'string',
        title: '{{t("Category axis / Dimension",{ns:"charts"})}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      metric: {
        required: true,
        type: 'string',
        title: '{{t("Value axis / Metrics",{ns:"charts"})}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      category: {
        type: 'string',
        title: '{{t("Color legend / Dimensional",{ns:"charts"})}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      jsonConfig: {
        type: 'void',
        'x-component': 'div',
        properties: {
          template: {
            required: true,
            title: '{{t("JSON config",{ns:"charts"})}}',
            type: 'string',
            default: JSON5.stringify(chartConfig, null, 2),
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
            'x-component-props': {
              autoSize: { minRows: 8, maxRows: 16 },
            },
            description: '{{jsonConfigDesc("Line | G2Plot","https://g2plot.antv.antgroup.com/api/plots/line")}}',
            'x-validator': { json5: true },
          },
        },
      },
    },
  },
};
