import { RouteSwitchProvider, useRouteSwitchContext } from '@nocobase/client';
import React, { useEffect } from 'react';
import MApplication from './Application';
import { isJSBridge } from '../core/bridge';
import { useHistory, useLocation } from 'react-router-dom';

export const RouterSwitchProvider = (props) => {
  const { routes, components } = useRouteSwitchContext();
  // redirect to mobile
  const location = useLocation();
  const history = useHistory();
  useEffect(() => {
    if (isJSBridge) {
      if (location.pathname.includes('/admin')) {
        history.push('/mobile');
      }
    }
  }, [history, location.pathname]);

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
