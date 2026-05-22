/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type FlowEngine, useFlowEngine } from '@nocobase/flow-engine';
import { FlowRoute, getAdminLayoutModel, type LayoutRouteLike } from '@nocobase/client-v2';
import React, { useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { CurrentPageUidContext, useCurrentPageUid } from '../../../application/CustomRouterContextProvider';
import { AppNotFound } from '../../../common/AppNotFound';
import { RemoteSchemaComponent } from '../../../schema-component';
import { KeepAlive, useKeepAlive } from './KeepAlive';
import { CurrentRouteProvider, useAllAccessDesktopRoutes } from './route-runtime';
import { NocoBaseDesktopRoute, NocoBaseDesktopRouteType } from './route-types';
import { findRouteBySchemaUid, isGroup } from './route-utils';

const noAccessPermission = (currentPageUid: string, allAccessRoutes: NocoBaseDesktopRoute[]) => {
  if (!currentPageUid) {
    return false;
  }

  const routeNode = findRouteBySchemaUid(currentPageUid, allAccessRoutes);
  if (!routeNode) {
    return true;
  }

  return false;
};

const useSyncLegacyAdminLayoutRoute = () => {
  const flowEngine = useFlowEngine();
  const location = useLocation();
  const params = useParams();
  const { name, tabUid } = params;
  const viewPath = params['*'];
  const routeParams = useMemo(
    () => ({ name, tabUid, '*': viewPath }) as Record<string, string | undefined>,
    [name, tabUid, viewPath],
  );
  const routeLike = useMemo<LayoutRouteLike>(
    () => ({
      name: tabUid ? 'admin.page.tab' : 'admin.page',
      pathname: location.pathname,
      params: routeParams,
      layoutRouteName: 'admin',
      layoutBasePathname: '/admin',
    }),
    [location.pathname, routeParams, tabUid],
  );

  useEffect(() => {
    const adminLayoutModel = getAdminLayoutModel(flowEngine, { required: false });
    if (!adminLayoutModel || !name) {
      return;
    }

    adminLayoutModel.syncLayoutRoute(routeLike);

    return () => {
      adminLayoutModel.clearLayoutRoute(routeLike);
    };
  }, [flowEngine, name, routeLike]);
};

const getLegacyAdminLayoutModel = (flowEngine: FlowEngine) => {
  return getAdminLayoutModel(flowEngine, { required: true });
};

const AdminPageContent = (props: { uid: string; allAccessRoutes: NocoBaseDesktopRoute[] }) => {
  const { uid, allAccessRoutes } = props;
  const { active } = useKeepAlive();
  const route = findRouteBySchemaUid(uid, allAccessRoutes);

  if (route?.type === NocoBaseDesktopRouteType.flowPage) {
    return <FlowRoute pageUid={uid} active={active} getLayoutModel={getLegacyAdminLayoutModel} />;
  }

  return <RemoteSchemaComponent uid={uid} />;
};

export const AdminDynamicPage = () => {
  const currentPageUid = useCurrentPageUid();
  const { allAccessRoutes } = useAllAccessDesktopRoutes();
  useSyncLegacyAdminLayoutRoute();

  if (isGroup(currentPageUid, allAccessRoutes)) {
    return null;
  }

  if (noAccessPermission(currentPageUid, allAccessRoutes)) {
    return <AppNotFound />;
  }

  return (
    <KeepAlive uid={currentPageUid}>
      {(uid) => (
        <CurrentPageUidContext.Provider value={uid}>
          <CurrentRouteProvider uid={uid}>
            <AdminPageContent uid={uid} allAccessRoutes={allAccessRoutes} />
          </CurrentRouteProvider>
        </CurrentPageUidContext.Provider>
      )}
    </KeepAlive>
  );
};
