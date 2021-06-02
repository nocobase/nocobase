import React, { createContext, useContext } from 'react';
import { Switch, Route as ReactRoute, Redirect } from 'react-router-dom';

export const RouteComponentContext = createContext({});

export interface RouteSwitchProps {
  routes?: any[];
  components?: any;
}

export function RouteSwitch(props: RouteSwitchProps) {
  const { routes } = props;
  if (!Array.isArray(routes)) {
    return null;
  }
  const components = props.components || useContext(RouteComponentContext);
  return (
    <RouteComponentContext.Provider value={components}>
      <Switch>
        {routes.map((route, key) => {
          if (route.type === 'redirect') {
            return (
              <Redirect
                key={key}
                exact={route.exact}
                from={route.from}
                to={route.to}
              />
            );
          }
          if (route.component) {
            let path = route.path;
            if (!path && Array.isArray(route.routes)) {
              path = route.routes.map((r) => r.path);
            }
            return (
              <ReactRoute
                key={key}
                path={path}
                exact={route.exact}
                component={(routeProps) => {
                  const Component =
                    typeof route.component === 'string'
                      ? components[route.component]
                      : route.component;
                  if (!Component) {
                    return null;
                  }
                  return (
                    <Component {...routeProps} route={route}>
                      <RouteSwitch routes={route.routes} />
                    </Component>
                  );
                }}
              />
            );
          }
        })}
      </Switch>
    </RouteComponentContext.Provider>
  );
}

export default RouteSwitch;
