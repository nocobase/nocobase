/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ACLRolesCheckProvider } from '../../../acl/ACLProvider';
import { CurrentAppInfoProvider } from '../../../appInfo/CurrentAppInfoProvider';
import {
  CurrentPageUidProvider,
  CurrentTabUidProvider,
  IsSubPageClosedByPageMenuProvider,
  useCurrentPageUid,
  useLocationNoUpdate,
} from '../../../application/CustomRouterContextProvider';
import { RemoteCollectionManagerProvider } from '../../../collection-manager/CollectionManagerProvider';
import { RemoteSchemaTemplateManagerProvider } from '../../../schema-templates/SchemaTemplateManagerProvider';
import { RoutesRequestProvider, useAllAccessDesktopRoutes } from './route-runtime';
import { NocoBaseDesktopRoute } from './route-types';
import { findFirstPageRoute } from './route-utils';

const findRouteByMenuSchemaUid = (schemaUid: string, routes: NocoBaseDesktopRoute[]) => {
  if (!routes) return;

  for (const route of routes) {
    if (route.menuSchemaUid === schemaUid) {
      return route;
    }

    if (route.children?.length) {
      const result = findRouteByMenuSchemaUid(schemaUid, route.children);
      if (result) {
        return result;
      }
    }
  }
};

export const NavigateToDefaultPage: FC = (props) => {
  const { allAccessRoutes } = useAllAccessDesktopRoutes();
  const location = useLocationNoUpdate();

  const defaultPageUid = findFirstPageRoute(allAccessRoutes)?.schemaUid;

  return (
    <>
      {props.children}
      {defaultPageUid && (location.pathname === '/admin' || location.pathname === '/admin/') && (
        <Navigate replace to={`/admin/${defaultPageUid}`} />
      )}
    </>
  );
};

export const LegacyRouteCompat: FC = (props) => {
  const currentPageUid = useCurrentPageUid();
  const { allAccessRoutes } = useAllAccessDesktopRoutes();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const route = findRouteByMenuSchemaUid(currentPageUid, allAccessRoutes);
    if (route) {
      navigate(location.pathname.replace(currentPageUid, route.schemaUid) + location.search);
    }
  }, [allAccessRoutes, currentPageUid, location.pathname, location.search, navigate]);

  return <>{props.children}</>;
};

export const AdminShellProvider = (props) => {
  return (
    <CurrentPageUidProvider>
      <CurrentTabUidProvider>
        <IsSubPageClosedByPageMenuProvider>
          <ACLRolesCheckProvider>
            <RoutesRequestProvider>
              <NavigateToDefaultPage>
                <LegacyRouteCompat>
                  <RemoteCollectionManagerProvider>
                    <CurrentAppInfoProvider>
                      <RemoteSchemaTemplateManagerProvider>{props.children}</RemoteSchemaTemplateManagerProvider>
                    </CurrentAppInfoProvider>
                  </RemoteCollectionManagerProvider>
                </LegacyRouteCompat>
              </NavigateToDefaultPage>
            </RoutesRequestProvider>
          </ACLRolesCheckProvider>
        </IsSubPageClosedByPageMenuProvider>
      </CurrentTabUidProvider>
    </CurrentPageUidProvider>
  );
};
