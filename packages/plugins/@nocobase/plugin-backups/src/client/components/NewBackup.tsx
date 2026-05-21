/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App, Button } from 'antd';
import React, { useEffect, useState } from 'react';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { useT } from '../locale';
import { useRequest } from '@nocobase/client';
import { BackupFile } from './BackupsTable';
import { NAMESPACE } from '../constants';
import { useBackupsContext } from '../contexts';

interface BackupTaskStatus {
  inProgress: boolean;
  message?: string;
}

export const NewBackup = () => {
  const [inProgressBackups, setInProgressBackups] = useState<string[]>([]);
  const t = useT();
  const { message, notification, modal } = App.useApp();
  const { refreshAsync: refresh } = useBackupsContext();
  const { runAsync: create, loading: creating } = useRequest<{ data: BackupFile }>(
    {
      url: `${NAMESPACE}:create`,
      method: 'post',
    },
    {
      manual: true,
      throttleWait: 1000,
    },
  );
  const { runAsync: queryStatus } = useRequest<{ data: Record<string, BackupTaskStatus> }>(
    {
      url: `${NAMESPACE}:taskStatus`,
      method: 'get',
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
      const statusResults = await queryStatus({
        names: inProgressBackups,
      });
      const doneBackup = [];
      const errorBackup = [];
      for (const [name, status] of Object.entries(statusResults.data)) {
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
        setInProgressBackups(inProgressBackups.filter((name) => !completedBackups.includes(name)));
      }
    }, 3000);
    return () => {
      clearInterval(interval);
    };
  }, [inProgressBackups, message, notification, queryStatus, refresh, t]);

  const Icon = creating ? LoadingOutlined : PlusOutlined;
  const createBackup = async () => {
    const res = await create();
    setInProgressBackups([...inProgressBackups, res.data.name]);
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
    <>
      <Button icon={<Icon />} disabled={creating} type="primary" onClick={handleBtnClick}>
        {t('New backup')}
      </Button>
    </>
  );
};
