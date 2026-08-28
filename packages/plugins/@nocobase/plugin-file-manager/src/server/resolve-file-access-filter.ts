/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NoPermissionError } from '@nocobase/acl';
import type { Context } from '@nocobase/actions';
import type { Collection } from '@nocobase/database';
import lodash from 'lodash';

export async function resolveFileAccessFilter(ctx: Context, collection: Collection, filter: object): Promise<object> {
  try {
    const permission = await ctx.dataSource.acl.resolveActionParams(ctx, {
      resourceName: collection.name,
      actionName: 'view',
      params: { filter },
    });
    const mergedParams = permission.mergedParams || { filter };
    return lodash.cloneDeep(mergedParams.filter || filter);
  } catch (error) {
    if (error instanceof NoPermissionError) {
      ctx.throw(403, 'No permissions');
    }
    throw error;
  }
}
