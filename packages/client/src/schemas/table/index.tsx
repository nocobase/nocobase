import React, { createContext, useContext, useRef, useState } from 'react';
import {
  useFieldSchema,
  Schema,
  observer,
  RecursionField,
  useField,
  useForm,
  FormProvider,
  createSchemaField,
} from '@formily/react';
import {
  Button,
  Pagination,
  PaginationProps,
  Space,
  Spin,
  Table as AntdTable,
} from 'antd';
import { findIndex } from 'lodash';
import constate from 'constate';
import useRequest from '@ahooksjs/use-request';
import { BaseResult } from '@ahooksjs/use-request/lib/types';
import { uid, clone } from '@formily/shared';
import { MenuOutlined } from '@ant-design/icons';
import { useVisibleContext } from '../action';
import { SortableHandle, SortableContainer, SortableElement } from 'react-sortable-hoc'
import cls from 'classnames';

interface TableRowProps {
  index: number;
  data: any;
}

const SortableRow = SortableElement((props: any) => <tr {...props} />)
const SortableBody = SortableContainer((props: any) => <tbody {...props} />)

const TableRowContext = createContext<TableRowProps>(null);

function usePaginationProps() {
  const schema = useFieldSchema();

  function findPagination(schema: Schema): Schema[] {
    return schema.reduceProperties((columns, current) => {
      if (current['x-component'] === 'Table.Pagination') {
        return [...columns, current];
      }
      return [...columns, ...findPagination(current)];
    }, []);
  }

  const pagination = findPagination(schema).shift();

  if (pagination) {
    // console.log({ pagination });
    const props = pagination['x-component-props'] || {};
    return { defaultCurrent: 1, defaultPageSize: 10, ...props };
  }

  return false;
}

function useDefaultAction() {
  const schema = useFieldSchema();

  function findDefaultAction(schema: Schema): Schema[] {
    return schema.reduceProperties((columns, current) => {
      if (current['x-default-action']) {
        return [...columns, current];
      }
      return [...columns, ...findDefaultAction(current)];
    }, []);
  }

  return findDefaultAction(schema).shift();
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
      render(value, record, recordIndex) {
        const index = dataSource.indexOf(record);
        return (
          <TableRowContext.Provider
            value={{
              index: index,
              data: record,
            }}
          >
            <RecursionField schema={item} name={index} onlyRenderProperties />
          </TableRowContext.Provider>
        );
      },
    };
  });
}

export function useTableRow() {
  const ctx = useContext(TableRowContext);
  console.log('useTableRow', ctx.data);
  return ctx.data;
}

export function useTableIndex() {
  const {
    params: { page, pageSize },
  } = useTableContext();
  const ctx = useContext(TableRowContext);
  const field = useField();
  if (!field.componentProps.isRemoteDataSource) {
    return ctx.index;
  }
  return pageSize ? ctx.index + (page - 1) * pageSize : ctx.index;
}

export function useTableDestroyAction() {
  const ctx = useContext(TableRowContext);
  const { field, selectedRowKeys, setSelectedRowKeys, refresh } =
    useTableContext();
  const rowKey = field.componentProps.rowKey || 'id';

  return {
    async run() {
      if (ctx && typeof ctx.index !== 'undefined') {
        field.remove(ctx.index);
        refresh();
        return;
      }

      if (!selectedRowKeys.length) {
        return;
      }
      while (selectedRowKeys.length) {
        const key = selectedRowKeys.shift();
        const index = findIndex(field.value, (item) => item[rowKey] === key);
        field.remove(index);
      }
      refresh();
      setSelectedRowKeys([]);
    },
  };
}

export function useTableFilterAction() {
  const { field, refresh, params } = useTableContext();
  const { setVisible } = useVisibleContext();
  const form = useForm();
  return {
    async run() {
      setVisible && setVisible(false);
      refresh();
    },
  };
}

export function useTableCreateAction() {
  const { field, run: exec, params } = useTableContext();
  const { setVisible } = useVisibleContext();
  const form = useForm();
  return {
    async run() {
      setVisible && setVisible(false);
      field.push({
        key: uid(),
        ...clone(form.values),
      });
      form.reset();
      exec({ ...params, page: 1 });
    },
  };
}

export function useTableUpdateAction() {
  const { field, refresh, params } = useTableContext();
  const { setVisible } = useVisibleContext();
  const form = useForm();
  return {
    async run() {
      setVisible && setVisible(false);
      refresh();
    },
  };
}

