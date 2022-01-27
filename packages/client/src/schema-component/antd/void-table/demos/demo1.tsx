/**
 * title: 勾选
 */
import { ISchema } from '@formily/react';
import {
  APIClientProvider,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  useAPIClient,
  VoidTable
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
      type: 'void',
      'x-uid': 'input',
      'x-component': 'VoidTable',
      'x-component-props': {
        rowKey: 'id',
        rowSelection: {
          type: 'checkbox',
        },
        pagination: {
          current: 2,
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
          'x-component': 'VoidTable.Column',
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
      <SchemaComponentProvider components={{ Hello, Input, VoidTable }}>
        <SchemaComponent schema={schema} />
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
