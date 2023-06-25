import { RouteSwitch, useRoutes } from '@nocobase/client';
import React, { useMemo } from 'react';
import { HashRouter, UNSAFE_LocationContext, UNSAFE_RouteContext } from 'react-router-dom';
import { InterfaceProvider } from './InterfaceProvider';

function RouteCleaner(props) {
  return (
    <UNSAFE_RouteContext.Provider
      value={{
        outlet: null,
        matches: [],
        isDataRoute: false,
      }}
    >
      <UNSAFE_LocationContext.Provider value={null as any}>{props.children}</UNSAFE_LocationContext.Provider>
    </UNSAFE_RouteContext.Provider>
  );
}

interface InterfaceRouterProps {
  [key: string]: any;
}
export const InterfaceRouter: React.FC<InterfaceRouterProps> = (props) => {
  const allRoutes = useRoutes();
  const routes = useMemo(
    () =>
      allRoutes.reduce((nextRoutes, item) => {
        if (item['component'] === 'MApplication') {
          nextRoutes.push(item, {
            type: 'redirect',
            to: '/mobile',
            from: '/',
          });
        }
        return nextRoutes;
      }, []),
    [allRoutes],
  );
  return (
    <RouteCleaner>
      <HashRouter>
        <InterfaceProvider>
          <RouteSwitch routes={routes}></RouteSwitch>
        </InterfaceProvider>
      </HashRouter>
    </RouteCleaner>
  );
};
