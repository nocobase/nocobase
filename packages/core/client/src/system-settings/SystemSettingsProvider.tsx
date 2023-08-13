import { Result } from 'ahooks/es/useRequest/src/types';
import React, { createContext, ReactNode, useContext } from 'react';
import { useRequest } from '../api-client';
import { useApp } from '../application';

export const SystemSettingsContext = createContext<Result<any, any>>(null);

export const useSystemSettings = () => {
  return useContext(SystemSettingsContext);
};

export const SystemSettingsProvider: React.FC<{ children?: ReactNode }> = (props) => {
  const app = useApp();
  const result = useRequest({
    url: 'systemSettings:get/1?appends=logo',
  });
  if (result.loading) {
    return app.renderComponent('AppSpin');
  }
  return <SystemSettingsContext.Provider value={result}>{props.children}</SystemSettingsContext.Provider>;
};
