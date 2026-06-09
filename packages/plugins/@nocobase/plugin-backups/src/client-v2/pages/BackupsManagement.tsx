/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Card, Space } from 'antd';
import React from 'react';
import { BackupsTable } from '../components/BackupsTable';
import { NewBackup } from '../components/NewBackup';
import { RefreshBackups } from '../components/RefreshBackups';
import { RestoreFromLocal } from '../components/RestoreFromLocal';
import { NAMESPACE } from '../constants';
import { BackupsContext, BackupsListBody } from '../contexts';

const EMPTY_BACKUPS_LIST: BackupsListBody = { data: [] };

const BackupsManagement = () => {
  const ctx = useFlowContext();
  const request = useRequest<BackupsListBody, []>(async () => {
    const response = await ctx.api.request<BackupsListBody>({
      url: `${NAMESPACE}:list`,
      method: 'get',
    });

    return response.data ?? EMPTY_BACKUPS_LIST;
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

export default BackupsManagement;
