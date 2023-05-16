import { RouteSwitch, useRoutes } from '@nocobase/client';
import React, { useEffect, useMemo } from 'react';
import { HashRouter } from 'react-router-dom';
import { InterfaceProvider } from './InterfaceProvider';

interface InterfaceRouterProps {}
export const InterfaceRouter: React.FC<InterfaceRouterProps> = (props) => {
  const allRoutes = useRoutes();
  const routes = useMemo(
    () =>
      allRoutes.reduce((nextRoutes, item) => {
        if (item['component'] === 'MApplication') {
          nextRoutes.push(item, {
            type: 'redirect',
            to: '/mobile',
            exact: true,
          });
        }
        return nextRoutes;
      }, []),
    [allRoutes],
  );

  return (
    <InterfaceProvider>
      <HashRouter>
        <RouteSwitch routes={routes}></RouteSwitch>
      </HashRouter>
    </InterfaceProvider>
  );
};
