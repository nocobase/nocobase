import React from 'react';
import { createForm } from '@formily/core';
import { SchemaRenderer } from '../../';
import { observer, connect, useField } from '@formily/react';

const schema = {
  type: 'void',
  name: 'action1',
  title: 'ModalForm',
  'x-component': 'Action',
  'x-component-props': {},
  properties: {
    modal1: {
      type: 'void',
      title: '对话框标题',
      'x-decorator': 'Form',
      'x-component': 'Action.Modal',
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
        },
      },
    },
  },
};

const form = createForm();

export default observer(() => {
  return (
    <div>
      <SchemaRenderer form={form} schema={schema} />
    </div>
  );
});
