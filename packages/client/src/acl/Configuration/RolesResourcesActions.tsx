import { FormItem, FormLayout } from '@formily/antd';
import { Checkbox, Select, Table } from 'antd';
import React from 'react';
import { useCollectionManager, useRecord } from '../..';

export const RolesResourcesActions = () => {
  const record = useRecord();
  console.log('record', record);
  const { get } = useCollectionManager();
  const collection = get(record.name);
  return (
    <div>
      <FormLayout layout={'vertical'}>
        <FormItem label={'操作权限'}>
          <Table
            size={'small'}
            pagination={false}
            columns={[
              {
                dataIndex: 'displayName',
                title: '操作',
              },
              {
                dataIndex: 'type',
                title: '类型',
              },
              {
                dataIndex: 'enable',
                title: '允许操作',
                render: () => <Checkbox />,
              },
              {
                dataIndex: 'scope',
                title: '可操作的数据范围',
                render: () => <Select size={'small'} />,
              },
            ]}
            dataSource={[
              {
                displayName: '添加',
                type: 'new-data',
              },
              {
                displayName: '导入',
                type: 'new-data',
              },
              {
                displayName: '查看',
                type: 'old-data',
              },
            ]}
          />
        </FormItem>
        <FormItem label={'字段权限'}>
          <Table
            dataSource={collection?.fields}
            columns={[
              {
                dataIndex:  ['uiSchema', 'title'],
                title: '字段名称',
              },
              {
                dataIndex: 'view',
                title: '查看',
                render: () => <Checkbox />
              },
              {
                dataIndex: 'update',
                title: '编辑',
                render: () => <Checkbox />
              },
              {
                dataIndex: 'create',
                title: '添加',
                render: () => <Checkbox />
              },
            ]}
          />
        </FormItem>
      </FormLayout>
    </div>
  );
};
