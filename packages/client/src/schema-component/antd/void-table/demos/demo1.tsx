/**
 * title: 勾选
 */
import { FormItem } from '@formily/antd';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import {
  APIClient,
  APIClientProvider,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  useAPIClient,
  VoidTable
} from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import _ from 'lodash';
import React from 'react';

const schema: ISchema = {
  type: 'object',
  properties: {
    hello: {
      'x-component': 'Hello',
    },
    input: {
      'x-uid': 'input',
      type: 'array',
      title: `编辑模式`,
      'x-decorator': 'FormItem',
      'x-component': 'VoidTable',
      'x-component-props': {
        rowKey: 'id',
        rowSelection: {
          type: 'checkbox',
        },
        request: {
          resource: 'posts',
          action: 'list',
          params: {
            filter: {},
            fields: [],
            page: 2,
            pageSize: 20,
          },
        },
        dataSource: [
          { id: 1, name: 'Name1' },
          { id: 2, name: 'Name2' },
          { id: 3, name: 'Name3' },
        ],
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

const api = new APIClient();

const mock = new MockAdapter(api.axios);

const sleep = (value: number) => new Promise((resolve) => setTimeout(resolve, value));

mock.onGet('/posts:list').reply(async (config) => {
  // const [{ pageSize }] = config.params;
  const pageSize = config.params.pageSize || 10;
  console.log(pageSize);
  await sleep(1000);
  return [
    200,
    {
      data: _.range(pageSize).map((v) => {
        return {
          id: v,
          name: `tttt${uid()}`,
        };
      }),
      meta: {
        count: 100,
      },
    },
  ];
});

const Hello = () => {
  const api = useAPIClient();
  return (
    <div
      onClick={() => {
        api.services.input.refresh();
      }}
    >
      Hello
    </div>
  );
};

export default () => {
  return (
    <APIClientProvider apiClient={api}>
      <SchemaComponentProvider components={{ Hello, Input, VoidTable, FormItem }}>
        <SchemaComponent schema={schema} />
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
