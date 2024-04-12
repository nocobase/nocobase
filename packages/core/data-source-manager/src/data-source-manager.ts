import { ToposortOptions } from '@nocobase/utils';
import { DataSource } from './data-source';
import { DataSourceFactory } from './data-source-factory';

type DataSourceHook = (dataSource: DataSource) => void;

export class DataSourceManager {
  dataSources: Map<string, DataSource>;
  factory: DataSourceFactory = new DataSourceFactory();

  onceHooks: Array<DataSourceHook> = [];

  protected middlewares = [];

  constructor(public options = {}) {
    this.dataSources = new Map();
    this.middlewares = [];
  }

  async add(dataSource: DataSource, options: any = {}) {
    await dataSource.load(options);
    this.dataSources.set(dataSource.name, dataSource);

    for (const hook of this.onceHooks) {
      hook(dataSource);
    }
  }

  use(fn: any, options?: ToposortOptions) {
    this.middlewares.push([fn, options]);
  }

  middleware() {
    return async (ctx, next) => {
      const name = ctx.get('x-data-source') || 'main';

      if (!this.dataSources.has(name)) {
        ctx.throw(`data source ${name} does not exist`);
      }

      const ds = this.dataSources.get(name);
      ctx.dataSource = ds;

      return ds.middleware(this.middlewares)(ctx, next);
    };
  }

  hookOnEveryInstancesOnce(hook: DataSourceHook) {
    this.addHookAndRun(hook);
  }

  private addHookAndRun(hook: DataSourceHook) {
    this.onceHooks.push(hook);
    for (const dataSource of this.dataSources.values()) {
      hook(dataSource);
    }
  }
}
