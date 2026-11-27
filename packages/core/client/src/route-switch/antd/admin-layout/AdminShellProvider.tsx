/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ACLRolesCheckProvider } from '../../../acl/ACLProvider';
import { CurrentAppInfoProvider } from '../../../appInfo/CurrentAppInfoProvider';
import {
  CurrentPageUidProvider,
  CurrentTabUidProvider,
  IsSubPageClosedByPageMenuProvider,
  useCurrentPageUid,
} from '../../../application/CustomRouterContextProvider';
import { RemoteCollectionManagerProvider } from '../../../collection-manager/CollectionManagerProvider';
import { RemoteSchemaTemplateManagerProvider } from '../../../schema-templates/SchemaTemplateManagerProvider';
import { RoutesRequestProvider, useAllAccessDesktopRoutes } from './route-runtime';
import { NocoBaseDesktopRoute } from './route-types';
import { findFirstPageRoute } from './route-utils';
import type { AdminLayoutModelV1 } from './AdminLayoutModel';

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

type AdminShellProps = { model?: Pick<AdminLayoutModelV1, 'resolveDefaultPage'> };

export const NavigateToDefaultPage: FC<AdminShellProps> = ({ model, children }) => {
  const { allAccessRoutes } = useAllAccessDesktopRoutes();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (pathname !== '/admin' && pathname !== '/admin/') return;
    let active = true;
    const redirect = async () => {
      const page = model
        ? await model.resolveDefaultPage(allAccessRoutes, findFirstPageRoute)
        : findFirstPageRoute(allAccessRoutes);
      if (active && page?.schemaUid) navigate(`/admin/${page.schemaUid}`, { replace: true });
    };
    redirect();
    return () => {
      active = false;
    };
  }, [allAccessRoutes, model, navigate, pathname]);

  return <>{children}</>;
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

export const AdminShellProvider: FC<AdminShellProps> = ({ children, model }) => {
  return (
    <CurrentPageUidProvider>
      <CurrentTabUidProvider>
        <IsSubPageClosedByPageMenuProvider>
          <ACLRolesCheckProvider>
            <RoutesRequestProvider>
              <NavigateToDefaultPage model={model}>
                <LegacyRouteCompat>
                  <RemoteCollectionManagerProvider>
                    <CurrentAppInfoProvider>
                      <RemoteSchemaTemplateManagerProvider>{children}</RemoteSchemaTemplateManagerProvider>
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
