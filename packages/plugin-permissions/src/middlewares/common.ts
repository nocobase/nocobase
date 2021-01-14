function getActionPermissions(roles) {
  const permissions = roles.reduce((permissions, role) => permissions.concat(role.get('permissions')), []);
  return permissions.reduce((actions, permission) => actions.concat(permission.get('actions')), []);
}

function getFieldPermissions(roles) {
  const permissions = roles.reduce((permissions, role) => permissions.concat(role.get('permissions')), []);
  return permissions.reduce((fields, permission) => fields.concat(permission.get('fields_permissions')), []);
}

async function getRolesWithPermissions(ctx) {
  // TODO: 还未定义关联数据的权限如何表达
  const {
    resourceName,
    associated,
    associatedName,
    associatedKey,
    actionName
  } = ctx.action.params;

  const Role = ctx.db.getModel('roles');
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
  const currentUser = this.getCurrentUser(ctx);
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

export default async function(ctx, next) {
  const {
    resourceName,
    actionName
  } = ctx.action.params;

  const roles = await getRolesWithPermissions.call(this, ctx);
  // 如果是系统管理员，则不进行其他验证或过滤
  if (roles.some(role => role.type === -1)) {
    return next();
  }
  const actionPermissions = getActionPermissions(roles);

  if (!actionPermissions.length) {
    return this.reject(ctx);
  }

  const filters = actionPermissions
    .filter(item => Boolean(item.scope) && Object.keys(item.scope.filter).length)
    .map(item => item.scope.filter);

  const fields = new Set();
  const fieldPermissions = getFieldPermissions(roles);
  fieldPermissions.forEach(item => {
    const actions = item.get('actions');
    if (actions && actions.includes(`${resourceName}:${actionName}`)) {
      fields.add(item.get('field').get('name'));
    }
  });

  ctx.action.mergeParams({
    ...(filters.length
      ? { filter: filters.length > 1 ? { or: filters } : filters[0] }
      : {}),
    fields: Array.from(fields)
  });

  return next();
}
