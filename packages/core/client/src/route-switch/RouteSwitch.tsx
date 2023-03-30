import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RouteContext } from './context';
import { useRouteComponent } from './hooks';
import { RouteSwitchProps } from './types';

export function RouteSwitch(props: RouteSwitchProps) {
  const { routes = [] } = props;
  if (!routes.length) {
    return null;
  }
  return (
    <Routes>
      {routes.map((route, index) => {
        console.log('🚀 ~ file: RouteSwitch.tsx:35 ~ {routes.map ~ route:', route);

        if (route.type == 'redirect') {
          return (
            <Route
              path={route.from}
              caseSensitive={route.sensitive}
              key={index}
              element={<Navigate replace to={route.to}></Navigate>}
            />
          );
        }
        if (!route.path && Array.isArray(route.routes)) {
        }
        console.log(route.path);
        return (
          <Route
            key={route.path as string}
            path={route.path as string}
            index={route.path === undefined}
            caseSensitive={route.sensitive}
            element={
              <RouteContext.Provider value={route}>
                <ComponentRenderer route={route} />
              </RouteContext.Provider>
            }
          ></Route>
        );
      })}
    </Routes>
  );
}

function ComponentRenderer(props) {
  console.log('🚀 ~ file: RouteSwitch.tsx:36 ~ ComponentRenderer ~ props?.route?.:', props?.route);
  const Component = useRouteComponent(props?.route?.component);
  console.log('🚀 ~ file: RouteSwitch.tsx:36 ~ ComponentRenderer ~ Component:', Component);
  return (
    <Component {...props}>
      <RouteSwitch routes={props?.route?.routes} />
    </Component>
  );
}
