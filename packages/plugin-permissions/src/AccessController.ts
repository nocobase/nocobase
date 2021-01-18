import { Op } from 'sequelize';

import { ROLE_TYPE_ANONYMOUS, ROLE_TYPE_ROOT, ROLE_TYPE_USER } from './constants';



export type CollectionPermissions = {
  actions: any[];
  fields: any[];
  tabs: any[]
};

export type PermissionParams = true | null | {
  filter: any,
  fields: any[]
};

// ctx.can = new AccessController(ctx).can;
// ctx.can('collection').permissions()
// => [{ name: 'list', scope: { id: 1, filter: {} } }]
// ctx.can('collection').act('list').any()
// => { filter: {}, fields: [] }
// ctx.can('collection').act('update').any()
// ctx.can('collection').act('update').one(resourceKey)
// ctx.can('collection').act('get').one(resourceKey)

export default class AccessController {
  static getPermissions(roles) {
    return roles.reduce((permissions, role) => permissions.concat(role.get('permissions')), []);
  }

  static getActionPermissions(permissions) {
    const actionsMap = new Map<string, any>();

    permissions.forEach(permission => {
      permission.get('actions').forEach(action => {
        // 如果没有同名 action
        if (!actionsMap.has(action.name)) {
          actionsMap.set(action.name, action);
          return;
        }

        const existedScope = actionsMap.get(action.name).get('scope');
        // 如果之前的同名 action 没有 scope 或 filter 为空
        if (!existedScope || !existedScope.get('filter') || !Object.keys(existedScope.get('filter')).length) {
          actionsMap.set(action.name, action);
          return;
        }
  
        const newScope = action.get('scope');
        // 如果新 action 没有 scope 或 filter 为空
        if (!newScope || !newScope.get('filter') || !Object.keys(newScope.get('filter')).length) {
          return;
        }
  
        // 以 or 关心合并两个 scope 中的 filter
        existedScope.set('filter', { [Op.or]: [existedScope.get('filter'), newScope.get('filter')] });
      });
    });

    return Array.from(actionsMap.values());
  }
  
  static getFieldPermissions(permissions) {
    const fieldsMap = new Map<string, any>();
    permissions.forEach(permission => {
      permission.get('fields_permissions').forEach(field => {
        if (!fieldsMap.has(field.field.name)) {
          fieldsMap.set(field.field.name, field);
          return;
        }
  
        const existedActions = fieldsMap.get(field.field.name).get('actions');
        if (!existedActions || !existedActions.length) {
          fieldsMap.set(field.field.name, field);
          return;
        }
  
        const newActions = field.get('actions');
        if (!newActions || !newActions.length) {
          return;
        }
  
        const actions = new Set(existedActions);
        newActions.forEach(item => actions.add(item));
        fieldsMap.get(field.field.name).set('actions', Array.from(actions));
      });
    });

    return Array.from(fieldsMap.values());
  }

  static getTabPemissions(permissions) {
    const tabs = new Set();
    permissions.forEach(permission => {
      permission.get('tabs_permissions').forEach(tab => tabs.add(tab.id));
    });

    return Array.from(tabs);
  }

  context;

  resourceName: string;
  actionName: string;

  constructor(ctx) {
    this.context = ctx;
  }

  can = (resourceName) => {
    this.resourceName = resourceName;
    return this;
  };

  act(name) {
    this.actionName = name;
    return this;
  }

  async permissions(): Promise<CollectionPermissions> {
    const roles = await this.getRolesWithPermissions();
    if (roles.some(role => role.type === ROLE_TYPE_ROOT)) {
      return this.getRootPermissions();
    }

    const permissions = AccessController.getPermissions(roles);
    
    return {
      actions: AccessController.getActionPermissions(permissions),
      fields: AccessController.getFieldPermissions(permissions),
      tabs: AccessController.getTabPemissions(permissions)
    };
  }

