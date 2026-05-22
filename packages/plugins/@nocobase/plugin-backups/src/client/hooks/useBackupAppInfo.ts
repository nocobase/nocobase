import { useAPIClient } from '@nocobase/client';
import { useMemoizedFn, useRequest } from 'ahooks';

type BackupAppInfo = {
  database: {
    dialect: string;
    schema?: string;
  };
};

export const useBackupAppInfo = () => {
  const apiClient = useAPIClient();
  const getBackupAppInfo = useMemoizedFn(() => {
    return apiClient.request({
      url: 'backups:appInfo',
    });
  });

  const { data } = useRequest(getBackupAppInfo, {
    cacheKey: 'backupAppInfo',
    staleTime: -1,
  });

  return {
    database: {
      dialect: data?.data?.data.database.dialect,
      schema: data?.data?.data.database.schema,
    },
  } as BackupAppInfo;
};
