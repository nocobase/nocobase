import { Spin } from 'antd';
import React, { createContext, useContext } from 'react';
import { useRequest } from '../api-client';

export const CurrentAppInfoContext = createContext(null);

export const useCurrentAppInfo = () => {
  return useContext(CurrentAppInfoContext);
};
export const CurrentAppInfoProvider = (props) => {
  const result = useRequest(
    {
      url: 'app:getInfo',
    },
    {
      onSuccess(data) {
        const localTheme = localStorage.getItem('NOCOBASE_THEME');
        if (localTheme !== data?.data?.theme) {
          localStorage.setItem('NOCOBASE_THEME', data?.data?.theme);
          window.location.reload();
        }
      },
    },
  );
  const localTheme = localStorage.getItem('NOCOBASE_THEME');
  if (localTheme && localTheme !== result?.data?.data?.theme) {
    return <Spin />;
  }
  if (result.loading) {
    return <Spin />;
  }
  return <CurrentAppInfoContext.Provider value={result.data}>{props.children}</CurrentAppInfoContext.Provider>;
};
