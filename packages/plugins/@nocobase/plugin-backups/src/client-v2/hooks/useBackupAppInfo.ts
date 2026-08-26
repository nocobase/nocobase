/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';

export type BackupAppInfo = {
  database: {
    dialect: string;
    schema?: string;
  };
};

type ResourceResponse<T> = {
  data?: T;
};

const EMPTY_BACKUP_APP_INFO: BackupAppInfo = {
  database: {
    dialect: '',
  },
};

export const useBackupAppInfo = () => {
  const ctx = useFlowContext();
  const getBackupAppInfo = useMemoizedFn(async () => {
    const response = await ctx.api.request<ResourceResponse<BackupAppInfo>>({
      url: 'backups:appInfo',
    });

    return response.data?.data ?? EMPTY_BACKUP_APP_INFO;
  });

  const { data } = useRequest(getBackupAppInfo, {
    cacheKey: 'backupAppInfo',
    staleTime: -1,
  });

  return data ?? EMPTY_BACKUP_APP_INFO;
};
