/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '../index';
import { getRepositoryFromParams } from '../utils';

export async function upsert(ctx: Context, next: () => Promise<any>) {
  const repository = getRepositoryFromParams(ctx);

  // 从 params.values 中获取 filterKeys 和 values
  // 请求体结构: { filterKeys: [...], values: {...} }
  const paramsValues = ctx.action.params.values || {};
  const { filterKeys, values, ...rest } = paramsValues;

  const [instance, created] = await repository.upsert({
    filterKeys,
    values,
    context: ctx,
    ...rest,
  });

  ctx.body = {
    data: instance,
    meta: {
      created,
    },
  };

  ctx.status = 200;
  await next();
}
