import { FormItem } from '@formily/antd';
import { action } from '@formily/reactive';
import { APIClient, APIClientProvider, Cascader, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';

const apiClient = new APIClient();

const mock = new MockAdapter(apiClient.axios);

mock.onGet('/china_regions').reply(200, {
  data: [
    {
      value: 'zhejiang',
      label: 'Zhejiang',
      isLeaf: false,
    },
    {
      value: 'jiangsu',
      label: 'Jiangsu',
      isLeaf: false,
    },
  ],
});

const useAsyncDataSource = (api: APIClient) => (field) => {
  field.loading = true;
  api.request({ url: 'china_regions' }).then(
    action.bound((res) => {
      field.dataSource = res?.data?.data || [];
      field.loading = false;
    }),
  );
};

const loadData = (api: APIClient) => (selectedOptions, field) => {
  const targetOption = selectedOptions[selectedOptions.length - 1];
  targetOption.loading = true;

  // load options lazily
  setTimeout(() => {
    targetOption.loading = false;
    targetOption.children = [
      {
        label: `${targetOption.label} Dynamic 1`,
        value: 'dynamic1',
      },
      {
        label: `${targetOption.label} Dynamic 2`,
        value: 'dynamic2',
      },
    ];
    field.dataSource = [...field.dataSource];
  }, 500);
}

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: `编辑模式`,
      name: 'name1',
      'x-decorator': 'FormItem',
      'x-component': 'Cascader',
      'x-component-props': {
        changeOnSelectLast: false,
        labelInValue: true,
        maxLevel: 3,
        loadData: '{{loadData(apiClient)}}',
        // fieldNames: {
        //   label: 'name',
        //   value: 'code',
        //   children: 'children',
        // },
      },
      'x-reactions': [
        '{{useAsyncDataSource(apiClient)}}',
        {
          target: 'read',
          fulfill: {
            state: {
              value: '{{$self.value}}',
            },
          },
        },
      ],
    },
    read: {
      type: 'string',
      title: `阅读模式`,
      name: 'name2',
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Cascader',
      'x-component-props': {
        changeOnSelectLast: false,
        labelInValue: true,
        maxLevel: 3,
        // fieldNames: {
        //   label: 'name',
        //   value: 'code',
        //   children: 'children',
        // },
      },
    },
  },
};

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponentProvider components={{ Cascader, FormItem }}>
        <SchemaComponent scope={{ apiClient, loadData, useAsyncDataSource }} schema={schema} />
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
