import { ISchema } from '@formily/react';
import {
  APIClientProvider,
  Action,
  BlockSchemaComponentProvider,
  CollectionField,
  CollectionManagerProvider,
  FormBlockProvider,
  FormItem,
  FormV2,
  Input,
  Password,
  SchemaComponent,
  SchemaComponentProvider,
} from '@nocobase/client';
import React from 'react';
import { mockAPIClient } from '../../../../test';
import collections from './collections';

const { apiClient, mockRequest } = mockAPIClient();

mockRequest.onGet('/users:get').reply(200, {
  data: {
    id: 1,
    nickname: '张三',
    password: '123456',
  },
});

const schema: ISchema = {
  type: 'object',
  properties: {
    block: {
      type: 'void',
      'x-decorator': 'FormBlockProvider',
      'x-decorator-props': {
        collection: 'users',
        resource: 'users',
        action: 'get',
      },
      properties: {
        form: {
          type: 'void',
          'x-component': 'FormV2',
          'x-read-pretty': true,
          'x-component-props': {
            useProps: '{{ useFormBlockProps }}',
          },
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              properties: {
                row1: {
                  type: 'void',
                  'x-component': 'Grid.Row',
                  properties: {
                    col11: {
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        nickname: {
                          type: 'string',
                          'x-decorator': 'FormItem',
                          'x-designer': 'FormItem.Designer',
                          'x-component': 'CollectionField',
                        },
                      },
                    },
                    col12: {
                      type: 'void',
                      'x-component': 'Grid.Col',
                      properties: {
                        password: {
                          type: 'string',
                          'x-decorator': 'FormItem',
                          'x-designer': 'FormItem.Designer',
                          'x-component': 'CollectionField',
                        },
                      },
                    },
                  },
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
      <CollectionManagerProvider collections={collections}>
        <SchemaComponentProvider
          components={{ FormBlockProvider, FormItem, CollectionField, Input, Action, FormV2, Password }}
        >
          <BlockSchemaComponentProvider>
            <SchemaComponent schema={schema} />
          </BlockSchemaComponentProvider>
        </SchemaComponentProvider>
      </CollectionManagerProvider>
    </APIClientProvider>
  );
};
