/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useMobileRoutes } from '../../mobile-providers';
import { isInnerLink } from '../../utils';

export const MobileHomePage = () => {
  const { routeList } = useMobileRoutes();
  const firstValidTabBar = routeList.find((tab) => tab.schemaUid || isInnerLink(tab.options?.url));
  if (!firstValidTabBar) return null;
  const url = firstValidTabBar?.options?.url || `/${firstValidTabBar.type}/${firstValidTabBar.schemaUid}`;
  if (url) {
    return <Navigate to={url} replace={true} />;
  }

  return null;
};
