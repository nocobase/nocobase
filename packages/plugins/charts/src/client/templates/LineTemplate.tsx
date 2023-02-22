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
const arr = [{a:"1",b:2,c:3},{a:"2",b:2,c:3},{a:"3",b:2,c:3},{a:"4",b:2,c:3},{a:"5",b:2,c:3},]
export const lineTemplate = {
  title: '1 个「时间」或「有序名词」字段，1 个「数值」字段',
  type: 'Line',
  group:2,
  renderComponent: 'G2Plot',
  defaultChartOptions: chartConfig,
  configurableProperties: {
    type: 'object',
    properties: {
      dimension: {
        required: true,
        type: 'string',
        title: '{{t("Category Axis/dimension")}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      metric: {
        required: true,
        type: 'string',
        title: '{{t("Value Axis/Metrics")}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      category: {
        type: 'string',
        title: '{{t("Color legend/dimensional")}}',
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
