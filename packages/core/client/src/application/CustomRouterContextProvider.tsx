/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/json-schema';
import _ from 'lodash';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Location,
  NavigateFunction,
  NavigateOptions,
  useHref,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

const NavigateNoUpdateContext = React.createContext<NavigateFunction>(null);
NavigateNoUpdateContext.displayName = 'NavigateNoUpdateContext';

const LocationNoUpdateContext = React.createContext<Location>(null);
LocationNoUpdateContext.displayName = 'LocationNoUpdateContext';

export const LocationSearchContext = React.createContext<string>('');
LocationSearchContext.displayName = 'LocationSearchContext';

const IsAdminPageContext = React.createContext<boolean>(false);
IsAdminPageContext.displayName = 'IsAdminPageContext';

/**
 * @internal
 */
export const CurrentPageUidContext = React.createContext<string>('');
CurrentPageUidContext.displayName = 'CurrentPageUidContext';

const IsInSettingsPageContext = React.createContext<boolean>(false);
IsInSettingsPageContext.displayName = 'IsInSettingsPageContext';

/**
 * @internal
 */
export const CurrentTabUidContext = React.createContext<string>('');
CurrentTabUidContext.displayName = 'CurrentTabUidContext';

const SearchParamsContext = React.createContext<URLSearchParams>(new URLSearchParams());
SearchParamsContext.displayName = 'SearchParamsContext';

const RouterBasenameContext = React.createContext<string>('');
RouterBasenameContext.displayName = 'RouterBasenameContext';

export const IsSubPageClosedByPageMenuContext = React.createContext<{
  isSubPageClosedByPageMenu: () => boolean;
  setFieldSchema: React.Dispatch<React.SetStateAction<Schema>>;
  reset: () => void;
}>({
  isSubPageClosedByPageMenu: () => false,
  setFieldSchema: () => {},
  reset: () => {},
});
IsSubPageClosedByPageMenuContext.displayName = 'IsSubPageClosedByPageMenuContext';

export const IsSubPageClosedByPageMenuProvider: FC = ({ children }) => {
  const params = useParams();
  const prevParamsRef = useRef<any>({});
  const [fieldSchema, setFieldSchema] = useState<Schema>(null);

  const isSubPageClosedByPageMenu = useCallback(() => {
    const result =
      _.isEmpty(params['*']) &&
      fieldSchema?.['x-component-props']?.openMode === 'page' &&
      !!prevParamsRef.current['*']?.includes(fieldSchema['x-uid']);

    prevParamsRef.current = params;

    return result;
  }, [fieldSchema, params]);

  const reset = useCallback(() => {
    prevParamsRef.current = {};
  }, []);

  const value = useMemo(
    () => ({ isSubPageClosedByPageMenu, setFieldSchema, reset }),
    [isSubPageClosedByPageMenu, reset],
  );

  return (
    <IsSubPageClosedByPageMenuContext.Provider value={value}>{children}</IsSubPageClosedByPageMenuContext.Provider>
  );
};

/**
 * see: https://stackoverflow.com/questions/50449423/accessing-basename-of-browserouter
 * @returns {string} basename
 */
const RouterBasenameProvider: FC = ({ children }) => {
  const basenameOfCurrentRouter = useHref('/');
  return <RouterBasenameContext.Provider value={basenameOfCurrentRouter}>{children}</RouterBasenameContext.Provider>;
};

const SearchParamsProvider: FC = ({ children }) => {
  const [searchParams] = useSearchParams();
  return <SearchParamsContext.Provider value={searchParams}>{children}</SearchParamsContext.Provider>;
};

const IsInSettingsPageProvider: FC = ({ children }) => {
  const isInSettingsPage = useLocation().pathname.includes('/settings');
  return <IsInSettingsPageContext.Provider value={isInSettingsPage}>{children}</IsInSettingsPageContext.Provider>;
};

const IsAdminPageProvider: FC = ({ children }) => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  return <IsAdminPageContext.Provider value={isAdminPage}>{children}</IsAdminPageContext.Provider>;
};

export const CurrentPageUidProvider: FC = ({ children }) => {
  const params = useParams();
  return <CurrentPageUidContext.Provider value={params.name}>{children}</CurrentPageUidContext.Provider>;
};

export const CurrentTabUidProvider: FC = ({ children }) => {
  const params = useParams();
  return <CurrentTabUidContext.Provider value={params.tabUid}>{children}</CurrentTabUidContext.Provider>;
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
 * use `useNavigateNoUpdate` to avoid components re-rendering.
 * @returns
 */
export const useNavigateNoUpdate = () => {
  return React.useContext(NavigateNoUpdateContext);
};

/**
 * use `useLocationNoUpdate` to avoid components re-rendering.
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

export const useIsInSettingsPage = () => {
  return React.useContext(IsInSettingsPageContext);
};

/**
 * @internal
 */
export const useCurrentTabUid = () => {
  return React.useContext(CurrentTabUidContext);
};

export const useCurrentSearchParams = () => {
  return React.useContext(SearchParamsContext);
};

export const useRouterBasename = () => {
  return React.useContext(RouterBasenameContext);
};

/**
 * Used to determine if the user closed the sub-page by clicking on the page menu
 * @returns
 */
export const useIsSubPageClosedByPageMenu = (fieldSchema: Schema) => {
  const { isSubPageClosedByPageMenu, setFieldSchema, reset } = React.useContext(IsSubPageClosedByPageMenuContext);

  useEffect(() => {
    setFieldSchema(fieldSchema);
  }, [fieldSchema, setFieldSchema]);

  return { isSubPageClosedByPageMenu, reset };
};

export const CustomRouterContextProvider: FC = ({ children }) => {
  return (
    <NavigateNoUpdateProvider>
      <LocationNoUpdateProvider>
        <IsAdminPageProvider>
          <LocationSearchProvider>
            <SearchParamsProvider>
              <RouterBasenameProvider>
                <IsInSettingsPageProvider>{children}</IsInSettingsPageProvider>
              </RouterBasenameProvider>
            </SearchParamsProvider>
          </LocationSearchProvider>
        </IsAdminPageProvider>
      </LocationNoUpdateProvider>
    </NavigateNoUpdateProvider>
  );
};
