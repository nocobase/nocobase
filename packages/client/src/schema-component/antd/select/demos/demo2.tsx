/**
 * title: Select
 */
import { FormItem } from '@formily/antd';
import { SchemaComponent, SchemaComponentProvider, Select } from '@nocobase/client';
import React from 'react';

const schema = {
  type: 'object',
  properties: {
    editable: {
      type: 'string',
      title: `Editable`,
      'x-decorator': 'FormItem',
      'x-component': 'Select.Object',
      'x-component-props': {
        fieldNames: { label: 'title', value: 'id' },
      },
      enum: [
        {
          title: '福建',
          id: 'FJ',
        },
        { title: '江苏', id: 'XZ' },
        { title: '浙江', id: 'ZX' },
      ],
      'x-reactions': {
        target: 'read',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
      },
    },
    read: {
      type: 'string',
      title: `Read pretty`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Select.Object',
      'x-component-props': {
        fieldNames: { label: 'title', value: 'id' },
      },
      enum: [
        {
          title: '福建',
          id: 'FuJian',
          children: [
            { title: '福州', id: 'FZ' },
            { title: '莆田', id: 'PT' },
          ],
        },
        { title: '江苏', id: 'XZ' },
        { title: '浙江', id: 'ZX' },
      ],
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Select, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
