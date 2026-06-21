import { useApp } from '@nocobase/client';
import { useMemoizedFn } from 'ahooks';

export const useCheckBackupMessage = () => {
  const app = useApp();
  const showCheckBackupMessage = useMemoizedFn(() => {
    app.maintaining = true;
    app.error = {
      command: {
        name: 'APP Restoring',
      },
      message: 'checking backup...',
      code: 'APP_COMMANDING',
    };
  });
  const hideCheckBackupMessage = useMemoizedFn(() => {
    app.maintaining = false;
  });

  return { showCheckBackupMessage, hideCheckBackupMessage };
};
