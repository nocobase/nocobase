import { ISchema } from "@formily/react";

export default {
  type: 'object',
  properties: {
    form: {
      type: 'void',
      "x-component": 'FormLayout',
      "x-component-props": {
        layout: 'vertical',
      },
      properties: {
        title: {
          type: 'string',
          title: '数据表名称',
          required: true,
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        fields: {
          type: 'array',
          title: '字段',
          'x-decorator': 'FormItem',
          'x-component': 'DatabaseField',
          default: [
            {
              id: 1,
              interface: 'string',
              dataType: 'string',
              name: 'title',
              ui: {
                title: '标题',
              },
            },
            {
              id: 2,
              dataType: 'text',
              interface: 'textarea',
              name: 'content',
              ui: {
                title: '内容',
              },
            },
          ],
        }
      }
    },
  },
} as ISchema;