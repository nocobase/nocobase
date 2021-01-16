import path from 'path';
import { Op } from 'sequelize';
import { Application } from '@nocobase/server';
import { Operator } from '@nocobase/database';
import * as collectionsRolesActions from './actions/collections.roles';
import * as rolesCollectionsActions from './actions/roles.collections';

// API
// const permissions = ctx.app.getPluginInstance('permissions');
// const result: boolean = permissions.can(key, options);



export class Permissions {
  static getActionPermissions(roles) {
    const permissions = roles.reduce((permissions, role) => permissions.concat(role.get('permissions')), []);
    return permissions.reduce((actions, permission) => actions.concat(permission.get('actions')), []);
  }
  
  static getFieldPermissions(roles) {
    const permissions = roles.reduce((permissions, role) => permissions.concat(role.get('permissions')), []);
    return permissions.reduce((fields, permission) => fields.concat(permission.get('fields_permissions')), []);
  }

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
        const user = this.getCurrentUser(ctx);
        return { [Op.eq]: user[user.constructor.primaryKeyAttribute] };
      });
    }

    resourcer.use(this.middleware.bind(this));
  }

  async middleware(ctx, next) {
    const {
      resourceName,
      actionName
    } = ctx.action.params;

    const permissions = this;

    ctx.can = (function(key: string, options = {}) {
      return permissions.can(key, { ...options, context: this });
    }).bind(ctx);

    const result = await this.can(`${resourceName}:${actionName}`, { context: ctx });
    if (result === false) {
      return this.reject(ctx);
    }

    if (result === true) {
      return next();
    }

    ctx.action.mergeParams(result);

    return next();
  }

  async can(key: string, { context, ...options }) {
    const matcher = key.match(/^(?:([^\.]+)\.)?([^:]+)(?::([\w]+))$/);
    if (!matcher) {
      throw new Error('input key does not match pattern');
    }
    const [matched, associatedName, resourceName, actionName] = matcher;

    if (!actionName) {
      // TODO: 只获取相关数据
      return {};
    }

    if (!['list', 'get', 'create', 'update', 'destroy'].includes(actionName)) {
      // 不是常规 action 的，直接返回 true 以跳过。
      return true;
    }

    if (associatedName) {
      // TODO(feature): 关联数据的处理
      return true;
    }

    const roles = await this.getRolesWithPermissions({
      // ...options,
      // associatedName,
      resourceName,
      actionName,
      currentUser: this.getCurrentUser(context)
    });

    if (roles.some(role => role.type === -1)) {
      // 如果是系统管理员，则不进行其他验证或过滤
      return true;
    }

    const actionPermissions = Permissions.getActionPermissions(roles);
    // 如果找不到可用的 action 记录
    if (!actionPermissions.length) {
      // 则认为没有权限
      return false;
    }
    
    const filters = actionPermissions
      .filter(item => Boolean(item.scope) && Object.keys(item.scope.filter).length)
      .map(item => item.scope.filter);

    const fields = new Set();
    const fieldPermissions = Permissions.getFieldPermissions(roles);
    fieldPermissions.forEach(item => {
      const actions = item.get('actions');
      if (actions && actions.includes(`${resourceName}:${actionName}`)) {
        fields.add(item.get('field').get('name'));
      }
    });

    return {
      ...(filters.length
        ? { filter: filters.length > 1 ? { or: filters } : filters[0] }
        : {}),
      fields: Array.from(fields)
    };
  }

  getCurrentUser(ctx) {
    // TODO: 获取当前用户应调用当前依赖用户插件的相关方法
    return ctx.state.currentUser;
  }

  async getRolesWithPermissions({
    resourceName,
    // resourceKey,
    // associated,
    // associatedName,
    // associatedKey,
    actionName,
    currentUser
  }) {
    // TODO: 还未定义关联数据的权限如何表达

    const Role = this.app.database.getModel('roles');
    const permissionInclusion = {
      association: 'permissions',
      where: {
        collection_name: resourceName
      },
      required: true,
      include: [
        {
          association: 'actions',
          where: {
            name: `${resourceName}:${actionName}`
          },
          required: true,
          // 对 hasMany 关系可以进行拆分查询，避免联表过多标识符超过 PG 的 64 字符限制
          separate: true,
          include: [
            {
              association: 'scope',
              attribute: ['filter']
            }
          ]
        },
        {
          association: 'fields_permissions',
          include: [
            {
              association: 'field',
              attributes: ['name']
            }
          ],
          separate: true,
        }
      ],
    };
    
    let userRoles = [];
    // 获取登入用户的角色及权限
    if (currentUser) {
      const adminRoles = await currentUser.getRoles({
        where: {
          type: -1
        }
      });
      if (adminRoles.length) {
        return adminRoles;
      }
  
      userRoles = await currentUser.getRoles({
        where: {
          type: 1
        },
        include: [
          permissionInclusion
        ]
      });
    }
  
    // 获取匿名用户的角色及权限
    const anonymousRoles = await Role.findAll({
      where: {
        type: 0
      },
      include: [
        permissionInclusion
      ]
    });
  
    return [...anonymousRoles, ...userRoles];
  }
  
  reject(ctx) {
    ctx.throw(404);
  }
}

export default async function (options = {}) {
  const instance = new Permissions(this, options);

  return instance;
}
