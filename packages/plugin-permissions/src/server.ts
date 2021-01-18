import path from 'path';
import { Op } from 'sequelize';
import { Application } from '@nocobase/server';
import { Operator } from '@nocobase/database';
import * as collectionsRolesActions from './actions/collections.roles';
import * as rolesCollectionsActions from './actions/roles.collections';
import AccessController from './AccessController';

// API
// const permissions = ctx.app.getPluginInstance('permissions');
// const result: boolean = permissions.can(key, options);



export class Permissions {
  readonly app: Application;
  readonly options: any;

  constructor(app: Application, options) {
    this.app = app;
    this.options = options;

    const { database, resourcer } = app;

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
        const user = ctx.state.currentUser;
        return { [Op.eq]: user[user.constructor.primaryKeyAttribute] };
      });
    }

    resourcer.use(this.injection);
    resourcer.use(this.middleware);
  }

  injection = async (ctx, next) => {
    ctx.can = new AccessController(ctx).can;

    return next();
  };

  middleware = async (ctx, next) => {
    const {
      resourceName,
      actionName
    } = ctx.action.params;

    const result = await ctx.can(resourceName).act(actionName).any();
    if (!result) {
      return this.reject(ctx);
    }

    if (result === true) {
      return next();
    }

    ctx.action.mergeParams({
      filter: result.filter,
      fields: result.fields.map(item => item.get('field').get('name'))
    });

    return next();
  };
  
  reject(ctx) {
    ctx.throw(404);
  }
}

export default async function (options = {}) {
  const instance = new Permissions(this, options);

  return instance;
}
