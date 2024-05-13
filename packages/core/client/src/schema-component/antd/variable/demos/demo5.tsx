import { FormItem } from '@formily/antd-v5';
import { SchemaComponent, SchemaComponentProvider, Variable } from '@nocobase/client';
import React from 'react';

const scope = [
  { title: 'v1', name: 'test-v1' },
  { title: 'nested', name: 'nested', children: [{ title: 'v2', name: 'nested-v2' }] },
];

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: `显示具体值`,
      'x-decorator': 'FormItem',
      'x-component': 'Variable.RawTextArea',
      'x-component-props': {
        scope,
        changeOnSelect: true,
        autoSize: {
          minRows: 10,
        },
        fieldNames: {
          value: 'name',
          label: 'title',
        },
        placeholder: 'https://www.nocobase.com',
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
