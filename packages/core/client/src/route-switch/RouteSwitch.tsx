import React, { useCallback } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';
import { RouteContext } from './context';
import { useRouteComponent } from './hooks';
import { RouteSwitchProps } from './types';

export function RouteSwitch(props: RouteSwitchProps) {
  const { routes: remoteRoutes = [] } = props;

  // /a/b/:c?/:d?/:e? => /a/b
  const getOptionalSegmentsPath = useCallback((path: string) => {
    if (path.endsWith('?')) {
      return getOptionalSegmentsPath(path.split('/').slice(0, -1).join('/'));
    }
    return path;
  }, []);

  const getRoutes = useCallback(
    (routes: RouteSwitchProps['routes']) => {
      const res = routes.map((item) => {
        if (item.type === 'route' && item.routes) {
          // layout
          return {
            element: (
              <RouteContext.Provider value={item}>
                <ComponentRenderer component={item.component} />
              </RouteContext.Provider>
            ),
            children: getRoutes(item.routes).flat(Infinity),
          };
        } else if (item.type === 'route' && item.path) {
          // common route
          const commonRoutes = [
            {
              path: getOptionalSegmentsPath(item.path), // /a/b/:c?/:d? => /a/b | /a/b => /a/b
              caseSensitive: item.sensitive,
              element: (
                <RouteContext.Provider value={item}>
                  <ComponentRenderer component={item.component} />
                </RouteContext.Provider>
              ),
            },
          ];

          if (item.path.endsWith('?')) {
            commonRoutes.push({
              path: item.path.replaceAll('?', '').replaceAll('(.+)', ''), // /a/b/:c?/:d(.+)? => /a/b/:c/:d
              caseSensitive: item.sensitive,
              element: (
                <RouteContext.Provider value={item}>
                  <ComponentRenderer component={item.component} />
                </RouteContext.Provider>
              ),
            });
          }
          return commonRoutes;
        } else if (item.type === 'redirect') {
          // redirect route
          return {
            path: item.from,
            element: <Navigate replace to={item.to} />,
          };
        }
      });
      return res;
    },
    [getOptionalSegmentsPath],
  );

  const routers = useRoutes(getRoutes(remoteRoutes));
  return routers;
}

function ComponentRenderer(props) {
  const Component = useRouteComponent(props?.component);
  return <Component></Component>;
}
