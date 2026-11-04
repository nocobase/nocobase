/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LoadingOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Table, useCurrentAppInfo } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { App, Divider, Space, theme } from 'antd';
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

type AppInfo = {
  name?: string;
  data?: {
    name?: string;
  };
};

type ResourceResponse<T> = {
  data?: T;
};

export const BackupsTable = () => {
  const t = useT();
  const downloadingRef = useRef(false);
  const [downloading, setDownloading] = useState<string>();
  const ctx = useFlowContext();
  const currentAppInfo = useCurrentAppInfo<AppInfo>();
  const { token } = theme.useToken();
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
      if (downloadingRef.current) return;
      const appName = currentAppInfo?.name ?? currentAppInfo?.data?.name;
      const params: Record<string, string> = {
        filterByTk: fileData.name,
      };
      if (appName) {
        params.__appName = appName;
      }
      downloadingRef.current = true;
      setDownloading(fileData.name);
      try {
        const response = await ctx.api.request<{ data: { token: string } }>({
          url: 'backups:download',
          method: 'post',
          params,
        });
        const link = document.createElement('a');
        link.href = ctx.api.axios.getUri({
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
    },
    [ctx.api, currentAppInfo?.data?.name, currentAppInfo?.name, message, t],
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
            <a onClick={() => handleDestroy(record)}>{t('Delete')}</a>
          </Space>
        ),
      },
    ],
    [downloading, handleDestroy, handleDownload, t, token.colorText],
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
