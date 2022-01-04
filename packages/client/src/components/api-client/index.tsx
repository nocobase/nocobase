import React, { createContext, useContext } from 'react';
import { default as useReq } from 'ahooks/lib/useRequest';

export interface IResource {
  list?: () => Promise<any>;
  get?: () => Promise<any>;
  create?: () => Promise<any>;
  update?: () => Promise<any>;
  destroy?: () => Promise<any>;
}

export class APIClient {
  async request(options?: any) {
    return {};
  }

  resource(name: string, of?: any): IResource {
    return {};
  }
}

export const APIClientContext = createContext<APIClient>(null);

export interface APIClientProviderProps {
  apiClient: APIClient;
  children?: any;
}

export function APIClientProvider(props: APIClientProviderProps) {
  const { apiClient, children } = props;
  return <APIClientContext.Provider value={apiClient}>{children}</APIClientContext.Provider>;
}

export function useAPIClient() {
  return useContext(APIClientContext);
}

export function useRequest(service: any, options?: any) {
  const apiClient = useContext(APIClientContext);
  return useReq(() => apiClient.request(service), options);
}

export function useResource(name: any, of?: any) {
  const apiClient = useContext(APIClientContext);
  return apiClient.resource(name, of);
}
