import { RouteSwitch, useRoutes } from '@nocobase/client';
import React, { useMemo } from 'react';
import { HashRouter } from 'react-router-dom';

interface InterfaceRouterProps {}
export const InterfaceRouter: React.FC<InterfaceRouterProps> = (props) => {
  const allRoutes = useRoutes();
  const routes = useMemo(
    () =>
      allRoutes.reduce((nextRoutes, item) => {
        if (item['component'] === 'MobileApplication') {
          nextRoutes.push({
            ...item,
            path: '/',
          });
        }
        return nextRoutes;
      }, []),
    [allRoutes],
  );

  return (
    <HashRouter>
      <RouteSwitch routes={routes}></RouteSwitch>
    </HashRouter>
  );
};
