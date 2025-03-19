import { ISchema } from '@formily/json-schema';
import {
  CustomRouterContextProvider,
  Filter,
  FilterAction,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
} from '@nocobase/client';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Router } from 'react-router-dom';

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

const schema: ISchema = {
  type: 'void',
  properties: {
    demo: {
      type: 'object',
      title: 'Filter',
      enum: '{{ options }}',
      default: defaultValue,
      'x-component': 'FilterAction',
      'x-component-props': {},
    },
  },
};

export default () => {
  const history = createMemoryHistory();
  return (
    <Router location={history.location} navigator={history}>
      <CustomRouterContextProvider>
        <SchemaComponentProvider components={{ FilterAction, Filter, Input }} scope={{ options }}>
          <SchemaComponent schema={schema} />
        </SchemaComponentProvider>
      </CustomRouterContextProvider>
    </Router>
  );
};
