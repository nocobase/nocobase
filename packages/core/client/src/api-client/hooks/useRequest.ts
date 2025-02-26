/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { merge } from '@formily/shared';
import { useRequest as useReq, useSetState } from 'ahooks';
import { Options, Result } from 'ahooks/es/useRequest/src/types';
import { SetState } from 'ahooks/lib/useSetState';
import { AxiosRequestConfig } from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { useMemo } from 'react';
import { assign } from './assign';
import { useAPIClient } from './useAPIClient';

type FunctionService = (...args: any[]) => Promise<any>;

export type ReturnTypeOfUseRequest<TData = any> = ReturnType<typeof useRequest<TData>>;

export type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
  url?: string;
  skipNotify?: boolean | ((error: any) => boolean);
  skipAuth?: boolean;
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
  return useMemo(() => {
    return { ...result, state, setState };
  }, [result, setState, state]);
}
