/**
 * title: 勾选
 */
import { ISchema } from '@formily/react';
import {
  APIClientProvider,
  Input,
  RowSelection,
  SchemaComponent,
  SchemaComponentProvider,
  useAPIClient
} from '@nocobase/client';
import React from 'react';
import { apiClient } from './apiClient';

const schema: ISchema = {
  type: 'object',
  properties: {
    hello: {
      'x-component': 'Hello',
    },
    table1: {
      type: 'string',
      default: 1,
      'x-uid': 'input',
      'x-component': 'RowSelection',
      'x-component-props': {
        rowKey: 'id',
        rowSelection: {
          type: 'radio',
        },
        pagination: {
          // current: 2,
          pageSize: 2,
        },
        request: {
          resource: 'posts',
          action: 'list',
          params: {
            filter: {},
            // pageSize: 5,
          },
        },
      },
      properties: {
        column1: {
          type: 'void',
          title: 'Name',
          'x-component': 'RowSelection.Column',
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
};

const Hello = () => {
  const api = useAPIClient();
  return (
    <div
      onClick={() => {
        const service = api.service('input');
        if (!service) {
          return;
        }
        service.run({ ...service.params[0], page: 3 });
      }}
    >
      Hello
    </div>
  );
};

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponentProvider components={{ Hello, Input, RowSelection }}>
        <SchemaComponent schema={schema} />
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
