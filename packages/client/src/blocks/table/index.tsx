import React, { createContext, useContext, useState } from 'react';
import {
  useFieldSchema,
  Schema,
  observer,
  RecursionField,
  useField,
} from '@formily/react';
import { Button, Pagination, Space, Table as AntdTable } from 'antd';
import { DesignableBar } from './DesignableBar';
import { ColumnDesignableBar } from './ColumnDesignableBar';
import { uid } from '@formily/shared';
import useRequest from '@ahooksjs/use-request';
import constate from 'constate';
import { SchemaRenderer } from '../';
import { useVisibleContext } from '../action';

function useTableColumns(props?: any) {
  const schema = useFieldSchema();
  const { dataSource } = props || {};

  function findColumns(schema: Schema): Schema[] {
    return schema.reduceProperties((columns, current) => {
      if (current['x-component'] === 'Table.Column') {
        return [...columns, current];
      }
      return [...columns, ...findColumns(current)];
    }, []);
  }

  return findColumns(schema).map((item) => {
    const columnProps = item['x-component-props'] || {};
    return {
      title: item.title,
      dataIndex: item.name,
      ...columnProps,
      render(value, record, index) {
        // console.log({ item });
        // const index = dataSource.indexOf(record);
        item.mapProperties((s) => {
          s['title'] = undefined;
          s['x-read-pretty'] = true;
          return s;
        });
        return (
          <RecursionField schema={item} name={index} onlyRenderProperties />
        );
      },
    };
  });
}

function useTableActionBars() {
  const schema = useFieldSchema();

  function findActionBars(schema: Schema) {
    const actionBars = {
      top: [],
      bottom: [],
    };
    return schema.reduceProperties((bars, current) => {
      if (current['x-component'] === 'Table.ActionBar') {
        const align = current['x-component-props']?.['align'] || 'top';
        bars[align].push(current);

        return bars;
      }

      const nested = findActionBars(current);

      Object.keys(nested).forEach((align) => {
        bars[align].push(...nested[align]);
      });

      return bars;
    }, actionBars);
  }

  return findActionBars(schema);
}

function useTable() {
  const field = useField<Formily.Core.Models.ArrayField>();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const response = useRequest<any>(
    () => {
      return new Promise((resolve) => {
        console.log('useRequest');
        setTimeout(() => {
          resolve([
            { key: uid(), field1: uid(), field2: uid() },
            { key: uid(), field1: uid(), field2: uid() },
          ]);
        }, 500);
      });
    },
    {
      onSuccess(data) {
        field.setValue(data);
      },
    },
  );
  return {
    selectedRowKeys,
    setSelectedRowKeys,
    mutate: response.mutate,
    response,
    async create() {
      response.refresh()
    },
    async update() {
      response.refresh()
    },
    async destroy() {
      response.refresh()
    },
  } as any;
}

const [TableContextProvider, useTableContext] = constate(useTable);

export function useTableCreateAction() {
  const { visible, setVisible } = useVisibleContext()
  const { create } = useTableContext();
  return {
    run: async () => {
      setVisible(false);
      await create();
      console.log({ visible })
    },
  }
}

export function useTableDestroyAction() {
  // const { setVisible } = useVisibleContext()
  const { destroy } = useTableContext();
  return {
    run: async () => {
      // setVisible(false);
      await destroy();
    },
  }
}

const ArrayTable = (props) => {
  const field = useField<Formily.Core.Models.ArrayField>();
  // const dataSource = Array.isArray(field.value) ? field.value.slice() : [];
  const columns = useTableColumns();
  const actionBars = useTableActionBars();
  const {
    selectedRowKeys,
    setSelectedRowKeys,
    response = {},
    create,
  } = useTableContext();
  console.log({ response });
  const { data = [], loading, mutate } = response as any;
  return (
    <div>
      {actionBars.top.map((actionBarSchema) => {
        return (
          <RecursionField
            onlyRenderProperties
            schema={
              new Schema({
                type: 'object',
                properties: {
                  [actionBarSchema.name]: actionBarSchema,
                },
              })
            }
          />
        );
      })}
      <Button
        onClick={() => {
          create();
          // field.unshift({ key: uid(), field1: uid(), field2: uid() });
          // const dataSource = Array.isArray(field.value)
          //   ? field.value.slice()
          //   : [];
          // mutate(dataSource);
          // response.refresh();
          // console.log({ selectedRowKeys })
        }}
      >
        新增
      </Button>
      <AntdTable
        rowKey={'key'}
        loading={loading}
        pagination={false}
        columns={columns}
        dataSource={data}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          onChange: (keys) => {
            setSelectedRowKeys(keys);
          },
        }}
      />
      {actionBars.bottom.map((actionBarSchema) => {
        return (
          <RecursionField
            onlyRenderProperties
            schema={
              new Schema({
                type: 'object',
                properties: {
                  [actionBarSchema.name]: actionBarSchema,
                },
              })
            }
          />
        );
      })}
    </div>
  );
};

export const Table: any = observer((props) => {
  return (
    <TableContextProvider>
      <ArrayTable {...props} />
    </TableContextProvider>
  );
});

Table.Column = () => null;

Table.ActionBar = observer((props) => {
  return (
    <div className={'action-bar'}>
      <Space>{props.children}</Space>
    </div>
  );
});

Table.Pagination = observer((props) => {
  const { response } = useTableContext();
  return (
    <Pagination
      {...props}
      onChange={(page, pageSize) => {
        response.refresh();
        // console.log('useRequest', { page, pageSize });
      }}
    />
  );
});

Table.View = observer(() => {
  const schema = useFieldSchema();
  console.log('Table.View', schema);
  return (
    <SchemaRenderer
      schema={{
        type: 'object',
        properties: {
          [schema.name]: {
            ...schema.toJSON(),
            type: 'array',
            'x-component': 'Table.Field',
          },
        },
      }}
    />
  );
});

Table.Field = observer((props) => {
  return (
    <TableContextProvider>
      <ArrayTable {...props} />
    </TableContextProvider>
  );
});
