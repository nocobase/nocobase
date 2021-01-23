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

    database.getModel('collections').addHook('afterCreate', async (model: any, options) => {
      console.log('plugin-permissions hook');
      await model.updateAssociations({
        scopes: [
          {
            title: '全部数据',
            filter: {},
          },
          {
            title: '用户自己的数据',
            filter: {
              "created_by_id.$currentUser": true,
            },
          },
        ]
      }, options);
    });

    database.getModel('users').addHook('afterCreate', async(model, options) => {
      const { transaction = await database.sequelize.transaction() } = options;
      const Role = database.getModel('roles');
      const defaultRole = await Role.findOne({ where: { default: true }, transaction });
      if (defaultRole) {
        // @ts-ignore
        await model.addRole(defaultRole, { transaction });
      }
      if (!options.transaction) {
        await transaction.commit();
      }
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
    ctx.ac = new AccessController(ctx);

    return next();
  };

  middleware = async (ctx, next) => {
    const {
      associatedName,
      resourceField,
      resourceName,
      actionName
    } = ctx.action.params;

    let result = null;

    // 关系数据的权限
    if (associatedName && resourceField) {
      result = await ctx.ac.can(resourceField.options.target).act(actionName).any();
    } else {
      result = await ctx.ac.can(resourceName).act(actionName).any();
    }

    if (!result) {
      return this.reject(ctx);
    }

    if (result === true) {
      return next();
    }

    ctx.action.mergeParams({
      filter: result.filter,
      // TODO: 在 fields 改进之前，先注释掉
      // fields: result.fields.map(item => item.get('field').get('name'))
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
