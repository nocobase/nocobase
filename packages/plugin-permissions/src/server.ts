import path from 'path';
import { Op, where } from 'sequelize';
import { Application } from '@nocobase/server';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import * as rolesCollectionsActions from './actions/roles.collections';
import * as rolesPagesActions from './actions/roles.pages';

// API
// const permissions = ctx.app.getPluginInstance('permissions');
// const result: boolean = permissions.check(ctx);

class Permissions {
  app: Application;
  options: any;

  static check(roles) {
    const permissions = roles.reduce((permissions, role) => permissions.concat(role.get('permissions')), []);
    const actionPermissions = permissions.reduce((actions, permission) => actions.concat(permission.get('actions_permissions')), []);
    return Boolean(actionPermissions.length);
  }

  constructor(app: Application, options) {
    this.app = app;
    this.options = options;

    const database: Database = app.database;
    const resourcer: Resourcer = app.resourcer;

    database.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    Object.keys(rolesCollectionsActions).forEach(actionName => {
      resourcer.registerActionHandler(actionName, rolesCollectionsActions[actionName]);
    });

    Object.keys(rolesPagesActions).forEach(actionName => {
      resourcer.registerActionHandler(actionName, rolesPagesActions[actionName]);
    });

    // resourcer.use(this.middleware());
  }

  middleware() {
    return async (ctx, next) => {
      const roles = await this.getRolesWithPermissions(ctx);

      if (!Permissions.check(roles)) {
        return ctx.throw(404);
      }
      // TODO: merge action params (also fields)
  
      return next();
    };
  }

  async getRolesWithPermissions({ state: { currentUser }, action }) {
    // TODO: 获取当前用户应调用当前依赖用户插件的相关静态方法

    // TODO: 还未定义关联数据的权限如何表达
    const {
      resourceName,
      associated,
      associatedName,
      associatedKey,
      actionName
    } = action.params;

    const Role = this.app.database.getModel('roles');
    const permissionInclusion = {
      association: 'permissions',
      where: {
        collection_name: resourceName
      },
      required: true,
      include: [
        {
          association: 'actions_permissions',
          where: {
            name: actionName
          },
          required: true,
          include: [
            {
              association: 'fields_permissions'
            }
          ]
        }
      ],
    };
    // 获取匿名用户的角色及权限
    const anonymousRoles = await Role.findAll({
      where: {
        anonymous: true
      },
      include: [
        permissionInclusion
      ]
    });
    // 获取登入用户的角色及权限
    const userRoles = currentUser ? await currentUser.getRoles({
      include: [
        permissionInclusion
      ]
    }) : [];

    return [...anonymousRoles, ...userRoles];
  }
}

export default async function (options = {}) {
  const instance = new Permissions(this, options);

  return instance;
}
