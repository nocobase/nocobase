import { Spin } from 'antd';
import React, { createContext, useContext } from 'react';
import { useRequest } from '../api-client';

export const CurrentAppInfoContext = createContext(null);

export const useCurrentAppInfo = () => {
  return useContext<{
    data: {
      database: {
        dialect: string;
      };
      lang: string;
      version: string;
    };
    loading: boolean;
    error: any;
  }>(CurrentAppInfoContext);
};
export const CurrentAppInfoProvider = (props) => {
  const result = useRequest({
    url: 'app:getInfo',
  });
  if (result.loading) {
    return <Spin />;
  }
  return <CurrentAppInfoContext.Provider value={result.data}>{props.children}</CurrentAppInfoContext.Provider>;
};
