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
import { Repository } from '@nocobase/database';
import { getAuthCookieName, getAuthCookieOptions } from '@nocobase/utils';
import { UNION_ROLE_KEY } from '../constants';
import { SystemRoleMode } from '../enum';
import _ from 'lodash';

type RoleRecord = {
  name: string;
};

type SystemSettingsRecord = {
  roleMode?: SystemRoleMode;
};

export async function setCurrentRole(ctx: Context, next) {
  const headerRole = ctx.get('X-Role');
  const roleCookieName = getAuthCookieName('role', ctx.app?.name);
  const cookieRole = headerRole ? null : ctx.cookies?.get(roleCookieName);
  let currentRole = headerRole || cookieRole;
  const currentRoleFromCookie = !!cookieRole && !headerRole;

  if (currentRole === 'anonymous') {
    ctx.state.currentRole = currentRole;
    return next();
  }

  if (!ctx.state.currentUser) {
    return next();
  }

  const attachRoles = (ctx.state.attachRoles || []) as RoleRecord[];
  const cache = ctx.cache as Cache;
  const mainDb = ctx.app?.db || ctx.db;
  const repository = mainDb?.getRepository?.('users.roles', ctx.state.currentUser.id) as Repository | undefined;
  if (!repository) {
    return next();
  }
  const roles = (await cache.wrap(`roles:${ctx.state.currentUser.id}`, () =>
    repository.find({
      raw: true,
    }),
  )) as RoleRecord[];
  if (!roles.length && !attachRoles.length) {
    ctx.state.currentRole = undefined;
    return ctx.throw(401, {
      code: 'USER_HAS_NO_ROLES_ERR',
      message: ctx.t('The current user has no roles. Please try another account.', { ns: 'acl' }),
    });
  }
  // Merge the roles of the user and the roles from the departments of the user
  // And remove the duplicate roles
  const rolesMap = new Map<string, RoleRecord>();
  attachRoles.forEach((role) => rolesMap.set(role.name, role));
  roles.forEach((role) => rolesMap.set(role.name, role));
  const userRoles = Array.from(rolesMap.values());
  ctx.state.currentUser.roles = userRoles;
  const systemSettings = (await cache.wrap(`app:systemSettings`, () =>
    mainDb.getRepository('systemSettings').findOne({ raw: true }),
  )) as SystemSettingsRecord;
  const roleMode = systemSettings?.roleMode || SystemRoleMode.default;
  if ([currentRole, ctx.state.currentRole].includes(UNION_ROLE_KEY) && roleMode === SystemRoleMode.default) {
    currentRole = userRoles[0].name;
    ctx.state.currentRole = userRoles[0].name;
    ctx.headers['x-role'] = userRoles[0].name;
  } else if (roleMode === SystemRoleMode.onlyUseUnion) {
    ctx.state.currentRole = UNION_ROLE_KEY;
    ctx.headers['x-role'] = UNION_ROLE_KEY;
    ctx.state.currentRoles = userRoles.map((role) => role.name);
    return next();
  }

  if (currentRole === UNION_ROLE_KEY) {
    ctx.state.currentRole = UNION_ROLE_KEY;
    ctx.state.currentRoles = userRoles.map((role) => role.name);
    return next();
  }

  let role: string | undefined;
  // 1. If the X-Role is set, use the specified role
  if (currentRole) {
    role = userRoles.find((role) => role.name === currentRole)?.name;
    if (!role) {
      if (currentRoleFromCookie) {
        ctx.cookies?.set(roleCookieName, null, getAuthCookieOptions(ctx, false));
        currentRole = undefined;
      } else {
        return ctx.throw(401, {
          code: 'ROLE_NOT_FOUND_FOR_USER',
          message: ctx.t('The role does not belong to the user', { ns: 'acl' }),
        });
      }
    }
  }
  // 2. If the X-Role is not set, or the X-Role does not belong to the user, use the default role
  if (!role) {
    const defaultRoleModel = await cache.wrapWithCondition(
      `roles:${ctx.state.currentUser.id}:defaultRole`,
      () => mainDb.getRepository('rolesUsers').findOne({ where: { userId: ctx.state.currentUser.id, default: true } }),
      {
        isCacheable: (x) => !_.isEmpty(x),
      },
    );
    role = defaultRoleModel?.roleName || userRoles[0]?.name;
  }
  ctx.state.currentRole = role;
  ctx.state.currentRoles = role === UNION_ROLE_KEY ? userRoles.map((role) => role.name) : [role];
  if (currentRoleFromCookie && role) {
    ctx.cookies?.set(roleCookieName, role, getAuthCookieOptions(ctx, false));
  }
  if (!ctx.state.currentRoles.length) {
    return ctx.throw(401, {
      code: 'ROLE_NOT_FOUND_ERR',
      message: ctx.t('The user role does not exist. Please try signing in again', { ns: 'acl' }),
    });
  }

  await next();
}
