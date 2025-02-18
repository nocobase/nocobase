/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACLRole } from '@nocobase/acl';

const map2obj = (map: Map<string, string>) => {
  const obj = {};
  for (const [key, value] of map) {
    obj[key] = value;
  }
  return obj;
};

export async function checkAction(ctx, next) {
  const currentRole = ctx.state.currentRole;

  const anonymous = await ctx.db.getRepository('roles').findOne({
    filter: {
      name: 'anonymous',
    },
  });

  const aclRolesMap = ctx.app.acl.roles as Map<string, ACLRole>;
  const aclRoles = Array.from(aclRolesMap.values());

  let roleNames: string[] = [currentRole];

  if (!ctx.state.currentUser.id) {
    throw new Error('User session missed');
  }

  if (currentRole === '*') {
    const userRoles = await ctx.db.getRepository('rolesUsers').find({
      filter: {
        userId: ctx.state.currentUser.id,
      },
    });

    roleNames = userRoles.map((role) => role.get('roleName'));
  }

  const roleInstances = await ctx.db.getRepository('roles').find({
    filter: {
      name: {
        $in: roleNames,
      },
    },
    appends: ['menuUiSchemas'],
  });

  if (!roleInstances) {
    throw new Error(`Role ${currentRole} not exists`);
  }

  let role: ACLRole;

  if (currentRole === '*') {
    // todo: fix this
    const effectiveAclRoles = aclRoles.filter((role) => roleNames.includes(role.name));
    role = new ACLRole(ctx.app.acl, '*', effectiveAclRoles);
    role.setStrategy('');
  } else {
    role = ctx.app.acl.getRole(currentRole);
  }

  if (!role) {
    await ctx.app.emitAsync('acl:writeRoleToACL', roleInstances);
    role = ctx.app.acl.getRole(currentRole);
  }

  const availableActions = ctx.app.acl.getAvailableActions();

  ctx.body = {
    ...role.toJSON(),
    availableActions: [...availableActions.keys()],
    resources: [...role.resources.keys()],
    actionAlias: map2obj(ctx.app.acl.actionAlias),
    allowAll: roleNames.includes('root'),
    allowConfigure: roleInstances.map((role) => role.get('allowConfigure')),
    allowMenuItemIds: roleInstances.map((role) => role.get('menuUiSchemas').map((uiSchema) => uiSchema.get('x-uid'))),
    allowAnonymous: !!anonymous,
  };

  await next();
}
