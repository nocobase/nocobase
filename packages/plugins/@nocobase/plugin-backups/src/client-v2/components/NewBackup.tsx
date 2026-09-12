/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { App, Button } from 'antd';
import React, { useEffect, useState } from 'react';
import { NAMESPACE } from '../constants';
import { useBackupsContext } from '../contexts';
import { useT } from '../locale';
import type { BackupFile } from './BackupsTable';

type BackupTaskStatus = {
  inProgress: boolean;
  message?: string;
};

type ResourceResponse<T> = {
  data?: T;
};

export const NewBackup = () => {
  const [inProgressBackups, setInProgressBackups] = useState<string[]>([]);
  const t = useT();
  const ctx = useFlowContext();
  const { message, notification, modal } = App.useApp();
  const { refreshAsync: refresh } = useBackupsContext();
  const { runAsync: create, loading: creating } = useRequest<BackupFile | undefined, []>(
    async () => {
      const response = await ctx.api.request<ResourceResponse<BackupFile>>({
        url: `${NAMESPACE}:create`,
        method: 'post',
      });

      return response.data?.data;
    },
    {
      manual: true,
      throttleWait: 1000,
    },
  );
  const { runAsync: queryStatus } = useRequest<Record<string, BackupTaskStatus>, [string[]]>(
    async (names) => {
      const response = await ctx.api.request<ResourceResponse<Record<string, BackupTaskStatus>>>({
        url: `${NAMESPACE}:taskStatus`,
        method: 'get',
        params: { names },
      });

      return response.data?.data ?? {};
    },
    {
      manual: true,
    },
  );

  useEffect(() => {
    if (inProgressBackups.length === 0) {
      return;
    }
    const interval = setInterval(async () => {
      const statusResults = await queryStatus(inProgressBackups);
      const doneBackup: string[] = [];
      const errorBackup: string[] = [];
      for (const [name, status] of Object.entries(statusResults)) {
        if (!status.inProgress) {
          if (status.message) {
            errorBackup.push(name);
            notification.error({ message: status.message, role: 'alert' });
          } else {
            doneBackup.push(name);
          }
        }
      }
      const completedBackups = [...doneBackup, ...errorBackup];
      if (doneBackup.length > 0) {
        message.success(t('NEW_BACKUPS_CREATED', { names: doneBackup.join(', ') }));
        await refresh();
      }
      if (completedBackups.length > 0) {
        setInProgressBackups((current) => current.filter((name) => !completedBackups.includes(name)));
      }
    }, 3000);
    return () => {
      clearInterval(interval);
    };
  }, [inProgressBackups, message, notification, queryStatus, refresh, t]);

  const Icon = creating ? LoadingOutlined : PlusOutlined;
  const createBackup = async () => {
    const backup = await create();
    if (backup?.name) {
      setInProgressBackups((current) => [...current, backup.name]);
    }
    message.success(t('New backup operation started'));
    await refresh();
  };
  const handleBtnClick = async () => {
    modal.confirm({
      title: t('New backup'),
      content: t('Are you sure you want to create new backup?'),
      onOk: async () => {
        await createBackup();
      },
    });
  };

  return (
    <Button icon={<Icon />} disabled={creating} type="primary" onClick={handleBtnClick}>
      {t('New backup')}
    </Button>
  );
};
