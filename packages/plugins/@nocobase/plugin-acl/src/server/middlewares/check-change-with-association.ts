/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACL, createUserProvider } from '@nocobase/acl';
import { Context, Next } from '@nocobase/actions';
import _ from 'lodash';

export const checkChangesWithAssociation = async (ctx: Context, next: Next) => {
  const timezone =
    ctx.request?.get?.('x-timezone') ?? ctx.request?.header?.['x-timezone'] ?? ctx.req?.headers?.['x-timezone'];
  const { resourceName, actionName } = ctx.action;
  if (!['create', 'firstOrCreate', 'updateOrCreate', 'update'].includes(actionName)) {
    return next();
  }
  if (ctx.permission?.skip) {
    return next();
  }
  const roles = ctx.state.currentRoles;
  if (roles.includes('root')) {
    return next();
  }
  const acl: ACL = ctx.acl;
  for (const role of roles) {
    const aclRole = acl.getRole(role);
    if (aclRole.snippetAllowed(`${resourceName}:${actionName}`)) {
      return next();
    }
  }

  const params = ctx.action.params || {};
  const rawValues = params.values;
  if (_.isEmpty(rawValues)) {
    return next();
  }

  const protectedKeys = ['firstOrCreate', 'updateOrCreate'].includes(actionName) ? params.filterKeys || [] : [];
  const processed = await ctx.acl.sanitizeAssociationValues({
    db: ctx.db,
    database: ctx.database,
    timezone,
    userProvider: createUserProvider({
      db: ctx.db,
      currentUser: ctx.state?.currentUser,
    }),
    resourceName,
    actionName,
    values: rawValues,
    updateAssociationValues: params.updateAssociationValues || [],
    protectedKeys,
    roles,
    currentRole: ctx.state.currentRole,
    currentUser: ctx.state.currentUser,
    aclParams: ctx.permission?.can?.params,
  });
  ctx.action.params.values = processed;
  await next();
};
