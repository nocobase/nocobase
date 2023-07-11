import { Result } from 'ahooks/es/useRequest/src/types';
import { Spin } from 'antd';
import React, { createContext, ReactNode, useContext } from 'react';
import { useRequest } from '..';

export const SystemSettingsContext = createContext<Result<any, any>>(null);

export const useSystemSettings = () => {
  return useContext(SystemSettingsContext);
};

export const SystemSettingsProvider: React.FC<{ children?: ReactNode }> = (props) => {
  const result = useRequest({
    url: 'systemSettings:get/1?appends=logo',
  });
  if (result.loading) {
    return <Spin />;
  }
  return <SystemSettingsContext.Provider value={result}>{props.children}</SystemSettingsContext.Provider>;
};
