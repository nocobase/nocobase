import { ISchema } from '@formily/react';

export const string: ISchema = {
  name: 'string',
  type: 'object',
  title: '单行文本',
  group: 'basic',
  default: {
    dataType: 'string',
    // name,
    ui: {
      type: 'string',
      // title,
      'x-component': 'Input',
    } as ISchema,
  },
  properties: {
    'ui.title': {
      type: 'string',
      title: '字段名称',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      title: '字段标识',
      required: true,
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
    'ui.required': {
      type: 'string',
      title: '必填',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
};
