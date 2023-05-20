import { ISchema } from '@formily/react';

const getArraySchema = (title: string, fields = {}) => ({
  type: 'array',
  title,
  'x-decorator': 'FormItem',
  'x-component': 'ArrayItems',
  items: {
    type: 'object',
    'x-decorator': 'ArrayItems.Item',
    properties: {
      sort: {
        type: 'void',
        'x-decorator': 'FormItem',
        'x-component': 'ArrayItems.SortHandle',
      },
      ...fields,
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
      title: 'Add entry',
      'x-component': 'ArrayItems.Addition',
    },
  },
});

export const configSchema: ISchema = {
  type: 'object',
  properties: {
    tabs: {
      type: 'void',
      'x-component': 'Tabs',
      'x-decorator': 'Form',
      properties: {
        query: {
          title: '{{t("Query")}}',
          type: 'object',
          'x-component': 'Tabs.TabPane',
          properties: {
            dimensions: getArraySchema('{{t("Dimensions")}}', {
              field: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
              },
            }),
            measures: getArraySchema('{{t("Measures")}}', {
              field: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
              },
            }),
            sort: getArraySchema('{{t("Sort")}}', {
              field: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
              },
              order: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Radio.Group',
                'x-component-props': {
                  defaultValue: 'ASC',
                },
                enum: ['ASC', 'DESC'],
              },
            }),
            filter: {
              type: 'object',
              title: '{{t("Filter")}}',
              'x-decorator': 'FormItem',
              'x-component': 'Filter',
            },
          },
        },
        config: {
          title: 'Config',
          type: 'object',
          'x-component': 'Tabs.TabPane',
          properties: {
            chartType: {
              type: 'string',
              title: '{{t("Chart Type")}}',
              'x-decorator': 'FormItem',
              'x-component': 'Select',
            },
            chartConfig: {
              title: '{{t("Chart Config")}}',
              'x-decorator': 'FormItem',
              'x-component': 'Input.TextArea',
              'x-component-props': {
                autoSize: {
                  maxRows: 20,
                  minRows: 10,
                },
              },
            },
          },
        },
      },
    },
  },
};
