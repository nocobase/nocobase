import { useAPIClient, useApp } from '@nocobase/client';
import { NAMESPACE } from '../constants';
import React, { useEffect } from 'react';
import { App } from 'antd';
import { useCheckBackupMessage } from './useCheckBackupMessage';

export function useRestoreTask() {
  const apiClient = useAPIClient();
  const restoreTaskId = React.useRef<string | null>(null);
  const { notification } = App.useApp();
  const { maintaining } = useApp();
  const { hideCheckBackupMessage } = useCheckBackupMessage();

  useEffect(() => {
    const checkRestoreTask = async () => {
      if (!restoreTaskId.current) {
        return;
      }
      try {
        const {
          data: { data },
        } = await apiClient.request({
          url: `${NAMESPACE}:restoreStatus`,
          method: 'get',
          params: {
            task: restoreTaskId.current,
          },
        });
        if (!data.inProgress) {
          restoreTaskId.current = null;
        }
        if (data.message) {
          hideCheckBackupMessage();
          notification.error({ message: data.message, role: 'alert' });
        }
      } catch (error) {
        console.error(error);
      }
    };
    const interval = setInterval(checkRestoreTask, 3000);
    return () => clearInterval(interval);
  }, [maintaining]);

  return restoreTaskId;
}
