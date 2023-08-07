/**
 * title: Select
 */
import { FormItem } from '@formily/antd-v5';
import { ISchema } from '@formily/react';
import { SchemaComponent, SchemaComponentProvider, Select } from '@nocobase/client';
import React from 'react';

const options = [
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
];

const schema: ISchema = {
  type: 'object',
  properties: {
    editable: {
      type: 'object',
      title: `Editable`,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        // mode: 'tags',
        objectValue: true,
        fieldNames: { label: 'title', value: 'id' },
        options,
      },
      default: { title: '福州', id: 'FZ' },
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
      type: 'object',
      title: `Read pretty`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        // mode: 'tags',
        objectValue: true,
        fieldNames: { label: 'title', value: 'id' },
        options,
      },
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
