import React, { useState, useEffect, useRef, createRef } from 'react';
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
import cloneDeep from 'lodash/cloneDeep';
import Drawer from '@/components/pages/AdminLoader/Drawer';
import Field from '@/components/views/Field';
import { Form } from './Form';
import { View } from './';

export function Details(props) {
  const { __parent, noRequest,  associatedKey, resourceName, onFinish, onDataChange, data, items = [], resolve } = props;
  if (!items || items.length === 0) {
    return null;
  }
  const [currentTabIndex, setCurrentTabIndex] = useState('0');
  return (
    <div className={'page-tabs'}>
      { items.length > 1 && (
        <div className={'tabs-wrap'}>
          <Tabs size={'small'} activeKey={`${currentTabIndex}`} onChange={(activeKey) => {
            setCurrentTabIndex(activeKey);
          }}>
            {items.map((page, index) => (
              <Tabs.TabPane tab={page.title} key={`${index}`}/>
            ))}
          </Tabs>
        </div>
      ) }
      {(get(items, [currentTabIndex, 'views'])||[]).map(view => {
        let viewName: string;
        if (typeof view === 'string') {
          viewName = `${resourceName}.${view}`;
        } if (typeof view === 'object') {
          viewName = `${resourceName}.${view.name}`;
        }
        return (
          <View __parent={__parent} noRequest={noRequest} associatedKey={associatedKey} onFinish={onFinish} onDataChange={onDataChange} data={data} viewName={viewName}/>
        );
      })}
    </div>
  );
}

export function generateIndex(): string {
  return `${Math.random().toString(36).replace('0.', '').slice(-4).padStart(4, '0')}`;
}

export function SubTable(props: any) {
  const {
    __parent,
    schema = {},
    associatedKey,
    onChange,
    size = 'middle'
  } = props;

  const { 
    fields = [],
    actions = [],
    details = [],
    paginated = true,
    defaultPerPage = 10,
    // rowKey = 'id',
    labelField = 'id',
    sort,
    resourceName,
    associationField = {},
    appends = [],
    expandable,
    filter: schemaFilter = {},
  } = schema;

  const cloneFields = cloneDeep(fields) as any[];

  cloneFields.unshift({
    "dataIndex": [
    "sort"
    ],
    "title": "排序",
    "name": "sort",
    "interface": "sort",
    "type": "sort",
    "required": true,
    "developerMode": false,
    "component": {
      "type": "sort",
      "showInTable": true,
      "width": 60,
      "className": "drag-visible"
    },
  });

  const { type } = associationField;

  const { data = [], loading, mutate, refresh, run, params } = useRequest((params = {}, ...args) => {
    return type === 'virtual' || type === 'json' ? Promise.resolve({
      data: (props.data||[]).map(item => {
        if (!item[rowKey]) {
          item[rowKey] = generateIndex();
        }
        return item;
      })
    }) : api.resource(resourceName).list({
      associatedKey,
      perPage: -1,
      'fields[appends]': appends,
    })
    .then(({ data = [] }) => {
      console.log('associatedKey', data);
      if (!Array.isArray(data)) {
        return {
          data: [],
        }
      }
      return {
        data: data.map(item => {
          if (!item[rowKey]) {
            item[rowKey] = generateIndex();
          }
          return item;
        })
      }
    });
  }, {
    paginated: false,
  });

  const dataSource = data as any;

  const rowKey = '__index';

  const dragProps = {
    async onDragEnd(fromIndex, toIndex) {
      const data = arrayMove(dataSource, fromIndex, toIndex);
      mutate(data);
      onChange && await onChange(data);
    },
    handleSelector: ".drag-handle",
    ignoreSelector: "tr.ant-table-expanded-row",
    nodeSelector: "tr.ant-table-row"
  };

  const tableProps: any = {};

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  if (actions.length) {
    tableProps.rowSelection = {
      type: 'checkbox',
      selectedRowKeys,
      onChange: (selectedRowKeys: React.ReactText[], selectedRows: React.ReactText[]) => {
        setSelectedRowKeys(selectedRowKeys);
      },
    }
  }

  console.log({associatedKey, data, dataSource})

  return (
    <div>
      <Actions size={size} __parent={__parent} associatedKey={associatedKey} noRequest={true} onTrigger={{
        async create(values) {
          values[rowKey] = generateIndex();
          const data = [...dataSource];
          data.push(values);
          mutate(data);
          onChange && await onChange(data);
          console.log('create', {...values});
        },
        async destroy() {
          const data = dataSource.filter(item => !selectedRowKeys.includes(item[rowKey]));
          mutate(data);
          onChange && await onChange(data);
        },
      }} actions={actions} style={{ marginBottom: 14, marginTop: -31 }}/>
      <ReactDragListView {...dragProps}>
        <AntdTable
          rowKey={rowKey}
          dataSource={dataSource}
          size={size} 
          columns={fields2columns(cloneFields)}
          pagination={false}
          onChange={(pagination, filters, sorter, extra) => {
            
          }}
          expandable={expandable}
          onRow={(data, index) => ({
            onClick: (e) => {
              console.log('e.target', e.target);
              Drawer.open({
                title: details.length > 1 ? undefined : data[labelField],
                bodyStyle: {
                  // padding: 0,
                },
                content: ({resolve}) => (
                  <div>
                    <Details 
                      __parent={__parent}
                      associatedKey={associatedKey}
                      resourceName={resourceName} 
                      onFinish={async (values) => {
                        const data = [...dataSource];
                        data[index] = values;
                        mutate(data);
                        onChange && await onChange(data);
                        console.log('details', values);
                        resolve();
                      }}
                      onDataChange={() => {
                        
                      }}
                      noRequest={true}
                      data={data}
                      resolve={resolve}
                      items={details}
                    />
                  </div>
                ),
              });
            },
          })}
          {...tableProps}
        />
      </ReactDragListView>
    </div>
  );
}
