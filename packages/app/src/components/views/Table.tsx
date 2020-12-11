import React, { useState } from 'react';
import { Table as AntdTable, Card, Pagination } from 'antd';
import { redirectTo } from '@/components/pages/CollectionLoader/utils';
import { Actions } from '@/components/actions';
import { request, useRequest } from 'umi';
import api from '@/api-client';
import { components, fields2columns } from './SortableTable';

const columns = [
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '年龄',
    dataIndex: 'age',
    key: 'age',
  },
  {
    title: '住址',
    dataIndex: 'address',
    key: 'address',
  },
];

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
  } = props;
  const { fields, defaultTabName, rowKey = 'id', actions = [], paginated = true, defaultPageSize = 10 } = schema;
  // const { data, mutate } = useRequest(() => api.resource(name).list({
  //   associatedKey,
  // }));
  const name = associatedName ? `${associatedName}.${resourceName}` : resourceName;
  const { data, loading, pagination, mutate, refresh } = useRequest((params = {}) => {
    const { current, pageSize, ...restParams } = params;
    return api.resource(name).list({
      associatedKey,
      page: paginated ? current : 1,
      perPage: paginated ? pageSize : -1,
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
    defaultPageSize,
  });
  const { sourceKey = 'id' } = activeTab.field||{};
  console.log(props);
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
          async destroy() {
            await api.resource(name).destroy({
              associatedKey,
              filter: {
                [`${rowKey}.in`]: selectedRowKeys,
              },
            });
            await refresh();
            console.log('destroy.onTrigger', selectedRowKeys);
          }
        }}
      />
      <AntdTable 
        rowKey={rowKey}
        columns={fields2columns(fields)}
        dataSource={data?.list||(data as any)}
        components={components({
          data, 
          mutate,
          rowKey,
          onMoved: async ({resourceKey, offset}) => {
            await api.resource(name).sort({
              associatedKey,
              resourceKey,
              field: 'sort',
              offset,
            });
            await refresh();
            console.log({resourceKey, offset});
          }
        })}
        onRow={(data) => ({
          onClick: () => {
            redirectTo({
              ...props.match.params,
              [activeTab ? 'newItem' : 'lastItem']: {
                itemId: data[rowKey]||data.id,
                tabName: defaultTabName,
              },
            });
          },
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
