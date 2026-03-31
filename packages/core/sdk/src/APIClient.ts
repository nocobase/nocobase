/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, RawAxiosRequestHeaders } from 'axios';
import qs from 'qs';
import { Auth } from './Auth';
import { BaseStorage, LocalStorage, MemoryStorage, SessionStorage } from './Storage';

export interface ActionParams {
  filterByTk?: any;
  [key: string]: any;
}

type ResourceActionOptions<P = any> = {
  resource?: string;
  resourceOf?: any;
  action?: string;
  params?: P;
};

type ResourceAction = (params?: ActionParams, opts?: any) => Promise<any>;

export type IResource = {
  [key: string]: ResourceAction;
};

interface ExtendedOptions {
  authClass?: any;
  storageType?: 'localStorage' | 'sessionStorage' | 'memory';
  storageClass?: any;
  storagePrefix?: string;
  appName?: string;
  // 共享 token
  shareToken?: boolean;
}

export type APIClientOptions = AxiosInstance | (AxiosRequestConfig & ExtendedOptions);

export type RequestOptions = AxiosRequestConfig & {
  skipNotify?: boolean | ((error: any) => boolean);
  skipAuth?: boolean;
};

export class APIClient {
  options?: APIClientOptions;
  axios: AxiosInstance;
  auth: Auth;
  storage: BaseStorage;
  storagePrefix = 'NOCOBASE_';
  baseStoragePrefix = 'NOCOBASE_';
  shareToken = false;

  toErrMessages(error) {
    if (typeof document !== 'undefined' && typeof error?.response?.data === 'string') {
      const tempElement = document.createElement('div');
      tempElement.innerHTML = error?.response?.data;
      let message = tempElement.textContent || tempElement.innerText;
      if (message.includes('Error occurred while trying')) {
        message = 'The application may be starting up. Please try again later.';
        return [{ code: 'APP_WARNING', message }];
      }
      if (message.includes('502 Bad Gateway')) {
        message = 'The application may be starting up. Please try again later.';
        return [{ code: 'APP_WARNING', message }];
      }
      return [{ message }];
    }
    if (error?.response?.data?.error) {
      return [error?.response?.data?.error];
    }
    return (
      error?.response?.data?.errors ||
      error?.response?.data?.messages ||
      error?.response?.error || [{ message: error.message || 'Server error' }]
    );
  }

  getHeaders() {
    const headers = {};
    if (this.auth.locale) {
      headers['X-Locale'] = this.auth.locale;
    }
    if (this.auth.role) {
      headers['X-Role'] = this.auth.role;
    }
    if (this.auth.authenticator) {
      headers['X-Authenticator'] = this.auth.authenticator;
    }
    if (this.auth.token) {
      headers['Authorization'] = `Bearer ${this.auth.token}`;
    }
    return headers;
  }

  constructor(options?: APIClientOptions) {
    this.options = options;
    if (typeof options === 'function') {
      this.axios = options;
    } else {
      const {
        appName,
        authClass,
        storageType,
        storageClass,
        storagePrefix = 'NOCOBASE_',
        shareToken = false,
        ...others
      } = options || {};
      this.shareToken = shareToken;
      this.baseStoragePrefix = storagePrefix;
      this.storagePrefix = appName ? `${storagePrefix}${appName.toUpperCase()}_` : storagePrefix;
      this.axios = axios.create(others);
      this.initStorage(storageClass, storageType);
      if (authClass) {
        this.auth = new authClass(this);
      }
    }
    if (!this.storage) {
      this.initStorage();
    }
    if (!this.auth) {
      this.auth = new Auth(this);
    }
    this.interceptors();
  }

  createStorage(storageType: 'localStorage' | 'sessionStorage' | 'memory') {
    if (storageType === 'localStorage' && typeof localStorage !== 'undefined') {
      return new LocalStorage(this.storagePrefix, this.baseStoragePrefix, this.shareToken);
    }
    if (storageType === 'sessionStorage' && typeof sessionStorage !== 'undefined') {
      return new SessionStorage(this.storagePrefix, this.baseStoragePrefix, this.shareToken);
    }
    return new MemoryStorage();
  }

  private initStorage(storage?: any, storageType: 'localStorage' | 'sessionStorage' | 'memory' = 'localStorage') {
    if (storage) {
      this.storage = new storage(this);
      return;
    }
    this.storage = this.createStorage(storageType);
  }

  interceptors() {
    this.axios.interceptors.request.use((config) => {
      config.paramsSerializer = (params) => {
        return qs.stringify(params, {
          strictNullHandling: true,
          arrayFormat: 'brackets',
        });
      };
      return config;
    });
  }

  request<T = any, R = AxiosResponse<T>, D = any>(
    config: (AxiosRequestConfig<D> | ResourceActionOptions) & {
      skipNotify?: boolean | ((error: any) => boolean);
      skipAuth?: boolean;
    },
  ): Promise<R> {
    const { resource, resourceOf, action, params, headers } = config as any;
    if (resource) {
      return this.resource(resource, resourceOf, headers)[action](params);
    }
    return this.axios.request<T, R, D>(config);
  }

  resource(name: string, of?: any, headers?: RawAxiosRequestHeaders, cancel?: boolean): IResource {
    const target = {};
    const handler = {
      get: (_: any, actionName: string) => {
        if (cancel) {
          return;
        }

        let url = name.split('.').join(`/${encodeURIComponent(of) || '_'}/`);
        url += `:${actionName.toString()}`;
        const config: AxiosRequestConfig = { url };
        if (['get', 'list'].includes(actionName)) {
          config['method'] = 'get';
        } else {
          config['method'] = 'post';
        }
        return async (params?: ActionParams, opts?: any) => {
          const { values, filter, ...others } = params || {};
          config['params'] = others;
          if (filter) {
            if (typeof filter === 'string') {
              config['params']['filter'] = filter;
            } else {
              if (filter['*']) {
                delete filter['*'];
              }
              config['params']['filter'] = JSON.stringify(filter);
            }
          }
          if (config.method !== 'get') {
            config['data'] = values || {};
          }
          return await this.request({
            ...config,
            ...opts,
            headers,
          });
        };
      },
    };
    return new Proxy(target, handler);
  }
}
