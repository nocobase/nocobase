import React, { createContext, useContext } from 'react';
import { useRequest } from '../api-client';
import { useAppSpin } from '../application/hooks/useAppSpin';

export const CurrentAppInfoContext = createContext(null);
CurrentAppInfoContext.displayName = 'CurrentAppInfoContext';

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
  const { render } = useAppSpin();
  const result = useRequest({
    url: 'app:getInfo',
  });
  if (result.loading) {
    return render();
  }
  return <CurrentAppInfoContext.Provider value={result.data}>{props.children}</CurrentAppInfoContext.Provider>;
};
