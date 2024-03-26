import { ACL } from '@nocobase/acl';
import { getNameByParams, parseRequest } from '@nocobase/resourcer';
import EventEmitter from 'events';
import compose from 'koa-compose';
import { loadDefaultActions } from './load-default-actions';
import { ResourceManager } from './resource-manager';
import { ICollectionManager } from './types';

export type DataSourceOptions = any;

export abstract class DataSource extends EventEmitter {
  public collectionManager: ICollectionManager;
  public resourceManager: ResourceManager;
  public acl: ACL;

  constructor(protected options: DataSourceOptions) {
    super();
    this.init(options);
  }

  get name() {
    return this.options.name;
  }

  static testConnection(options?: any): Promise<boolean> {
    return Promise.resolve(true);
  }

  init(options: DataSourceOptions = {}) {
    this.acl = this.createACL();

    this.resourceManager = this.createResourceManager({
      prefix: process.env.API_BASE_PATH,
      ...options.resourceManager,
    });

    this.collectionManager = this.createCollectionManager(options);
    this.resourceManager.registerActionHandlers(loadDefaultActions(this));

    if (options.acl !== false) {
      this.resourceManager.use(this.acl.middleware(), { tag: 'acl', after: ['auth'] });
    }
  }

  collectionToResourceMiddleware() {
    return async (ctx, next) => {
      const params = parseRequest(
        {
          path: ctx.request.path,
          method: ctx.request.method,
        },
        {
          prefix: this.resourceManager.options.prefix,
          accessors: this.resourceManager.options.accessors,
        },
      );
      if (!params) {
        return next();
      }
      const resourceName = getNameByParams(params);
      // 如果资源名称未被定义
      if (this.resourceManager.isDefined(resourceName)) {
        return next();
      }
      // 如果经过加载后是已经定义的表
      if (!this.collectionManager.hasCollection(resourceName)) {
        return next();
      }
      this.resourceManager.define({
        name: resourceName,
      });
      return next();
    };
  }

  middleware(middlewares: any = []) {
    if (!this['_used']) {
      for (const [fn, options] of middlewares) {
        this.resourceManager.use(fn, options);
      }
      this['_used'] = true;
    }
    return async (ctx, next) => {
      ctx.getCurrentRepository = () => {
        const { resourceName, resourceOf } = ctx.action;
        return this.collectionManager.getRepository(resourceName, resourceOf);
      };

      return compose([this.collectionToResourceMiddleware(), this.resourceManager.restApiMiddleware()])(ctx, next);
    };
  }

  createACL() {
    return new ACL();
  }

  createResourceManager(options) {
    return new ResourceManager(options);
  }

  async load(options: any = {}) {}

  abstract createCollectionManager(options?: any): ICollectionManager;
}
