/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngineContext } from '@nocobase/flow-engine';
import React, { createContext, FC, memo, useContext, useMemo, useRef } from 'react';
import { useRequest } from '../api-client';
import { NocoBaseDesktopRoute } from './route-types';
import { findRouteBySchemaUid } from './route-utils';

const emptyArray = [];

export const NocoBaseRouteContext = createContext<NocoBaseDesktopRoute | null>(null);
NocoBaseRouteContext.displayName = 'NocoBaseRouteContext';

export const CurrentRouteProvider: FC<{ uid: string }> = memo(({ children, uid }) => {
  const { allAccessRoutes } = useAllAccessDesktopRoutes();
  const routeNode = useMemo(() => findRouteBySchemaUid(uid, allAccessRoutes), [uid, allAccessRoutes]);
  return <NocoBaseRouteContext.Provider value={routeNode}>{children}</NocoBaseRouteContext.Provider>;
});

export const useCurrentRoute = () => {
  return useContext(NocoBaseRouteContext) || {};
};

const AllAccessDesktopRoutesContext = createContext<{
  allAccessRoutes: NocoBaseDesktopRoute[];
  refresh: () => void;
}>({
  allAccessRoutes: emptyArray,
  refresh: () => {},
});
AllAccessDesktopRoutesContext.displayName = 'AllAccessDesktopRoutesContext';

export const useAllAccessDesktopRoutes = () => {
  return useContext(AllAccessDesktopRoutesContext);
};

export const RoutesRequestProvider: FC = ({ children }) => {
  const ctx = useFlowEngineContext();
  const mountedRef = useRef(false);
  const { data, refresh, loading } = useRequest<any>(
    {
      url: `/desktopRoutes:listAccessible`,
      params: { tree: true, sort: 'sort' },
    },
    {
      onSuccess(data) {
        ctx.routeRepository.setRoutes(data?.data || emptyArray);
      },
    },
  );

  const allAccessRoutesValue = useMemo(() => {
    return {
      allAccessRoutes: data?.data || emptyArray,
      refresh,
    };
  }, [data?.data, refresh]);

  if (loading && !mountedRef.current) {
    return null;
  }

  mountedRef.current = true;

  return (
    <AllAccessDesktopRoutesContext.Provider value={allAccessRoutesValue}>
      {children}
    </AllAccessDesktopRoutesContext.Provider>
  );
};
