import React from 'react';
import { PluginManagerContext } from './context';

export const PluginManagerProvider: React.FC<any> = (props) => {
  const { components, children } = props;
  return <PluginManagerContext.Provider value={{ components }}>{children}</PluginManagerContext.Provider>;
};
