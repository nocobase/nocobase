export const barTemplate = {
  title: 'bar',
  type: 'bar',
  renderComponent: 'G2Plot',
  defaultChartOptions: {
    xField: 'value',
    yField: 'year',
    seriesField: 'year',
    legend: {
      position: 'top-left',
    },
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
              dependencies: ['dataset.type'],
              fulfill: {
                state: {
                  visible: '{{$deps[0] === "builtIn"}}',
                },
              },
            },
          },
          filter: {
            title: '{{t(\'Filter\')}}',
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
          },
        },
      },
      chartOptions: {
        type: 'object',
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
        },
      },
    },
  },
};
