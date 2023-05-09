import { useRecord } from '../../record-provider';
import { Checkbox, message, Table } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCustomRequest } from './CustomRequestProvider';
import { useAPIClient } from '../../api-client';

export const CustomRequestConfigure = () => {
  const currentRecord = useRecord();
  const api = useAPIClient();
  const { items, service, roleService } = useCustomRequest();
  const { t } = useTranslation();
  const requestRoleMap = useMemo(() => {
    return (roleService?.data?.data || []).reduce((prev, curr) => {
      if (prev[curr.customRequestKey]) {
        prev[curr.customRequestKey] = [...prev[curr.customRequestKey], curr.roleName];
      } else {
        prev[curr.customRequestKey] = [curr.roleName];
      }
      return prev;
    }, {});
  }, [roleService?.data?.data]);

  useEffect(() => {
    service.run();
    roleService.run();
  }, []);

  const handleChange = async (checked, record) => {
    await api.request({
      url: `/customrequestRoles:set/${record.key}`,
      method: 'post',
      data: {
        value: !checked,
        customRequestKey: record.key,
        roleName: currentRecord?.name,
      },
    });
    message.success(t('Saved successfully'));
    roleService.run();
  };
  return (
    <Table
      loading={service.loading}
      rowKey={'key'}
      pagination={false}
      expandable={{
        defaultExpandAllRows: true,
      }}
      columns={[
        {
          dataIndex: 'name',
          title: t('Request name'),
        },
        {
          dataIndex: 'accessible',
          title: t('Accessible'),
          render: (_, record) => {
            const checked = requestRoleMap[record.key]?.includes?.(currentRecord?.name);
            return !record.children && <Checkbox checked={checked} onChange={() => handleChange(checked, record)} />;
          },
        },
      ]}
      dataSource={items}
    />
  );
};
