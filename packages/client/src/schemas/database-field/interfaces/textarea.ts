import { ISchema } from '@formily/react';

export const textarea: ISchema = {
  name: 'textarea',
  type: 'object',
  title: '多行文本',
  group: 'basic',
  default: {
    dataType: 'text',
    // name,
    uiSchema: {
      type: 'string',
      // title,
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-designable-bar': 'Markdown.DesignableBar',
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
      ],
    },
    'uiSchema.required': {
      type: 'string',
      title: '必填',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
};
