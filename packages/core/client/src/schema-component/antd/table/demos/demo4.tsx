import { ISchema, observer } from '@formily/react';
import { uid } from '@formily/shared';
import {
  Action,
  Application,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  Table,
  useRecord,
  useRequest,
} from '@nocobase/client';
import React, { createContext, useContext, useState } from 'react';

const DataSourceContext = createContext(null);
DataSourceContext.displayName = 'DataSourceContext';

const useSelectedRowKeys = () => {
  const ctx = useContext(DataSourceContext);
  return [ctx.selectedRowKeys, ctx.setSelectedRowKeys];
};

const useDataSource = (options) => {
  const ctx = useContext(DataSourceContext);
  return useRequest(
    () => {
      return Promise.resolve({
        data: ctx.dataSource,
      });
    },
    {
      ...options,
      refreshDeps: [JSON.stringify(ctx.dataSource)],
    },
  );
};

const useCreateAction = () => {
  const ctx = useContext(DataSourceContext);
  return {
    async run() {
      const dataSource = ctx.dataSource || [];
      dataSource.push({
        id: uid(),
        name: uid(),
      });
      ctx.setDataSource([...dataSource]);
    },
  };
};

const useBulkDestroyAction = () => {
  const ctx = useContext(DataSourceContext);
  const { selectedRowKeys, setSelectedRowKeys } = ctx;
  return {
    async run() {
      const dataSource = ctx.dataSource || [];
      ctx.setDataSource(
        dataSource.filter((item) => {
          return !selectedRowKeys.includes(item.id);
        }),
      );
      setSelectedRowKeys([]);
    },
  };
};

const useUpdateAction = () => {
  const record = useRecord();
  const ctx = useContext(DataSourceContext);
  return {
    async run() {
      const dataSource = ctx.dataSource || [];
      ctx.setDataSource([
        ...dataSource.map((item) => {
          if (record.id === item.id) {
            record.name = uid();
            return record;
          }
          return item;
        }),
      ]);
    },
  };
};

const useDestroyAction = () => {
  const record = useRecord();
  const ctx = useContext(DataSourceContext);
  return {
    async run() {
      const dataSource = ctx.dataSource || [];
      ctx.setDataSource(
        dataSource.filter((item) => {
          return record.id !== item.id;
        }),
      );
    },
  };
};

const ds = {
  useSelectedRowKeys,
  useDataSource,
  useCreateAction,
  useBulkDestroyAction,
  useUpdateAction,
  useDestroyAction,
};

const schema: ISchema = {
  type: 'object',
  properties: {
    context: {
      type: 'void',
      'x-component': 'DataSourceProvider',
      properties: {
        action1: {
          title: '添加',
          'x-component': 'Action',
          'x-component-props': {
            useAction: '{{ ds.useCreateAction }}',
          },
        },
        action2: {
          title: '删除',
          'x-component': 'Action',
          'x-component-props': {
            useAction: '{{ ds.useBulkDestroyAction }}',
          },
        },
        input: {
          type: 'array',
          title: `编辑模式`,
          'x-component': 'Table.Array',
          'x-component-props': {
            rowKey: 'id',
            pagination: false,
            rowSelection: {
              type: 'checkbox',
            },
            useSelectedRowKeys: '{{ ds.useSelectedRowKeys }}',
            useDataSource: '{{ ds.useDataSource }}',
          },
          properties: {
            column1: {
              type: 'void',
              title: 'Name',
              'x-component': 'Table.Column',
              properties: {
                name: {
                  type: 'string',
                  'x-component': 'Input',
                  'x-read-pretty': true,
                },
              },
            },
            column2: {
              type: 'void',
              title: 'Actions',
              'x-component': 'Table.Column',
              properties: {
                action1: {
                  title: '编辑',
                  'x-component': 'Action',
                  'x-component-props': {
                    useAction: '{{ ds.useUpdateAction }}',
                  },
                },
                action2: {
                  title: '删除',
                  'x-component': 'Action',
                  'x-component-props': {
                    useAction: '{{ ds.useDestroyAction }}',
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

const DataSourceProvider = observer(
  (props) => {
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [dataSource, setDataSource] = useState([]);
    const service = useRequest(
      () => {
        return Promise.resolve({
          data: [
            { id: 1, name: 'Name1' },
            { id: 2, name: 'Name2' },
            { id: 3, name: 'Name3' },
          ],
        });
      },
      {
        onSuccess(data) {
          setDataSource(data.data);
        },
      },
    );
    return (
      <DataSourceContext.Provider
        value={{
          service,
          dataSource,
          setDataSource,
          selectedRowKeys,
          setSelectedRowKeys,
        }}
      >
        {props.children}
      </DataSourceContext.Provider>
    );
  },
  { displayName: 'DataSourceProvider' },
);

const Root = () => {
  return (
    <SchemaComponentProvider scope={{ ds }} components={{ Action, DataSourceProvider, Table, Input }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};

const app = new Application({
  providers: [Root],
});

export default app.getRootComponent();
