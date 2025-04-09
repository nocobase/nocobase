/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';

export async function link(ctx: Context, next) {
  const { values } = ctx.action.params;
  const repository = ctx.db.getRepository('blockTemplateLinks');
  await repository.create({
    values,
  });
  await next();
}
