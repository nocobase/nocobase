import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RouteContext } from './context';
import { useRouteComponent } from './hooks';
import { RouteSwitchProps } from './types';

/**
 * 递归渲染 routes
 *
 * <Routes>
 *  <Route element={<Layout1 />}>
 *    <Route path="/a" element={<Page1 />}>
 *    <Route element={<Layout1 />}>
 *      <Route path="/b" element={<Page2 />} />
 *      <Route path="/c" element={<Page3 />} />
 *    </Route>
 *  </Route>
 * </Routes>
 */
export function RouteSwitch(props: RouteSwitchProps) {
  const { routes = [] } = props;
  if (!routes.length) {
    return null;
  }
  return (
    <Routes>
      {routes.map((route, index) => {
        if (route.type == 'redirect') {
          return <Navigate key={index} to={route.to} replace={!route.push} />;
        }

        if (typeof route.path === 'string') {
          return (
            <Route
              key={index}
              path={route.path}
              caseSensitive={route.sensitive}
              element={
                <RouteContext.Provider value={route}>
                  <ComponentRenderer component={route.component} />
                </RouteContext.Provider>
              }
            />
          );
        }

        if (!route.path && Array.isArray(route.routes)) {
          return (
            <RouteContext.Provider key={index} value={route}>
              <RouteSwitch key={index} routes={route.routes} />
            </RouteContext.Provider>
          );
        }
        return null;
      })}
    </Routes>
  );
}

function ComponentRenderer(props) {
  const Component = useRouteComponent(props?.component);
  return <Component></Component>;
}
