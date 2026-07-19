/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { UNSAFE_RouteContext, useLocation } from 'react-router-dom';
import {
  buildWorkflowTasksPageMenuPath,
  parseWorkflowTasksPageMenuRoute,
  type WorkflowTasksPageMenuRoute,
} from '../client-v2/pages/workflowTasksPageMenuRoute';

export type WorkflowTasksPageMenuRouteTarget = {
  taskType?: string;
  status?: string;
  popupId?: string | number;
};

export type WorkflowTasksPageMenuRouteAdapter = {
  route: WorkflowTasksPageMenuRoute;
  buildPathname: (route: WorkflowTasksPageMenuRouteTarget) => string;
  buildPath: (route: WorkflowTasksPageMenuRouteTarget) => string;
};

const WorkflowTasksPageMenuRouteContext = createContext<WorkflowTasksPageMenuRouteAdapter | null>(null);

export function useWorkflowTasksPageMenuRouteAdapter() {
  return useContext(WorkflowTasksPageMenuRouteContext);
}

export function WorkflowTasksPageMenuRouteProvider(props: { children: React.ReactNode; pageUid: string }) {
  const { children, pageUid } = props;
  const location = useLocation();
  const route = useMemo(
    () =>
      parseWorkflowTasksPageMenuRoute({
        pathname: location.pathname,
        pageUid,
        search: location.search,
        hash: location.hash,
      }),
    [location.hash, location.pathname, location.search, pageUid],
  );
  const value = useMemo<WorkflowTasksPageMenuRouteAdapter>(() => {
    const buildPathname = (nextRoute: WorkflowTasksPageMenuRouteTarget) =>
      buildWorkflowTasksPageMenuPath({
        pathname: location.pathname,
        pageUid,
        route: nextRoute,
      });

    return {
      route,
      buildPathname,
      buildPath: (nextRoute) => `${buildPathname(nextRoute)}${location.search}${location.hash}`,
    };
  }, [location.hash, location.pathname, location.search, pageUid, route]);

  return (
    <WorkflowTasksPageMenuRouteContext.Provider value={value}>{children}</WorkflowTasksPageMenuRouteContext.Provider>
  );
}

export function WorkflowTasksPageMenuItemRouteScope(props: { children: React.ReactNode }) {
  const { children } = props;
  const adapter = useWorkflowTasksPageMenuRouteAdapter();
  const routeContext = useContext(UNSAFE_RouteContext);
  const taskType = adapter?.route.taskType;
  const popupRoutePathname = adapter
    ? `${adapter.buildPathname({
        taskType,
        status: adapter.route.status,
      })}/popupid`
    : undefined;
  const scopedRouteContext = useMemo(() => {
    const lastMatch = routeContext.matches.at(-1);
    if (!popupRoutePathname || !taskType || !adapter) {
      return routeContext;
    }

    const scopedMatch = {
      ...(lastMatch || {}),
      params: {
        ...lastMatch?.params,
        taskType,
        status: adapter.route.status,
      },
      pathname: popupRoutePathname,
      pathnameBase: popupRoutePathname,
      route: {
        ...lastMatch?.route,
        path: 'popupid',
      },
    };

    return {
      ...routeContext,
      isDataRoute: false,
      matches: [...routeContext.matches, scopedMatch],
    };
  }, [adapter, popupRoutePathname, routeContext, taskType]);

  return <UNSAFE_RouteContext.Provider value={scopedRouteContext}>{children}</UNSAFE_RouteContext.Provider>;
}
