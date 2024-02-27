import { ISchema } from '@formily/react';
import {
  Action,
  Application,
  BlockSchemaComponentProvider,
  CollectionField,
  CollectionPlugin,
  CurrentUserProvider,
  DEFAULT_DATA_SOURCE_KEY,
  DEFAULT_DATA_SOURCE_TITLE,
  FormBlockProvider,
  FormItem,
  FormV2,
  Grid,
  Input,
  LocalDataSource,
  Password,
  Plugin,
  SchemaComponent,
} from '@nocobase/client';
import React from 'react';
import { mockAPIClient } from '../../../../testUtils';
import collections from './collections';

const { apiClient, mockRequest } = mockAPIClient();

mockRequest.onGet('/users:get').reply(200, {
  data: {
    id: 1,
    nickname: '张三',
    password: '123456',
  },
});
mockRequest.onGet('/auth:check').reply(() => {
  return [200, { data: {} }];
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

const Demo = () => {
  return (
    <CurrentUserProvider>
      <BlockSchemaComponentProvider>
        <SchemaComponent schema={schema} />
      </BlockSchemaComponentProvider>
    </CurrentUserProvider>
  );
};

class MyPlugin extends Plugin {
  async load() {
    this.app.dataSourceManager.addDataSource(LocalDataSource, {
      key: DEFAULT_DATA_SOURCE_KEY,
      displayName: DEFAULT_DATA_SOURCE_TITLE,
      collections: collections as any,
    });
  }
}
const app = new Application({
  apiClient,
  plugins: [CollectionPlugin, MyPlugin],
  components: {
    FormBlockProvider,
    FormItem,
    CollectionField,
    Input,
    Action,
    FormV2,
    Password,
    Grid,
  },
  providers: [Demo],
});

export default app.getRootComponent();
