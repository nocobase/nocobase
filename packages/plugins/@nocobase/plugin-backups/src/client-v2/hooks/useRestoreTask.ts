/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { App } from 'antd';
import React, { useEffect } from 'react';
import { NAMESPACE } from '../constants';

type RestoreStatus = {
  inProgress: boolean;
  message?: string;
};

type ResourceResponse<T> = {
  data?: T;
};

export function useRestoreTask() {
  const ctx = useFlowContext();
  const restoreTaskId = React.useRef<string | null>(null);
  const { notification } = App.useApp();

  useEffect(() => {
    let checking = false;
    let disposed = false;
    const checkRestoreTask = async () => {
      const taskId = restoreTaskId.current;
      if (!taskId || checking) {
        return;
      }
      checking = true;
      try {
        const response = await ctx.api.request<ResourceResponse<RestoreStatus>>({
          url: `${NAMESPACE}:restoreStatus`,
          method: 'get',
          params: {
            task: taskId,
          },
        });
        if (disposed || restoreTaskId.current !== taskId) {
          return;
        }
        const status = response.data?.data;
        if (!status) {
          return;
        }
        if (!status.inProgress) {
          restoreTaskId.current = null;
        }
        if (status.message) {
          notification.error({ message: status.message, role: 'alert' });
        }
      } catch (error) {
        if (!disposed) {
          console.error(error);
        }
      } finally {
        checking = false;
      }
    };
    const interval = setInterval(checkRestoreTask, 3000);
    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [ctx.api, notification]);

  return restoreTaskId;
}
