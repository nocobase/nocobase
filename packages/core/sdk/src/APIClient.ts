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

class Auth {
  protected api: APIClient;

  public token: string;

  public role: string;

  public locale: string;

  constructor(api: APIClient) {
    this.api = api;
    this.initFromStorage();
    this.api.axios.interceptors.request.use(this.middleware.bind(this));
  }

  middleware(config) {
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

  initFromStorage() {
    this.token = localStorage.getItem('NOCOBASE_TOKEN');
    this.role = localStorage.getItem('NOCOBASE_ROLE');
    this.locale = localStorage.getItem('NOCOBASE_LOCALE');
  }

  setLocale(locale: string) {
    this.locale = locale;
    localStorage.setItem('NOCOBASE_LOCALE', locale || '');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('NOCOBASE_TOKEN', token || '');
    if (!token) {
      this.setRole(null);
      this.setLocale(null);
    }
  }

  setRole(role: string) {
    this.role = role;
    localStorage.setItem('NOCOBASE_ROLE', role || '');
  }

  async signIn(values) {
    const response = await this.api.request({
      method: 'post',
      url: 'users:signin',
      data: values,
    });
    const data = response?.data?.data;
    this.setToken(data?.token);
    return data;
  }

  async signOut() {
    await this.api.request({
      method: 'post',
      url: 'users:signout',
    });
    this.setToken(null);
  }
}

export class APIClient {
  axios: AxiosInstance;
  auth: Auth;

  constructor(instance?: AxiosInstance | AxiosRequestConfig, customAuth?: typeof Auth) {
    if (typeof instance === 'function') {
      this.axios = instance;
    } else {
      this.axios = axios.create(instance);
    }
    const Authorization = customAuth || Auth;
    this.auth = new Authorization(this);
    this.paramsSerializer();
  }

  paramsSerializer() {
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
        return async (params?: ActionParams) => {
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
          return await this.request(config);
        };
      },
    };
    return new Proxy(target, handler);
  }
}
