import axios, { AxiosInstance, AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse } from 'axios';
import qs from 'qs';
import getSubAppName from './getSubAppName';

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

type ResourceAction = (params?: ActionParams) => Promise<any>;

export type IResource = {
  [key: string]: ResourceAction;
};

export class Auth {
  protected api: APIClient;

  protected KEYS = {
    locale: 'NOCOBASE_LOCALE',
    role: 'NOCOBASE_ROLE',
    token: 'NOCOBASE_TOKEN',
    authenticator: 'NOCOBASE_AUTH',
    theme: 'NOCOBASE_THEME',
  };

  protected options = {
    locale: null,
    role: null,
    authenticator: null,
    token: null,
  };

  constructor(api: APIClient) {
    this.api = api;
    this.initKeys();
    this.api.axios.interceptors.request.use(this.middleware.bind(this));
  }

  initKeys() {
    if (typeof window === 'undefined') {
      return;
    }
    const appName = getSubAppName(this.api['app'] ? this.api['app'].getPublicPath() : '/');
    if (!appName) {
      return;
    }
    this.KEYS['role'] = `${appName.toUpperCase()}_` + this.KEYS['role'];
    this.KEYS['locale'] = `${appName.toUpperCase()}_` + this.KEYS['locale'];
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

  getOption(key: string) {
    if (!this.KEYS[key]) {
      return;
    }
    return this.api.storage.getItem(this.KEYS[key]);
  }

  setOption(key: string, value?: string) {
    if (!this.KEYS[key]) {
      return;
    }
    this.options[key] = value;
    return this.api.storage.setItem(this.KEYS[key], value || '');
  }

  getLocale() {
    return this.getOption('locale');
  }

  setLocale(locale: string) {
    this.setOption('locale', locale);
  }

  getRole() {
    return this.getOption('role');
  }

  setRole(role: string) {
    this.setOption('role', role);
  }

  getToken() {
    return this.getOption('token');
  }

  setToken(token: string) {
    this.setOption('token', token);
  }

  getAuthenticator() {
    return this.getOption('authenticator');
  }

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
    this.setToken(data?.token);
    this.setAuthenticator(authenticator);
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
  storageClass?: any;
}

export type APIClientOptions = AxiosInstance | (AxiosRequestConfig & ExtendedOptions);

export class APIClient {
  axios: AxiosInstance;
  auth: Auth;
  storage: Storage;

  constructor(instance?: APIClientOptions) {
    if (typeof instance === 'function') {
      this.axios = instance;
    } else {
      const { authClass, storageClass, ...others } = instance || {};
      this.axios = axios.create(others);
      this.initStorage(storageClass);
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

  private initStorage(storage?: any) {
    if (storage) {
      this.storage = new storage(this);
    } else if (typeof localStorage !== 'undefined') {
      this.storage = localStorage;
    } else {
      this.storage = new MemoryStorage();
    }
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

  request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R> {
    const { resource, resourceOf, action, params, headers } = config as any;
    if (resource) {
      return this.resource(resource, resourceOf, headers)[action](params);
    }
    return this.axios.request<T, R, D>(config);
  }

  resource(name: string, of?: any, headers?: AxiosRequestHeaders): IResource {
    const target = {};
    const handler = {
      get: (_: any, actionName: string) => {
        let url = name.split('.').join(`/${of || '_'}/`);
        url += `:${actionName}`;
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
