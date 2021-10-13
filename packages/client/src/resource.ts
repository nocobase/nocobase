import { RequestMethod } from 'umi-request';
import { request as req } from './schemas';

export interface ResourceOptions {
  resourceName: string;
  associatedKey?: any;
  associatedName?: string;
  resourceKey?: any;
}

export interface GetOptions {
  resourceKey?: any;
  defaultAppends?: any[];
  appends?: string[];
}

export interface SaveOptions {
  resourceKey?: any;
}

export interface ListOptions {
  defaultFilter?: any;
  filter?: any;
  pageSize?: number;
  defaultAppends?: any[];
  appends?: string[];
  perPage?: number;
}

export class Resource {
  public options: ResourceOptions;
  public request: RequestMethod;

  constructor(options: string | ResourceOptions, request?: any) {
    if (typeof options === 'string') {
      this.options = { resourceName: options };
    } else {
      this.options = options;
    }
    this.request = request || req;
  }

  sort(options) {
    const { resourceName } = this.options;
    const { resourceKey, target, field = 'sort' } = options;
    return this.request(`${resourceName}:sort/${resourceKey}`, {
      method: 'post',
      data: {
        target,
        field,
      },
    });
  }

  list(options: ListOptions = {}) {
    const {
      defaultAppends = [],
      appends = [],
      defaultFilter,
      filter,
      pageSize,
      ...others
    } = options;
    const { associatedKey, associatedName, resourceName } = this.options;
    let url = `${resourceName}:list`;
    if (associatedName && associatedKey) {
      url = `${associatedName}/${associatedKey}/${resourceName}:list`;
    }
    return this.request(url, {
      method: 'get',
      params: {
        filter: decodeURIComponent(
          JSON.stringify({ and: [defaultFilter, filter].filter(Boolean) }),
        ),
        'fields[appends]': defaultAppends.concat(appends).join(','),
        perPage: pageSize,
        ...others,
      },
    });
  }

  get(options: GetOptions = {}) {
    const resourceKey = options.resourceKey || this.options.resourceKey;
    const { resourceName } = this.options;
    if (!resourceKey) {
      return Promise.resolve({ data: {} });
    }
    const { defaultAppends = [], appends = [], ...others } = options;
    return this.request(`${resourceName}:get/${resourceKey}`, {
      params: {
        ...others,
        'fields[appends]': defaultAppends.concat(appends).join(','),
      },
    });
  }

  create(values: any) {
    const { associatedKey, associatedName, resourceName } = this.options;
    let url = `${resourceName}:create`;
    if (associatedKey && associatedName) {
      url = `${associatedName}/${associatedKey}/${url}`;
    }
    return this.request(url, {
      method: 'post',
      data: values,
    });
  }

  save(values: any, options: SaveOptions = {}) {
    const resourceKey = options.resourceKey || this.options.resourceKey;
    const { associatedKey, associatedName, resourceName } = this.options;
    let url = `${resourceName}:${
      resourceKey ? `update/${resourceKey}` : 'create'
    }`;
    if (associatedKey && associatedName) {
      url = `${associatedName}/${associatedKey}/${url}`;
    }
    return this.request(url, {
      method: 'post',
      data: values,
    });
  }

  export(options: any) {
    const { resourceName } = this.options;
    const { columns, ...others } = options;
    const url = `${resourceName}:export`;
    return this.request(url, {
      method: 'post',
      params: {
        columns: JSON.stringify(columns),
        ...others,
      },
      parseResponse: false,
      responseType: 'blob',
    }).then(async (response: Response) => {
      const filename = decodeURI(
        response.headers
          .get('Content-Disposition')
          .replace('attachment; filename=', ''),
      );
      // ReadableStream
      let res = new Response(response.body);
      let blob = await res.blob();
      let url = URL.createObjectURL(blob);
      let a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      // cleanup
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      a = null;
      blob = null;
      url = null;
      res = null;
    });
  }

  destroy(filter: any) {
    const { resourceName } = this.options;
    const url = `${resourceName}:destroy`;
    return this.request(url, {
      method: 'get',
      params: {
        filter,
      },
    });
  }

  toggle(options?: any) {
    const { associatedKey, associatedName, resourceName } = this.options;
    const { resourceKey } = options;
    let url = `${associatedName}/${associatedKey}/${resourceName}:toggle/${resourceKey}`;
    return this.request(url, {
      method: 'post',
    });
  }

  static make(
    options: null | string | Resource | ResourceOptions,
    request?: any,
  ): Resource | null {
    if (typeof options === 'string') {
      return new this({ resourceName: options }, request);
    }
    if (options instanceof Resource) {
      return options;
    }
    if (typeof options === 'object' && options.resourceName) {
      return new this(options, request);
    }
    console.warn('resource 初始化参数错误');
    return null;
  }
}
