import React, { useEffect, useRef, useState } from 'react';
import { Table as AntdTable, Card, Pagination } from 'antd';
import { Actions } from '@/components/actions';
import ViewFactory from '@/components/views';
import { useRequest } from 'umi';
import api from '@/api-client';
import { components, fields2columns } from './SortableTable';

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
  } = props;
  const { rowKey = 'id', fields = [], rowViewName, actions = [], paginated = true, defaultPerPage = 10 } = schema;
  const { sourceKey = 'id' } = activeTab.field||{};
  const drawerRef = useRef<any>();
  const name = associatedName ? `${associatedName}.${resourceName}` : resourceName;
  const { data, loading, pagination, mutate, refresh, params, run } = useRequest((params = {}) => {
    const { current, pageSize, sorter, filter, ...restParams } = params;
    return api.resource(name).list({
      associatedKey,
      page: paginated ? current : 1,
      perPage: paginated ? pageSize : -1,
      sorter,
      filter,
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
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const onChange = (selectedRowKeys: React.ReactText[]) => {
    setSelectedRowKeys(selectedRowKeys);
  }
  const tableProps: any = {};
  if (actions.length) {
    tableProps.rowSelection = {
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
        onFinish={() => {
          refresh();
        }}
        onTrigger={{
          async filter(values) {
            console.log('filter', values);
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
        rowKey={rowKey}
        loading={loading}
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
            drawerRef.current.setVisible(true);
            drawerRef.current.getData(record[rowKey]);
          }
        })}
        pagination={false}
        {...tableProps}
      />
      {paginated && (
        <div className={'table-pagination'}>
          <Pagination {...pagination} showQuickJumper showSizeChanger size={'default'}/>
        </div>
      )}
    </Card>
  );
}
