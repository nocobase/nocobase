import { Checkbox, Table } from 'antd';
import React from 'react';
import { useMenuItems } from '.';
import { useRecord } from '../..';
import { useAPIClient } from '../../api-client';

export const MenuConfigure = () => {
  const record = useRecord();
  const api = useAPIClient();
  const items = useMenuItems();
  return (
    <Table
      rowKey={'uid'}
      pagination={false}
      expandable={{
        defaultExpandAllRows: true,
      }}
      columns={[
        {
          dataIndex: 'title',
          title: '菜单项',
        },
        {
          dataIndex: 'accessible',
          title: (
            <>
              <Checkbox /> 允许访问
            </>
          ),
          render: (_, schema) => (
            <Checkbox
              onChange={async (e) => {
                await api.request({
                  url: `roles/${record.name}/menuUiSchemas:toggle/${schema.uid}`,
                });
              }}
            />
          ),
        },
      ]}
      dataSource={items}
    />
  );
};
