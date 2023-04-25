import { ISchema, useForm } from '@formily/react';
import {
  AntdSchemaComponentProvider,
  APIClient,
  APIClientProvider,
  BlockSchemaComponentProvider,
  CollectionManagerProvider,
  SchemaComponent,
  SchemaComponentProvider,
  useFormBlockContext,
} from '@nocobase/client';
import React from 'react';
import collections from './collections';

function useAction() {
  const ctx = useFormBlockContext();
  const form = useForm();
  return {
    async run() {
      console.log('form.values', form.values);
      // await ctx.resource.create({
      //   values: form.values,
      // });
    },
  };
}

const schema: ISchema = {
  type: 'object',
  properties: {
    block: {
      type: 'void',
      'x-decorator': 'FormBlockProvider',
      'x-decorator-props': {
        collection: 'users',
        resource: 'users',
      },
      properties: {
        form: {
          type: 'void',
          'x-component': 'FormV2',
          'x-component-props': {},
          properties: {
            nickname: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'CollectionField',
            },
            button: {
              title: '提交',
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

const apiClient = new APIClient({
  baseURL: 'http://localhost:3000/api',
});

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
