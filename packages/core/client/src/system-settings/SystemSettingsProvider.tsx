import { Result } from 'ahooks/es/useRequest/src/types';
import React, { createContext, ReactNode, useContext } from 'react';
import { useRequest } from '../api-client';
import { useAppSpin } from '../application/hooks/useAppSpin';

export const SystemSettingsContext = createContext<Result<any, any>>(null);

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

  // 主要是为了方便在 e2e 测试中获取到 adminSchemaUid
  localStorage.setItem('NOCOBASE_SYSTEM_SETTINGS', JSON.stringify(result.data));

  return <SystemSettingsContext.Provider value={result}>{props.children}</SystemSettingsContext.Provider>;
};
