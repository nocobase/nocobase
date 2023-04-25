import { ISchema } from '@formily/react';
import {
  AntdSchemaComponentProvider,
  APIClient,
  APIClientProvider,
  BlockSchemaComponentProvider,
  CollectionManagerProvider,
  RecordProvider,
  SchemaComponent,
  SchemaComponentProvider,
} from '@nocobase/client';
import React from 'react';
import collections from './collections';

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
        useParams: '{{ useParamsFromRecord }}',
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

const apiClient = new APIClient({
  baseURL: 'http://localhost:3000/api',
});

const record = {
  id: 1,
};

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponentProvider>
        <CollectionManagerProvider collections={collections.data}>
          <AntdSchemaComponentProvider>
            <BlockSchemaComponentProvider>
              <RecordProvider record={record}>
                <SchemaComponent schema={schema} />
              </RecordProvider>
            </BlockSchemaComponentProvider>
          </AntdSchemaComponentProvider>
        </CollectionManagerProvider>
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
