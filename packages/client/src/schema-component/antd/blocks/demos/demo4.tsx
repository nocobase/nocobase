import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import {
  AntdSchemaComponentProvider,
  APIClient,
  APIClientProvider,
  CollectionManagerProvider,
  SchemaComponent,
  SchemaComponentProvider,
  useKanbanBlockProps
} from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import { range } from 'lodash';
import React from 'react';
import collections from './collections';

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
          'x-component': 'KanbanBlock',
          'x-component-props': {
            useProps: '{{ useKanbanBlockProps }}',
          },
          properties: {
            card: {
              type: 'void',
              name: 'card',
              'x-component': 'KanbanBlock.Card',
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

  mock.onGet('/users:list').reply(async (config) => {
    const { page = 1, pageSize = 10 } = config.params;
    await sleep(2000);
    return [
      200,
      {
        data: range(0, pageSize).map((index) => {
          return {
            id: index + (page - 1) * pageSize,
            nickname: uid(),
          };
        }),
        meta: { count: 100, page, pageSize },
      },
    ];
  });

  mock.onGet('/users:get').reply(async (config) => {
    const { filterByTk } = config.params;
    await sleep(2000);
    return [
      200,
      {
        data: {
          id: filterByTk,
          nickname: filterByTk,
        },
      },
    ];
  });
};

// mock(apiClient);

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponentProvider>
        <CollectionManagerProvider collections={collections.data}>
          <AntdSchemaComponentProvider>
            <SchemaComponent schema={schema} scope={{ useKanbanBlockProps }} />
          </AntdSchemaComponentProvider>
        </CollectionManagerProvider>
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
