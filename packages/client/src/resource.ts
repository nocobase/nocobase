import request from 'umi-request';

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

  protected options: ResourceOptions;

  constructor(options: string | ResourceOptions) {
    if (typeof options === 'string') {
      this.options = { resourceName: options }
    } else {
      this.options = options;
    }
  }

  list(options: ListOptions = {}) {
    const { resourceName } = this.options;
    return request(`/api/${resourceName}:list`);
  }

  get(options: GetOptions = {}) {
    const resourceKey = options.resourceKey || this.options.resourceKey;
    const { resourceName } = this.options;
    if (!resourceKey) {
      return Promise.resolve({ data: {} });
    }
    return request(`/api/${resourceName}:get/${resourceKey}`);
  }

  save(values: any, options: SaveOptions = {}) {
    const resourceKey = options.resourceKey || this.options.resourceKey;
    const { resourceName } = this.options;
    const url = `/api/${resourceName}:${resourceKey ? `update/${resourceKey}` : 'create'}`;
    return request(url, {
      method: 'post',
      data: values,
    });
  }

  static make(options: string | Resource | ResourceOptions) {
    if (typeof options === 'string') {
      return new Resource({ resourceName: options });
    }
    if (options instanceof Resource) {
      return options;
    }
    if (typeof options === 'object' && options.resourceName) {
      return new Resource(options);
    }
    throw 'resource 参数错误';
  }
}
