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
  get: (params?: ActionParams, options?: any) => Promise<any>;
  list: (params?: ActionParams, options?: any) => Promise<any>;
  create: (params?: ActionParams, options?: any) => Promise<any>;
  update: (params?: ActionParams, options?: any) => Promise<any>;
  destroy: (params?: ActionParams, options?: any) => Promise<any>;
  [name: string]: (params?: ActionParams, options?: any) => Promise<any>;
}

// TODO 待改进，提供一个封装度更完整的 SDK，request 可以自由替换
class ApiClient {
  resource(name: string): Resource {
    const proxy: any = new Proxy(
      {},
      {
        get(target, method, receiver) {
          return (params: ActionParams = {}, options: any = {}) => {
            let {
              associatedKey,
              resourceKey,
              filter,
              sorter,
              sort = [],
              values,
              ...restParams
            } = params;
            let url = `/${name}`;
            sort = sort || [];
            options.params = restParams;
            if (['list', 'get', 'export'].indexOf(method as string) !== -1) {
              options.method = 'get';
            } else {
              options.method = 'post';
              options.data = values;
            }
            if (associatedKey) {
              url = `/${name.split('.').join(`/${associatedKey}/`)}`;
            }
            url += `:${method as string}`;
            // console.log(name, name.split('.'), associatedKey, name.split('.').join(`/${associatedKey}/`));
            if (resourceKey) {
              url += `/${resourceKey}`;
            }
            if (filter) {
              options.params['filter'] = JSON.stringify(filter);
            }
            if (sorter) {
              sort = [];
              const arr = Array.isArray(sorter) ? sorter : [sorter];
              arr.forEach(({ order, field }) => {
                if (order === 'descend') {
                  sort.push(`-${field}`);
                } else if (order === 'ascend') {
                  sort.push(field);
                }
              });
            }
            if (sort.length === 0) {
              delete options.params['sort'];
            } else {
              options.params['sort'] = sort.join(',');
            }
            console.log({ url, params });
            return request(url, options);
          };
        },
      },
    );
    return proxy;
  }
}

const api = new ApiClient();

export default api;
