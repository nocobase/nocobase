import { ISchema } from '@formily/react';
import {
  AntdSchemaComponentProvider,
  APIClient,
  APIClientProvider,
  BlockSchemaComponentProvider,
  CollectionManagerProvider,
  SchemaComponent,
  SchemaComponentProvider,
} from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';
import collections from './collections';
import data from './data';

const schema: ISchema = {
  type: 'object',
  properties: {
    block: {
      type: 'void',
      'x-decorator': 'KanbanBlockProvider',
      'x-decorator-props': {
        collection: 't_j6omof6tza8',
        resource: 't_j6omof6tza8',
        action: 'list',
        groupField: 'f_hpmvdltzs6m',
        params: {
          paginate: false,
        },
      },
      properties: {
        kanban: {
          type: 'array',
          'x-component': 'Kanban',
          'x-component-props': {
            useProps: '{{ useKanbanBlockProps }}',
          },
          properties: {
            card: {
              type: 'void',
              'x-component': 'Kanban.Card',
              properties: {
                f_g8j5jvalqh0: {
                  'x-decorator': 'FormItem',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
                f_tegyd222bcc: {
                  'x-decorator': 'FormItem',
                  'x-component': 'CollectionField',
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

const sleep = (value: number) => new Promise((resolve) => setTimeout(resolve, value));

const apiClient = new APIClient({
  baseURL: 'http://localhost:3000/api',
});

const mock = (api: APIClient) => {
  const mock = new MockAdapter(api.axios);
  mock.onGet('/t_j6omof6tza8:list').reply(async (config) => {
    await sleep(200);
    return [200, data];
  });
};

mock(apiClient);

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponentProvider>
        <CollectionManagerProvider collections={collections.data}>
          <AntdSchemaComponentProvider>
            <BlockSchemaComponentProvider>
              <SchemaComponent schema={schema} />
            </BlockSchemaComponentProvider>
          </AntdSchemaComponentProvider>
        </CollectionManagerProvider>
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
