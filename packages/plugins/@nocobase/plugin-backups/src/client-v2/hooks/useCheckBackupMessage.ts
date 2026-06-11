/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp } from '@nocobase/client-v2';
import { useFlowEngine } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { BACKUP_RESTORE_RUNTIME_KEY, BackupRestoreRuntime } from '../constants';

type BackupRuntimeApp = {
  error?: unknown;
  maintaining?: boolean;
  setMaintaining?: (maintaining: boolean) => void;
};

function getRuntime(context: object): BackupRestoreRuntime | undefined {
  return (context as Record<string, unknown>)[BACKUP_RESTORE_RUNTIME_KEY] as BackupRestoreRuntime | undefined;
}

export const useCheckBackupMessage = () => {
  const engine = useFlowEngine();
  const app = useApp() as BackupRuntimeApp;

  const showCheckBackupMessage = useMemoizedFn(() => {
    const runtime = getRuntime(engine.context);
    if (runtime) {
      runtime.showCheckBackupMessage();
      return;
    }

    if (typeof app.setMaintaining === 'function') {
      app.setMaintaining(true);
    } else {
      app.maintaining = true;
    }
    app.error = {
      command: {
        name: 'APP Restoring',
      },
      message: 'checking backup...',
      code: 'APP_COMMANDING',
    };
  });

  const hideCheckBackupMessage = useMemoizedFn(() => {
    const runtime = getRuntime(engine.context);
    if (runtime) {
      runtime.hideCheckBackupMessage();
      return;
    }

    if (typeof app.setMaintaining === 'function') {
      app.setMaintaining(false);
    } else {
      app.maintaining = false;
    }
  });

  return { showCheckBackupMessage, hideCheckBackupMessage };
};
