import React, { useMemo } from 'react';
import { Redirect, Route, Switch, useLocation, useRouteMatch } from 'react-router-dom';
import { RouteContext } from './context';
import { useRoute, useRouteComponent } from './hooks';
import { RouteSwitchProps } from './types';

export function RouteSwitch(props: RouteSwitchProps) {
  const { routes = [] } = props;
  const { url: base, path } = useRouteMatch();

  if (!routes.length) {
    return null;
  }
  return (
    <Switch>
      {routes.map((route, index) => {
        if (route.type == 'redirect') {
          return (
            <Redirect
              key={index}
              to={route.to}
              push={route.push}
              from={route.from}
              path={route.path}
              exact={route.exact}
              strict={route.strict}
            />
          );
        }
        if (!route.path && Array.isArray(route.routes)) {
          route.path = route.routes.map((r) => r.path) as any;
        }
        let nextPath = route.path;
        if (route.path && typeof route.path === 'string' && !route.path.startsWith('/')) {
          nextPath = `${base.endsWith('/') ? base : base + '/'}${route.path}`;
        }
        return (
          <Route
            key={[nextPath].flat().join(',') as string}
            path={nextPath}
            exact={route.exact}
            strict={route.strict}
            sensitive={route.sensitive}
          >
            <ComponentRenderer route={route} />
          </Route>
        );
      })}
    </Switch>
  );
}

function ComponentRenderer(props) {
  const { route } = props;
  const Component = useRouteComponent(route?.component);
  if (React.isValidElement(Component)) {
    return React.cloneElement(Component, props, <RouteSwitch routes={route.routes} />);
  }
  return (
    <RouteContext.Provider value={route}>
      <Component {...props}>
        <RouteSwitch routes={route?.routes} />
      </Component>
    </RouteContext.Provider>
  );
}
