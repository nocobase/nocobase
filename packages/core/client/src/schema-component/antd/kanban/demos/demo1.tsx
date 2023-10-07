import { ISchema } from '@formily/react';
import {
  AntdSchemaComponentProvider,
  APIClientProvider,
  BlockSchemaComponentProvider,
  CollectionManagerProvider,
  CurrentUserProvider,
  SchemaComponent,
  SchemaComponentProvider,
} from '@nocobase/client';
import React from 'react';
import { mockAPIClient } from '../../../../testUtils';
import collections from './collections';
import data from './data';

const { apiClient, mockRequest } = mockAPIClient();
const sleep = (value: number) => new Promise((resolve) => setTimeout(resolve, value));

mockRequest.onGet('/t_j6omof6tza8:list').reply(async (config) => {
  await sleep(200);
  return [200, data];
});
mockRequest.onGet('/auth:check').reply(() => {
  return [200, { data: {} }];
});

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

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <CurrentUserProvider>
        <SchemaComponentProvider>
          <CollectionManagerProvider collections={collections}>
            <AntdSchemaComponentProvider>
              <BlockSchemaComponentProvider>
                <SchemaComponent schema={schema} />
              </BlockSchemaComponentProvider>
            </AntdSchemaComponentProvider>
          </CollectionManagerProvider>
        </SchemaComponentProvider>
      </CurrentUserProvider>
    </APIClientProvider>
  );
};
