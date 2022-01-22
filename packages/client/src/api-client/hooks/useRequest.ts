import { useContext } from 'react';
import { AxiosRequestConfig } from 'axios';
import { Options } from 'ahooks/lib/useRequest/src/types';
import { default as useReq } from 'ahooks/lib/useRequest';
import { APIClientContext } from '../context';

type FunctionService = (...args: any[]) => Promise<any>;

type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
};

export function useRequest<P>(
  service: AxiosRequestConfig<P> | ResourceActionOptions<P> | FunctionService,
  options?: Options<any, any>,
) {
  const api = useContext(APIClientContext);
  if (typeof service === 'function') {
    return useReq(service, options);
  }
  return useReq(async (params) => {
    const { resource } = service as ResourceActionOptions;
    if (resource) {
      Object.assign(service, { params });
    } else {
      Object.assign(service, params);
    }
    const response = await api.request(service);
    return response?.data;
  }, options);
}
