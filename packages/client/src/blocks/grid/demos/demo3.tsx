import React, { useMemo } from 'react';
import { FormProvider, FormConsumer, useField, useFieldSchema } from '@formily/react';
import { createForm } from '@formily/core';
import {
  SchemaFieldWithDesigner,
  registerFieldComponents,
} from '../../../fields';
import { grid, row, column, block } from '../utils';
import { blocks2properties } from '../utils';
import { Card } from 'antd';

function Designer(props) {
  const form = useMemo(() => createForm({}), []);
  const { schema } = props;
  return (
    <div>
      <FormProvider form={form}>
        <SchemaFieldWithDesigner schema={schema} />
        {/* <FormConsumer>
          {(form) => {
            return <div>{JSON.stringify(form.values, null, 2)}</div>;
          }}
        </FormConsumer> */}
      </FormProvider>
    </div>
  );
}

function Hello(props) {
  const schema = useFieldSchema();
  return (
    <div style={{ marginBottom: 24, padding: '1rem', background: '#f9f9f9', minHeight: 50, lineHeight: '50px' }}>
      Hello {schema.title}
    </div>
  );
}

registerFieldComponents({ Hello, Designer, Card });

const nested = blocks2properties([
  {
    type: 'string',
    title: `Nested Block 1`,
    required: true,
    'x-read-pretty': false,
    // 'x-decorator': 'FormItem',
    'x-component': 'Hello',
    rowOrder: 1,
    columnOrder: 1,
    blockOrder: 1,
  },
  {
    type: 'string',
    title: `Nested Block 2`,
    required: true,
    'x-read-pretty': false,
    // 'x-decorator': 'FormItem',
    'x-component': 'Hello',
    rowOrder: 1,
    columnOrder: 2,
    blockOrder: 1,
  },
  {
    type: 'string',
    title: `Nested Block 3`,
    required: true,
    'x-read-pretty': false,
    // 'x-decorator': 'FormItem',
    'x-component': 'Hello',
    rowOrder: 2,
    columnOrder: 1,
    blockOrder: 1,
  },
]);

const blocks = [
  {
    type: 'string',
    title: `Block 1`,
    required: true,
    'x-read-pretty': false,
    // 'x-decorator': 'FormItem',
    'x-component': 'Hello',
    rowOrder: 1,
    columnOrder: 1,
    blockOrder: 1,
  },
  {
    type: 'string',
    title: `Block 2`,
    required: true,
    'x-read-pretty': false,
    // 'x-decorator': 'FormItem',
    'x-component': 'Hello',
    rowOrder: 1,
    columnOrder: 2,
    blockOrder: 1,
  },
  {
    type: 'string',
    title: `Block 3`,
    required: true,
    'x-read-pretty': false,
    // 'x-decorator': 'FormItem',
    'x-component': 'Hello',
    rowOrder: 2,
    columnOrder: 1,
    blockOrder: 1,
  },
  {
    type: 'string',
    title: `Block 4`,
    required: true,
    'x-read-pretty': false,
    // 'x-decorator': 'FormItem',
    'x-component': 'Hello',
    rowOrder: 1,
    columnOrder: 1,
    blockOrder: 2,
  },
  {
    type: 'string',
    title: `Block 5`,
    required: true,
    'x-read-pretty': false,
    // 'x-decorator': 'FormItem',
    'x-component': 'Hello',
    rowOrder: 3,
    columnOrder: 1,
    blockOrder: 1,
  },
  {
    type: 'string',
    title: `Block 6`,
    required: true,
    'x-read-pretty': false,
    // 'x-decorator': 'FormItem',
    'x-component': 'Hello',
    rowOrder: 3,
    columnOrder: 2,
    blockOrder: 1,
  },
  {
    type: 'string',
    title: `Block 7`,
    required: true,
    'x-read-pretty': false,
    'x-decorator': 'Card',
    'x-decorator-props': {
      title: '内嵌区块（只能在当前区域内部拖拽）',
    },
    'x-component': 'Designer',
    'x-component-props': {
      schema: {
        type: 'object',
        properties: {
          layout: {
            type: 'void',
            'x-component': 'FormLayout',
            'x-component-props': {
              layout: 'vertical',
            },
            properties: {
              [nested.name]: nested,
            },
          },
        },
      },
    },
    rowOrder: 4,
    columnOrder: 1,
    blockOrder: 1,
  },
];
const schema = blocks2properties(blocks);
export default () => {
  console.log({schema});
  return (
    <div>
      <Designer
        schema={{
          type: 'object',
          properties: {
            layout: {
              type: 'void',
              'x-component': 'FormLayout',
              'x-component-props': {
                layout: 'vertical',
              },
              properties: {
                [schema.name]: schema,
              },
            },
          },
        }}
      />
      {/* <pre>{JSON.stringify(schema, null, 2)}</pre> */}
    </div>
  );
};
