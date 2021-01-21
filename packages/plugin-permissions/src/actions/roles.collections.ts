import { Op } from 'sequelize';
import { actions } from '@nocobase/actions';

export async function list(ctx: actions.Context, next: actions.Next) {
  const { associated } = ctx.action.params;
  // TODO: 暂时 action 中间件就这么写了
  ctx.action.mergeParams({
    associated: null
  });
  await actions.common.list(ctx, async () => {
    const permissions = await associated.getPermissions();
    ctx.body.rows.forEach(item => {
      const permission = permissions.find(p => p.collection_name === item.get('name'));
      if (permission) {
        // item.permissions = [permission]; // 不输出
        item.set('permissions', [permission]); // 输出
      }
    });
    next();
  });
}

export async function get(ctx: actions.Context, next: actions.Next) {
  const {
    resourceKey,
    associated
  } = ctx.action.params;

  ctx.body = await ctx.ac.as(associated).can(resourceKey).permissions();

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

  const fieldsValue = values.fields.filter(field => field.actions && field.actions.length);
  const existedFields = await permission.getFields_permissions({
    include: [
      { association: 'field' }
    ],
    transaction
  });
  const toRemoveFields = [];
  const fieldsLeft = [];
  existedFields.forEach(field => {
    if (
      !fieldsValue.find(({ field_id }) => field_id === field.field_id)
      && !(field.field.developerMode ^ ctx.state.developerMode)
    ) {
      toRemoveFields.push(field.field);
    } else {
      fieldsLeft.push(field);
    }
  });
  if (toRemoveFields.length) {
    await permission.removeFields(toRemoveFields, { transaction });
  }
  for (const fieldItem of fieldsValue) {
    const field = fieldsLeft.find(item => item.field_id === fieldItem.field_id);
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
