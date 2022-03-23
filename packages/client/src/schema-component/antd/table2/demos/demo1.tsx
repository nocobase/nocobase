import { ArrayField } from '@formily/core';
import { ISchema, useField } from '@formily/react';
import { Input, SchemaComponent, SchemaComponentProvider, TableBlockProvider, TableV2 } from '@nocobase/client';
import React from 'react';

const useEvents = () => {
  const field = useField<ArrayField>();
  return {
    onLoad() {
      field.value = [
        { id: 1, name: 'Name1' },
        { id: 2, name: 'Name2' },
        { id: 3, name: 'Name3' },
        { id: 4, name: 'Name4' },
        { id: 5, name: 'Name5' },
        { id: 6, name: 'Name6' },
      ];
    },
  };
};

const schema: ISchema = {
  type: 'object',
  properties: {
    block: {
      type: 'void',
      'x-decorator': 'TableBlockProvider',
      properties: {
        input: {
          type: 'array',
          title: `编辑模式`,
          default: [
            { id: 1, name: 'Name1' },
            { id: 2, name: 'Name2' },
            { id: 3, name: 'Name3' },
          ],
          'x-component': 'TableV2',
          'x-component-props': {
            rowKey: 'id',
            rowSelection: {
              type: 'checkbox',
            },
            useEvents,
          },
          properties: {
            column1: {
              type: 'void',
              title: 'Name',
              'x-component': 'TableV2.Column',
              properties: {
                name: {
                  type: 'string',
                  'x-component': 'Input',
                  'x-read-pretty': true,
                },
              },
            },
          },
        },
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ TableBlockProvider, TableV2, Input }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
