import { observable } from '@formily/reactive';
import { Result } from 'ahooks/lib/useRequest/src/types';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

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

export class APIClient {
  axios: AxiosInstance;

  services: Record<string, Result<any, any>>;

  constructor(instance?: AxiosInstance | AxiosRequestConfig) {
    this.services = observable({});
    if (typeof instance === 'function') {
      this.axios = instance;
    } else {
      this.axios = axios.create(instance);
    }
  }

  service(uid: string): Result<any, any> {
    return this.services[uid];
  }

  request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D> | ResourceActionOptions): Promise<R> {
    const { resource, resourceOf, action, params } = config as any;
    console.log('config', config);
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
        return (params?: ActionParams) => {
          const { values, ...others } = params || {};
          config['params'] = others;
          if (config.method !== 'get') {
            config['data'] = values || {};
          }
          return this.request(config);
        };
      },
    };
    return new Proxy(target, handler);
  }
}