import React, { useContext } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { Result } from 'antd';
import { RouteContext } from './context';
import { useRouteComponent } from './hooks';
import { RouteSwitchProps } from './types';
import { ACLContext } from '../acl/ACLProvider';

export function RouteSwitch(props: RouteSwitchProps) {
  const { routes = [] } = props;
  const data = useContext(ACLContext);
  const { snippets } = data?.data.data || { snippets: [] };
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
              const {
                match: { params, url },
              } = props;
              if (url === '/admin/pm/list' || params?.pluginName) {
                const pmAclCheck = url === '/admin/pm/list' && snippets.includes('plugin-manager');
                const pluginTabSnippet =
                  params?.pluginName && `!settings-center.${params.pluginName}.${params.tabName}`;
                const pluginTabAclCheck = pluginTabSnippet && !snippets.includes(pluginTabSnippet);
                const aclCheck = pluginTabAclCheck || pmAclCheck;
                if (aclCheck) {
                  return (
                    <RouteContext.Provider value={route}>
                      <ComponentRenderer {...props} route={route} />
                    </RouteContext.Provider>
                  );
                } else {
                  return (
                    <RouteContext.Provider value={route}>
                      <NotFoundRenderer {...props} route={route} />
                    </RouteContext.Provider>
                  );
                }
              }
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

function NotFoundRenderer(props) {
  const Component = useRouteComponent(props?.route?.component);
  return (
    <Component {...props}>
      <Result status="404" title="404" subTitle="Sorry, the page you visited does not exist." />
    </Component>
  );
}
