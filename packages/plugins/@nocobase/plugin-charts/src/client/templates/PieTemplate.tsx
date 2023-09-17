import JSON5 from 'json5';

const chartConfig = {
  appendPadding: 10,
  angleField: '{{metric}}',
  colorField: '{{dimension}}',
  radius: 0.9,
  label: {
    type: 'inner',
    offset: '-30%',
    content: '{{({percent}) => `${(percent * 100).toFixed(0)}%`}}',
    style: {
      fontSize: 14,
      textAlign: 'center',
    },
  },
  interactions: [{ type: 'element-active' }],
};

export const pieTemplate = {
  description: '1 「Time」 or 「Order Noun」 field, 1 「Value」 field',
  title: 'Pie',
  type: 'Pie',
  iconId: 'icon-pie',
  group: 2,
  renderComponent: 'G2Plot',
  defaultChartOptions: chartConfig,
  configurableProperties: {
    type: 'void',
    properties: {
      dimension: {
        required: true,
        type: 'string',
        title: '{{t("Sector label / Dimensional",{ns:"charts"})}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      metric: {
        required: true,
        type: 'string',
        title: '{{t("Sector Angle / Metric",{ns:"charts"})}}',
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
            description: '{{jsonConfigDesc("Pie | G2Plot","https://g2plot.antv.antgroup.com/api/plots/pie")}}',
            'x-validator': { json5: true },
          },
        },
      },
    },
  },
};
