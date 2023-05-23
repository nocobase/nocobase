import React, { Fragment, useCallback, useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RouteContext } from './context';
import { useRouteComponent } from './hooks';
import { RouteProps, RouteRedirectProps, RouteSwitchProps } from './types';

type FlattenRoute = RouteRedirectProps & { layouts: RouteProps[] };

/**
 * 递归渲染 routes
 *
 * const routes = [
 *  {
 *    path: '/',
 *    component: 'Home'
 *  },
 *  {
 *    component: 'Layout1',
 *    routes: [
 *      {
 *        component: 'Layout2',
 *        routes: [
 *          {
 *            path: '/signin',
 *            component: 'SignIn'
 *          },
 *        ],
 *      },
 *      {
 *        path: '/signup',
 *        component: 'SignUp',
 *      },
 *    ],
 *  },
 * ];
 *
 * =>
 *
 * <Routes>
 *   <Route path="/" element={<Home />} />
 *   <Route element={<Layout1 />}>
 *      <Route element={<Layout2 />}>
 *        <Route path="/signin" element={<SignIn />} />
 *      </Route>
 *     <Route path="/signup" element={<SignUp />} />
 *   </Route>
 * </Routes>
 */
export function RouteSwitch(props: RouteSwitchProps) {
  const { routes = [] } = props;
  const flattenRoutes = useMemo(() => {
    const recursiveRoutes = (routes: RouteRedirectProps[], layouts: RouteProps[] = []) => {
      const result: FlattenRoute[] = [];
      routes.forEach((route) => {
        if (route.routes && route.type !== 'redirect') {
          result.push(...recursiveRoutes(route.routes, [...layouts, route]));
        } else {
          result.push({
            ...route,
            layouts,
          });
        }
      });
      return result;
    };

    return recursiveRoutes([...routes]);
  }, [routes]);

  // /a/b/:c?/:d?/:e? => /a/b
  const getOptionalSegmentsPath = useCallback((path: string) => {
    if (path.endsWith('?')) {
      return getOptionalSegmentsPath(path.split('/').slice(0, -1).join('/'));
    }
    return path;
  }, []);
  const getRoute = useCallback(
    (route: RouteRedirectProps) => {
      if (route.type == 'redirect') {
        return <Route path={route.from} element={<Navigate replace to={route.to} />} />;
      } else if (route.type == 'route') {
        if (route.path.endsWith('?')) {
          return (
            <>
              {/* path: /a/b/:c?/:d? => /a/b */}
              <Route
                path={getOptionalSegmentsPath(route.path)}
                caseSensitive={route.sensitive}
                element={
                  <RouteContext.Provider value={route}>
                    <ComponentRenderer component={route.component} />
                  </RouteContext.Provider>
                }
              />
              {/* path: /a/b/:c?/:d? => /a/b/:c/:d */}
              <Route
                path={route.path.replaceAll('?', '').replaceAll('(.+)', '')}
                caseSensitive={route.sensitive}
                element={
                  <RouteContext.Provider value={route}>
                    <ComponentRenderer component={route.component} />
                  </RouteContext.Provider>
                }
              />
            </>
          );
        }
        return (
          <Route
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
      return <></>;
    },
    [getOptionalSegmentsPath],
  );

  const renderRouteWithLayout = useCallback(
    (route: FlattenRoute) => {
      const recursiveRenderComponent = (layouts: RouteProps[], route: FlattenRoute) => {
        if (layouts.length) {
          const [layout, ...rest] = layouts;
          return (
            <Route
              element={
                <RouteContext.Provider value={layout}>
                  <ComponentRenderer component={layout.component} />
                </RouteContext.Provider>
              }
            >
              {recursiveRenderComponent(rest, route)}
            </Route>
          );
        }
        return getRoute(route);
      };
      return recursiveRenderComponent(route.layouts, route);
    },
    [getRoute],
  );
  return (
    <Routes>
      {flattenRoutes.map((route, index) => (
        <Fragment key={index}>{renderRouteWithLayout(route)}</Fragment>
      ))}
    </Routes>
  );
}

function ComponentRenderer(props) {
  const Component = useRouteComponent(props?.component);
  return <Component></Component>;
}
