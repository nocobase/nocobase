import React, { createContext, useContext } from 'react';
import { Result } from 'ahooks/lib/useRequest/src/types';
import { useRequest } from '../api-client';

export const AsyncDataContext = createContext<Result<any, any>>(null);

export interface AsyncDataProviderProps {
  value?: any;
  resource?: any;
  request?: any;
  action?: string;
  defaultParams?: any;
}

export const AsyncDataProvider: React.FC<AsyncDataProviderProps> = (props) => {
  const { value, request, resource, action, defaultParams, children } = props;
  if (value) {
    return <AsyncDataContext.Provider value={value}>{children}</AsyncDataContext.Provider>;
  }
  const callback = (params?: any) => resource[action]({ ...defaultParams, ...params });
  const result = useRequest(request || callback);
  return <AsyncDataContext.Provider value={result}>{children}</AsyncDataContext.Provider>;
};

export const useAsyncData = () => {
  return useContext(AsyncDataContext);
};
