/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ArrayFieldRepository,
  BelongsToManyRepository,
  HasManyRepository,
  MultipleRelationRepository,
} from '@nocobase/database';
import { Context } from '..';
import { getRepositoryFromParams } from '../utils';

export async function add(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);

  if (
    !(
      repository instanceof MultipleRelationRepository ||
      repository instanceof HasManyRepository ||
      repository instanceof ArrayFieldRepository
    )
  ) {
    return await next();
  }
  const filterByTk = ctx.action.params.filterByTk || ctx.action.params.filterByTks || ctx.action.params.values;

  await (<HasManyRepository | BelongsToManyRepository>repository).add(filterByTk);

  ctx.status = 200;

  await next();
}
