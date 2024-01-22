import { DataSource, DataSourceOptions } from './data-source';

export class DataSourceManager {
  dataSources: Map<string, DataSource<DataSourceOptions>>;

  constructor() {
    this.dataSources = new Map();
  }

  add(dataSource: DataSource<DataSourceOptions>) {
    this.dataSources.set(dataSource.name, dataSource);
  }

  middleware() {
    return async (ctx, next) => {
      console.log(ctx.get('x-data-source'));
      const name = ctx.get('x-data-source');
      if (this.dataSources.has(name)) {
        const ds = this.dataSources.get(name);
        return ds.middleware()(ctx, next);
      }
      await next();
      console.log('next....');
    };
  }
}
