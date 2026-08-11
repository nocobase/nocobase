/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Spin } from 'antd';
import React from 'react';
import { useRestoreTask } from '../hooks/useRestoreTask';
import { useT } from '../locale';

type RestoreLoadingContextValue = {
  restoring: boolean;
  startRestoring: (taskId: string) => void;
};

const RestoreLoadingContext = React.createContext<RestoreLoadingContextValue | null>(null);

export const RestoreLoadingProvider = ({ children }: React.PropsWithChildren) => {
  const t = useT();
  const [restoring, setRestoring] = React.useState(false);
  const restoreTaskId = useRestoreTask();
  const startRestoring = React.useCallback(
    (taskId: string) => {
      restoreTaskId.current = taskId;
      setRestoring(true);
    },
    [restoreTaskId],
  );
  const value = React.useMemo(() => ({ restoring, startRestoring }), [restoring, startRestoring]);

  return (
    <RestoreLoadingContext.Provider value={value}>
      {children}
      {restoring && <Spin fullscreen tip={t('Restoring backup')} />}
    </RestoreLoadingContext.Provider>
  );
};

export function useRestoreLoading() {
  const context = React.useContext(RestoreLoadingContext);
  if (!context) {
    throw new Error('RestoreLoadingProvider is missing');
  }
  return context;
}
