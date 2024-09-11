import { ISchema, useForm } from '@formily/react';
import { notification } from 'antd';
import { default as React } from 'react';
import { Action, FormItem, FormV2, Input, Password } from '../../..';
import { Application } from '../../../../application/Application';
import { Plugin } from '../../../../application/Plugin';
import { useFilterByTk } from '../../../../block-provider/BlockProvider';
import { BlockSchemaComponentProvider } from '../../../../block-provider/BlockSchemaComponentProvider';
import { FormBlockProvider, useFormBlockContext } from '../../../../block-provider/FormBlockProvider';
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

mockRequest.onPost('/users:update').reply((params) => {
  notification.success({
    message: params.data,
  });
  return [200, JSON.parse(params.data)];
});
mockRequest.onGet('/auth:check').reply(() => {
  return [200, { data: {} }];
});

const useAction = () => {
  const ctx = useFormBlockContext();
  const form = useForm();
  const filterByTk = useFilterByTk();
  return {
    async run() {
      console.log('form.values', form.values);
      await ctx.resource.update({
        filterByTk,
        values: form.values,
      });
    },
  };
};

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
          properties: {
            nickname: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
              'x-component-props': {
                className: 'nickname',
              },
            },
            password: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-designer': 'FormItem.Designer',
              'x-component': 'CollectionField',
              'x-component-props': {
                className: 'password',
              },
            },
            button: {
              title: 'Submit',
              'x-component': 'Action',
              'x-component-props': {
                htmlType: 'submit',
                type: 'primary',
                useAction,
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
  },
  providers: [Demo],
});

export default app.getRootComponent();
