import { ISchema } from '@formily/react';
import {
  AntdSchemaComponentProvider,
  APIClient,
  APIClientProvider,
  Application,
  BlockSchemaComponentProvider,
  SchemaComponent,
  SchemaComponentProvider,
  ExtendCollectionsProvider,
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
      'x-decorator': 'CalendarBlockProvider',
      'x-decorator-props': {
        collection: 't_j6omof6tza8',
        resource: 't_j6omof6tza8',
        action: 'list',
        fieldNames: {
          id: 'id',
          start: 'createdAt',
          end: 'createdAt',
          title: 'f_g8j5jvalqh0',
        },
        params: {
          paginate: false,
        },
      },
      properties: {
        calendar: {
          type: 'array',
          name: 'calendar1',
          'x-component': 'CalendarV2',
          'x-component-props': {
            useProps: '{{ useCalendarBlockProps }}',
          },
          properties: {
            toolBar: {
              type: 'void',
              'x-component': 'CalendarV2.ActionBar',
              properties: {
                today: {
                  type: 'void',
                  title: '今天',
                  'x-component': 'CalendarV2.Today',
                  'x-action': 'calendar:today',
                  'x-align': 'left',
                },
                nav: {
                  type: 'void',
                  title: '翻页',
                  'x-component': 'CalendarV2.Nav',
                  'x-action': 'calendar:nav',
                  'x-align': 'left',
                },
                title: {
                  type: 'void',
                  title: '标题',
                  'x-component': 'CalendarV2.Title',
                  'x-action': 'calendar:title',
                  'x-align': 'left',
                },
                viewSelect: {
                  type: 'void',
                  title: '视图切换',
                  'x-component': 'CalendarV2.ViewSelect',
                  'x-action': 'calendar:viewSelect',
                  'x-align': 'right',
                },
              },
            },
          },
        },
      },
    },
  },
};

const apiClient = new APIClient({
  baseURL: 'http://localhost:3000/api',
});

const sleep = (value: number) => new Promise((resolve) => setTimeout(resolve, value));

const mock = (api: APIClient) => {
  const mock = new MockAdapter(api.axios);

  mock.onGet('/t_j6omof6tza8:list').reply(async (config) => {
    await sleep(2000);
    return [200, data];
  });
};

mock(apiClient);

const Root = () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponentProvider>
        <ExtendCollectionsProvider collections={collections.data as any}>
          <AntdSchemaComponentProvider>
            <BlockSchemaComponentProvider>
              <SchemaComponent schema={schema} />
            </BlockSchemaComponentProvider>
          </AntdSchemaComponentProvider>
        </ExtendCollectionsProvider>
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};

const app = new Application({
  providers: [Root],
});

export default app.getRootComponent();
