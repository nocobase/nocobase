import { merge } from '@formily/shared';
import { useRequest as useReq, useSetState } from 'ahooks';
import { Options, Result } from 'ahooks/es/useRequest/src/types';
import { AxiosRequestConfig } from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { assign } from './assign';
import { useAPIClient } from './useAPIClient';
import { SetState } from 'ahooks/lib/useSetState';

type FunctionService = (...args: any[]) => Promise<any>;

export type ReturnTypeOfUseRequest<TData = any> = ReturnType<typeof useRequest<TData>>;

export type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
  url?: string;
};

export type UseRequestService<P> = AxiosRequestConfig<P> | ResourceActionOptions<P> | FunctionService;
export type UseRequestOptions = Options<any, any> & { uid?: string };
export interface UseRequestResult<P> extends Result<P, any> {
  state: any;
  setState: SetState<{}>;
}

export function useRequest<P>(service: UseRequestService<P>, options: UseRequestOptions = {}): UseRequestResult<P> {
  // 缓存用途
  const [state, setState] = useSetState({});
  const api = useAPIClient();

  let tempService;

  if (typeof service === 'function') {
    tempService = service;
  } else if (service) {
    tempService = async (params = {}) => {
      const { resource, url } = service as ResourceActionOptions;
      let args = cloneDeep(service);
      if (resource || url) {
        args.params = args.params || {};
        assign(args.params, params);
      } else {
        args = merge(args, params);
      }
      const response = await api.request(args);
      return response?.data;
    };
  } else {
    tempService = async () => {};
  }
  const tempOptions = {
    ...options,
    onSuccess(...args) {
      // @ts-ignore
      options.onSuccess?.(...args);
      if (options.uid) {
        api.services[options.uid] = result;
      }
    },
  };

  const result = useReq<P, any>(tempService, tempOptions);
  return { ...result, state, setState };
}
