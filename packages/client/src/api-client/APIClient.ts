import { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

export interface IResource {
  list?: () => Promise<any>;
  get?: () => Promise<any>;
  create?: () => Promise<any>;
  update?: () => Promise<any>;
  destroy?: () => Promise<any>;
}

export class APIClient {
  axios: AxiosInstance;

  constructor(axios: AxiosInstance) {
    this.axios = axios;
  }

  request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D>): Promise<R> {
    return this.axios.request<T, R, D>(config);
  }

  resource(name: string, of?: any): IResource {
    const target = {};
    const handler = {
      get: (_: any, method: string) => {
        let url = name.split('.').join(of || '');
        url += `:${method}`;
        return () => this.request({
          url,
        });
      },
    };
    return new Proxy(target, handler);
  }
}
