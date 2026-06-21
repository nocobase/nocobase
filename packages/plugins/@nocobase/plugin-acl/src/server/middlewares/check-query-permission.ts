/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Next } from '@nocobase/actions';
import { NoPermissionError } from '@nocobase/acl';
import { applyQueryPermission } from '../query/apply-query-permission';

export async function checkQueryPermission(ctx, next: Next) {
  const query: Record<string, any> = { ...ctx.action.params.values };

  try {
    const result = await applyQueryPermission({
      acl: ctx.acl,
      db: ctx.database,
      resourceName: ctx.action.resourceName,
      query,
      currentUser: ctx.state?.currentUser,
      currentRole: ctx.state?.currentRole,
      currentRoles: ctx.state?.currentRoles,
      timezone: ctx.get?.('x-timezone'),
      state: ctx.state,
    });

    ctx.action.params = {
      ...ctx.action.params,
      values: result.query,
    };
  } catch (error) {
    if (error instanceof NoPermissionError) {
      ctx.throw(403, 'No permissions');
    }
    throw error;
  }

  await next();
}
