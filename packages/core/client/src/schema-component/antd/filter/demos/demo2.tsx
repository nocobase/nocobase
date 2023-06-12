import { AntdSchemaComponentProvider, Filter, Input, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';

const options = [
  {
    name: 'name',
    title: 'Name',
    operators: [
      { label: 'eq', value: '$eq' },
      { label: 'ne', value: '$ne' },
    ],
    schema: {
      type: 'string',
      title: 'Name',
      'x-component': 'Input',
    },
  },
  {
    name: 'age',
    title: 'Age',
    operators: [
      { label: 'in', value: '$in' },
      { label: 'not', value: '$not' },
    ],
    schema: {
      type: 'string',
      title: 'Age',
      'x-component': 'InputNumber',
    },
  },
  {
    name: 'tags',
    title: 'Tags',
    schema: {
      title: 'Tags',
    },
    children: [
      {
        name: 'slug',
        title: 'Slug',
        operators: [
          { label: 'in', value: '$in' },
          { label: 'not', value: '$not' },
        ],
        schema: {
          title: 'Slug',
          type: 'string',
          'x-component': 'Input',
        },
      },
      {
        name: 'title',
        title: 'Title',
        operators: [
          { label: 'eq', value: '$eq' },
          { label: 'ne', value: '$ne' },
        ],
        schema: {
          title: 'Title',
          type: 'string',
          'x-component': 'Input',
        },
      },
    ],
  },
];

const defaultValue = {
  $or: [
    {
      name: {
        $ne: null,
      },
    },
    {
      'tags.title': {
        $eq: 'aaa',
      },
    },
  ],
};

const schema: any = {
  type: 'void',
  properties: {
    demo: {
      name: 'filter',
      type: 'object',
      enum: options,
      default: defaultValue,
      'x-component': 'Filter',
      'x-component-props': {},
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider>
      <AntdSchemaComponentProvider>
        <SchemaComponent components={{ Input, Filter }} schema={schema} />
      </AntdSchemaComponentProvider>
    </SchemaComponentProvider>
  );
};
