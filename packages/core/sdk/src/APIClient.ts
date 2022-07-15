import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
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

export interface IResource {
  list?: (params?: ActionParams) => Promise<any>;
  get?: (params?: ActionParams) => Promise<any>;
  create?: (params?: ActionParams) => Promise<any>;
  update?: (params?: ActionParams) => Promise<any>;
  destroy?: (params?: ActionParams) => Promise<any>;
  [key: string]: (params?: ActionParams) => Promise<any>;
}

export class Auth {
  protected api: APIClient;

  protected options = {
    token: null,
    locale: null,
    role: null,
  };

  constructor(api: APIClient) {
    this.api = api;
    this.locale = this.getLocale();
    this.role = this.getRole();
    this.token = this.getToken();
    this.api.axios.interceptors.request.use(this.middleware.bind(this));
  }

  get locale() {
    return this.getLocale();
  }

  get role() {
    return this.getRole();
  }

  get token() {
    return this.getToken();
  }

  set locale(value) {
    this.setLocale(value);
  }

  set role(value) {
    this.setRole(value);
  }

  set token(value) {
    this.setToken(value);
  }

  middleware(config: AxiosRequestConfig) {
    if (this.locale) {
      config.headers['X-Locale'] = this.locale;
    }
    if (this.role) {
      config.headers['X-Role'] = this.role;
    }
    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }
    return config;
  }

  getLocale() {
    return this.api.storage.getItem('NOCOBASE_LOCALE');
  }

  setLocale(locale: string) {
    this.options.locale = locale;
    this.api.storage.setItem('NOCOBASE_LOCALE', locale || '');
  }

  getToken() {
    return this.api.storage.getItem('NOCOBASE_TOKEN');
  }

  setToken(token: string) {
    this.options.token = token;
    this.api.storage.setItem('NOCOBASE_TOKEN', token || '');
    if (!token) {
      this.setRole(null);
      this.setLocale(null);
    }
  }

  getRole() {
    return this.api.storage.getItem('NOCOBASE_ROLE');
  }

  setRole(role: string) {
    this.options.role = role;
    this.api.storage.setItem('NOCOBASE_ROLE', role || '');
  }

  async signIn(values): Promise<AxiosResponse<any>> {
    const response = await this.api.request({
      method: 'post',
      url: 'users:signin',
      data: values,
    });
    const data = response?.data?.data;
    this.setToken(data?.token);
    return response;
  }

  async signOut() {
    await this.api.request({
      method: 'post',
      url: 'users:signout',
    });
    this.setToken(null);
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

export class APIClient {
  axios: AxiosInstance;
  auth: Auth;
  storage: Storage;

  constructor(instance?: AxiosInstance | (AxiosRequestConfig & ExtendedOptions)) {
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
    const { resource, resourceOf, action, params } = config as any;
    if (resource) {
      return this.resource(resource, resourceOf)[action](params);
    }
    return this.axios.request<T, R, D>(config);
  }

  resource(name: string, of?: any): IResource {
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
              config['params']['filter'] = JSON.stringify(filter);
            }
          }
          if (config.method !== 'get') {
            config['data'] = values || {};
          }
          return await this.request({
            ...config,
            ...opts,
          });
        };
      },
    };
    return new Proxy(target, handler);
  }
}
