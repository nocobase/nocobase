import React from 'react';
import { Space, useRequest } from '@nocobase/client';
import { Card } from 'antd';
import { BackupFile, BackupsTable } from './BackupsTable';
import { RefreshBackups } from './RefreshBackups';
import { RestoreFromLocal } from './RestoreFromLocal';
import { NewBackup } from './NewBackup';
import { BackupsContext } from '../contexts';
import { NAMESPACE } from '../constants';

export const BackupsManagement = () => {
  const request = useRequest<{ data: BackupFile[] }>({
    url: `${NAMESPACE}:list`,
    method: 'get',
  });

  return (
    <BackupsContext.Provider value={request}>
      <Card bordered={false}>
        <Space style={{ float: 'right', marginBottom: 16 }}>
          <RefreshBackups />
          <RestoreFromLocal />
          <NewBackup />
        </Space>
        <BackupsTable />
      </Card>
    </BackupsContext.Provider>
  );
};
