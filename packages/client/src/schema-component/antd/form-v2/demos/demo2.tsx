import { ISchema, useForm } from '@formily/react';
import {
  AntdSchemaComponentProvider,
  APIClient,
  APIClientProvider,
  CollectionManagerProvider,
  RecordProvider,
  SchemaComponent,
  SchemaComponentProvider,
  useFilterByTk,
  useFormBlockContext,
  useFormBlockProps,
  useParamsFromRecord
} from '@nocobase/client';
import React from 'react';
import collections from './collections';

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
        useParams: '{{ useParamsFromRecord }}',
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
            },
            password: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-designer': 'FormItem.Designer',
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

const record = {
  id: 1,
};

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponentProvider>
        <CollectionManagerProvider collections={collections.data}>
          <AntdSchemaComponentProvider>
            <RecordProvider record={record}>
              <SchemaComponent schema={schema} scope={{ useFormBlockProps, useParamsFromRecord }} />
            </RecordProvider>
          </AntdSchemaComponentProvider>
        </CollectionManagerProvider>
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
