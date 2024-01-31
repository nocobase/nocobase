import { ISchema, useForm } from '@formily/react';
import {
  Action,
  Application,
  BlockSchemaComponentProvider,
  CollectionField,
  CollectionPlugin,
  CurrentUserProvider,
  FormBlockProvider,
  FormItem,
  FormV2,
  Input,
  Password,
  SchemaComponent,
  useFormBlockContext,
} from '@nocobase/client';
import { notification } from 'antd';
import React from 'react';
import { useFilterByTk } from '../../../../block-provider/BlockProvider';
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
      },
      properties: {
        form: {
          type: 'void',
          'x-component': 'FormV2',
          'x-component-props': {
            useProps: '{{ useFormBlockProps }}',
          },
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

const app = new Application({
  apiClient,
  collectionManager: {
    collections: collections as any,
  },
  plugins: [CollectionPlugin],
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
