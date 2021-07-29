import { request } from './schemas';

export interface ResourceOptions {
  resourceName: string;
  associatedKey?: any;
  associatedName?: string;
  resourceKey?: any;
}

export interface GetOptions {
  resourceKey?: any;
  appends?: string[];
}

export interface SaveOptions {
  resourceKey?: any;
}

export interface ListOptions {
}

export class Resource {

  public options: ResourceOptions;

  constructor(options: string | ResourceOptions) {
    if (typeof options === 'string') {
      this.options = { resourceName: options }
    } else {
      this.options = options;
    }
  }

  list(options: ListOptions = {}) {
    const { resourceName } = this.options;
    return request(`${resourceName}:list`);
  }

  get(options: GetOptions = {}) {
    const resourceKey = options.resourceKey || this.options.resourceKey;
    const { resourceName } = this.options;
    if (!resourceKey) {
      return Promise.resolve({ data: {} });
    }
    return request(`${resourceName}:get/${resourceKey}`);
  }

  create(values: any) {
    const { resourceName } = this.options;
    const url = `${resourceName}:create`;
    return request(url, {
      method: 'post',
      data: values,
    });
  }

  save(values: any, options: SaveOptions = {}) {
    const resourceKey = options.resourceKey || this.options.resourceKey;
    const { resourceName } = this.options;
    const url = `${resourceName}:${resourceKey ? `update/${resourceKey}` : 'create'}`;
    return request(url, {
      method: 'post',
      data: values,
    });
  }

  destroy(filter: any) {
    const { resourceName } = this.options;
    const url = `${resourceName}:destroy`;
    return request(url, {
      method: 'get',
      params: {
        filter
      },
    });
  }

  static make(options: null | string | Resource | ResourceOptions): Resource | null {
    if (typeof options === 'string') {
      return new Resource({ resourceName: options });
    }
    if (options instanceof Resource) {
      return options;
    }
    if (typeof options === 'object' && options.resourceName) {
      return new Resource(options);
    }
    console.warn('resource 初始化参数错误');
    return null;
  }
}
