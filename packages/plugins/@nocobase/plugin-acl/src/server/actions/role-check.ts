/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const map2obj = (map: Map<string, string>) => {
  const obj = {};
  for (const [key, value] of map) {
    obj[key] = value;
  }
  return obj;
};

export async function checkAction(ctx, next) {
  const currentRole = ctx.state.currentRole;

  const roleInstance = await ctx.db.getRepository('roles').findOne({
    filter: {
      name: currentRole,
    },
    appends: ['menuUiSchemas'],
  });

  if (!roleInstance) {
    throw new Error(`Role ${currentRole} not exists`);
  }

  const anonymous = await ctx.db.getRepository('roles').findOne({
    filter: {
      name: 'anonymous',
    },
  });

  let role = ctx.app.acl.getRole(currentRole);

  if (!role) {
    await ctx.app.emitAsync('acl:writeRoleToACL', roleInstance);
    role = ctx.app.acl.getRole(currentRole);
  }

  const availableActions = ctx.app.acl.getAvailableActions();
  let uiButtonSchemasBlacklist = [];
  if (currentRole !== 'root') {
    const eqCurrentRoleList = await ctx.db
      .getRepository('uiButtonSchemasRoles')
      .find({
        filter: { 'roleName.$eq': currentRole },
      })
      .then((list) => list.map((v) => v.uid));

    const NECurrentRoleList = await ctx.db
      .getRepository('uiButtonSchemasRoles')
      .find({
        filter: { 'roleName.$ne': currentRole },
      })
      .then((list) => list.map((v) => v.uid));
    uiButtonSchemasBlacklist = NECurrentRoleList.filter((uid) => !eqCurrentRoleList.includes(uid));
  }

  ctx.body = {
    ...role.toJSON(),
    availableActions: [...availableActions.keys()],
    resources: [...role.resources.keys()],
    actionAlias: map2obj(ctx.app.acl.actionAlias),
    allowAll: currentRole === 'root',
    allowConfigure: roleInstance.get('allowConfigure'),
    allowMenuItemIds: roleInstance.get('menuUiSchemas').map((uiSchema) => uiSchema.get('x-uid')),
    allowAnonymous: !!anonymous,
    uiButtonSchemasBlacklist,
  };

  await next();
}
