import { ISchema } from '@formily/react';

export const subTable: ISchema = {
  name: 'subTable',
  type: 'object',
  title: '子表格',
  group: 'relation',
  default: {
    interface: 'subTable',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-decorator': 'FormItem',
      'x-component': 'Table',
      'x-designable-bar': 'Markdown.DesignableBar',
      enum: [],
    } as ISchema,
  },
  properties: {
    'uiSchema.title': {
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
        { label: 'HasMany', value: 'hasMany' },
      ],
    },
    'children': {
      type: 'array',
      title: '子表格字段',
      'x-decorator': 'FormItem',
      'x-component': 'DatabaseField',
    },
  },
};
