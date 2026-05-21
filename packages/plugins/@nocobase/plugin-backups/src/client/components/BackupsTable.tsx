import { DatePicker, useRequest, useAPIClient, useCurrentAppInfo, useApp } from '@nocobase/client';
import type { TableColumnsType } from 'antd';
import { App, Divider, message, Space, Table } from 'antd';
import React, { useContext } from 'react';
import { NAMESPACE } from '../constants';
import { BackupsContext } from '../contexts';
import { useT } from '../locale';
import { RestoreFromBackup } from './RestoreFromBackup';

export interface BackupFile {
  name: string;
  fileSize: string;
  createdAt: string;
  inProgress: boolean;
}

export const BackupsTable = () => {
  const t = useT();
  const api = useAPIClient();
  const currentAppInfo = useCurrentAppInfo();
  const app = useApp();
  const { modal } = App.useApp();
  const { data, loading, refreshAsync: refresh } = useContext(BackupsContext);
  const { runAsync: destroy } = useRequest<{ data: BackupFile[] }>(
    {
      url: `${NAMESPACE}:destroy`,
      method: 'post',
    },
    { manual: true },
  );

  const handleDestory = (fileData: BackupFile) => {
    modal.confirm({
      title: t('Delete record'),
      content: t('Are you sure you want to delete it?'),
      onOk: async () => {
        await destroy({ filterByTk: fileData.name });
        await refresh();
        message.success(t('The deletion was successful.'));
      },
    });
  };

  const handleDownload = async (fileData: BackupFile) => {
    const appName = currentAppInfo?.data?.['name'];
    let url = `${app.getApiUrl('backups:download')}?filterByTk=${fileData.name}&token=${api.auth.token}`;
    if (appName) {
      url += `&__appName=${appName}`;
    }
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileData.name);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const hideCellWhenInProgress = (data: BackupFile) => (data.inProgress ? { colSpan: 0 } : {});
  const columns: TableColumnsType<BackupFile> = [
    {
      title: t('Backup list'),
      dataIndex: 'name',
      width: 400,
      onCell: (data) => {
        return data.inProgress
          ? {
              colSpan: 4,
            }
          : {};
      },
      render: (name, data) =>
        data.inProgress ? (
          <div style={{ color: 'rgba(0, 0, 0, 0.88)' }}>
            {name}({t('Backing up')}...)
          </div>
        ) : (
          <div>{name}</div>
        ),
    },
    {
      title: t('File size'),
      dataIndex: 'fileSize',
      onCell: hideCellWhenInProgress,
    },
    {
      title: t('Created at'),
      dataIndex: 'createdAt',
      onCell: hideCellWhenInProgress,
      render: (value) => {
        return <DatePicker.ReadPretty value={value} showTime />;
      },
    },
    {
      title: t('Actions'),
      dataIndex: 'actions',
      onCell: hideCellWhenInProgress,
      render: (_, record) => (
        <Space split={<Divider type="vertical" />}>
          <RestoreFromBackup backup={record} />
          <a
            type="link"
            onClick={() => {
              handleDownload(record);
            }}
          >
            {t('Download')}
          </a>
          <a onClick={() => handleDestory(record)}>{t('Delete')}</a>
        </Space>
      ),
    },
  ];

  return <Table rowKey={'name'} dataSource={data?.data} loading={loading} columns={columns} />;
};
