/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ACLRole } from '@nocobase/acl';
import type { Context, Next } from '@nocobase/actions';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';

export async function saveSchema(ctx: Context, next: Next) {
  const roles: ACLRole[] = ctx.app.acl.getRoles(ctx.state.currentRoles || [ctx.state.currentRole]);
  if (!roles.some((role) => role.name === 'root' || role.effectiveSnippets().allowed.includes('ui.uiSchemas'))) {
    ctx.throw(403);
  }

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
