/**
 * title: Filter
 */
import { AntdSchemaComponentProvider, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';

const schema = {
  name: 'filter',
  type: 'object',
  'x-component': 'Filter',
  properties: {
    column1: {
      type: 'void',
      title: '字段1',
      'x-component': 'Filter.Column',
      'x-component-props': {
        operations: [
          { label: '等于', value: 'eq' },
          { label: '不等于', value: 'ne' },
        ],
      },
      properties: {
        field1: {
          type: 'string',
          'x-component': 'Input',
        },
      },
    },
    column2: {
      type: 'void',
      title: '字段2',
      'x-component': 'Filter.Column',
      'x-component-props': {
        operations: [
          { label: '大于', value: 'gt' },
          { label: '小于', value: 'lt' },
          { label: '非空', value: 'notNull', noValue: true },
        ],
      },
      properties: {
        field2: {
          type: 'string',
          'x-component': 'Input',
        },
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider>
      <AntdSchemaComponentProvider>
        <SchemaComponent schema={schema} />
      </AntdSchemaComponentProvider>
    </SchemaComponentProvider>
  );
};
