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
            association: 'scope'
          }
        ]
      },
      {
        association: 'fields_permissions',
        separate: true,
      },
      {
        association: 'tabs_permissions',
        separate: true,
      }
    ],
    distinct: true,
    limit: 1
  });
  
  const result = permission
    ? {
      actions: permission.actions || [],
      fields: permission.fields_permissions || [],
      tabs: (permission.tabs_permissions || []).map(item => item.tab_id),
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

  const transaction = await ctx.db.sequelize.transaction();

  // role.getPermissions
  let [permission] = await associated.getPermissions({
    where: {
      collection_name: resourceKey
    },
    transaction
  });

  if (!permission) {
    // 不存在则创建
    permission = await associated.createPermission({
      collection_name: resourceKey,
      description: values.description
    }, { transaction });
  } else {
    // 存在则更新描述
    await permission.update({ description: values.description }, { transaction });
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
    },
    transaction
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
    },
    transaction
  });
  // 更新或创建
  const existedActions = await permission.getActions({ transaction });
  for (const actionItem of values.actions) {
    const action = existedActions.find(item => item.name === actionItem.name);
    if (action) {
      await action.update(actionItem, { transaction });
    } else {
      await permission.createAction(actionItem, { transaction });
    }
  };

  const FieldModel = ctx.db.getModel('fields');
  const existedFields = await permission.getFields({ transaction });
  const toRemoveFieldIds = existedFields.filter(field => (
    !values.fields.find(({ field_id }) => field_id === field[FieldModel.primaryKeyAttribute])
    && !(field.developerMode ^ ctx.state.developerMode)
  ));
  if (toRemoveFieldIds.length) {
    await permission.removeFields(toRemoveFieldIds, { transaction });
  }
  for (const fieldItem of values.fields) {
  const FieldModel = ctx.db.getModel('fields');
    const field = existedFields.find(item => item[FieldModel.primaryKeyAttribute] === fieldItem.field_id);
    if (field) {
      await field.update(fieldItem, { transaction });
    } else {
      await permission.createFields_permission(fieldItem, { transaction });
    }
  }

  const TabModel = ctx.db.getModel('tabs');
  const existedTabs = await permission.getTabs({ transaction });
  const toRemoveTabs = existedTabs.filter(tab => (
    // 如果没找到
    !values.tabs.find(id => tab[TabModel.primaryKeyAttribute] === id)
      // 且开发者模式匹配
      && !(tab.developerMode ^ ctx.state.developerMode)));
  await permission.removeTabs(toRemoveTabs, { transaction });
  await permission.addTabs(values.tabs, { transaction });

  await transaction.commit();

  ctx.body = permission;

  await next();
}
