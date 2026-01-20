/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';

type FlowCtx = FlowModel['context'];

export async function runInlineQuery(ctx: FlowCtx) {
  return ctx.sql.run('SELECT * FROM users WHERE status = $status', {
    status: 'active',
  });
}

export async function saveSqlSnippet(ctx: FlowCtx) {
  await ctx.sql.save({
    uid: 'list-active-users',
    title: 'List Active Users',
    sql: 'SELECT * FROM users WHERE status = $status',
  });
}

export async function runById(ctx: FlowCtx) {
  return ctx.sql.runById('list-active-users', {
    status: 'active',
  });
}

export async function destroySqlSnippet(ctx: FlowCtx) {
  await ctx.sql.destroy('list-active-users');
}
