/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parseFilter } from '@nocobase/utils';
import { createContextVariablesScope } from '../helper';

export async function parseVariables(ctx, next) {
  const filter = ctx.action.params.filter;
  if (!filter) {
    return next();
  }
  ctx.action.params.filter = await parseFilter(filter, createContextVariablesScope(ctx));
  await next();
}
