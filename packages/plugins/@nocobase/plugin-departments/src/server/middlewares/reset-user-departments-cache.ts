/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Context, Next } from '@nocobase/actions';
import { Cache } from '@nocobase/cache';

export const resetUserDepartmentsCache = async (ctx: Context, next: Next) => {
  await next();
  const { associatedName, resourceName, associatedIndex, actionName, values } = ctx.action.params;
  const cache = ctx.app.cache as Cache;
  if (
    associatedName === 'departments' &&
    resourceName === 'members' &&
    ['add', 'remove', 'set'].includes(actionName) &&
    values?.length
  ) {
    // Delete cache when the members of a department changed
    for (const memberId of values) {
      await cache.del(`departments:${memberId}`);
    }
  }

  if (associatedName === 'users' && resourceName === 'departments' && ['add', 'remove', 'set'].includes(actionName)) {
    await cache.del(`departments:${associatedIndex}`);
  }
};
