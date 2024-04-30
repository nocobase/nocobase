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
import React, { createContext, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ChartQueryMetadataContext = createContext({
  refresh: () => {},
  data: [] as any[],
});
ChartQueryMetadataContext.displayName = 'ChartQueryMetadataContext';

export const ChartQueryMetadataProvider: React.FC = (props) => {
  const api = useAPIClient();

  const options = {
    resource: 'chartsQueries',
    action: 'listMetadata',
    params: {
      paginate: false,
      sort: ['-id'],
    },
  };

  const location = useLocation();

  const isAdminPage = location.pathname.startsWith('/admin');
  const token = api.auth.getToken() || '';

  const service = useRequest<{
    data: any;
  }>(options, {
    refreshDeps: [isAdminPage, token],
    ready: !!(isAdminPage && token),
  });

  const refresh = async () => {
    const { data } = await api.request(options);
    service.mutate(data);
    return data?.data || [];
  };

  if (service.loading) {
    return <Spin />;
  }

  return (
    <ChartQueryMetadataContext.Provider
      value={{
        refresh,
        data: service.data?.data,
      }}
    >
      {props.children}
    </ChartQueryMetadataContext.Provider>
  );
};

export const useChartQueryMetadataContext = () => {
  return useContext(ChartQueryMetadataContext);
};
