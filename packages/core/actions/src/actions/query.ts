/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '..';

function getQueryParams(ctx: Context) {
  return { ...ctx.action.params.values };
}

export async function query(ctx: Context, next) {
  if (ctx.action.sourceId) {
    ctx.throw(400, 'Query action does not support association resources');
  }

  const repository = ctx.db.getRepository(ctx.action.resourceName) as any;
  ctx.body = await repository.query({
    context: ctx,
    ...getQueryParams(ctx),
    timezone: ctx.get?.('x-timezone'),
  });
  await next();
}
