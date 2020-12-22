import React, { useEffect, useState } from 'react';
import { Table as AntdTable, Card, Pagination } from 'antd';
import { redirectTo } from '@/components/pages/CollectionLoader/utils';
import { Actions } from '@/components/actions';
import { request, useRequest } from 'umi';
import api from '@/api-client';
import { components, fields2columns } from './SortableTable';

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
    selectedRowKeys: srk,
  } = props;
  const { name: viewName, fields, actionDefaultParams = {}, defaultTabName, rowKey = 'id', actions = [], paginated = true, defaultPerPage = 10 } = schema;
  // const { data, mutate } = useRequest(() => api.resource(name).list({
  //   associatedKey,
  // }));
  const name = associatedName ? `${associatedName}.${resourceName}` : resourceName;
  const { data, loading, pagination, mutate, refresh, run, params } = useRequest((params = {}, ...args) => {
    const { current, pageSize, sorter, filter, ...restParams } = params;
    console.log('paramsparamsparamsparamsparams', params, args);
    return api.resource(name).list({
      associatedKey,
      page: paginated ? current : 1,
      perPage: paginated ? pageSize : -1,
      sorter,
      filter,
      viewName,
      ...actionDefaultParams,
      // ...args2,
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
  const { sourceKey = 'id' } = activeTab.field||{};
  console.log(props);
  const [selectedRowKeys, setSelectedRowKeys] = useState(srk||[]);
  const onChange = (selectedRowKeys: React.ReactText[], selectedRows: React.ReactText[]) => {
    setSelectedRowKeys(selectedRowKeys);
    onSelected && onSelected(selectedRows);
  }
  useEffect(() => {
    setSelectedRowKeys(srk);
  }, [srk]);
  console.log(srk);
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
          async filter(values) {
            // @ts-ignore
            run({...params[0], filter: values.filter});
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
          }
        }}
      />
      <AntdTable 
        rowKey={rowKey}
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
        onRow={(data) => ({
          onClick: () => {
            if (isFieldComponent) {
              return;
            }
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
