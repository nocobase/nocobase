import { ToposortOptions } from '@nocobase/utils';
import { DataSource } from './DataSource';

export class DataSourceManager {
  dataSources: Map<string, DataSource>;
  protected middlewares = [];

  constructor() {
    this.dataSources = new Map();
    this.middlewares = [];
  }

  add(dataSource: DataSource) {
    this.dataSources.set(dataSource.name, dataSource);
  }

  use(fn: any, options?: ToposortOptions) {
    this.middlewares.push([fn, options]);
  }

  middleware() {
    return async (ctx, next) => {
      const name = ctx.get('x-data-source');
      if (this.dataSources.has(name)) {
        const ds = this.dataSources.get(name);
        ctx.dataSource = ds;
        return ds.middleware(this.middlewares)(ctx, next);
      }
      await next();
      console.log('next....');
    };
  }
}
