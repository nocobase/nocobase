import { ISchema } from '@formily/react';

export const select: ISchema = {
  name: 'select',
  type: 'object',
  title: '下拉选择',
  group: 'choices',
  default: {
    dataType: 'string',
    // name,
    ui: {
      type: 'string',
      // title,
      'x-component': 'Select',
      enum: [],
    } as ISchema,
  },
  properties: {
    'ui.title': {
      type: 'string',
      required: true,
      title: '字段名称',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      required: true,
      title: '字段标识',
      'x-disabled': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    dataType: {
      type: 'string',
      title: '数据类型',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      enum: [
        { label: 'String', value: 'string' },
        { label: 'Text', value: 'text' },
      ],
    },
    'ui.enum': {
      type: 'array',
      title: '可选项',
      'x-decorator': 'FormItem',
      'x-component': 'ArrayTable',
      'x-component-props': {
        pagination: false,
        // scroll: { x: '100%' },
      },
      items: {
        type: 'object',
        properties: {
          column1: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': { width: 50, title: '', align: 'center' },
            properties: {
              sort: {
                type: 'void',
                'x-component': 'ArrayTable.SortHandle',
              },
            },
          },
          column2: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': { title: '选项值' },
            properties: {
              value: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
              },
            },
          },
          column3: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': { title: '选项' },
            properties: {
              label: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
              },
            },
          },
          column4: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': { title: '颜色' },
            properties: {
              color: {
                type: 'string',
                'x-decorator': 'FormItem',
                'x-component': 'ColorSelect',
              },
            },
          },
          column5: {
            type: 'void',
            'x-component': 'ArrayTable.Column',
            'x-component-props': {
              title: '',
              dataIndex: 'operations',
              fixed: 'right',
            },
            properties: {
              item: {
                type: 'void',
                'x-component': 'FormItem',
                properties: {
                  remove: {
                    type: 'void',
                    'x-component': 'ArrayTable.Remove',
                  },
                },
              },
            },
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          'x-component': 'ArrayTable.Addition',
          title: '添加可选项',
        },
      },
    },
    'ui.required': {
      type: 'string',
      title: '必填',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
};
