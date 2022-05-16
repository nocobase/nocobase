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
  protected token: string;
  protected role: string;

  constructor(api: APIClient) {
    this.api = api;
    this.api.axios.interceptors.request.use((config) => {
      config.headers['X-Hostname'] = window.location.hostname;
      if (this.role) {
        config.headers['X-Role'] = this.role;
      }
      if (this.token) {
        config.headers['Authorization'] = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  setToken(token: string) {
    this.token = token;
  }

  setRole(role: string) {
    this.role = role;
  }

  async signIn(values) {
    const response = await this.api.request({
      method: 'post',
      url: 'users:signin',
      data: values,
    });
    const data = response?.data?.data;
    this.token = data;
    return data;
  }

  async signOut() {
    await this.api.request({
      method: 'post',
      url: 'users:signout',
    });
    this.token = null;
  }
}

export class APIClient {
  axios: AxiosInstance;
  auth: Auth;

  constructor(instance?: AxiosInstance | AxiosRequestConfig) {
    if (typeof instance === 'function') {
      this.axios = instance;
    } else {
      this.axios = axios.create(instance);
    }
    this.auth = new Auth(this);
    this.qsMiddleware();
  }

  qsMiddleware() {
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