  async any(): Promise<PermissionParams> {
    const roles = await this.getRolesWithPermissions();
    if (roles.some(role => role.type === ROLE_TYPE_ROOT)) {
      return true;
    }
    // 只处理 actions 表里的权限，其余跳过
    const getActionNames = await this.getActionNames();
    if (!getActionNames.includes(this.actionName)) {
      console.log(`skip ${this.resourceName}:${this.actionName}`);
      return true;
    }
    const permissions = AccessController.getPermissions(roles);
    const actionPermissions = AccessController.getActionPermissions(permissions);

    if (!actionPermissions.length) {
      // 如果找不到可用的 action 记录
      // 则认为没有权限
      return null;
    }
    
    const filters = actionPermissions
      .filter(item => Boolean(item.scope) && Object.keys(item.scope.filter).length)
      .map(item => item.scope.filter);

    const fields = AccessController.getFieldPermissions(permissions);

    return {
      filter: filters.length
        ? filters.length > 1 ? { or: filters } : filters[0]
        : {},
      fields
    };
  }
  
  async one(resourceKey): Promise<PermissionParams> {
    const any = await this.any();

    if (!any || any === true) {
      return any;
    }

    const { filter } = any;

    const Collection = this.context.db.getModel(this.resourceName);
    const existed = await Collection.count({
      where: {
        ...filter,
        [Collection.primaryKeyAttribute]: resourceKey
      }
    });

    return existed ? any : null;
  }

  async getRolesWithPermissions() {
    const { context, resourceName, actionName = null } = this;
    if (!resourceName) {
      throw new Error('resource name must be set first by can(resourceName)');
    }
    const Role = context.db.getModel('roles');
    const permissionInclusion = {
      association: 'permissions',
      where: {
        collection_name: resourceName
      },
      required: true,
      include: [
        {
          association: 'actions',
          where: actionName ? {
            name: `${resourceName}:${actionName}`
          } : {},
          required: true,
          // 对 hasMany 关系可以进行拆分查询，避免联表过多标识符超过 PG 的 64 字符限制
          separate: true,
          include: [
            {
              association: 'scope'
            }
          ]
        },
        {
          association: 'fields_permissions',
          include: [
            {
              association: 'field'
            }
          ],
          separate: true,
        },
        {
          association: 'tabs_permissions',
          separate: true,
        }
      ],
    };
    
    let userRoles = [];
    // 获取登入用户的角色及权限
    const { currentUser } = context.state;
    if (currentUser) {
      const rootRoles = await currentUser.getRoles({
        where: {
          type: ROLE_TYPE_ROOT
        }
      });
      if (rootRoles.length) {
        return rootRoles;
      }

      userRoles = await currentUser.getRoles({
        where: {
          type: ROLE_TYPE_USER
        },
        include: [
          permissionInclusion
        ]
      });
    }

    // 获取匿名用户的角色及权限
    const anonymousRoles = await Role.findAll({
      where: {
        type: ROLE_TYPE_ANONYMOUS
      },
      include: [
        permissionInclusion
      ]
    });

    return [...anonymousRoles, ...userRoles];
  }

  async getActionNames() {
    const { context, resourceName = null } = this;
    const Action = context.db.getModel('actions');
    const actions = await Action.findAll({
      where: {
        collection_name: { [Op.or]: [resourceName, null] }
      }
    });
    return actions.map(action => action.name);
  }

  async getRootPermissions(): Promise<CollectionPermissions> {
    const { context, resourceName = null } = this;
    const Action = context.db.getModel('actions');
    const actions = await Action.findAll({
      where: {
        collection_name: { [Op.or]: [resourceName, null] }
      }
    });

    const Field = context.db.getModel('fields');
    const fields = await Field.findAll({
      where: {
        collection_name: resourceName
      }
    });

    const Tab = context.db.getModel('tabs');
    const tabs = await Tab.findAll({
      where: {
        collection_name: resourceName
      },
      attribute: [Tab.primaryKeyAttribute]
    });

    const actionsNames = actions.map(action => ({
      name: `${resourceName}:${action.name}`
    }));

    return {
      actions: actionsNames,
      fields: fields.map(field => ({
        field,
        field_id: field.id,
        actions: actionsNames.map(({ name }) => name)
      })),
      tabs: tabs.map(tab => tab[Tab.primaryKeyAttribute])
    }
  }
}
