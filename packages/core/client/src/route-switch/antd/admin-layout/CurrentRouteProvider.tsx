/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, FC, useContext } from 'react';
import { NocoBaseDesktopRoute } from './convertRoutesToSchema';

const RouteContext = createContext<NocoBaseDesktopRoute | null>(null);
RouteContext.displayName = 'RouteContext';

export const CurrentRouteProvider: FC<{ uid: string }> = ({ children, uid }) => {
  const menuSchema = useContext(MenuSchemaRequestContext);
  return <RouteContext.Provider value={uid}>{children}</RouteContext.Provider>;
};

export const useCurrentRoute = () => {
  return useContext(RouteContext);
};
