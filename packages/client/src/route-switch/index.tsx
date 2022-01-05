import React, { createContext, useContext } from 'react';
import { Switch, Route, Redirect } from 'react-router';
import get from 'lodash/get';

interface RedirectProps {
  type: 'redirect';
  to: any;
  path?: string;
  exact?: boolean;
  strict?: boolean;
  push?: boolean;
  from?: string;
  [key: string]: any;
}

interface RouteProps {
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

export interface RouteSwitchProps {
  routes?: RouteRedirectProps[];
  components?: any;
}

export const RouteSwitchContext = createContext({
  components: {},
});

export const RouteContext = createContext(null);

export function useRouteComponent(name?: string) {
  if (!name) {
    return () => null;
  }
  const { components } = useContext(RouteSwitchContext);
  return get(components, name) || (() => null);
}

export function useRoute() {
  return useContext(RouteContext);
}

interface RouteSwitchProviderProps {
  components?: any;
  children?: any;
}

export function RouteSwitchProvider(props: RouteSwitchProviderProps) {
  const { children, components } = props;
  return <RouteSwitchContext.Provider value={{ components }}>{children}</RouteSwitchContext.Provider>;
}

function ComponentRenderer(props) {
  const Component = useRouteComponent(props?.route?.component);
  return (
    <Component {...props}>
      <RouteSwitch routes={props.route.routes} />
    </Component>
  );
}

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
