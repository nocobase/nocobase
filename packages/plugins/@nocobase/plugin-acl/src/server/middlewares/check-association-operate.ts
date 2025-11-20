/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACL, NoPermissionError } from '@nocobase/acl';
import { Context, Next } from '@nocobase/actions';

export async function checkAssociationOperate(ctx: Context, next: Next) {
  const { actionName, resourceName, sourceId } = ctx.action;
  if (!(resourceName.includes('.') && ['add', 'set', 'remove', 'toggle'].includes(actionName))) {
    return next();
  }
  const acl: ACL = ctx.acl;
  const roles = ctx.state.currentRoles;
  for (const role of roles) {
    const aclRole = acl.getRole(role);
    if (aclRole.snippetAllowed(`${resourceName}:${actionName}`)) {
      return next();
    }
  }
  const [resource, association] = resourceName.split('.');
  const result = ctx.can({
    roles,
    resource,
    action: 'update',
  });
  if (!result) {
    ctx.throw(403, 'No permissions');
  }
  const params = result.params || ctx.acl.fixedParamsManager.getParams(resourceName, actionName);
  if (params.whitelist && !params.whitelist?.includes(association)) {
    ctx.throw(403, 'No permissions');
  }
  if (params.filter) {
    try {
      const filteredParams = ctx.acl.filterParams(ctx, resource, params);
      const parsedParams = await ctx.acl.parseJsonTemplate(filteredParams, ctx);
      const repo = ctx.db.getRepository(resource);
      const record = await repo.findOne({
        filterByTk: sourceId,
        filter: parsedParams.filter,
      });
      if (!record) {
        ctx.throw(403, 'No permissions');
      }
    } catch (e) {
      if (e instanceof NoPermissionError) {
        ctx.throw(403, 'No permissions');
      }
      throw e;
    }
  }
  ctx.permission = {
    ...ctx.permission,
    skip: true,
  };
  await next();
}
