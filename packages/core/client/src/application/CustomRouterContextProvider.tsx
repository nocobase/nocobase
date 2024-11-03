/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useEffect } from 'react';
import {
  Location,
  NavigateFunction,
  NavigateOptions,
  PathMatch,
  useLocation,
  useMatch,
  useNavigate,
  useParams,
} from 'react-router-dom';

const NavigateNoUpdateContext = React.createContext<NavigateFunction>(null);
NavigateNoUpdateContext.displayName = 'NavigateNoUpdateContext';

const LocationNoUpdateContext = React.createContext<Location>(null);
LocationNoUpdateContext.displayName = 'LocationNoUpdateContext';

export const LocationSearchContext = React.createContext<string>('');
LocationSearchContext.displayName = 'LocationSearchContext';

const IsAdminPageContext = React.createContext<boolean>(false);
IsAdminPageContext.displayName = 'IsAdminPageContext';

const CurrentPageUidContext = React.createContext<string>('');
CurrentPageUidContext.displayName = 'CurrentPageUidContext';

const MatchAdminContext = React.createContext<PathMatch<string> | null>(null);
MatchAdminContext.displayName = 'MatchAdminContext';

const MatchAdminNameContext = React.createContext<PathMatch<string> | null>(null);
MatchAdminNameContext.displayName = 'MatchAdminNameContext';

const MatchAdminProvider: FC = ({ children }) => {
  const matchAdmin = useMatch('/admin');
  return <MatchAdminContext.Provider value={matchAdmin}>{children}</MatchAdminContext.Provider>;
};

const MatchAdminNameProvider: FC = ({ children }) => {
  const matchAdminName = useMatch('/admin/:name');
  return <MatchAdminNameContext.Provider value={matchAdminName}>{children}</MatchAdminNameContext.Provider>;
};

const IsAdminPageProvider: FC = ({ children }) => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  return <IsAdminPageContext.Provider value={isAdminPage}>{children}</IsAdminPageContext.Provider>;
};

const CurrentPageUidProvider: FC = ({ children }) => {
  const params = useParams<any>();
  return <CurrentPageUidContext.Provider value={params.name}>{children}</CurrentPageUidContext.Provider>;
};

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
  const locationRef = React.useRef<any>({});

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

export const useIsAdminPage = () => {
  return React.useContext(IsAdminPageContext);
};

export const useCurrentPageUid = () => {
  return React.useContext(CurrentPageUidContext);
};

export const useMatchAdmin = () => {
  return React.useContext(MatchAdminContext);
};

export const useMatchAdminName = () => {
  return React.useContext(MatchAdminNameContext);
};

export const CustomRouterContextProvider: FC = ({ children }) => {
  return (
    <NavigateNoUpdateProvider>
      <LocationNoUpdateProvider>
        <IsAdminPageProvider>
          <LocationSearchProvider>
            <CurrentPageUidProvider>
              <MatchAdminProvider>
                <MatchAdminNameProvider>{children}</MatchAdminNameProvider>
              </MatchAdminProvider>
            </CurrentPageUidProvider>
          </LocationSearchProvider>
        </IsAdminPageProvider>
      </LocationNoUpdateProvider>
    </NavigateNoUpdateProvider>
  );
};
