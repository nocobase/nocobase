import { Spin } from 'antd';
import React from 'react';
import { useRequest } from '../api-client';
import { RouteSwitchContext } from './context';
import { RouteSwitchProviderProps } from './types';

export function RouteSwitchProvider(props: RouteSwitchProviderProps) {
  const { children, components, routes } = props;
  return <RouteSwitchContext.Provider value={{ routes, components }}>{children}</RouteSwitchContext.Provider>;
}

export function RemoteRouteSwitchProvider(props: RouteSwitchProviderProps) {
  const { data, loading } = useRequest({
    url: 'uiRoutes:getAccessible',
  });
  if (loading) {
    return <Spin />;
  }
  return <RouteSwitchProvider {...props} routes={data?.data || []} />;
}
