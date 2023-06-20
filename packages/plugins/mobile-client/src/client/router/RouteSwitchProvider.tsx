import { RouteSwitchProvider, useRouteSwitchContext } from '@nocobase/client';
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isJSBridge } from '../core/bridge';
import MApplication from './Application';

export const RouterSwitchProvider = (props) => {
  const { routes, components } = useRouteSwitchContext();
  // redirect to mobile
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (isJSBridge()) {
      if (location.pathname.includes('/admin')) {
        navigate('/mobile');
      }
    }
  }, [location.pathname, navigate]);

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
