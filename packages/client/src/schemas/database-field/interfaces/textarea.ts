import { ISchema } from '@formily/react';

export const textarea: ISchema = {
  type: 'object',
  title: '多行文本',
  default: {
    dataType: 'text',
    // name,
    ui: {
      type: 'string',
      // title,
      'x-component': 'Input.TextArea',
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
    'ui.required': {
      type: 'string',
      title: '必填',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
};
