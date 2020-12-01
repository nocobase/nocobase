import { request } from 'umi';

interface ActionParams {
  resourceKey?: string | number;
  // resourceName?: string;
  // associatedName?: string;
  associatedKey?: string | number;
  fields?: any;
  filter?: any;
  values?: any;
  page?: any;
  perPage?: any;
  [key: string]: any;
}

interface Resource {
  get: (params?: ActionParams) => Promise<any>;
  list: (params?: ActionParams) => Promise<any>;
  create: (params?: ActionParams) => Promise<any>;
  update: (params?: ActionParams) => Promise<any>;
  destroy: (params?: ActionParams) => Promise<any>;
  [name: string]: (params?: ActionParams) => Promise<any>;
}

class ApiClient {
  resource(name: string): Resource {
    const proxy: any = new Proxy({}, {
      get(target, method, receiver) {
        return (params: ActionParams = {}) => {
          const { associatedKey, resourceKey, ...restParams } = params;
          let url = `/${name}`;
          let options: any = {};
          if (['list', 'get'].indexOf(method as string) !== -1) {
            options.method = 'get';
            options.params = restParams;
          } else {
            options.method = 'post';
            options.data = restParams;
          }
          if (associatedKey) {
            url = `/${name.split('.').join(`/${associatedKey}/`)}`;
          }
          url += `:${method as string}`;
          // console.log(name, name.split('.'), associatedKey, name.split('.').join(`/${associatedKey}/`));
          if (resourceKey) {
            url += `/${resourceKey}`;
          }
          console.log({url, params});
          return request(url, options);
        };
      }
    });
    return proxy;
  }
}

const api = new ApiClient();

export default api;
