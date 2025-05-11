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

export class Auth {
  protected api: APIClient;

  get storagePrefix() {
    return this.api.storagePrefix;
  }

  get KEYS() {
    const defaults = {
      locale: this.storagePrefix + 'LOCALE',
      role: this.storagePrefix + 'ROLE',
      token: this.storagePrefix + 'TOKEN',
      authenticator: this.storagePrefix + 'AUTH',
      theme: this.storagePrefix + 'THEME',
    };

    if (this.api['app']) {
      const appName = this.api['app']?.getName?.();
      if (appName) {
        defaults['role'] = `${appName.toUpperCase()}_` + defaults['role'];
        defaults['locale'] = `${appName.toUpperCase()}_` + defaults['locale'];
      }
    }

    return defaults;
  }

  protected options = {
    locale: null,
    role: null,
    authenticator: null,
    token: null,
  };

  constructor(api: APIClient) {
    this.api = api;
    this.api.axios.interceptors.request.use(this.middleware.bind(this));
  }

  get locale() {
    return this.getLocale();
  }

  set locale(value: string) {
    this.setLocale(value);
  }

  get role() {
    return this.getRole();
  }

  set role(value: string) {
    this.setRole(value);
  }

  get token() {
    return this.getToken();
  }

  set token(value: string) {
    this.setToken(value);
  }

  get authenticator() {
    return this.getAuthenticator();
  }

  set authenticator(value: string) {
    this.setAuthenticator(value);
  }

  /**
   * @internal
   */
  getOption(key: string) {
    if (!this.KEYS[key]) {
      return;
    }
    return this.api.storage.getItem(this.KEYS[key]);
  }

  /**
   * @internal
   */
  setOption(key: string, value?: string) {
    if (!this.KEYS[key]) {
      return;
    }
    this.options[key] = value;
    return this.api.storage.setItem(this.KEYS[key], value || '');
  }

  /**
   * @internal
   * use {@link Auth#locale} instead
   */
  getLocale() {
    return this.getOption('locale');
  }

  /**
   * @internal
   * use {@link Auth#locale} instead
   */
  setLocale(locale: string) {
    this.setOption('locale', locale);
  }

  /**
   * @internal
   * use {@link Auth#role} instead
   */
  getRole() {
    return this.getOption('role');
  }

  /**
   * @internal
   * use {@link Auth#role} instead
   */
  setRole(role: string) {
    this.setOption('role', role);
  }

  /**
   * @internal
   * use {@link Auth#token} instead
   */
  getToken() {
    return this.getOption('token');
  }

  /**
   * @internal
   * use {@link Auth#token} instead
   */
  setToken(token: string) {
    this.setOption('token', token);

    if (this.api['app']) {
      this.api['app'].eventBus.dispatchEvent(
        new CustomEvent('auth:tokenChanged', { detail: { token, authenticator: this.authenticator } }),
      );
    }
  }

  /**
   * @internal
   * use {@link Auth#authenticator} instead
   */
  getAuthenticator() {
    return this.getOption('authenticator');
  }

  /**
   * @internal
   * use {@link Auth#authenticator} instead
   */
  setAuthenticator(authenticator: string) {
    this.setOption('authenticator', authenticator);
  }

  middleware(config: AxiosRequestConfig) {
    if (this.locale) {
      config.headers['X-Locale'] = this.locale;
    }
    if (this.role) {
      config.headers['X-Role'] = this.role;
    }
    if (this.authenticator && !config.headers['X-Authenticator']) {
      config.headers['X-Authenticator'] = this.authenticator;
    }
    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }
    return config;
  }

  async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>> {
    const response = await this.api.request({
      method: 'post',
      url: 'auth:signIn',
      data: values,
      headers: {
        'X-Authenticator': authenticator,
      },
    });
    const data = response?.data?.data;
    this.setAuthenticator(authenticator);
    this.setToken(data?.token);
    return response;
  }

  async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>> {
    return await this.api.request({
      method: 'post',
      url: 'auth:signUp',
      data: values,
      headers: {
        'X-Authenticator': authenticator,
      },
    });
  }

  async signOut() {
    const response = await this.api.request({
      method: 'post',
      url: 'auth:signOut',
    });
    this.setToken(null);
    this.setRole(null);
    this.setAuthenticator(null);
    return response;
  }

  async lostPassword(values: any): Promise<AxiosResponse<any>> {
    // 获取当前 URL 的查询参数
    const searchParams = new URLSearchParams(window.location.search);

    // 转换为对象
    const paramsObject = Object.fromEntries(searchParams.entries());

    const response = await this.api.request({
      method: 'post',
      url: 'auth:lostPassword',
      data: {
        ...values,
        baseURL: window.location.href.split('/forgot-password')[0],
      },
      headers: {
        'X-Authenticator': paramsObject.name,
      },
    });
    return response;
  }

  async resetPassword(values: any): Promise<AxiosResponse<any>> {
    const response = await this.api.request({
      method: 'post',
      url: 'auth:resetPassword',
      data: values,
    });
    return response;
  }

  async checkResetToken(values: any): Promise<AxiosResponse<any>> {
    const response = await this.api.request({
      method: 'post',
      url: 'auth:checkResetToken',
      data: values,
    });
    return response;
  }
}

export abstract class Storage {
  abstract clear(): void;
  abstract getItem(key: string): string | null;
  abstract removeItem(key: string): void;
  abstract setItem(key: string, value: string): void;
}

export class MemoryStorage extends Storage {
  items = new Map();

  clear() {
    this.items.clear();
  }

  getItem(key: string) {
    return this.items.get(key);
  }

  setItem(key: string, value: string) {
    return this.items.set(key, value);
  }

  removeItem(key: string) {
    return this.items.delete(key);
  }
}

interface ExtendedOptions {
  authClass?: any;
  storageType?: 'localStorage' | 'sessionStorage' | 'memory';
  storageClass?: any;
  storagePrefix?: string;
}

export type APIClientOptions = AxiosInstance | (AxiosRequestConfig & ExtendedOptions);

export class APIClient {
  options?: APIClientOptions;
  axios: AxiosInstance;
  auth: Auth;
  storage: Storage;
  storagePrefix = 'NOCOBASE_';

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
      const { authClass, storageType, storageClass, storagePrefix = 'NOCOBASE_', ...others } = options || {};
      this.storagePrefix = storagePrefix;
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

  private initStorage(storage?: any, storageType = 'localStorage') {
    if (storage) {
      this.storage = new storage(this);
      return;
    }
    if (storageType === 'localStorage' && typeof localStorage !== 'undefined') {
      this.storage = localStorage;
      return;
    }
    if (storageType === 'sessionStorage' && typeof sessionStorage !== 'undefined') {
      this.storage = sessionStorage;
      return;
    }
    this.storage = new MemoryStorage();
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
