import { connect, ISchema, observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { SchemaComponent, SchemaComponentProvider, Tree } from '@nocobase/client';
import React from 'react';


const schema: ISchema = {
  type: 'object',
  properties: {
    objArr: {
      type: 'array',
      'x-component': 'Tree',
      'x-component-props': {
        treeData: [
          {
            title: 'parent 1-0',
            id: '0-0-0',
            parentId: null,
            disabled: true,
          },
          {
            title: 'parent 1-1',
            key: '0-0-1',
            parentId: '0-0-0',
            children: [{ title: <span style={{ color: '#1677ff' }}>sss</span>, key: '0-0-1-0' }],
          },
        ],
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Tree }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
