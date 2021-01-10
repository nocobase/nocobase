import { connect } from '@formily/react-schema-renderer'
import React, { useEffect, useState } from 'react';
import { Input as AntdInput, Table, Checkbox, Select } from 'antd'
import { acceptEnum, mapStyledProps, mapTextComponent } from '../shared'
import api from '@/api-client';
import { useRequest } from 'umi';
import { useDynamicList } from 'ahooks';
import findIndex from 'lodash/findIndex';

export const Permissions = {} as {Actions: any, Fields: any, Tabs: any};

Permissions.Actions = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent
})(({onChange, value = [], resourceKey, ...restProps}) => {
  const { data = [], loading = true } = useRequest(() => {
    return api.resource('collections.actions').list({
      associatedKey: resourceKey,
    });
  }, {
    refreshDeps: [resourceKey]
  });

  return <Table size={'small'} pagination={false} dataSource={data} columns={[
    {
      title: '操作',
      dataIndex: ['title'],
    },
    {
      title: '类型',
      dataIndex: ['onlyNew'],
    },
    {
      title: '允许操作',
      dataIndex: ['accessable'],
      render: (val, record) => <Checkbox defaultChecked={!!val} onChange={(e) => {
        console.log(e.target.checked);
        const values = [...value];
        const index = findIndex(values, (item: any) => item.id === record.id);
        if (index >= 0) {
          values[index].accessable = e.target.checked;
        } else {
          values.push({
            id: record.id,
            accessable: e.target.checked,
          });
        }
        onChange(values);
      }}/>
    },
    {
      title: '可操作的数据范围',
      dataIndex: ['scope'],
      render: (value, record) => <Select size={'small'}/>
    },
  ]} loading={loading}/>
})

Permissions.Fields = connect<'TextArea'>({
  getProps: mapStyledProps,
  getComponent: mapTextComponent
})(({onChange, resourceKey, ...restProps}) => {

  const { data = [], loading = true } = useRequest(() => {
    return api.resource('collections.fields').list({
      associatedKey: resourceKey,
    });
  }, {
    refreshDeps: [resourceKey]
  });
  console.log({resourceKey, data});

  return <Table size={'small'} pagination={false} dataSource={data} columns={[
    {
      title: '字段名称',
      dataIndex: ['title'],
    },
    {
      title: <><Checkbox/> 查看</>,
      dataIndex: ['list'],
      render: () => <Checkbox/>
    },
    {
      title: <><Checkbox/> 编辑</>,
      dataIndex: ['update'],
      render: () => <Checkbox/>
    },
    {
      title: <><Checkbox/> 新建</>,
      dataIndex: ['create'],
      render: () => <Checkbox/>
    },
  ]} loading={loading}/>
})

Permissions.Tabs = connect<'TextArea'>({
  getProps: mapStyledProps,
  getComponent: mapTextComponent
})(({onChange, value = [], resourceKey, ...restProps}) => {

  const { data = [], loading = true, mutate } = useRequest(() => {
    return api.resource('collections.tabs').list({
      associatedKey: resourceKey,
    });
  }, {
    refreshDeps: [resourceKey]
  });
  console.log({resourceKey, data});

  return <Table size={'small'} pagination={false} dataSource={data} columns={[
    {
      title: '标签页',
      dataIndex: ['title'],
    },
    {
      title: (
        <>
          <Checkbox onChange={(e) => {
            onChange(data.map(record => {
              return {
                id: record.id,
                accessable: e.target.checked,
              };
            }));
            mutate(data.map(record => {
              record.accessable = e.target.checked;
              return record;
            }));
          }}/> 查看
        </>
      ),
      dataIndex: ['accessable'],
      render: (val, record) => {
        return (
          <Checkbox checked={val} onChange={(e) => {
            record.accessable = e.target.checked;
            const values = [...value];
            const index = findIndex(values, (item: any) => item.id === record.id);
            if (index >= 0) {
              values[index].accessable = e.target.checked;
            } else {
              values.push({
                id: record.id,
                accessable: e.target.checked,
              });
            }
            console.log(values);
            onChange(values);
          }}/>
        )
      }
    },
  ]} loading={loading}/>
});
