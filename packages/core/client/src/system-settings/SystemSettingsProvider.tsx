import { Result } from 'ahooks/es/useRequest/src/types';
import React, { createContext, ReactNode, useContext } from 'react';
import { useRequest } from '../api-client';
import { useAppSpin } from '../application/hooks/useAppSpin';

export const SystemSettingsContext = createContext<Result<any, any>>(null);
SystemSettingsContext.displayName = 'SystemSettingsContext';

export const useSystemSettings = () => {
  return useContext(SystemSettingsContext);
};

export const SystemSettingsProvider: React.FC<{ children?: ReactNode }> = (props) => {
  const { render } = useAppSpin();
  const result = useRequest({
    url: 'systemSettings:get/1?appends=logo',
  });
  if (result.loading) {
    return render();
  }

  return <SystemSettingsContext.Provider value={result}>{props.children}</SystemSettingsContext.Provider>;
};
