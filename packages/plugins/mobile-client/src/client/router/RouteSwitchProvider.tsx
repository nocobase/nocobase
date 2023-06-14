import { RouteSwitchProvider, useRouteSwitchContext } from '@nocobase/client';
import React, { useEffect } from 'react';
import MApplication from './Application';
import { isJSBridge } from '../core/bridge';

export const RouterSwitchProvider = (props) => {
  const { routes, components } = useRouteSwitchContext();
  // redirect to mobile
  if (isJSBridge) {
    const redirectRoute = routes[0];
    if (redirectRoute.type === 'redirect' && redirectRoute.to === '/admin') {
      redirectRoute.to = '/mobile';
    }
  }
  return (
    <RouteSwitchProvider
      routes={routes}
      components={{
        ...components,
        MApplication,
      }}
    >
      {props.children}
    </RouteSwitchProvider>
  );
};
