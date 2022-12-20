import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { RouteContext } from './context';
import { useRouteComponent } from './hooks';
import { RouteSwitchProps } from './types';

export function RouteSwitch(props: RouteSwitchProps) {
  const { routes = [] } = props;
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
        return (
          <Route
            key={index}
            path={route.path}
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
  return (
    <Component {...props}>
      <RouteSwitch routes={props.route.routes} />
    </Component>
  );
}
