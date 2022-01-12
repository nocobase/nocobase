import React from 'react';
import { Table } from 'antd';
import MockAdapter from 'axios-mock-adapter';
import {
  APIClientProvider,
  SchemaComponentProvider,
  SchemaComponent,
  useRequest,
  APIClient,
  AsyncDataProvider,
  useAsyncData,
} from '@nocobase/client';

const apiClient = new APIClient();

const mock = new MockAdapter(apiClient.axios);

mock.onGet('/users').reply(200, {
  data: [
    { id: 1, name: 'John Smith' },
    { id: 2, name: 'Mike' },
  ],
});

const TableView = (props) => {
  const { data, loading } = useAsyncData();
  return <Table {...props} dataSource={data?.data} loading={loading} />;
};

const AsyncDataTableView = (props) => {
  const { request, ...others } = props;
  return (
    <AsyncDataProvider request={request}>
      <TableView {...others} />
    </AsyncDataProvider>
  );
};

export default () => {
  return (
    <APIClientProvider apiClient={apiClient}>
      <SchemaComponentProvider components={{ TableView, AsyncDataTableView, AsyncDataProvider }}>
        <SchemaComponent
          schema={{
            properties: {
              table1: {
                type: 'void',
                'x-decorator': 'AsyncDataProvider',
                'x-decorator-props': {
                  request: { url: '/users' },
                },
                'x-component': 'TableView',
                'x-component-props': {
                  rowKey: 'id',
                  columns: [
                    {
                      title: 'Name',
                      dataIndex: 'name',
                      key: 'name',
                    },
                  ],
                },
              },
              table2: {
                type: 'void',
                'x-component': 'AsyncDataTableView',
                'x-component-props': {
                  request: { url: '/users' },
                  rowKey: 'id',
                  columns: [
                    {
                      title: 'Name',
                      dataIndex: 'name',
                      key: 'name',
                    },
                  ],
                },
              },
            },
          }}
        />
      </SchemaComponentProvider>
    </APIClientProvider>
  );
};
