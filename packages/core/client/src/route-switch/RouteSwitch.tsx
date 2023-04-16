import React from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';
import { RouteContext } from './context';
import { useRouteComponent } from './hooks';
import { RouteSwitchProps } from './types';

export function RouteSwitch(props: RouteSwitchProps) {
  const { routes = [], base = '/' } = props;
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
            key={index}
            path={nextPath}
            exact={route.exact}
            strict={route.strict}
            sensitive={route.sensitive}
            render={(props) => {
              return (
                <RouteContext.Provider value={route}>
                  <ComponentRenderer {...props} route={route} />
                </RouteContext.Provider>
              );
            }}
          />
        );
      })}
    </Switch>
  );
}

function ComponentRenderer(props) {
  const Component = useRouteComponent(props?.route?.component);
  const { path } = useRouteMatch();
  return (
    <Component {...props}>
      <RouteSwitch base={path} routes={props.route.routes} />
    </Component>
  );
}
