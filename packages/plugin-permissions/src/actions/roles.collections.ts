import { Op } from 'sequelize';
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
        association: 'actions',
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
      actions: permission.actions || [],
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

  // role.getPermissions
  let [permission] = await associated.getPermissions({
    where: {
      collection_name: resourceKey
    }
  });

  if (!permission) {
    // 不存在则创建
    permission = await associated.createPermission({
      collection_name: resourceKey,
      description: values.description
    });
  } else {
    // 存在则更新描述
    await permission.update({ description: values.description });
  }

  // 查找对应 collection 下所有“可用”的 actions
  const ActionModel = ctx.db.getModel('actions');
  const availableActions = await ActionModel.findAll({
    where: {
      // null 代表全局 action
      collection_name: {
        [Op.or]: [resourceKey, null]
      },
      ...(ctx.state.developerMode ? {} : { developerMode: false })
    }
  });

  // 需要移除的 = 所有可用的 - 要添加的
  const toRemoveActionNames = new Set<string>();
  availableActions.forEach(action => {
    const name = `${action.collection_name || resourceKey}:${action.name}`;
    if (!values.actions.find(item => item.name === name)) {
      toRemoveActionNames.add(name);
    }
  });

  // 移除没有设置的
  // 因为只知道 name（不知道 id），所以只能从 Model 上调用移除
  const ActionPermission = ctx.db.getModel('actions_permissions');
  await ActionPermission.destroy({
    where: {
      permission_id: permission.id,
      name: Array.from(toRemoveActionNames)
    }
  });
  // 更新或创建
  const existedActions = await permission.getActions();
  for (const actionItem of values.actions) {
    const action = existedActions.find(item => item.name === actionItem.name);
    if (action) {
      await action.update(actionItem);
    } else {
      await permission.createAction(actionItem);
    }
  };

  const FieldModel = ctx.db.getModel('fields');
  const availableFields = await FieldModel.findAll({
    where: {
      collection_name: resourceKey,
      ...(ctx.state.developerMode ? {} : { developerMode: false })
    }
  });

  const toRemoveFieldIds = [];
  availableFields.forEach(field => {
    if (!values.fields.find(item => item.field_id === field[FieldModel.primaryKeyAttribute])) {
      toRemoveFieldIds.push(field[FieldModel.primaryKeyAttribute]);
    }
  });

  await permission.removeFields(toRemoveFieldIds);

  const existedFields = await permission.getFields_permissions();
  for (const fieldItem of values.fields) {
    const field = existedFields.find(item => item.field_id === fieldItem.field_id);
    if (field) {
      await field.update(fieldItem);
    } else {
      await permission.createFields_permission(fieldItem);
    }
  }

  ctx.body = permission;

  await next();
}
