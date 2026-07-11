/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { Table } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { App, Button, Divider, Space, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useCallback, useMemo, useRef, useState } from 'react';
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

type ResourceResponse<T> = {
  data?: T;
};

export const BackupsTable = () => {
  const t = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const downloadingFileNameRef = useRef<string | null>(null);
  const [downloadingFileName, setDownloadingFileName] = useState<string | null>(null);
  const backupsTableClassName = useMemo(
    () => css`
      .ant-table-tbody > tr > td {
        line-height: ${token.controlHeight - token.paddingXXS}px;
      }
    `,
    [token.controlHeight, token.paddingXXS],
  );
  const { modal, message } = App.useApp();
  const { data, loading, refreshAsync: refresh } = useBackupsContext();
  const { runAsync: destroy } = useRequest<BackupFile[] | undefined, [string]>(
    async (filterByTk) => {
      const response = await ctx.api.request<ResourceResponse<BackupFile[]>>({
        url: `${NAMESPACE}:destroy`,
        method: 'post',
        params: { filterByTk },
      });

      return response.data?.data;
    },
    { manual: true },
  );

  const handleDestroy = useCallback(
    (fileData: BackupFile) => {
      modal.confirm({
        title: t('Delete record'),
        content: t('Are you sure you want to delete it?'),
        onOk: async () => {
          await destroy(fileData.name);
          await refresh();
          message.success(t('The deletion was successful.'));
        },
      });
    },
    [destroy, message, modal, refresh, t],
  );

  const handleDownload = useCallback(
    async (fileData: BackupFile) => {
      if (downloadingFileNameRef.current) {
        return;
      }

      downloadingFileNameRef.current = fileData.name;
      setDownloadingFileName(fileData.name);

      try {
        const { url } = await ctx.api.auth.createTemporaryUrl({
          url: 'backups:download',
          params: {
            filterByTk: fileData.name,
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
        downloadingFileNameRef.current = null;
        setDownloadingFileName(null);
      }
    },
    [ctx.api],
  );

  const hideCellWhenInProgress = (record: BackupFile) => (record.inProgress ? { colSpan: 0 } : {});
  const columns = useMemo<ColumnsType<BackupFile>>(
    () => [
      {
        title: t('Backup list'),
        dataIndex: 'name',
        width: 400,
        ellipsis: true,
        onCell: (record) => {
          return record.inProgress
            ? {
                colSpan: 4,
              }
            : {};
        },
        render: (name: string, record) =>
          record.inProgress ? (
            <span style={{ color: token.colorText }}>
              {name}({t('Backing up')}...)
            </span>
          ) : (
            <span>{name}</span>
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
        render: (value: string | undefined) => {
          return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
      },
      {
        title: t('Actions'),
        dataIndex: 'actions',
        onCell: hideCellWhenInProgress,
        render: (_: unknown, record) => (
          <Space split={<Divider type="vertical" />}>
            <RestoreFromBackup backup={record} />
            <Button
              type="link"
              htmlType="button"
              aria-label={t('Download')}
              aria-busy={downloadingFileName === record.name}
              loading={downloadingFileName === record.name}
              disabled={downloadingFileName !== null && downloadingFileName !== record.name}
              style={{ height: 'auto', padding: 0 }}
              onClick={() => {
                handleDownload(record);
              }}
            >
              {t('Download')}
            </Button>
            <a onClick={() => handleDestroy(record)}>{t('Delete')}</a>
          </Space>
        ),
      },
    ],
    [downloadingFileName, handleDestroy, handleDownload, t, token.colorText],
  );

  return (
    <Table<BackupFile>
      rowKey="name"
      className={backupsTableClassName}
      dataSource={data?.data}
      loading={loading}
      columns={columns}
    />
  );
};
