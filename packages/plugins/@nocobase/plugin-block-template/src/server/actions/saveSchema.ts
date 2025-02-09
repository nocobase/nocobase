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
  const { resourceIndex, values, removeParentsIfNoChildren, breakRemoveOn, position } = ctx.action.params;

  const repository = ctx.db.getRepository<UiSchemaRepository>('uiSchemas');

  const { schema, wrap = null } = values.schema ? values : { schema: values, wrap: null };

  // insertAdjacent 和 patch 均无法更新父节点对应的key， 会造成节点信息存储到错误的节点上
  // 因此先删除该节点，再插入新节点
  await repository.remove(schema['x-uid']);

  ctx.body = await repository.insertAdjacent(position, resourceIndex, schema, {
    removeParentsIfNoChildren,
    breakRemoveOn,
    wrap,
  });

  await next();
}
