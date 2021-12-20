import React, { createContext, useContext } from 'react';
import { default as useReq } from 'ahooks/lib/useRequest';

export const APIClientContext = createContext(null);

export class APIClient {
  request() {}
  resource() {}
}

export interface APIClientProviderProps {
  apiClient: APIClient;
  children?: any;
}

export function APIClientProvider(props: APIClientProviderProps) {
  const { apiClient, children } = props;
  return <APIClientContext.Provider value={apiClient}>{children}</APIClientContext.Provider>;
}

export function useRequest(service: any, options?: any) {
  const apiClient = useContext(APIClientContext);
  return useReq(apiClient.request(service), options);
}
