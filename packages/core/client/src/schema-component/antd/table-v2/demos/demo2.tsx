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
      'x-decorator': 'TableFieldProvider',
      'x-decorator-props': {
        collection: 't_ab12qiwruwk',
        association: 't_j6omof6tza8.f_jj9cyhron1d',
        resource: 't_j6omof6tza8.f_jj9cyhron1d',
        action: 'list',
        params: {
          // pageSize: 999,
          paginate: false,
        },
        showIndex: true,
        dragSort: false,
      },
      properties: {
        button: {
          type: 'void',
          title: '打开',
          'x-component': 'Action',
          'x-component-props': {},
          properties: {
            drawer: {
              'x-component': 'Action.Drawer',
              type: 'void',
              title: 'Drawer Title',
              properties: {
                hello1: {
                  'x-content': 'Hello',
                  title: 'T1',
                },
              },
            },
          },
        },
        table: {
          type: 'array',
          'x-component': 'TableV2',
          'x-component-props': {
            rowKey: 'id',
            rowSelection: {
              type: 'checkbox',
            },
            useProps: '{{ useTableFieldProps }}',
          },
          properties: {
            column1: {
              type: 'void',
              title: 'Name',
              'x-component': 'TableV2.Column',
              properties: {
                f_m7ibo1vrvnm: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
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

// const mock = (api: APIClient) => {
//   const mock = new MockAdapter(api.axios);

//   mock.onGet('/users:list').reply(async (config) => {
//     const { page = 1, pageSize = 10 } = config.params;
//     await sleep(2000);
//     return [
//       200,
//       {
//         data: range(0, pageSize).map((index) => {
//           return {
//             id: index + (page - 1) * pageSize,
//             nickname: uid(),
//           };
//         }),
//         meta: { count: 100, page, pageSize },
//       },
//     ];
//   });
// };

// mock(apiClient);

const record = {
  id: 40,
  createdAt: '2022-03-09T00:19:13.743Z',
  updatedAt: '2022-03-12T05:39:40.670Z',
  createdById: 1,
  updatedById: 1,
  f_1ckuegfab9s: null,
  f_a4z4h45vi5b: null,
  f_cht6rsiiiko: null,
  f_d93g4r08krl: '1',
  f_f7txg1oc3nt: '2022-03-09T00:19:13.743Z',
  f_g8j5jvalqh0: '开源协议',
  f_hpmvdltzs6m: null,
  f_tegyd222bcc: null,
  f_yc8jbfiqfvh: 'c4hobfb5k07',
  f_z27302tl2bf: 'vx4bhmtsuus',
  f_zek99qhv0vc: '2022-03-12T05:39:40.670Z',
  f_u007sq2jg93: [],
  f_jj9cyhron1d: [
    {
      id: 4,
      createdAt: '2022-03-09T00:19:13.756Z',
      updatedAt: '2022-03-12T05:39:40.703Z',
      f_yzivojrp6l8: 40,
      createdById: 1,
      updatedById: 1,
      f_4mpiovytw4d: null,
      f_m7ibo1vrvnm: '协议修改为 Apache',
    },
    {
      id: 5,
      createdAt: '2022-03-09T00:19:13.766Z',
      updatedAt: '2022-03-12T05:39:40.708Z',
      f_yzivojrp6l8: 40,
      createdById: 1,
      updatedById: 1,
      f_4mpiovytw4d: null,
      f_m7ibo1vrvnm: '调整开源范围',
    },
    {
      id: 6,
      createdAt: '2022-03-09T00:19:13.772Z',
      updatedAt: '2022-03-12T05:39:40.713Z',
      f_yzivojrp6l8: 40,
      createdById: 1,
      updatedById: 1,
      f_4mpiovytw4d: null,
      f_m7ibo1vrvnm: '代码里补充完整版权信息',
    },
  ],
  f_ooar0pto2ko: [],
  f_2dpc76bszit: {
    id: 1,
    createdAt: '2022-03-06T09:41:36.042Z',
    updatedAt: '2022-03-22T02:36:45.960Z',
    appLang: 'zh-CN',
    email: 'admin@nocobase.com',
    nickname: 'Super Admin',
  },
  f_ksgzy9vmgce: [],
  f_47f2d9wgofm: [],
  f_qmlomqm7lvb: [],
};

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponentProvider>
        <RecordProvider record={record}>
          <CollectionManagerProvider collections={collections.data}>
            <AntdSchemaComponentProvider>
              <BlockSchemaComponentProvider>
                <SchemaComponent schema={schema} />
              </BlockSchemaComponentProvider>
            </AntdSchemaComponentProvider>
          </CollectionManagerProvider>
        </RecordProvider>
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
