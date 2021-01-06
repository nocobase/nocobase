import React, { useEffect, useRef, useState } from 'react';
import { Table as AntdTable, Card, Pagination } from 'antd';
import { Actions } from '@/components/actions';
import ViewFactory from '@/components/views';
import { useRequest } from 'umi';
import api from '@/api-client';
import { components, fields2columns } from './SortableTable';
import { LoadingOutlined } from '@ant-design/icons';

export const icon = <LoadingOutlined style={{ fontSize: 36 }} spin />;

export interface SimpleTableProps {
  schema?: any;
  activeTab?: any;
  resourceName: string;
  associatedName?: string;
  associatedKey?: string;
  [key: string]: any;
}

export function SimpleTable(props: SimpleTableProps) {
  console.log(props);
  const {
    activeTab = {},
    pageInfo = {},
    schema,
    resourceName,
    associatedName,
    associatedKey,
    isFieldComponent,
    onSelected,
    multiple = true,
    selectedRowKeys: srk,
  } = props;
  const { rowKey = 'id', name: viewName, actionDefaultParams = {}, fields = [], rowViewName, actions = [], paginated = true, defaultPerPage = 10 } = schema;
  const { filter: defaultFilter = {} } = actionDefaultParams;
  const { sourceKey = 'id' } = activeTab.field||{};
  const drawerRef = useRef<any>();
  const [filterCount, setFilterCount] = useState(0);
  const name = associatedName ? `${associatedName}.${resourceName}` : resourceName;
  const { data, loading, pagination, mutate, refresh, params, run } = useRequest((params = {}) => {
    const { current, pageSize, sorter, filter, ...restParams } = params;
    return api.resource(name).list({
      associatedKey,
      page: paginated ? current : 1,
      perPage: paginated ? pageSize : -1,
      sorter,
      // filter,
      viewName,
      ...actionDefaultParams,
      filter: {
        and: [
          defaultFilter,
          filter,
        ].filter(obj => obj && Object.keys(obj).length)
      }
    })
    .then(({data = [], meta = {}}) => {
      return {
        data: {
          list: data,
          total: meta.count||data.length,
        },
      };
    });
  }, {
    paginated,
    defaultPageSize: defaultPerPage,
  });
  console.log(schema, data);
  const [selectedRowKeys, setSelectedRowKeys] = useState(srk||[]);
  const onChange = (selectedRowKeys: React.ReactText[], selectedRows: React.ReactText[]) => {
    setSelectedRowKeys(selectedRowKeys);
    onSelected && onSelected(selectedRows);
  }
  useEffect(() => {
    setSelectedRowKeys(srk);
  }, [srk]);
  const tableProps: any = {};
  if (actions.length) {
    tableProps.rowSelection = {
      type: multiple ? 'checkbox' : 'radio',
      selectedRowKeys,
      onChange,
    }
  }
  console.log('rowViewName', {rowViewName})
  return (
    <Card bordered={false}>
      <Actions
        {...props}
        style={{ marginBottom: 14 }}
        actions={actions}
        filterCount={filterCount}
        onFinish={() => {
          refresh();
        }}
        onTrigger={{
          async filter(values) {
            console.log('filter', values);
            const items = values.filter.and || values.filter.or;
            setFilterCount(Object.keys(items).length);
            // @ts-ignore
            run({...params[0], filter: values.filter});
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
      <ViewFactory
        {...props}
        mode={'update'}
        viewName={rowViewName}
        reference={drawerRef}
        onFinish={() => {
          refresh();
        }}
      />
      <AntdTable
        size={'middle'}
        rowKey={rowKey}
        loading={{
          spinning: loading,
          size: 'large',
          indicator: icon,
          // className: 'spinning--absolute',
        }}
        columns={fields2columns(fields)}
        dataSource={data?.list||(data as any)}
        onChange={(pagination, filters, sorter, extra) => {
          run({...params[0], sorter});
        }}
        components={components({
          data, 
          mutate,
          rowKey,
          onMoved: async ({resourceKey, target}) => {
            await api.resource(name).sort({
              associatedKey,
              resourceKey,
              values: {
                field: 'sort',
                target,
              },
            });
            await refresh();
            console.log({resourceKey, target});
          }
        })}
        onRow={(record) => ({
          onClick: () => {
            if (isFieldComponent) {
              return;
            }
            drawerRef.current.setVisible(true);
            drawerRef.current.getData(record[rowKey]);
          }
        })}
        pagination={false}
        {...tableProps}
      />
      {paginated && (
        <div className={'table-pagination'}>
          <Pagination {...pagination} showTotal={(total)=> `共 ${total} 条记录`} showQuickJumper showSizeChanger size={'small'}/>
        </div>
      )}
    </Card>
  );
}
