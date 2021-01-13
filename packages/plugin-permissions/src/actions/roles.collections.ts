import { actions } from '@nocobase/actions';

export async function list(ctx: actions.Context, next: actions.Next) {
  // TODO: 暂时 action 中间件就这么写了
  ctx.action.mergeParams({associated: null});
  return actions.common.list(ctx, next);
}

export async function get(ctx: actions.Context, next: actions.Next) {
  const {
    resourceKey,
    associated
  } = ctx.action.params;

  const [permission] = await associated.getPermissions({
    where: {
      collection_name: resourceKey
    },
    include: [
      {
        association: 'actions_permissions',
        // 对 hasMany 关系可以进行拆分查询，避免联表过多标识符超过 PG 的 64 字符限制
        separate: true,
        include: [
          {
            association: 'scope',
            attribute: ['filter']
          },
        ]
      },
      {
        association: 'fields_permissions',
        separate: true,
      }
    ],
    limit: 1
  });
  
  const result = permission
    ? {
      actions: permission.actions_permissions || [],
      fields: permission.fields_permissions || [],
      tabs: permission.tabs_permissions || [],
    }
    : {
      actions: [],
      fields: [],
      tabs: []
    };

  ctx.body = result;

  await next();
}

export async function update(ctx: actions.Context, next: actions.Next) {
  const {
    resourceKey,
    associated,
    values
  } = ctx.action.params;

  let [permission] = await associated.getPermissions({
    where: {
      collection_name: resourceKey
    }
  });
  if (!permission) {
    permission = await associated.createPermission({
      collection_name: resourceKey,
      description: values.description
    });
  } else {
    await permission.update({ description: values.description });
  }

  await permission.updateAssociations({
    actions_permissions: values.actions,
    fields_permissions: values.fields,
    tabs: values.tabs
  });

  ctx.body = permission;
  await next();
}
