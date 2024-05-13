// import { FormItem } from '@formily/antd-v5';
import { SchemaComponent, SchemaComponentProvider, FormItem, Variable, DatePicker } from '@nocobase/client';
import React from 'react';

const scope = [
  { label: 'Current time', value: 'now' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Tomorrow', value: 'tomorrow' },
];

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: `自定义编辑组件`,
      'x-decorator': 'FormItem',
      'x-component': 'Variable.Input',
      'x-component-props': {
        scope,
        children: <DatePicker />,
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Variable, FormItem }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
