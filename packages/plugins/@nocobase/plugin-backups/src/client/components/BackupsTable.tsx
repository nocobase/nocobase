/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DatePicker, useAPIClient, useRequest } from '@nocobase/client';
import type { TableColumnsType } from 'antd';
import { App, Button, Divider, message, Space, Table } from 'antd';
import React, { useState } from 'react';
import { NAMESPACE } from '../constants';
import { useBackupsContext } from '../contexts';
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
  const { modal } = App.useApp();
  const [downloadingFileName, setDownloadingFileName] = useState<string | null>(null);
  const { data, loading, refreshAsync: refresh } = useBackupsContext();
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
    setDownloadingFileName(fileData.name);

    try {
      const targetParams = new URLSearchParams({ filterByTk: fileData.name });
      const code = await api.auth.createAccessCode({
        url: `backups:download?${targetParams}`,
      });
      const appName = api.getHeaders()['X-App'];
      const baseURL = api.axios.defaults.baseURL?.replace(/\/+$/, '') || '/api';
      const url = api.axios.getUri({
        baseURL: '',
        url: `${baseURL}/backups:download`,
        params: {
          filterByTk: fileData.name,
          _code: code,
          ...(appName && appName !== 'main' ? { __appName: appName } : {}),
        },
      });
      const link = document.createElement('a');
      link.href = url;
      link.download = fileData.name;
      link.hidden = true;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      // API request errors are displayed by the client's notification middleware.
    } finally {
      setDownloadingFileName(null);
    }
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
          <Button
            type="link"
            htmlType="button"
            aria-label={t('Download')}
            aria-busy={downloadingFileName === record.name}
            loading={downloadingFileName === record.name}
            disabled={downloadingFileName !== null}
            style={{ height: 'auto', padding: 0 }}
            onClick={() => {
              handleDownload(record);
            }}
          >
            {t('Download')}
          </Button>
          <a onClick={() => handleDestory(record)}>{t('Delete')}</a>
        </Space>
      ),
    },
  ];

  return <Table rowKey={'name'} dataSource={data?.data} loading={loading} columns={columns} />;
};
