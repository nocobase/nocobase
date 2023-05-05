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

  protected NOCOBASE_LOCALE_KEY = 'NOCOBASE_LOCALE';

  protected NOCOBASE_ROLE_KEY = 'NOCOBASE_ROLE';

  protected NOCOBASE_AUTH_KEY = 'NOCOBASE_AUTH';

  protected options = {
    locale: null,
    role: null,
    auth: {
      authenticator: null,
      token: null,
    },
  };

  constructor(api: APIClient) {
    this.api = api;
    this.initKeys();
    this.locale = this.getLocale();
    this.role = this.getRole();
    this.auth = this.getAuth();
    this.api.axios.interceptors.request.use(this.middleware.bind(this));
  }

  initKeys() {
    if (!window) {
      return;
    }
    const match = window.location.pathname.match(/^\/apps\/([^/]*)\//);
    if (!match) {
      return;
    }
    const appName = match[1];
    this.NOCOBASE_LOCALE_KEY = `${appName.toUpperCase()}_NOCOBASE_LOCALE`;
    this.NOCOBASE_ROLE_KEY = `${appName.toUpperCase()}_NOCOBASE_ROLE`;
  }

  get locale() {
    return this.getLocale();
  }

  set locale(value) {
    this.setLocale(value);
  }

  get role() {
    return this.getRole();
  }

  set role(value) {
    this.setRole(value);
  }

  get auth() {
    return this.getAuth();
  }

  set auth(value) {
    this.setAuth(value);
  }

  middleware(config: AxiosRequestConfig) {
    if (this.locale) {
      config.headers['X-Locale'] = this.locale;
    }
    if (this.role) {
      config.headers['X-Role'] = this.role;
    }
    if (this.auth?.authenticator) {
      config.headers['X-Authenticator'] = this.auth.authenticator;
    }
    if (this.auth?.token) {
      config.headers['Authorization'] = `Bearer ${this.auth.token}`;
    }
    return config;
  }

  getLocale() {
    return this.api.storage.getItem(this.NOCOBASE_LOCALE_KEY);
  }

  setLocale(locale: string) {
    this.options.locale = locale;
    this.api.storage.setItem(this.NOCOBASE_LOCALE_KEY, locale || '');
  }

  getAuth() {
    const auth = this.api.storage.getItem('NOCOBASE_AUTH');
    return JSON.parse(auth);
  }

  setAuth(auth: { authenticator: string; token: string }) {
    this.options.auth = auth;
    this.api.storage.setItem('NOCOBASE_AUTH', JSON.stringify(auth));
    if (!auth?.token) {
      this.setRole(null);
      // this.setLocale(null);
    }
  }

  getToken() {
    const auth = this.getAuth();
    return auth?.token;
  }

  getRole() {
    return this.api.storage.getItem(this.NOCOBASE_ROLE_KEY);
  }

  setRole(role: string) {
    this.options.role = role;
    this.api.storage.setItem(this.NOCOBASE_ROLE_KEY, role || '');
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
    this.setAuth({
      authenticator,
      token: data?.token,
    });
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
    await this.api.request({
      method: 'post',
      url: 'users:signOut',
    });
    this.setAuth(null);
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
