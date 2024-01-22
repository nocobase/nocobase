import { ACL } from '@nocobase/acl';
import { getNameByParams, parseRequest } from '@nocobase/resourcer';
import compose from 'koa-compose';
import { ResourceManager } from './ResourceManager';
import { loadDefaultActions } from './loadDefaultActions';
import { ICollectionManager } from './types';

export abstract class DataSource {
  public collectionManager: ICollectionManager;
  public resourceManager: ResourceManager;
  public acl: ACL;

  constructor(protected options: any) {
    this.acl = this.createACL();
    this.resourceManager = this.createResourceManager({
      prefix: '/api',
      ...options.resourceManager,
    });
    this.collectionManager = this.createCollectionManager(options.collectionManager);
    this.resourceManager.registerActionHandlers(loadDefaultActions(this));
    this.resourceManager.use(this.acl.middleware());
  }

  get name() {
    return this.options.name;
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

  async load() {}

  abstract createCollectionManager(options?: any): ICollectionManager;
}
