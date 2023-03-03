import JSON5 from 'json5';

const chartConfig = {
  appendPadding: 10,
  xField: '{{metric}}',
  yField: '{{dimension}}',
  colorField: '{{category}}',
  shape: 'circle',
  size: 4,
  yAxis: {
    nice: true,
    line: {
      style: {
        stroke: '#aaa',
      },
    },
  },
  xAxis: {
    min: -100,
    grid: {
      line: {
        style: {
          stroke: '#eee',
        },
      },
    },
    line: {
      style: {
        stroke: '#aaa',
      },
    },
  },
};

export const scatterTemplate = {
  description: '1 「Numeric」 field, 0~ 1 「Unordered Noun」 field',
  type: 'Scatter',
  title: 'Scatter',
  iconId: 'icon-scatter',
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
            description: '{{jsonConfigDesc("Scatter | G2Plot","https://g2plot.antv.antgroup.com/api/plots/scatter")}}',
            'x-validator': { json5: true },
          },
        },
      },
    },
  },
};
