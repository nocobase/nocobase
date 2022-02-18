import { Checkbox, Spin, Table } from 'antd';
import React from 'react';
import { useRecord } from '../..';
import { useAPIClient, useRequest } from '../../api-client';
import { useRoute } from '../../route-switch';

const toItems = (properties = {}) => {
  const items = [];
  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      const element = properties[key];
      const item = {
        title: element.title,
        uid: element['x-uid'],
      };
      if (element.properties) {
        item['children'] = toItems(element.properties);
      }
      items.push(item);
    }
  }
  return items;
};

export const MenuConfigure = () => {
  const route = useRoute();
  const record = useRecord();
  console.log(route.uiSchemaUid);
  const api = useAPIClient();
  const { loading, data } = useRequest({
    url: `uiSchemas:getProperties/${route.uiSchemaUid}`,
  });
  if (loading) {
    return <Spin />;
  }
  const items = toItems(data?.data?.properties);
  console.log(items);
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