const [TableContextProvider, useTableContext] = constate(() => {
  const field = useField<Formily.Core.Models.ArrayField>();
  const schema = useFieldSchema();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const pagination = usePaginationProps();
  const response = useRequest<{
    list: any[];
    total: number;
  }>((params = {}) => {
    return new Promise((resolve) => {
      const dataSource = Array.isArray(field.value) ? field.value.slice() : [];
      if (pagination) {
        const {
          page = pagination.defaultCurrent,
          pageSize = pagination.defaultPageSize,
        } = params;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize - 1;
        resolve({
          list: dataSource.slice(startIndex, endIndex + 1),
          total: dataSource.length,
        });
      } else {
        resolve({
          list: dataSource,
          total: dataSource.length,
        });
      }
    });
  });
  const params = {
    page: pagination.defaultCurrent,
    pageSize: pagination.defaultPageSize,
    ...(response.params[0] || {}),
  };
  return {
    ...response,
    params,
    field,
    schema,
    selectedRowKeys,
    setSelectedRowKeys,
  };
});

export { TableContextProvider, useTableContext };

const TableContainer = observer((props) => {
  const field = useField<Formily.Core.Models.ArrayField>();
  const schema = useFieldSchema();
  const actionBars = useTableActionBars();
  const { loading, data, refresh, selectedRowKeys, setSelectedRowKeys } =
    useTableContext();
  const rowKey = field.componentProps.rowKey || 'id';
  const defaultAction = useDefaultAction();
  console.log({ defaultAction });
  const dataSource = Array.isArray(field.value) ? field.value.slice() : [];
  const columns = useTableColumns({ dataSource });
  const ref = useRef<HTMLDivElement>()
  const addTdStyles = (node: HTMLElement) => {
    const helper = document.body.querySelector(`.nb-table-sort-helper`)
    if (helper) {
      const tds = node.querySelectorAll('td')
      requestAnimationFrame(() => {
        helper.querySelectorAll('td').forEach((td, index) => {
          if (tds[index]) {
            td.style.width = getComputedStyle(tds[index]).width
          }
        })
      })
    }
  }
  return (
    <div ref={ref} className={'nb-table'}>
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
      <AntdTable
        pagination={false}
        rowKey={rowKey}
        loading={loading}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          onChange: (keys) => {
            console.log(keys);
            setSelectedRowKeys(keys);
          },
        }}
        dataSource={data?.list}
        columns={columns}
        components={{
          body: {
            wrapper: (props: any) => (
              <SortableBody
                useDragHandle
                lockAxis="y"
                // disableAutoscroll
                helperClass={`nb-table-sort-helper`}
                helperContainer={() => {
                  return ref.current?.querySelector('tbody')
                }}
                onSortStart={({ node }) => {
                  addTdStyles(node)
                }}
                onSortEnd={({ oldIndex, newIndex }) => {
                  field.move(oldIndex, newIndex);
                  refresh();
                }}
                {...props}
              />
            ),
            row: (props: any) => {
              const index = findIndex(field.value, item => item[rowKey] === props['data-row-key']);
              return (
                <SortableRow
                  index={index}
                  {...props}
                />
              )
            },
          },
        }}
        onRow={(data) => {
          const index = dataSource.indexOf(data);
          return {
            onClick(e) {
              console.log('onRow', (e.target as HTMLElement), (e.target as HTMLElement).classList.contains('ant-table-cell'));
              if (!(e.target as HTMLElement).classList.contains('ant-table-cell')) {
                return;
              }
              if (!defaultAction) {
                return;
              }
              // console.log('defaultAction');
              field
                .query(`.${schema.name}.${index}.${defaultAction.name}`)
                .take((f) => {
                  const setVisible = f.componentProps.setVisible;
                  setVisible && setVisible(true);
                });
            },
          };
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
});

export const Table: any = observer((props) => {
  return (
    <TableContextProvider>
      <TableContainer />
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
  const { data, params, run } = useTableContext();
  return (
    data?.total > params?.pageSize && (
      <Pagination
        {...props}
        defaultCurrent={1}
        defaultPageSize={5}
        current={params?.page}
        pageSize={params?.pageSize}
        total={data?.total}
        onChange={(page, pageSize) => {
          run({ page, pageSize });
        }}
      />
    )
  );
});

const SortHandle = SortableHandle((props: any) => {
  return (
    <MenuOutlined
      {...props}
      className={cls(`nb-table-sort-handle`, props.className)}
      style={{ ...props.style }}
    />
  )
}) as any

Table.SortHandle = observer((props) => {
  const field = useField<Formily.Core.Models.Field>();
  console.log('SortHandle', field.value);
  return <SortHandle {...props}/>;
});

Table.Index = observer((props) => {
  const index = useTableIndex();
  return <div>#{index + 1}</div>;
});

Table.Addition = observer((props: any) => {
  const { field, refresh } = useTableContext();
  const current = useField();
  return (
    <Button
      block
      onClick={() => {
        if (props.method === 'unshift') {
          field.unshift({
            key: uid(),
          });
        } else {
          field.push({
            key: uid(),
          });
        }
        refresh();
      }}
    >
      {current.title}
    </Button>
  );
});
