/**
 * title: Filter
 */
import { observer, useForm } from '@formily/react';
import { AntdSchemaComponentProvider, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';

const schema = {
  type: 'void',
  properties: {
    demo: {
      name: 'filter',
      type: 'array',
      'x-component': 'Filter',
      'x-component-props': {
        onChange: (value) => {
          console.log('=====', JSON.stringify(value, null, 2));
        },
      },
      default: {
        and: [
          {
            field1: {
              eq: 'aa',
            },
          },
          {
            field1: {
              eq: 500,
            },
          },
        ],
      },
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
              type: 'number',
              'x-component': 'InputNumber',
            },
          },
        },
      },
    },
    output: {
      type: 'string',
      'x-component': 'Output',
    },
  },
};

const Output = observer(() => {
  const form = useForm();
  return <pre>{JSON.stringify(form.values, null, 2)}</pre>;
});

export default () => {
  return (
    <SchemaComponentProvider>
      <AntdSchemaComponentProvider>
        <SchemaComponent components={{ Output }} schema={schema} />
      </AntdSchemaComponentProvider>
    </SchemaComponentProvider>
  );
};
