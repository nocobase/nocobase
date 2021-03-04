import React, { useState, useEffect } from 'react';
import './style.less';
import { Helmet } from 'umi';
import { Spin } from '@nocobase/client';
import { useRequest, useLocation } from 'umi';
import api from '@/api-client';
import { Actions } from '../Actions';
import { Table as AntdTable, Card, Pagination, Button, Tabs, Descriptions, Tooltip } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { components, fields2columns } from '@/components/views/SortableTable';
import ReactDragListView from 'react-drag-listview';
import arrayMove from 'array-move';
import get from 'lodash/get';
import Drawer from '@/components/pages/AdminLoader/Drawer';
import Field from '@/components/views/Field';
import { Form } from './Form';
import { View } from './';

export const icon = <LoadingOutlined style={{ fontSize: 36 }} spin />;

export function PageTabs(props) {
  const { associatedKey, resourceName, onFinish, onDataChange, data, pages = [], resolve } = props;
  if (!pages || pages.length === 0) {
    return null;
  }
  const [page, setPage] = useState(pages[0]);
  const { id, collection_name, views } = page;
  return (
    <div className={'page-tabs'}>
      { pages.length > 1 && (
        <Tabs activeKey={`${id}`} onChange={(pageId) => {
          console.log(pageId);
          const p = pages.find(page => page.id == pageId);
          if (p) {
            setPage(p);
          }
        }}>
          {pages.map(page => (
            <Tabs.TabPane tab={page.title} key={page.id}>
            </Tabs.TabPane>
          ))}
        </Tabs>
      ) }
      {views.map(view => {
        let viewName: string;
        if (typeof view === 'string') {
          viewName = `${resourceName}.${view}`;
        } if (typeof view === 'object') {
          viewName = `${resourceName}.${view.name}`;
        }
        return (
          <View associatedKey={associatedKey} onFinish={onFinish} onDataChange={onDataChange} data={data} viewName={viewName}/>
        );
      })}
    </div>
  );
}

export function Table(props: any) {
  const {
    onSelected,
    multiple = true,
    isFieldComponent,
    schema = {},
    data: record = {},
  } = props;

  const { 
    fields = [],
    actions = [],
    pages = [],
    paginated = true,
    defaultPerPage = 10,
    rowKey = 'id',
    labelField = 'id',
    sort,
    resourceName,
    associationField = {},
    appends = [],
    filter: defaultFilter = {},
  } = schema;


  const associatedKey = props.associatedKey || record[associationField.sourceKey||'id'];
  console.log({associatedKey, record, associationField})

  const { data, loading, pagination, mutate, refresh, run, params } = useRequest((params = {}, ...args) => {
    const { current, pageSize, sorter, filter, ...restParams } = params;
    console.log('paramsparamsparamsparamsparams', params, args);
    return api.resource(resourceName).list({
      associatedKey,
      page: paginated ? current : 1,
      perPage: paginated ? pageSize : -1,
      sorter,
      sort,
      'fields[appends]': appends,
      // filter,
      // ...actionDefaultParams,
      filter: {
        and: [
          defaultFilter,
          filter,
        ].filter(obj => obj && Object.keys(obj).length)
      }
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

  // const { data, loading, pagination, mutate, refresh, run, params } = useRequest((params = {}, ...args) => {
  //   const { current, pageSize, sorter, filter, ...restParams } = params;
  //   return api.resource(resourceName).list({
  //     associatedKey,
  //     sort,
  //   }).then(({data = [], meta = {}}) => {
  //     return {
  //       data: {
  //         list: data,
  //         total: meta.count||data.length,
  //       },
  //     };
  //   });
  // }, {
  //   paginated,
  //   defaultPageSize: defaultPerPage,
  // });

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const onChange = (selectedRowKeys: React.ReactText[], selectedRows: React.ReactText[]) => {
    setSelectedRowKeys(selectedRowKeys);
    onSelected && onSelected(selectedRows);
  }
  // useEffect(() => {
  //   setSelectedRowKeys(srk);
  // }, [srk]);
  // console.log(srk);
  const tableProps: any = {};

  if (actions.length) {
    tableProps.rowSelection = {
      type: multiple ? 'checkbox' : 'radio',
      selectedRowKeys,
      onChange,
    }
  }

  const dragProps = {
    async onDragEnd(fromIndex, toIndex) {
      const list = data?.list||(data as any);
      const resourceKey = get(list, [fromIndex, rowKey]);
      const targetIndex = get(list, [toIndex, rowKey]);
      const newList = arrayMove(list, fromIndex, toIndex);
      // const item = list.splice(fromIndex, 1)[0];
      // list.splice(toIndex, 0, item);
      mutate({
        ...data,
        list: newList,
      });
      await api.resource(resourceName).sort({
        associatedKey,
        resourceKey,
        values: {
          field: 'sort',
          target: {
            [rowKey]: targetIndex,
          },
        },
      });
      await refresh();
      console.log({fromIndex, toIndex, newList});
    },
    handleSelector: ".drag-handle",
    ignoreSelector: "tr.ant-table-expanded-row",
    nodeSelector: "tr.ant-table-row"
  };

  return (
    <div>
      <Actions associatedKey={associatedKey} onTrigger={{
        async create(values) {
          refresh();
        },
        async update(values) {
          refresh();
        },
        async filter(values) {
          refresh();
        },
        async destroy() {
          if (selectedRowKeys.length) {
            await api.resource(resourceName).destroy({
              associatedKey,
              filter: {
                [`${rowKey}.in`]: selectedRowKeys,
              },
            });
          }
          refresh();
        },
      }} actions={actions} style={{ marginBottom: 14 }}/>
      <ReactDragListView {...dragProps}>
        <AntdTable
          rowKey={rowKey}
          loading={{
            spinning: loading,
            size: 'large',
            indicator: icon,
          }}
          dataSource={data?.list||(data as any)}
          size={'middle'} 
          columns={fields2columns(fields, {associatedKey, refresh})}
          pagination={false}
          onChange={(pagination, filters, sorter, extra) => {
            run({...params[0], sorter});
          }}
          onRow={(data) => ({
            onClick: () => {
              Drawer.open({
                title: pages.length > 1 ? undefined : data[labelField],
                bodyStyle: {
                  // padding: 0,
                },
                content: ({resolve}) => (
                  <div>
                    <PageTabs associatedKey={associatedKey} resourceName={resourceName} onFinish={() => {
                      refresh();
                      resolve();
                    }} onDataChange={() => {
                      refresh();
                    }} data={data} resolve={resolve} pages={pages}></PageTabs>
                  </div>
                ),
              });
            },
          })}
          {...tableProps}
        />
      </ReactDragListView>
      {paginated && (
        <div className={'table-pagination'}>
          <Pagination {...pagination} showTotal={(total)=> `共 ${total} 条记录`} showQuickJumper showSizeChanger size={'small'}/>
        </div>
      )}
    </div>
  );
}
