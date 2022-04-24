import { Checkbox, message, Table } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../../api-client';
import { useRecord } from '../../record-provider';
import { useCompile } from '../../schema-component';
import { useMenuItems } from './RoleTable';

const findUids = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }
  const uids = [];
  for (const item of items) {
    uids.push(item.uid);
    uids.push(...findUids(item.children));
  }
  return uids;
};

export const MenuConfigure = () => {
  const record = useRecord();
  const api = useAPIClient();
  const items = useMenuItems();
  const compile = useCompile();
  const { t } = useTranslation();
  const allUids = findUids(items);
  const [uids, setUids] = useState([]);
  const { loading, refresh } = useRequest(
    {
      resource: 'roles.menuUiSchemas',
      resourceOf: record.name,
      action: 'list',
      params: {
        paginate: false,
      },
    },
    {
      onSuccess(data) {
        setUids(data?.data?.map((schema) => schema['x-uid']) || []);
      },
    },
  );
  const resource = api.resource('roles.menuUiSchemas', record.name);
  const allChecked = allUids.length === uids.length;
  return (
    <Table
      loading={loading}
      rowKey={'uid'}
      pagination={false}
      expandable={{
        defaultExpandAllRows: true,
      }}
      columns={[
        {
          dataIndex: 'title',
          title: t('Menu item title'),
        },
        {
          dataIndex: 'accessible',
          title: (
            <>
              <Checkbox
                checked={allChecked}
                onChange={async (value) => {
                  if (allChecked) {
                    await resource.set({
                      values: [],
                    });
                  } else {
                    await resource.set({
                      values: allUids,
                    });
                  }
                  refresh();
                  message.success(t('Saved successfully'));
                }}
              />{' '}
              {t('Accessible')}
            </>
          ),
          render: (_, schema) => {
            const checked = uids.includes(schema.uid);
            return (
              <Checkbox
                checked={checked}
                onChange={async (e) => {
                  if (checked) {
                    const index = uids.indexOf(schema.uid);
                    uids.splice(index, 1);
                    setUids([...uids]);
                  } else {
                    setUids((prev) => [...prev, schema.uid]);
                  }
                  await resource.toggle({
                    values: {
                      tk: schema.uid,
                    },
                  });
                  message.success(t('Saved successfully'));
                }}
              />
            );
          },
        },
      ]}
      dataSource={items}
    />
  );
};
