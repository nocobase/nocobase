import React from 'react';
import { Table } from 'antd';
import { useTranslation } from 'react-i18next';

export const PreviewFields = () => {
  const { t } = useTranslation();

  const columns = [
    {
      title: t('Field name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('Field type'),
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: t('Field source'),
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: t('Field interface'),
      dataIndex: 'interface',
      key: 'interface',
    },
    {
      title: t('Field display name'),
      dataIndex: 'title',
      key: 'title',
    },
  ];
  return (
    <>
      <h4>Fields:</h4>
      <Table columns={columns} />
      <h4>Preview:</h4>
      <Table columns={columns} />
    </>
  );
};
