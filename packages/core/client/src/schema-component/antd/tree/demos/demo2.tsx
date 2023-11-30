
import { ISchema, useForm } from '@formily/react';
import {
  APIClientProvider,
  AntdSchemaComponentProvider,
  BlockSchemaComponentProvider,
  CollectionManagerProvider,
  SchemaComponent,
  SchemaComponentProvider,
  useFormBlockContext,
  useTableBlockContext,
  useTreeBlockProps
} from '@nocobase/client';
import { notification } from 'antd';
import React from 'react';
import { mockAPIClient } from '../../../../testUtils';
import collections from './collections';

const { apiClient, mockRequest } = mockAPIClient();
const sleep = (value: number) => new Promise((resolve) => setTimeout(resolve, value));

mockRequest.onGet('/users:list').reply(async (config) => {
  await sleep(200);
  return [
    200,
    {
      data: [
        {
          title: 'parent 1',
          id: 1,
          parentId: 0
        },
        {
          title: 'parent 1-1',
          id: 2,
          parentId: 1
        },
        {
          title: 'parent 1-2',
          id: 3,
          parentId: 1
        },
        {
          title: 'parent 2',
          id: 4,
          parentId: 0
        },
        {
          title: 'parent 2-1',
          id: 5,
          parentId: 4
        },
        {
          title: 'parent 2-2',
          id: 6,
          parentId: 4
        },
      ],
      expandedKeys: [1]
    },
  ];
});

mockRequest.onGet('/users:get').reply(async (config) => {
  const { filterByTk } = config.params;
  await sleep(200);
  return [
    200,
    {
      data: {
        id: filterByTk,
        title: `name${filterByTk}`,
      },
    },
  ];
});

mockRequest.onPost('/users:create').reply(async (config) => {
  await sleep(200);
  notification.success({
    message: config.data,
  });
  return [
    200,
    {
      data: JSON.parse(config.data),
    },
  ];
});

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
      await ctx.resource.create({
        values: form.values,
      });
    },
  };
}



const schema: ISchema = {
  type: 'object',
  properties: {
    block: {
      type: 'void',
      'x-decorator': 'TreeBlockProvider',
      'x-decorator-props': {
        collection: 'users',
        resource: 'users',
        action: 'list',
        showIndex: true,
        dragSort: false,
      },
      properties: {
        tree: {
          type: 'object',
          title: `编辑模式`,
          'x-component': 'Tree',
          'x-component-props': {
            useProps: '{{ useTreeBlockProps }}',
          },

        },
      },
    },
  },
};
export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponentProvider>
        <CollectionManagerProvider collections={collections.data}>
          <AntdSchemaComponentProvider>
            <BlockSchemaComponentProvider>
              <SchemaComponent schema={schema} scope={{ useCreateAction, useTreeBlockProps }} />
            </BlockSchemaComponentProvider>
          </AntdSchemaComponentProvider>
        </CollectionManagerProvider>
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
