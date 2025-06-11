/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, FC, useMemo } from 'react';
import { useAPIClient, useRequest, UseRequestResult } from '@nocobase/client';

type ContextType = {
  data?: Record<string, any>;
  loading: boolean;
  setConfig: UseRequestResult<Record<string, any>>['run'];
};

const SystemManagementContext = createContext<ContextType>(null as any);

export const SystemManagementProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const getConfigReq = useRequest<{ data?: Record<string, any> }>({
    url: 'systemManagement:getConfig',
  });

  const api = useAPIClient();
  const resource = api.resource('systemManagement');

  const setConfigReq = useRequest(resource.setConfig, {
    manual: true,
    onSuccess() {
      getConfigReq.refresh();
    },
  });

  const value = useMemo(() => {
    return {
      data: getConfigReq.data?.data,
      loading: getConfigReq.loading || setConfigReq.loading,
      setConfig: setConfigReq.run,
    };
  }, [getConfigReq.data?.data, getConfigReq.loading, setConfigReq]);

  return <SystemManagementContext.Provider value={value}>{children}</SystemManagementContext.Provider>;
};

export const useSystemManagementContext = () => {
  return React.useContext(SystemManagementContext);
};
