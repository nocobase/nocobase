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
import { useMobileRoutesContext } from '../../mobile-providers';
import { isInnerLink } from '../../utils';

export const MobileHomePage = () => {
  const { routeList } = useMobileRoutesContext();
  const firstValidTabBar = routeList.find((tab) => tab.url && isInnerLink(tab.url));
  if (firstValidTabBar) {
    return <Navigate to={firstValidTabBar.url} replace={true} />;
  }

  return null;
};
