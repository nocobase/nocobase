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

export async function renderSqlBlock(ctx: FlowCtx) {
  if (ctx.flowSettingsEnabled) {
    await ctx.sql.save({
      uid: ctx.model.uid,
      sql: 'select * from users where id = {{ctx.user.id}}',
      dataSourceKey: 'main',
    });
  }

  ctx.useResource('SQLResource');
  ctx.resource.setDataSourceKey('main');
  ctx.resource.setFilterByTk(ctx.model.uid);
  await ctx.resource.refresh();

  ctx.element.innerHTML = `<pre>${JSON.stringify(ctx.resource.getData(), null, 2)}</pre>`;
}
