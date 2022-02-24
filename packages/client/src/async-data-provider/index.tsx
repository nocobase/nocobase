import { Result } from 'ahooks/lib/useRequest/src/types';
import React, { createContext, useContext } from 'react';
import { useRequest } from '../api-client';

export const AsyncDataContext = createContext<Result<any, any> & { state?: any; setState?: any }>(null);

export interface AsyncDataProviderProps {
  value?: any;
  request?: any;
  uid?: string;
  onSuccess?: (data, params) => void;
}

export const AsyncDataProvider: React.FC<AsyncDataProviderProps> = (props) => {
  const { value, request, children, ...others } = props;
  if (value) {
    return <AsyncDataContext.Provider value={value}>{children}</AsyncDataContext.Provider>;
  }
  const result = useRequest(request, { ...others });
  return <AsyncDataContext.Provider value={result}>{children}</AsyncDataContext.Provider>;
};

export const useAsyncData = () => {
  return useContext(AsyncDataContext);
};
