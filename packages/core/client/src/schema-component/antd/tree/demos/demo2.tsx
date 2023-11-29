
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
import { range } from 'lodash';
import React from 'react';
import { mockAPIClient } from '../../../../test';
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
            // options: [
            //   {
            //     title: 'parent 1',
            //     key: '0-0',
            //     children: [
            //       {
            //         title: 'parent 1-0',
            //         key: '0-0-0',
            //         disabled: true,
            //         children: [
            //           {
            //             title: 'leaf',
            //             key: '0-0-0-0',
            //             disableCheckbox: true,
            //           },
            //           {
            //             title: 'leaf',
            //             key: '0-0-0-1',
            //           },
            //         ],
            //       },
            //       {
            //         title: 'parent 1-1',
            //         key: '0-0-1',
            //         children: [{ title: <span style={{ color: '#1677ff' }}>sss</span>, key: '0-0-1-0' }],
            //       },
            //     ],
            //   },
            // ]
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
