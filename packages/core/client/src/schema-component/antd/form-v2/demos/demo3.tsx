import { ISchema } from '@formily/react';
import { default as React } from 'react';
import { Action, FormItem, FormV2, Grid, Input, Password } from '../../..';
import { Application } from '../../../../application/Application';
import { Plugin } from '../../../../application/Plugin';
import { BlockSchemaComponentProvider } from '../../../../block-provider/BlockSchemaComponentProvider';
import { FormBlockProvider } from '../../../../block-provider/FormBlockProvider';
import { CollectionPlugin } from '../../../../collection-manager/collectionPlugin';
import { CollectionField } from '../../../../data-source/collection-field/CollectionField';
import { LocalDataSource } from '../../../../data-source/data-source/DataSource';
import {
  DEFAULT_DATA_SOURCE_KEY,
  DEFAULT_DATA_SOURCE_TITLE,
} from '../../../../data-source/data-source/DataSourceManager';
import { mockAPIClient } from '../../../../testUtils';
import { CurrentUserProvider } from '../../../../user/CurrentUserProvider';
import { SchemaComponent } from '../../../core/SchemaComponent';
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
        filterByTk: 1,
      },
      properties: {
        form: {
          type: 'void',
          'x-component': 'FormV2',
          'x-use-component-props': 'useFormBlockProps',
          'x-read-pretty': true,
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
