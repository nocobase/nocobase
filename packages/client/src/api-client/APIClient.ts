import axios, { Axios, AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

export interface ActionParams {
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
}

export class APIClient {
  axios: AxiosInstance;

  constructor(instance?: AxiosInstance | AxiosRequestConfig) {
    if (typeof instance === 'function') {
      this.axios = instance;
    } else {
      this.axios = axios.create(instance);
    }
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
        return (params?: ActionParams) => {
          config[config.method === 'get' ? 'params' : 'data'] = { __params__: params };
          console.log({ config });
          return this.request(config);
        };
      },
    };
    return new Proxy(target, handler);
  }
}
