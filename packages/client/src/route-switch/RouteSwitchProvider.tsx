import React from 'react';
import { RouteSwitchContext } from './context';
import { RouteSwitchProviderProps } from './types';

export function RouteSwitchProvider(props: RouteSwitchProviderProps) {
  const { children, components } = props;
  return <RouteSwitchContext.Provider value={{ components }}>{children}</RouteSwitchContext.Provider>;
}
