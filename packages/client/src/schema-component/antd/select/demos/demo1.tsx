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
      'x-component': 'Select',
      'x-component-props': {},
      enum: [
        {
          label: '福建',
          value: 'FuJian',
          children: [
            { label: '福州', value: 'FZ' },
            { label: '莆田', value: 'PT' },
          ],
        },
        { label: '江苏', value: 'XZ' },
        { label: '浙江', value: 'ZX' },
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
      'x-component': 'Select',
      'x-component-props': {},
      enum: [
        {
          label: '福建',
          value: 'FuJian',
          children: [
            { label: '福州', value: 'FZ' },
            { label: '莆田', value: 'PT' },
          ],
        },
        { label: '江苏', value: 'XZ' },
        { label: '浙江', value: 'ZX' },
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
