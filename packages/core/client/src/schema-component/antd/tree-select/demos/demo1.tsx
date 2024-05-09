/**
 * title: TreeSelect
 */
import { FormItem } from '@formily/antd-v5';
import { SchemaComponent, SchemaComponentProvider, TreeSelect } from '@nocobase/client';
import React from 'react';

const dataSource = [
  {
    label: '选项1',
    value: 1,
    children: [
      {
        label: 'Child Node1',
        value: '0-0-0',
      },
      {
        label: 'Child Node2',
        value: '0-0-1',
      },
      {
        label: 'Child Node3',
        value: '0-0-2',
      },
    ],
  },
  {
    label: '选项2',
    value: 2,
    children: [
      {
        label: 'Child Node1',
        value: '0-1-0',
      },
      {
        label: 'Child Node2',
        value: '0-1-1',
      },
      {
        label: 'Child Node3',
        value: '0-1-2',
      },
    ],
  },
];
const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: `Editable`,
      'x-decorator': 'FormItem',
      'x-component': 'TreeSelect',
      'x-component-props': {
        treeData: dataSource,
      },
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
      'x-component': 'TreeSelect',
      'x-component-props': {
        treeData: dataSource,
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ TreeSelect, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
