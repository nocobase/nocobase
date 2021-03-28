import React, { useEffect, useState, useRef } from 'react';
import { Table as AntdTable, Card, Pagination } from 'antd';
import { redirectTo } from '@/components/pages/CollectionLoader/utils';
import { Actions } from '@/components/actions';
import { request, useRequest } from 'umi';
import api from '@/api-client';
import { components, fields2columns } from './SortableTable';
import { LoadingOutlined } from '@ant-design/icons';
import ViewFactory from '@/components/views';

export const icon = <LoadingOutlined style={{ fontSize: 36 }} spin />;

export interface TableProps {
  schema?: any;
  activeTab?: any;
  resourceName: string;
  associatedName?: string;
  associatedKey?: string;
  [key: string]: any;
}

export function Table(props: TableProps) {
  const {
    activeTab = {},
    schema,
    resourceName,
    associatedName,
    associatedKey,
    isFieldComponent,
    onSelected,
    multiple = true,
    selectedRowKeys: srk,
    defaultFilter = {},
  } = props;
  const {
    name: viewName,
    mode = 'default',
    rowViewName = 'form',
    fields,
    actionDefaultParams = {},
    defaultTabName,
    rowKey = 'id',
    actions = [],
    paginated = true,
    defaultPerPage = 10,
    disableRowClick,
  } = schema;
  // const { data, mutate } = useRequest(() => api.resource(name).list({
  //   associatedKey,
  // }));
  const { filter: defaultActionFilter = {} } = actionDefaultParams;

  const [filterCount, setFilterCount] = useState(0);
  const name = associatedName
    ? `${associatedName}.${resourceName}`
    : resourceName;
  const {
    data,
    loading,
    pagination,
    mutate,
    refresh,
    run,
    params,
  } = useRequest(
    (params = {}, ...args) => {
      const { current, pageSize, sorter, filter, ...restParams } = params;
      console.log('paramsparamsparamsparamsparams', params, args);
      return api
        .resource(name)
        .list({
          associatedKey,
          page: paginated ? current : 1,
          perPage: paginated ? pageSize : -1,
          sorter,
          // filter,
          viewName,
          ...actionDefaultParams,
          filter: {
            and: [defaultFilter, defaultActionFilter, filter].filter(
              obj => obj && Object.keys(obj).length,
            ),
          },
          // ...args2,
        })
        .then(({ data = [], meta = {} }) => {
          return {
            data: {
              list: data,
              total: meta.count || data.length,
            },
          };
        });
    },
    {
      paginated,
      defaultPageSize: defaultPerPage,
    },
  );
  const { sourceKey = 'id' } = activeTab.field || {};
  const drawerRef = useRef<any>();
  console.log(props);
  const [selectedRowKeys, setSelectedRowKeys] = useState(srk || []);
  const onChange = (
    selectedRowKeys: React.ReactText[],
    selectedRows: React.ReactText[],
  ) => {
    setSelectedRowKeys(selectedRowKeys);
    onSelected && onSelected(selectedRows);
  };
  useEffect(() => {
    setSelectedRowKeys(srk);
  }, [srk]);
  console.log(srk);
  const tableProps: any = {};
  if (actions.length) {
    tableProps.rowSelection = {
      type: multiple ? 'checkbox' : 'radio',
      selectedRowKeys,
      onChange,
    };
  }
  return (
    <Card bordered={false}>
      <Actions
        {...props}
        filterCount={filterCount}
        style={{ marginBottom: 14 }}
        actions={actions}
        onFinish={() => {
          refresh();
        }}
        onTrigger={{
          async filter(values) {
            const items = values.filter.and || values.filter.or;
            setFilterCount(Object.keys(items).length);
            // @ts-ignore
            run({ ...params[0], filter: values.filter });
            console.log('filter', values);
          },
          async destroy() {
            await api.resource(name).destroy({
              associatedKey,
              filter: {
                [`${rowKey}.in`]: selectedRowKeys,
              },
            });
            await refresh();
            // @ts-ignore
            window.routesReload && window.routesReload();
            console.log('destroy.onTrigger', selectedRowKeys);
          },
        }}
      />
      {mode === 'simple' && (
        <ViewFactory
          {...props}
          mode={'update'}
          viewName={rowViewName}
          reference={drawerRef}
          onFinish={() => {
            refresh();
          }}
        />
      )}
      <AntdTable
        size={'middle'}
        rowKey={rowKey}
        loading={{
          spinning: loading,
          size: 'large',
          indicator: icon,
          // className: 'spinning--absolute m32',
        }}
        columns={fields2columns(fields, { associatedKey, refresh })}
        dataSource={data?.list || (data as any)}
        onChange={(pagination, filters, sorter, extra) => {
          run({ ...params[0], sorter });
        }}
        components={components({
          data,
          mutate,
          rowKey,
          isFieldComponent: disableRowClick || isFieldComponent,
          onMoved: async ({ resourceKey, target }) => {
            await api.resource(name).sort({
              associatedKey,
              resourceKey,
              values: {
                field: 'sort',
                target,
              },
            });
            await refresh();
            console.log({ resourceKey, target });
          },
        })}
        onRow={data => ({
          onClick: () => {
            if (disableRowClick || isFieldComponent) {
              return;
            }
            if (mode === 'simple') {
              drawerRef.current.setVisible(true);
              drawerRef.current.getData(data[rowKey]);
            } else {
              redirectTo({
                ...props.match.params,
                [activeTab ? 'newItem' : 'lastItem']: {
                  itemId: data[rowKey] || data.id,
                  tabName: defaultTabName,
                },
              });
            }
          },
        })}
        pagination={false}
        {...tableProps}
      />
      {paginated && (
        <div className={'table-pagination'}>
          <Pagination
            {...pagination}
            showTotal={total => `共 ${total} 条记录`}
            showQuickJumper
            showSizeChanger
            size={'small'}
          />
        </div>
      )}
    </Card>
  );
}
