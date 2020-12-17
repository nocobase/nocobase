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

export interface SimpleTableProps {
  schema?: any;
  activeTab?: any;
  resourceName: string;
  associatedName?: string;
  associatedKey?: string;
  [key: string]: any;
}

export function generateIndex(): string {
  return `${Math.random().toString(36).replace('0.', '').slice(-4).padStart(4, '0')}`;
}

export default function Table(props: SimpleTableProps) {
  console.log(props);
  const drawerRef = useRef<any>();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const onTableChange = (selectedRowKeys: React.ReactText[]) => {
    setSelectedRowKeys(selectedRowKeys);
  }
  const tableProps: any = {};
  tableProps.rowSelection = {
    selectedRowKeys,
    onChange: onTableChange,
  }
  const { rowKey = '__id', fields = [] } = props;
  const { value = [], onChange } = props;

  const { data: schema = {}, loading } = useRequest(() => api.resource('fields').getView({
    resourceKey: 'simple'
  }));

  if (loading) {
    return <Spin/>
  }

  return (
    <div>
      <div>
        <Space style={{marginBottom: 14}}>
          <Button type={'primary'} onClick={() => {
            drawerRef.current.setVisible(true);
            drawerRef.current.setIndex(undefined);
            drawerRef.current.setData({});
            drawerRef.current.setTitle('创建子字段');
          }}>创建</Button>
          <Popconfirm title="确认删除吗？" onConfirm={() => {
            console.log({selectedRowKeys})
            const newValues = value.filter(item => selectedRowKeys.indexOf(item.__id) === -1);
            onChange(newValues);
          }}>
            <Button>删除</Button>
          </Popconfirm>
        </Space>
      </div>
      <Form onFinish={(values, index: number) => {
        console.log(values);
        const newVaules = [...value];
        if (typeof index === 'undefined') {
          newVaules.push({...values, __id: generateIndex()})
        } else {
          newVaules[index] = values;
        }
        onChange(newVaules);
        console.log(newVaules);
      }} ref={drawerRef}/>
      <AntdTable
        rowKey={rowKey}
        // loading={loading}
        columns={fields2columns(schema.fields||[])}
        dataSource={value}
        onChange={(pagination, filters, sorter, extra) => {
          
        }}
        components={components({
          data: {
            list: value.map((item, index) => {
              if (item.__id) {
                return item;
              };
              return {...item, __id: generateIndex()};
            }),
          },
          mutate: (values) => {
            onChange(values.list);
            console.log(values);
          },
          rowKey,
          onMoved: async ({resourceKey, target}) => {
          }
        })}
        onRow={(record, index) => ({
          onClick: () => {
            console.log(record);
            drawerRef.current.setVisible(true);
            drawerRef.current.setIndex(index);
            drawerRef.current.setData(record);
            drawerRef.current.setTitle('编辑子字段');
          }
        })}
        pagination={false}
        {...tableProps}
      />
    </div>
  );
}
