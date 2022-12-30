import {
  AntdSchemaComponentProvider,
  SchemaComponent,
  SchemaComponentProvider,
  Input,
  InputNumber,
} from '@nocobase/client';
import React from 'react';
import { FilterAction } from '../FilterAction';
import { Filter } from '../Filter';

const schema: any = {
  type: 'void',
  properties: {
    demo: {
      type: 'object',
      enum: [
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
      ],
      default: {
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
      },
      'x-component': 'Filter',
      'x-component-props': {},
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider>
      <AntdSchemaComponentProvider>
        <SchemaComponent components={{ Filter, Input, InputNumber }} schema={schema} />
      </AntdSchemaComponentProvider>
    </SchemaComponentProvider>
  );
};
