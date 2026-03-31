/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RouteRepository } from '@nocobase/client-v2';
import { useFlowEngineContext } from '@nocobase/flow-engine';
import React, { createContext, FC, memo, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { NocoBaseDesktopRoute } from './route-types';
import { findRouteBySchemaUid } from './route-utils';

const emptyArray: NocoBaseDesktopRoute[] = [];

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
  refresh: () => Promise<NocoBaseDesktopRoute[]>;
}>({
  allAccessRoutes: emptyArray,
  refresh: async () => emptyArray,
});
AllAccessDesktopRoutesContext.displayName = 'AllAccessDesktopRoutesContext';

export const useAllAccessDesktopRoutes = () => {
  return useContext(AllAccessDesktopRoutesContext);
};

export const RoutesRequestProvider: FC = ({ children }) => {
  const ctx = useFlowEngineContext();
  const routeRepository = ctx.routeRepository as RouteRepository;
  const allAccessRoutes = useSyncExternalStore(
    (onStoreChange) => routeRepository.subscribe(onStoreChange),
    () => routeRepository.listAccessible(),
    () => emptyArray,
  );
  const [initialized, setInitialized] = useState(allAccessRoutes.length > 0);

  useEffect(() => {
    let active = true;

    const loadAccessibleRoutes = async () => {
      try {
        await routeRepository.refreshAccessible();
      } catch (error) {
        console.error('[NocoBase] RoutesRequestProvider failed to refresh accessible routes.', error);
      } finally {
        if (active) {
          setInitialized(true);
        }
      }
    };

    void loadAccessibleRoutes();

    return () => {
      active = false;
    };
  }, [routeRepository]);

  const refresh = React.useCallback(async () => {
    const routes = await routeRepository.refreshAccessible();
    setInitialized(true);
    return routes;
  }, [routeRepository]);

  const allAccessRoutesValue = useMemo(() => {
    return {
      allAccessRoutes,
      refresh,
    };
  }, [allAccessRoutes, refresh]);

  if (!initialized) {
    return null;
  }

  return (
    <AllAccessDesktopRoutesContext.Provider value={allAccessRoutesValue}>
      {children}
    </AllAccessDesktopRoutesContext.Provider>
  );
};
