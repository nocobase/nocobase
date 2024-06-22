/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useEffect } from 'react';
import { Location, NavigateFunction, NavigateOptions, useLocation, useNavigate } from 'react-router-dom';

const NavigateNoUpdateContext = React.createContext<NavigateFunction>(null);
const LocationNoUpdateContext = React.createContext<Location>(null);
const LocationSearchContext = React.createContext<string>('');

/**
 * When the URL changes, components that use `useNavigate` will re-render.
 * This provider provides a `navigateNoUpdate` method that can avoid re-rendering.
 *
 * see: https://github.com/remix-run/react-router/issues/7634
 * @param param0
 * @returns
 */
const NavigateNoUpdateProvider: FC = ({ children }) => {
  const navigate = useNavigate();
  const navigateRef = React.useRef(navigate);
  navigateRef.current = navigate;

  const navigateNoUpdate = React.useCallback((to: string, options?: NavigateOptions) => {
    navigateRef.current(to, options);
  }, []);

  return (
    <NavigateNoUpdateContext.Provider value={navigateNoUpdate as NavigateFunction}>
      {children}
    </NavigateNoUpdateContext.Provider>
  );
};

/**
 * When the URL changes, components that use `useLocation` will re-render.
 * This provider provides a `useLocationNoUpdate` method that can avoid re-rendering.
 **/
const LocationNoUpdateProvider: FC = ({ children }) => {
  const location = useLocation();
  const locationRef = React.useRef(location);

  useEffect(() => {
    Object.assign(locationRef.current, location);
  }, [location]);

  return <LocationNoUpdateContext.Provider value={locationRef.current}>{children}</LocationNoUpdateContext.Provider>;
};

const LocationSearchProvider: FC = ({ children }) => {
  const location = useLocation();
  return <LocationSearchContext.Provider value={location.search}>{children}</LocationSearchContext.Provider>;
};

/**
 * use `useNavigateNoUpdate` to avoid components that use `useNavigateNoUpdate` re-rendering.
 * @returns
 */
export const useNavigateNoUpdate = () => {
  return React.useContext(NavigateNoUpdateContext);
};

/**
 * use `useLocationNoUpdate` to avoid components that use `useLocationNoUpdate` re-rendering.
 * @returns
 */
export const useLocationNoUpdate = () => {
  return React.useContext(LocationNoUpdateContext);
};

export const useLocationSearch = () => {
  return React.useContext(LocationSearchContext);
};

export const CustomRouterContextProvider: FC = ({ children }) => {
  return (
    <NavigateNoUpdateProvider>
      <LocationNoUpdateProvider>
        <LocationSearchProvider>{children}</LocationSearchProvider>
      </LocationNoUpdateProvider>
    </NavigateNoUpdateProvider>
  );
};
