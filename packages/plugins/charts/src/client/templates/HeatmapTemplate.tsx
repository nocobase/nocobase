import JSON5 from 'json5';

const chartConfig = {
  xField: '{{metric}}',
  yField: '{{dimension}}',
  colorField: '{{category}}',
  color: ['#174c83', '#7eb6d4', '#efefeb', '#efa759', '#9b4d16'],
  meta: {
    '{{metric}}': {
      type: 'cat'
    }
  }
};

export const heatmapTemplate = {
  description: '1 「Time」 or 「Order Noun」 field, 1 「Value」 field',
  type: 'Heatmap',
  title: 'Heatmap',
  iconId: 'icon-heatmap',
  group: 1,
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
            description: '{{jsonConfigDesc("Heatmap | G2Plot","https://g2plot.antv.antgroup.com/api/plots/heatmap")}}',
            'x-validator': { json5: true },
          },
        },
      },
    },
  },
}
