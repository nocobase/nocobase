import { ISchema } from '@formily/react';
import { lang } from '../../locale';

const getArraySchema = (fields = {}) => ({
  type: 'array',
  'x-decorator': 'FormItem',
  'x-component': 'ArrayItems',
  'x-component-props': { style: { width: 550 } },
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
    card: {
      type: 'void',
      'x-component': 'Card',
      properties: {
        chartType: {
          type: 'string',
          title: '{{t("Chart type")}}',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
        },
        chartConfig: {
          title: '{{t("Chart JSON config")}}',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
          'x-component-props': {
            autoSize: {
              minRows: 5,
            },
          },
        },
      },
    },
  },
};

export const querySchema: ISchema = {
  type: 'object',
  properties: {
    collapse: {
      type: 'void',
      'x-decorator': 'FormItem',
      'x-component': 'FormCollapse',
      'x-component-props': {
        formCollapse: '{{formCollapse}}',
      },
      properties: {
        pane1: {
          type: 'void',
          'x-component': 'FormCollapse.CollapsePanel',
          'x-component-props': {
            header: lang('Measures'),
            key: 'measures',
          },
          properties: {
            measures: getArraySchema({
              field: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: '{{t("Field")}}',
                },
              },
              aggregation: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Select',
                'x-component-props': {
                  placeholder: '{{t("Aggregation")}}',
                },
                enum: [
                  { label: 'Sum', value: 'sum' },
                  { label: 'Count', value: 'count' },
                  { label: 'Avg', value: 'avg' },
                  { label: 'Max', value: 'max' },
                  { label: 'Min', value: 'min' },
                ],
              },
              alias: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: '{{t("Alias")}}',
                },
              },
            }),
          },
        },
        pane2: {
          type: 'void',
          'x-component': 'FormCollapse.CollapsePanel',
          'x-component-props': {
            header: lang('Dimensions'),
            key: 'dimensions',
          },
          properties: {
            dimensions: getArraySchema({
              field: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
              },
            }),
          },
        },
        pane3: {
          type: 'void',
          'x-component': 'FormCollapse.CollapsePanel',
          'x-component-props': {
            header: lang('Sort'),
            key: 'sort',
          },
          properties: {
            sort: getArraySchema({
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
          },
        },
        pane4: {
          type: 'void',
          'x-component': 'FormCollapse.CollapsePanel',
          'x-component-props': {
            header: lang('Filter'),
            key: 'filter',
          },
          properties: {
            filter: {
              type: 'object',
              'x-decorator': 'FormItem',
              'x-component': 'Filter',
            },
          },
        },
      },
    },
    cache: {
      type: 'boolean',
      title: '{{t("Enable cache")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
    },
  },
};
