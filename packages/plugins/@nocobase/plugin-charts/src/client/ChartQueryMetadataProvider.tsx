/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, useRequest } from '@nocobase/client';
import { Spin } from 'antd';
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export const ChartQueryMetadataContext = createContext({
  refresh: () => {},
  data: [] as any[],
});
ChartQueryMetadataContext.displayName = 'ChartQueryMetadataContext';

const options = {
  resource: 'chartsQueries',
  action: 'listMetadata',
  params: {
    paginate: false,
    sort: ['-id'],
  },
};

export const ChartQueryMetadataProvider: React.FC = (props) => {
  // TODO：旧版插件已弃用，待删除
  return <>{props.children}</>;

  const api = useAPIClient();
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith('/admin');
  const token = api.auth.getToken() || '';

  const service = useRequest<{
    data: any;
  }>(options, {
    refreshDeps: [isAdminPage, token],
    ready: !!(isAdminPage && token),
  });

  const refresh = useCallback(async () => {
    const { data } = await api.request(options);
    service.mutate(data);
    return data?.data || [];
  }, [options, service]);

  const value = useMemo(() => {
    return {
      refresh,
      data: service.data?.data,
    };
  }, [service.data?.data, refresh]);

  if (service.loading) {
    return <Spin />;
  }

  return <ChartQueryMetadataContext.Provider value={value}>{props.children}</ChartQueryMetadataContext.Provider>;
};

export const useChartQueryMetadataContext = () => {
  return useContext(ChartQueryMetadataContext);
};
