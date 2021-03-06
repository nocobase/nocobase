import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Table as AntdTable, Button, Space, Popconfirm } from 'antd';
import { Actions } from '@/components/actions';
import ViewFactory from '@/components/views';
import { useRequest } from 'umi';
import api from '@/api-client';
import { components, fields2columns } from '@/components/views/SortableTable';
import Form from './Form';
import { Spin } from '@nocobase/client';
import maxBy from 'lodash/maxBy';
import Drawer from '@/components/pages/AdminLoader/Drawer';
import ReactDragListView from 'react-drag-listview';
import arrayMove from 'array-move';
import get from 'lodash/get';
import findIndex from 'lodash/findIndex';
import { FilterOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

export interface SimpleTableProps {
  schema?: any;
  activeTab?: any;
  resourceName: string;
  associatedName?: string;
  associatedKey?: string;
  [key: string]: any;
}

const schema = {
  talbe: {
    fields: [
      {
        interface: 'sort',
        type: 'sort',
        name: 'sort',
        title: '排序',
        component: {},
      },
      // {
      //   interface: 'string',
      //   type: 'string',
      //   name: 'name',
      //   title: '视图',
      //   component: {
      //     type: 'string',
      //   },
      // },
      {
        interface: 'linkTo',
        type: 'string',
        name: 'view',
        target: 'views_v2',
        // foreignKey: 'pageName',
        // targetKey: 'id',
        title: '视图',
        labelField: 'title',
        valueField: 'name',
        multiple: false,
        component: {
          type: 'drawerSelect',
          'x-component-props': {
            viewName: 'views_v2.table',
            resourceName: 'views_v2',
            labelField: 'title',
            valueField: 'name',
          },
        },
      },
      {
        interface: 'radio',
        type: 'string',
        name: 'width',
        title: '宽度',
        dataSource: [
          { label: '50%', value: '50%' },
          { label: '100%', value: '100%' },
        ],
        component: {
          type: 'radio',
        },
      }
    ]
  },
  form: {
    fields: [
      // {
      //   interface: 'string',
      //   type: 'string',
      //   name: 'name',
      //   title: '视图',
      //   component: {
      //     type: 'string',
      //   },
      // },
      {
        interface: 'linkTo',
        type: 'belongsTo',
        name: 'view',
        target: 'views_v2',
        // foreignKey: 'pageName',
        // targetKey: 'id',
        title: '视图',
        labelField: 'title',
        valueField: 'name',
        multiple: false,
        component: {
          type: 'drawerSelect',
          'x-component-props': {
            multiple: false,
            viewName: 'views_v2.table',
            resourceName: 'views_v2',
            labelField: 'title',
            valueField: 'name',
          },
        },
      },
      {
        interface: 'radio',
        type: 'string',
        name: 'width',
        title: '宽度',
        dataSource: [
          { label: '50%', value: '50%' },
          { label: '100%', value: '100%' },
        ],
        component: {
          type: 'radio',
        },
      }
    ],
  },
};

export function generateIndex(): string {
  return `${Math.random().toString(36).replace('0.', '').slice(-4).padStart(4, '0')}`;
}

export default function Table(props: SimpleTableProps) {
  console.log({props});
  const { associatedKey, rowKey = '__index', value, onChange } = props;
  const [dataSource, setDataSource] = useState(() => {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.map((item: any) => {
      if (typeof item === 'string') {
        item = { name: item };
      }
      if (!item.__index) {
        item.__index = generateIndex();
      }
      return item;
    });
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const columns = fields2columns(schema.talbe.fields);
  console.log({value});
  const dragProps = {
    async onDragEnd(fromIndex, toIndex) {
      const list = dataSource;
      const newList = arrayMove(list, fromIndex, toIndex);
      setDataSource(newList);
      console.log({fromIndex, toIndex, newList});
    },
    handleSelector: ".drag-handle",
    ignoreSelector: "tr.ant-table-expanded-row",
    nodeSelector: "tr.ant-table-row"
  };
  return (
    <div>
      <Popconfirm title="确认删除吗？" onConfirm={async () => {
        const data = dataSource.filter(item => !selectedRowKeys.includes(item.__index));
        setDataSource(data);
      }}>
      <Button
        danger
        type={'ghost'}
        icon={<DeleteOutlined/>}
      >删除</Button>
    </Popconfirm>
      <Button icon={<PlusOutlined/>} type={'primary'} onClick={() => {
        Drawer.open({
          title: 'xx',
          content: ({ resolve }) => {
            return (
              <>
                <Form onFinish={(values) => {
                  const data = [...dataSource];
                  data.push({
                    ...values,
                    __index: generateIndex(),
                  });
                  setDataSource(data);
                  onChange(data);
                
                  resolve();
                }} schema={{
                  fields: schema.form.fields,
                }}/>
              </>
            )
          }
        })
      }}>新增</Button>
      <ReactDragListView {...dragProps}>
        <AntdTable
          rowKey={rowKey}
          pagination={false}
          size={'small'}
          columns={columns}
          dataSource={dataSource}
          rowSelection={{
            selectedRowKeys,
            onChange(selectedRowKeys) {
              setSelectedRowKeys(selectedRowKeys);
            }
          }}
          onRow={(record) => {
            return {
              onClick() {
                Drawer.open({
                  title: 'xx',
                  content: ({ resolve }) => {
                    return (
                      <>
                        <Form onFinish={(values) => {
                          const index = findIndex(dataSource, item => item.__index === values.__index);
                          const data = [...dataSource];
                          if (index === -1) {
                            return;
                          }
                          data[index] = values;
                          console.log({values, index, data})
                          setDataSource(data);
                          onChange(data);
                          // if (index >= 0) {
                          //   dataSource[index] = values;
                          //   setDataSource({...dataSource});
                          // }
                          resolve();
                        }} data={record} schema={{
                          fields: schema.form.fields,
                        }}/>
                      </>
                    )
                  }
                })
              }
            }
          }}
        />
      </ReactDragListView>
    </div>
  );
}
