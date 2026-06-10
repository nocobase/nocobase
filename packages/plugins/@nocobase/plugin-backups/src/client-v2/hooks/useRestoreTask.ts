/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { App } from 'antd';
import React, { useEffect } from 'react';
import { NAMESPACE } from '../constants';
import { useCheckBackupMessage } from './useCheckBackupMessage';

type RestoreStatus = {
  inProgress: boolean;
  message?: string;
};

type ResourceResponse<T> = {
  data?: T;
};

type BackupRuntimeApp = {
  maintaining?: boolean;
};

export function useRestoreTask() {
  const ctx = useFlowContext();
  const app = useApp() as BackupRuntimeApp;
  const restoreTaskId = React.useRef<string | null>(null);
  const { notification } = App.useApp();
  const { hideCheckBackupMessage } = useCheckBackupMessage();

  useEffect(() => {
    const checkRestoreTask = async () => {
      if (!restoreTaskId.current) {
        return;
      }
      try {
        const response = await ctx.api.request<ResourceResponse<RestoreStatus>>({
          url: `${NAMESPACE}:restoreStatus`,
          method: 'get',
          params: {
            task: restoreTaskId.current,
          },
        });
        const status = response.data?.data;
        if (!status) {
          return;
        }
        if (!status.inProgress) {
          restoreTaskId.current = null;
        }
        if (status.message) {
          hideCheckBackupMessage();
          notification.error({ message: status.message, role: 'alert' });
        }
      } catch (error) {
        console.error(error);
      }
    };
    const interval = setInterval(checkRestoreTask, 3000);
    return () => clearInterval(interval);
  }, [app.maintaining, ctx.api, hideCheckBackupMessage, notification]);

  return restoreTaskId;
}
