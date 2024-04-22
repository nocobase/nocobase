import { ToposortOptions } from '@nocobase/utils';
import { DataSource } from './data-source';
import { DataSourceFactory } from './data-source-factory';

type DataSourceHook = (dataSource: DataSource) => void;

export class DataSourceManager {
  dataSources: Map<string, DataSource>;
  /**
   * @internal
   */
  factory: DataSourceFactory = new DataSourceFactory();
  protected middlewares = [];
  private onceHooks: Array<DataSourceHook> = [];

  constructor(public options = {}) {
    this.dataSources = new Map();
    this.middlewares = [];
  }

  get(dataSourceKey: string) {
    return this.dataSources.get(dataSourceKey);
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

  registerDataSourceType(type: string, DataSourceClass: any) {
    this.factory.register(type, DataSourceClass);
  }

  getDataSourceClass(type: string) {
    return this.factory.getClass(type);
  }

  createDataSourceInstance(type: string, options: any = {}): DataSource {
    return this.factory.create(type, options);
  }

  afterAddDataSource(hook: DataSourceHook) {
    this.addHookAndRun(hook);
  }

  private addHookAndRun(hook: DataSourceHook) {
    this.onceHooks.push(hook);
    for (const dataSource of this.dataSources.values()) {
      hook(dataSource);
    }
  }
}
