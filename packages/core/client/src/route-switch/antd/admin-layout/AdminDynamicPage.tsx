/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { CurrentPageUidContext, useCurrentPageUid } from '../../../application/CustomRouterContextProvider';
import { AppNotFound } from '../../../common/AppNotFound';
import { RemoteSchemaComponent } from '../../../schema-component';
import { KeepAlive } from './KeepAlive';
import { CurrentRouteProvider, useAllAccessDesktopRoutes } from './route-runtime';
import { NocoBaseDesktopRoute } from './route-types';
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

export const AdminDynamicPage = () => {
  const currentPageUid = useCurrentPageUid();
  const { allAccessRoutes } = useAllAccessDesktopRoutes();

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
            <RemoteSchemaComponent uid={uid} />
          </CurrentRouteProvider>
        </CurrentPageUidContext.Provider>
      )}
    </KeepAlive>
  );
};
