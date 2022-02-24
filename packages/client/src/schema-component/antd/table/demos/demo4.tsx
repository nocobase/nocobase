import { ISchema, observer } from '@formily/react';
import { uid } from '@formily/shared';
import {
  Action,
  Input,
  SchemaComponent,
  SchemaComponentProvider,
  Table,
  useRecord,
  useRequest
} from '@nocobase/client';
import React, { createContext, useContext, useState } from 'react';

const DataSourceContext = createContext(null);

const schema: ISchema = {
  type: 'object',
  properties: {
    context: {
      type: 'void',
      'x-component': 'Context',
      properties: {
        action1: {
          title: '提交',
          'x-component': 'Action',
          'x-component-props': {
            useAction() {
              const ctx = useContext(DataSourceContext);
              return {
                async run() {
                  console.log(ctx.dataSource);
                  const dataSource = ctx.dataSource || [];
                  dataSource.push({
                    id: uid(),
                    name: uid(),
                  });
                  ctx.setDataSource([...dataSource]);
                },
              };
            },
          },
        },
        action2: {
          title: '删除',
          'x-component': 'Action',
          'x-component-props': {
            useAction() {
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
            },
          },
        },
        input: {
          type: 'array',
          title: `编辑模式`,
          'x-component': 'Table.Array',
          'x-component-props': {
            rowKey: 'id',
            rowSelection: {
              type: 'checkbox',
            },
            useSelectedRowKeys() {
              const ctx = useContext(DataSourceContext);
              return [ctx.selectedRowKeys, ctx.setSelectedRowKeys];
            },
            useDataSource(options) {
              const ctx = useContext(DataSourceContext);
              return useRequest(
                () => {
                  console.log('ctx.dataSource', ctx.dataSource);
                  return Promise.resolve({
                    data: ctx.dataSource,
                  });
                },
                {
                  ...options,
                  refreshDeps: [JSON.stringify(ctx.dataSource)],
                },
              );
            },
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
                action: {
                  title: '删除',
                  'x-component': 'Action',
                  'x-component-props': {
                    useAction() {
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

const Context = observer((props) => {
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
  console.log('dataSource1', dataSource);
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
});

export default () => {
  return (
    <SchemaComponentProvider components={{ Action, Context, Table, Input }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
