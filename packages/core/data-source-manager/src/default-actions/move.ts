/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';

export function createMoveAction(databaseMoveAction) {
  return async function move(ctx: Context, next) {
    const repository = ctx.getCurrentRepository();

    if (repository.move) {
      ctx.body = await repository.move(ctx.action.params);
      await next();
      return;
    }

    if (repository.database) {
      ctx.databaseRepository = repository;
      return databaseMoveAction(ctx, next);
    }

    throw new Error(`Repository can not handle action move for ${ctx.action.resourceName}`);
  };
}
