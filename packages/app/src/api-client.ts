import { request } from 'umi';

interface ResourceProxyConstructor {
  new <T, H extends object>(target: T, handler: ProxyHandler<H>): H
}

const ResourceProxy = Proxy as ResourceProxyConstructor;

interface Params {
  resourceKey?: string | number;
  // resourceName?: string;
  // associatedName?: string;
  associatedKey?: string | number;
  fields?: any;
  filter?: any;
  [key: string]: any;
}

interface Handler {
  [name: string]: (params?: Params) => Promise<any>;
}

class APIClient {
  resource(name: string) {
    return new ResourceProxy<object, Handler>({}, {
      get(target, method, receiver) {
        return (params: Params = {}) => {
          console.log(params);
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
  }
}

const api = new APIClient();

export default api;
