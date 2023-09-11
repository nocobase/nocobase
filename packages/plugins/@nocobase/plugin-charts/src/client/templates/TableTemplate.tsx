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
  message: '{{t("Invalid JSON format",{ ns: "charts" })}}',
};

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
export const tableTemplate = {
  title: '表格展示',
  type: 'DataSetPreviewTable',
  group: 2,
  renderComponent: 'DataSetPreviewTable',
  defaultChartOptions: chartConfig,
  configurableProperties: {
    type: 'void',
    properties: {},
  },
};
