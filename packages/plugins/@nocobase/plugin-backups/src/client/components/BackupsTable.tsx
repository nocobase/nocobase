/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LoadingOutlined } from '@ant-design/icons';
import { DatePicker, useRequest, useAPIClient, useCurrentAppInfo } from '@nocobase/client';
import type { TableColumnsType } from 'antd';
import { App, Divider, message, Space, Table } from 'antd';
import React, { useRef, useState } from 'react';
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
  const downloadingRef = useRef(false);
  const [downloading, setDownloading] = useState<string>();
  const api = useAPIClient();
  const currentAppInfo = useCurrentAppInfo();
  const { modal } = App.useApp();
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
    if (downloadingRef.current) return;
    const appName = currentAppInfo?.data?.['name'];
    const params: Record<string, string> = {
      filterByTk: fileData.name,
    };
    if (appName) {
      params.__appName = appName;
    }
    downloadingRef.current = true;
    setDownloading(fileData.name);
    try {
      const response = await api.request<{ data: { token: string } }>({
        url: 'backups:download',
        method: 'post',
        params,
      });
      const link = document.createElement('a');
      link.href = api.axios.getUri({
        url: 'backups:download',
        params: { ...params, hash: response.data.data.token },
      });
      link.download = fileData.name;
      link.rel = 'noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      message.error(t('Download failed'));
    } finally {
      downloadingRef.current = false;
      setDownloading(undefined);
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
          <a
            role="button"
            tabIndex={0}
            aria-busy={downloading === record.name}
            aria-disabled={!!downloading}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleDownload(record);
              }
            }}
            onClick={() => {
              handleDownload(record);
            }}
          >
            {downloading === record.name && <LoadingOutlined style={{ marginRight: 4 }} aria-hidden />}
            {t('Download')}
          </a>
          <a onClick={() => handleDestory(record)}>{t('Delete')}</a>
        </Space>
      ),
    },
  ];

  return <Table rowKey={'name'} dataSource={data?.data} loading={loading} columns={columns} />;
};
