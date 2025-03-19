/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useContext, useRef } from 'react';
import { UNSAFE_LocationContext, UNSAFE_RouteContext } from 'react-router-dom';

/**
 * Resets the route context for popups to improve popup opening performance
 */
export const PopupRouteContextResetter: FC = React.memo(({ children }) => {
  const currentLocationContext = useContext(UNSAFE_LocationContext);
  const currentRouteContext = useContext(UNSAFE_RouteContext);
  const prevLocationContextRef = useRef(currentLocationContext);
  const prevRouteContextRef = useRef(currentRouteContext);

  if (
    !currentLocationContext.location.pathname.includes('/popups/') &&
    currentLocationContext.location.pathname !== prevLocationContextRef.current.location.pathname
  ) {
    prevLocationContextRef.current = currentLocationContext;
    prevRouteContextRef.current = currentRouteContext;
  }

  return (
    <UNSAFE_LocationContext.Provider value={prevLocationContextRef.current}>
      <UNSAFE_RouteContext.Provider value={prevRouteContextRef.current}>{children}</UNSAFE_RouteContext.Provider>
    </UNSAFE_LocationContext.Provider>
  );
});

PopupRouteContextResetter.displayName = 'PopupRouteContextResetter';
