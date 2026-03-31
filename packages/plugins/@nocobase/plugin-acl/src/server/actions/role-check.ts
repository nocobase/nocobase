/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { mergeRole } from '@nocobase/acl';
import { SystemRoleMode } from '../enum';

const map2obj = (map: Map<string, string>) => {
  const obj = {};
  for (const [key, value] of map) {
    obj[key] = value;
  }
  return obj;
};

export async function checkAction(ctx, next) {
  const currentRoles = ctx.state.currentRoles;

  const roleInstances = await ctx.db.getRepository('roles').find({
    filter: {
      name: currentRoles,
    },
    appends: ['menuUiSchemas'],
  });

  if (!roleInstances.length) {
    throw new Error(`Role ${currentRoles} not exists`);
  }

  const anonymous = await ctx.db.getRepository('roles').findOne({
    filter: {
      name: 'anonymous',
    },
  });

  let roles = ctx.app.acl.getRoles(currentRoles);

  if (!roles.length) {
    await Promise.all(roleInstances.map((x) => ctx.app.emitAsync('acl:writeRoleToACL', x)));
    roles = ctx.app.acl.getRoles(currentRoles);
  }

  const availableActions = ctx.app.acl.getAvailableActions();
  const role = mergeRole(roles);
  const allowMenuItemIds = roleInstances.flatMap((roleInstance) =>
    roleInstance.get('menuUiSchemas').map((uiSchema) => uiSchema.get('x-uid')),
  );
  let uiButtonSchemasBlacklist = [];
  const currentRole = ctx.state.currentRole;
  if (!currentRoles.includes('root')) {
    const eqCurrentRoleList = await ctx.db
      .getRepository('uiButtonSchemasRoles')
      .find({
        filter: { roleName: currentRoles },
      })
      .then((list) => list.map((v) => v.uid));

    const NECurrentRoleList = await ctx.db
      .getRepository('uiButtonSchemasRoles')
      .find({
        filter: { 'roleName.$notIn': currentRoles },
      })
      .then((list) => list.map((v) => v.uid));
    uiButtonSchemasBlacklist = NECurrentRoleList.filter((uid) => !eqCurrentRoleList.includes(uid));
  }
  const systemSettings = await ctx.db.getRepository('systemSettings').findOne();
  const roleMode = systemSettings?.get('roleMode') || SystemRoleMode.default;

  ctx.body = {
    ...role,
    role: currentRole,
    roleMode,
    availableActions: [...availableActions.keys()],
    actionAlias: map2obj(ctx.app.acl.actionAlias),
    allowAll: !!currentRoles.includes('root'),
    allowConfigure: !!roleInstances.find((x) => x.get('allowConfigure')),
    allowMenuItemIds: [...new Set(allowMenuItemIds)],
    allowAnonymous: !!anonymous,
    uiButtonSchemasBlacklist,
  };

  await next();
}
