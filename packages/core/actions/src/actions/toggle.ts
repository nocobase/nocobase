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

  await (<BelongsToManyRepository>repository).toggle(ctx.action.params.values);
  ctx.body = 'ok';
  await next();
}
