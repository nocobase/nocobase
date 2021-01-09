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
  const { target = 'fields', value = [], onChange } = props;

  const { data: schema = {}, loading } = useRequest(() => api.resource(target).getView({
    resourceKey: 'simple'
  }));

  const [dataSource, setDataSource] = useState(value.map((item, index) => {
    if (item.__id) {
      return item;
    };
    return {...item, __id: generateIndex()};
  }))

  if (loading) {
    return <Spin/>
  }

  // console.log('dataSource', dataSource);
  return (
    <div>
      <div>
        <Space style={{marginBottom: 14, position: 'absolute', right: 0, top: -31}}>
          <Popconfirm title="确认删除吗？" onConfirm={() => {
            console.log({selectedRowKeys})
            const newValues = dataSource.filter(item => selectedRowKeys.indexOf(item.__id) === -1);
            setDataSource(newValues);
            onChange(newValues);
          }}>
            <Button size={'small'} type={'ghost'} danger>删除</Button>
          </Popconfirm>
          <Button size={'small'} type={'primary'} onClick={() => {
            drawerRef.current.setVisible(true);
            drawerRef.current.setIndex(undefined);
            drawerRef.current.setData({});
            drawerRef.current.setTitle('新增子字段');
          }}>新增</Button>
        </Space>
      </div>
      <Form target={target} onFinish={(values, index: number) => {
        console.log(values);
        const newVaules = [...dataSource];
        if (typeof index === 'undefined') {
          newVaules.push({...values, __id: generateIndex()})
        } else {
          newVaules[index] = values;
        }
        setDataSource(newVaules);
        onChange(newVaules);
        // console.log(newVaules);
      }} ref={drawerRef}/>
      <AntdTable
        size={'small'}
        rowKey={rowKey}
        // loading={loading}
        columns={fields2columns(schema.fields||[])}
        dataSource={dataSource}
        onChange={(pagination, filters, sorter, extra) => {
          
        }}
        components={components({
          data: {
            list: dataSource,
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
