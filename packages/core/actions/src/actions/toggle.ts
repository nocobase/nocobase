/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BelongsToManyRepository } from '@nocobase/database';
import { Context } from '..';
import { getRepositoryFromParams } from '../utils';

export async function toggle(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);

  if (!(repository instanceof BelongsToManyRepository)) {
    return await next();
  }

  const filterByTk = ctx.action.params.filterByTk || ctx.action.params.filterByTks || ctx.action.params.values;

  await (<BelongsToManyRepository>repository).toggle(filterByTk);
  ctx.body = 'ok';
  await next();
}
