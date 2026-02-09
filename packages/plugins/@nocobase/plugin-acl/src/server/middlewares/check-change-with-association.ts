/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACL } from '@nocobase/acl';
import { Context, Next } from '@nocobase/actions';
import _ from 'lodash';

export const checkChangesWithAssociation = async (ctx: Context, next: Next) => {
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
  const processed = await ctx.acl.sanitizeAssociationValues(ctx, {
    resourceName,
    actionName,
    values: rawValues,
    updateAssociationValues: params.updateAssociationValues || [],
    protectedKeys,
  });
  ctx.action.params.values = processed;
  await next();
};
