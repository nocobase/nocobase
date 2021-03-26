import React, { useState, useEffect, useRef, createRef } from 'react';
import './style.less';
import { Helmet } from 'umi';
import { Spin } from '@nocobase/client';
import { useRequest, useLocation } from 'umi';
import api from '@/api-client';
import { Actions } from '../Actions';
import { Modal, Table as AntdTable, Card, Pagination, Button, Tabs, Descriptions, Tooltip } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { components, fields2columns } from '@/components/views/SortableTable';
import ReactDragListView from 'react-drag-listview';
import arrayMove from 'array-move';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import some from 'lodash/some';
import Drawer from '@/components/pages/AdminLoader/Drawer';
import Field from '@/components/views/Field';
import { Form } from './Form';
import { View } from './';

export function Details(props) {
  const { onValueChange, onReset, __parent, noRequest,  associatedKey, resourceName, onFinish, onDataChange, data, items = [], resolve } = props;
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
          <View 
            onValueChange={onValueChange}
            onReset={onReset} 
            __parent={__parent} 
            noRequest={noRequest} 
            associatedKey={associatedKey} 
            onFinish={onFinish} 
            onDataChange={onDataChange} 
            data={data} 
            viewName={viewName}/>
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
    actions: defaultActions = [],
    details: defaultDetails  = [],
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

  let actions = defaultActions;
  let details = defaultDetails;

  if (!onChange) {
    actions = [];
    details = [];
  }

  const cloneFields = cloneDeep(fields) as any[];

  let draggable = !!schema.draggable;

  let sortField: string;

  for (const field of cloneFields) {
    if (field.type === 'sort') {
      sortField = field.name;
    }
  }

  if (draggable && !sortField) {
    sortField = 'sort',
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
  }

  if (!sortField) {
    sortField = 'sort';
  }

  const { type } = associationField;
  const { data = [], loading, mutate, refresh, run, params } = useRequest((params = {}, ...args) => {
    return !associatedKey || type === 'virtual' || type === 'json' ? Promise.resolve({
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
      let data = arrayMove(dataSource, fromIndex, toIndex);
      data = data.map((v: any, i) => {
        return {...v, [sortField]: i};
      });
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

  return (
    <div>
      <Actions size={size} __parent={__parent} associatedKey={associatedKey} noRequest={true} onTrigger={{
        async create(values) {
          values[rowKey] = generateIndex();
          let data = [...dataSource];
          data.push(values);
          data = data.map((v: any, i) => {
            return {...v, [sortField]: i};
          });
          mutate(data);
          onChange && await onChange(data);
        },
        async add(items = []) {
          let data = [...dataSource];
          data.push(...items);
          data = data.map((v: any, i) => {
            if (!v[rowKey]) {
              v[rowKey] = generateIndex();
            }
            return {...v, [sortField]: i};
          });
          mutate(data);
          onChange && await onChange(data);
        },
        async destroy() {
          let data = dataSource.filter(item => !selectedRowKeys.includes(item[rowKey]));
          data = data.map((v: any, i) => {
            return {...v, [sortField]: i};
          });
          mutate(data);
          onChange && await onChange(data);
        },
      }} actions={actions} style={{ marginBottom: 14, marginTop: -31 }}/>
      <ReactDragListView {...dragProps}>
        <AntdTable
          rowKey={rowKey}
          dataSource={dataSource}
          size={size} 
          columns={fields2columns(cloneFields, { mutate, dataSource, onChange })}
          pagination={false}
          onChange={(pagination, filters, sorter, extra) => {
            
          }}
          components={{
            body: {
              row: ({className, ...others}) => {
                if (!details.length) {
                  return <tr className={className} {...others}/>
                }
                return <tr className={className ? `${className} row-clickable` : 'row-clickable'} {...others}/>
              },
            }
          }}
          expandable={expandable}
          onRow={(data, index) => ({
            onClick: (e) => {
              const className = (e.target as HTMLElement).className;
              if (typeof className === 'string' && 
                  (className.includes('ant-table-selection-column') 
                    || className.includes('ant-checkbox') 
                    || className.includes('ant-radio')
                  )
                ) {
                return;
              }
              if (!details.length) {
                return;
              }
              Drawer.open({
                title: details.length > 1 ? undefined : data[labelField],
                bodyStyle: {
                  // padding: 0,
                },
                content: ({resolve, closeWithConfirm}) => (
                  <div>
                    <Details 
                      // __parent={__parent}
                      associatedKey={associatedKey}
                      resourceName={resourceName} 
                      onFinish={async (values) => {
                        let data = [...dataSource];
                        console.log({values});
                        data[index] = values;
                        data = data.map((v: any, i) => {
                          return {...v, [sortField]: i};
                        });
                        mutate(data);
                        onChange && await onChange(data);
                        console.log({values, data});
                        resolve();
                      }}
                      onReset={resolve}
                      onDataChange={() => {
                        
                      }}
                      onValueChange={() => {
                        closeWithConfirm && closeWithConfirm(true);
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
