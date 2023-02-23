import JSON5 from 'json5';

const validateJSON = {
  validator: `{{(value, rule)=> {
    if (!value) {
      return '';
    }
    try {
      const val = JSON5.parse(value);
      if(!isNaN(val)) {
        return false;
      }
      return true;
    } catch(error) {
      console.error(error);
      return false;
    }
  }}}`,
  message: '{{t("Invalid JSON format")}}',
};

const chartConfig = {
  xField: '{{dimension}}',
  yField: '{{metric}}',
  legend: false,
};
export const funnelTemplate = {
  title: '1 个「无序名词」字段，1 个「数值」字段',
  type: 'Funnel',
  group: 2,
  renderComponent: 'G2Plot',
  defaultChartOptions: chartConfig,
  configurableProperties: {
    type: 'object',
    properties: {
      dimension: {
        required: true,
        type: 'string',
        title: '{{t("Sector label/dimensional")}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      metric: {
        required: true,
        type: 'string',
        title: '{{t("Funnel Layer Width/Metrics")}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      advanceConfig: {
        required: true,
        title: '{{t("AdvanceConfig")}}',
        type: 'string',
        default: JSON5.stringify(chartConfig, null, 2),
        'x-decorator': 'FormItem',
        'x-component': 'Input.TextArea',
        'x-component-props': {
          autoSize: { minRows: 8, maxRows: 16 },
        },
        'x-validator': validateJSON,
      },
    },
  },
};
