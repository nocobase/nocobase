import { merge } from '@formily/shared';
import { default as useReq } from 'ahooks/lib/useRequest';
import { Options } from 'ahooks/lib/useRequest/src/types';
import { AxiosRequestConfig } from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { useContext } from 'react';
import { APIClientContext } from '../context';
import { assign } from './assign';

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
  return useReq(async (params = {}) => {
    const { resource } = service as ResourceActionOptions;
    let args = cloneDeep(service);
    if (resource) {
      args.params = args.params || {};
      assign(args.params, params);
    } else {
      args = merge(args, params);
    }
    const response = await api.request(args);
    return response?.data;
  }, options);
}
