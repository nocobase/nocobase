/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';

export async function saveSchema(ctx: Context, next) {
  const { filterByTk, values, removeParentsIfNoChildren, breakRemoveOn, position } = ctx.action.params;

  const repository = ctx.db.getRepository<UiSchemaRepository>('uiSchemas');
  const schema = values.schema;

  ctx.body = await repository.insertAdjacent(position, filterByTk, schema, {
    removeParentsIfNoChildren,
    breakRemoveOn,
    wrap: null,
  });

  await next();
}
