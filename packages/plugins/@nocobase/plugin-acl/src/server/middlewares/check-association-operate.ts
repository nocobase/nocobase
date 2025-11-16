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

export async function checkAssociationOperate(ctx: Context, next: Next) {
  const { actionName, resourceName } = ctx.action;
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
  ctx.permission = {
    ...ctx.permission,
    skip: true,
  };
  await next();
}
