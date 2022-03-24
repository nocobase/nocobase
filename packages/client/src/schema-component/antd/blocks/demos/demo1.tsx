import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import {
  AntdSchemaComponentProvider,
  APIClient,
  APIClientProvider,
  CollectionManagerProvider,
  SchemaComponent,
  SchemaComponentProvider,
  useFormBlockContext,
  useFormBlockProps,
  useRecord,
  useTableBlockContext,
  useTableBlockProps
} from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import { range } from 'lodash';
import React from 'react';
import collections from './collections';

function useAction() {
  const ctx = useTableBlockContext();
  return {
    async run() {
      const params = ctx.service.params?.[0] || {};
      ctx.service.run({ ...params, page: 2 });
    },
  };
}

function useCreateAction() {
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

const formSchema: ISchema = {
  type: 'void',
  'x-decorator': 'FormBlockProvider',
  'x-decorator-props': {
    collection: 'users',
    resource: 'users',
    action: 'get',
    useParams() {
      const record = useRecord();
      return {
        filterByTk: record.id,
      };
    },
    // params: {
    //   pageSize: 2,
    // },
  },
  properties: {
    form: {
      type: 'void',
      'x-component': 'FormBlock',
      'x-component-props': {
        useProps: '{{ useFormBlockProps }}',
      },
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
            useAction: '{{ useCreateAction }}',
          },
        },
      },
    },
  },
};

const schema: ISchema = {
  type: 'object',
  properties: {
    block: {
      type: 'void',
      'x-decorator': 'TableBlockProvider',
      'x-decorator-props': {
        collection: 'users',
        resource: 'users',
        action: 'list',
        params: {
          pageSize: 2,
        },
      },
      properties: {
        button: {
          title: '刷新',
          'x-component': 'Action',
          'x-component-props': {
            useAction,
          },
        },
        table: {
          type: 'array',
          title: `编辑模式`,
          'x-component': 'TableBlock',
          'x-component-props': {
            rowKey: 'id',
            rowSelection: {
              type: 'checkbox',
            },
            useProps: '{{ useTableBlockProps }}',
          },
          properties: {
            column1: {
              type: 'void',
              title: 'Name',
              'x-component': 'TableBlock.Column',
              properties: {
                nickname: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              },
            },
            actions: {
              type: 'void',
              title: 'Actions',
              'x-component': 'TableBlock.Column',
              properties: {
                view: {
                  type: 'void',
                  title: 'View',
                  'x-component': 'Action',
                  'x-component-props': {},
                  properties: {
                    drawer: {
                      'x-component': 'Action.Drawer',
                      type: 'void',
                      title: 'Drawer Title',
                      properties: {
                        formSchema,
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

const sleep = (value: number) => new Promise((resolve) => setTimeout(resolve, value));

const apiClient = new APIClient({
  baseURL: 'http://localhost:3000/api',
});

const mock = (api: APIClient) => {
  const mock = new MockAdapter(api.axios);

  mock.onGet('/users:list').reply(async (config) => {
    const { page = 1, pageSize = 10 } = config.params;
    await sleep(2000);
    return [
      200,
      {
        data: range(0, pageSize).map((index) => {
          return {
            id: index + (page - 1) * pageSize,
            nickname: uid(),
          };
        }),
        meta: { count: 100, page, pageSize },
      },
    ];
  });

  mock.onGet('/users:get').reply(async (config) => {
    const { filterByTk } = config.params;
    await sleep(2000);
    return [
      200,
      {
        data: {
          id: filterByTk,
          nickname: filterByTk,
        },
      },
    ];
  });
};

mock(apiClient);

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponentProvider>
        <CollectionManagerProvider collections={collections.data}>
          <AntdSchemaComponentProvider>
            <SchemaComponent schema={schema} scope={{ useCreateAction, useTableBlockProps, useFormBlockProps }} />
          </AntdSchemaComponentProvider>
        </CollectionManagerProvider>
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
