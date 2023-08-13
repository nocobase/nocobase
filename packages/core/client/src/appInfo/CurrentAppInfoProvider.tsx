import React, { createContext, useContext } from 'react';
import { useRequest } from '../api-client';
import { useApp } from '../application';

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
  }>(CurrentAppInfoContext);
};
export const CurrentAppInfoProvider = (props) => {
  const app = useApp();
  const result = useRequest({
    url: 'app:getInfo',
  });
  if (result.loading) {
    return app.renderComponent('AppSpin');
  }
  return <CurrentAppInfoContext.Provider value={result.data}>{props.children}</CurrentAppInfoContext.Provider>;
};
