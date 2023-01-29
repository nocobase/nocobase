import { i18n } from '@nocobase/client';

const validateJSON = {
  validator: `{{(value, rule)=> {
    if (!value) {
      return '';
    }
    try {
      const val = JSON.parse(value);
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
  appendPadding: 10,
  angleField: 'value',
  colorField: 'type',
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
  title: 'Pie',
  type: 'Pie',
  renderComponent: 'G2Plot',
  defaultChartOptions: {
    appendPadding: 10,
    angleField: 'value',
    colorField: 'type',
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
  },
  configurableProperties: {
    type: 'void',
    'x-component': 'Tabs',
    'x-component-props': {
      style: {
        marginTop: -15,
      },
    },
    properties: {
      dataset: {
        type: 'object',
        title: 'Dataset options',
        'x-component': 'Tabs.TabPane',
        'x-component-props': {
          tab: 'Dataset options',
        },
        properties: {
          type: {
            title: '{{t(\'Type\')}}',
            required: true,
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            default: 'builtIn',
            enum: [
              { label: 'Built-in', value: 'builtIn' },
              { label: 'SQL', value: 'sql' },
              { label: 'API', value: 'api' },
            ],
          },
          sql: {
            title: '{{t(\'SQL\')}}',
            'x-component': 'Input.TextArea',
            'x-decorator': 'FormItem',
            'x-reactions': {
              dependencies: ['dataset.type'],
              fulfill: {
                state: {
                  visible: '{{$deps[0] === "sql"}}',
                },
              },
            },
          },
          api: {
            title: '{{t(\'API\')}}',
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            'x-reactions': {
              dependencies: ['dataset.type'],
              fulfill: {
                state: {
                  visible: '{{$deps[0] === "api"}}',
                },
              },
            },
          },
          aggregateFunction: {
            title: '{{t(\'Aggregate function\')}}',
            required: true,
            'x-component': 'Radio.Group',
            'x-decorator': 'FormItem',
            enum: [
              { label: 'SUM', value: 'SUM' },
              { label: 'COUNT', value: 'COUNT' },
              { label: 'AVG', value: 'AVG' },
            ],
            'x-reactions': {
              dependencies: ['dataset.type'],
              fulfill: {
                state: {
                  visible: '{{$deps[0] === "builtIn"}}',
                },
              },
            },
          },
          computedField: {
            title: '{{t(\'Computed field\')}}',
            required: true,
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: '{{computedFields}}',
            'x-reactions': {
              dependencies: ['dataset.type', 'dataset.aggregateFunction'],
              fulfill: {
                state: {
                  visible: '{{$deps[0] === "builtIn" && $deps[1] !== "COUNT"}}',
                },
              },
            },
          },
          groupByField: {
            title: '{{t(\'GroupBy field\')}}',
            required: true,
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: '{{groupByFields}}',
            'x-reactions': {
              dependencies: ['dataset.type'],
              fulfill: {
                state: {
                  visible: '{{$deps[0] === "builtIn"}}',
                },
              },
            },
          },
          /*filter: {
            title: "{{t('Filter')}}",
            'x-component': 'Filter',
            'x-decorator': 'FormItem',
            'x-component-props': {},
            'x-reactions': {
              dependencies: ['dataset.type'],
              fulfill: {
                state: {
                  visible: '{{$deps[0] === "builtIn"}}',
                },
              },
            },
          },*/
        },
      },
      chartOptions: {
        type: 'object',
        // required: true,
        title: 'Chart options',
        'x-component': 'Tabs.TabPane',
        'x-component-props': {
          tab: 'Chart options',
        },
        properties: {
          title: {
            title: '{{t(\'Title\')}}',
            'x-component': 'Input',
            'x-decorator': 'FormItem',
          },
          /*angleField: {
            title: '{{t(\'angleField\')}}',
            required: true,
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            'x-reactions': (field) => {
              const computedField = field.query('dataset.computedField')?.value();
              const groupByField = field.query('dataset.groupByField')?.value();
              if (groupByField || computedField) {
                field.dataSource = [
                  {
                    label: 'type',
                    value: 'type',
                  },
                  {
                    label: 'value',
                    value: 'value',
                  },
                ];
              } else {
                field.dataSource = [];
              }
            },
          },*/
          // colorField: {
          //   title: '{{t(\'colorField\')}}',
          //   required: true,
          //   'x-component': 'Select',
          //   'x-decorator': 'FormItem',
          //   'x-reactions': (field) => {
          //     const computedField = field.query('dataset.computedField')?.value();
          //     const groupByField = field.query('dataset.groupByField')?.value();
          //     if (groupByField || computedField) {
          //       field.dataSource = [
          //         {
          //           label: 'type',
          //           value: 'type',
          //         },
          //         {
          //           label: 'value',
          //           value: 'value',
          //         },
          //       ];
          //     } else {
          //       field.dataSource = [];
          //     }
          //   },
          // },
        },
      },
      chartConfig: {
        type: 'object',
        title: 'Chart Config',
        'x-component': 'Tabs.TabPane',
        'x-component-props': {
          tab: 'Chart Config',
        },
        properties: {
          config: {
            required: true,
            title: '{{t("Config")}}',
            type: 'string',
            default: JSON.stringify(chartConfig, null, 2),
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
            'x-component-props': {
              autoSize: { minRows: 8, maxRows: 16 },
            },
            'x-validator': validateJSON,
          },
        },
      },
    },
  },
};
