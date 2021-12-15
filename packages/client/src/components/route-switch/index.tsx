import React, { useContext, createContext } from 'react';
import { Switch, Route, Redirect } from 'react-router';
import get from 'lodash/get';

export interface RedirectProps {
  type: 'redirect';
  to: any;
  path?: string;
  exact?: boolean;
  strict?: boolean;
  push?: boolean;
  from?: string;
  [key: string]: any;
}

export interface RouteProps {
  type: 'route';
  path?: string | string[];
  exact?: boolean;
  strict?: boolean;
  sensitive?: boolean;
  component?: any;
  routes?: RouteProps[];
  [key: string]: any;
}

export type RouteRedirectProps = RedirectProps | RouteProps;

export interface RouteSwitchOptions {
  routes?: RouteRedirectProps[];
  components?: any;
}

export interface RouteSwitchProps {
  routes?: RouteRedirectProps[];
  components?: any;
}

export const RouteComponentsContext = createContext(null);

export function useComponent(route: RouteProps) {
  const components = useContext(RouteComponentsContext);
  if (typeof route.component === 'string') {
    const component = get(components, route.component);
    return component;
  }
  return route.component || (() => null);
}

export function createRouteSwitch(options: RouteSwitchOptions) {
  function ComponentRenderer(props) {
    const Component = useComponent(props.route);
    return (
      <Component {...props}>
        <RouteSwitch routes={props.route.routes} />
      </Component>
    );
  }

  function RouteSwitch(props: RouteSwitchProps) {
    const { routes = [] } = props;
    if (!routes.length) {
      return null;
    }
    return (
      <RouteComponentsContext.Provider value={{ ...options.components, ...props.components }}>
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
                  return <ComponentRenderer {...props} route={route} />;
                }}
              />
            );
          })}
        </Switch>
      </RouteComponentsContext.Provider>
    );
  }
  return RouteSwitch;
}
