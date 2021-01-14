import path from 'path';
import { Op } from 'sequelize';
import { Application } from '@nocobase/server';
import Database, { Operator } from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import * as collectionsRolesActions from './actions/collections.roles';
import * as rolesCollectionsActions from './actions/roles.collections';
import common from './middlewares/common';

// API
// const permissions = ctx.app.getPluginInstance('permissions');
// const result: boolean = permissions.check(ctx);



class Permissions {
  readonly app: Application;
  readonly options: any;

  private interceptors = new Map<string, Function>();

  constructor(app: Application, options) {
    this.app = app;
    this.options = options;

    const database: Database = app.database;
    const resourcer: Resourcer = app.resourcer;

    // 常规 action 都统一处理
    ['list', 'get', 'create', 'update', 'destroy'].forEach(action => {
      this.registerInterceptor(action, common);
    });

    database.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    Object.keys(collectionsRolesActions).forEach(actionName => {
      resourcer.registerActionHandler(`collections.roles:${actionName}`, collectionsRolesActions[actionName]);
    });

    Object.keys(rolesCollectionsActions).forEach(actionName => {
      resourcer.registerActionHandler(`roles.collections:${actionName}`, rolesCollectionsActions[actionName]);
    });

    // 针对“自己创建的” scope 添加特殊的操作符以生成查询条件
    if (!Operator.has('$currentUser')) {
      Operator.register('$currentUser', (value, { ctx }) => {
        const user = this.getCurrentUser(ctx);
        return { [Op.eq]: user[user.constructor.primaryKeyAttribute] };
      });
    }

    resourcer.use(this.middleware.bind(this));
  }

  getInterceptor(action, collection) {
    if (this.interceptors.has(action)) {
      return this.interceptors.get(action);
    }
    return this.interceptors.get(`${collection}:${action}`);
  }

  registerInterceptor(name, interceptor) {
    this.interceptors.set(name, interceptor);
  }

  async middleware(ctx, next) {
    const {
      resourceName,
      actionName
    } = ctx.action.params;

    const interceptor = this.getInterceptor(actionName, resourceName);
    if (interceptor) {
      return interceptor.call(this, ctx, next);
    }

    return next();
  }

  getCurrentUser(ctx) {
    // TODO: 获取当前用户应调用当前依赖用户插件的相关方法
    return ctx.state.currentUser;
  }

  reject(ctx) {
    ctx.throw(404);
  }
}

export default async function (options = {}) {
  const instance = new Permissions(this, options);

  return instance;
}
