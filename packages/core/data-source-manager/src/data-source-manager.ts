import { ToposortOptions } from '@nocobase/utils';
import { DataSource } from './data-source';
import { DataSourceFactory } from './data-source-factory';

export class DataSourceManager {
  dataSources: Map<string, DataSource>;
  factory: DataSourceFactory = new DataSourceFactory();

  protected middlewares = [];

  constructor(public options = {}) {
    this.dataSources = new Map();
    this.middlewares = [];
  }

  async add(dataSource: DataSource, options: any = {}) {
    await dataSource.load(options);
    this.dataSources.set(dataSource.name, dataSource);
  }

  use(fn: any, options?: ToposortOptions) {
    this.middlewares.push([fn, options]);
  }

  middleware() {
    return async (ctx, next) => {
      const name = ctx.get('x-data-source');
      if (name) {
        if (this.dataSources.has(name)) {
          const ds = this.dataSources.get(name);
          ctx.dataSource = ds;
          return ds.middleware(this.middlewares)(ctx, next);
        } else {
          ctx.throw(`data source ${name} does not exist`);
        }
      }
      await next();
      console.log('next....');
    };
  }
}
