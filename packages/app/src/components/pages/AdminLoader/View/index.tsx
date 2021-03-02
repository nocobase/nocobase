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

const VIEWS = new Map();

export function registerView(type, view) {
  VIEWS.set(type, view);
}

export function getView(type) {
  return VIEWS.get(type);
}

export const icon = <LoadingOutlined style={{ fontSize: 36 }} spin />;

export function View(props: any) {
  const { viewName, children, ...restProps } = props;

  const { data = {}, loading } = useRequest(() => api.resource('views_v2').getInfo({
    resourceKey: viewName,
  }), {
    refreshDeps: [viewName],
  });

  if (loading) {
    return <Spin/>
  }

  const { type } = data;

  const Component = getView(type);

  return (
    <Component schema={data}/>
  );
};

export function Table(props: any) {
  const {
    onSelected,
    multiple = true,
    isFieldComponent,
    associatedKey,
    schema = {},
  } = props;

  const { 
    fields = [],
    actions = [],
    pages = [],
    paginated = true,
    defaultPerPage = 10,
    collection_name,
    rowKey = 'id',
    labelField = 'id',
    sort,
  } = schema;

  const resourceName = collection_name;

  const { data, loading, pagination, mutate, refresh, run, params } = useRequest((params = {}, ...args) => {
    const { current, pageSize, sorter, filter, ...restParams } = params;
    return api.resource(resourceName).list({
      sort,
    }).then(({data = [], meta = {}}) => {
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
    <Card bordered={false}>
      <Actions actions={actions} style={{ marginBottom: 14 }}/>
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
          onRow={(data) => ({
            onClick: () => {
              Drawer.open({
                title: pages.length > 1 ? undefined : data[labelField],
                bodyStyle: {
                  // padding: 0,
                },
                content: ({resolve}) => (
                  <div>
                    <PageTabs resolve={resolve} pages={pages}></PageTabs>
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
    </Card>
  );
}

function PageTabs(props) {
  const { pages = [], resolve } = props;
  if (!pages || pages.length === 0) {
    return null;
  }
  const [page, setPage] = useState(pages[0]);
  const { id, collection_name, views } = page;
  return (
    <div className={'page-tabs'}>
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
      {views.map(view => {
        let viewName: string;
        if (typeof view === 'string') {
          viewName = `${collection_name}.${view}`;
        } if (typeof view === 'object') {
          viewName = `${collection_name}.${view.name}`;
        }
        return (
          <View resolve={resolve} viewName={viewName}/>
        );
      })}
    </div>
  );
}

export function Details(props) {
  const { resourceKey, schema = {}, resolve } = props;
  const { fields = [], actions = [] } = schema;
  const data = {};
  return (
    <div>
      <Actions actions={actions} style={{ marginBottom: 14 }}/>
      <Descriptions 
        // layout={'vertical'}
        size={'middle'}
        bordered 
        column={1}>
        {fields.map(field => {
          return (
            <Descriptions.Item label={field.title||field.name}>
              <Field data={field} viewType={'descriptions'} schema={field} value={get(data, field.name)}/>
            </Descriptions.Item>
          )
        })}
      </Descriptions>
      <Drawer.Footer>
                      <Button onClick={resolve} type={'primary'}>确定</Button>
                    </Drawer.Footer>
    </div>
  );
}

export function Association(props) {
  const { schema = {} } = props;
  const { targetViewName } = schema;
  return (
    <div>
      <View viewName={targetViewName}/>
    </div>
  );
}

registerView('table', Table);
registerView('form', Form);
registerView('details', Details);
registerView('association', Association);

export default View;
