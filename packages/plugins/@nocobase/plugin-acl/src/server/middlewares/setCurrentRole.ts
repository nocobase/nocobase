/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { Cache } from '@nocobase/cache';
import { Model, Repository } from '@nocobase/database';

export async function setCurrentRole(ctx: Context, next) {
  const currentRole = ctx.get('X-Role');

  if (currentRole === 'anonymous') {
    ctx.state.currentRole = currentRole;
    return next();
  }

  if (!ctx.state.currentUser) {
    return next();
  }

  const attachRoles = ctx.state.attachRoles || [];
  const cache = ctx.cache as Cache;
  const repository = ctx.db.getRepository('users.roles', ctx.state.currentUser.id) as unknown as Repository;
  const roles = (await cache.wrap(`roles:${ctx.state.currentUser.id}`, () =>
    repository.find({
      raw: true,
    }),
  )) as Model[];
  if (!roles.length && !attachRoles.length) {
    ctx.state.currentRole = undefined;
    return ctx.throw(401, {
      code: 'USER_HAS_NO_ROLES_ERR',
      message: ctx.t('The current user has no roles. Please try another account.', { ns: 'acl' }),
    });
  }
  // Merge the roles of the user and the roles from the departments of the user
  // And remove the duplicate roles
  const rolesMap = new Map();
  attachRoles.forEach((role: any) => rolesMap.set(role.name, role));
  roles.forEach((role: any) => rolesMap.set(role.name, role));
  const userRoles = Array.from(rolesMap.values());
  ctx.state.currentUser.roles = userRoles;

  let role: string | undefined;

  if (currentRole === '*') {
    role = currentRole;
  } else {
    // 1. If the X-Role is set, use the specified role
    if (currentRole) {
      role = userRoles.find((role) => role.name === currentRole)?.name;
      if (!role) {
        return ctx.throw(401, {
          code: 'ROLE_NOT_FOUND_FOR_USER',
          message: ctx.t('The role does not belong to the user', { ns: 'acl' }),
        });
      }
    }
    // 2. If the X-Role is not set, or the X-Role does not belong to the user, use the default role
    if (!role) {
      const defaultRole = userRoles.find((role) => role?.rolesUsers?.default);
      role = (defaultRole || userRoles[0])?.name;
    }
  }
  ctx.state.currentRole = role;
  if (!ctx.state.currentRole) {
    return ctx.throw(401, {
      code: 'ROLE_NOT_FOUND_ERR',
      message: ctx.t('The user role does not exist. Please try signing in again', { ns: 'acl' }),
    });
  }

  await next();
}
