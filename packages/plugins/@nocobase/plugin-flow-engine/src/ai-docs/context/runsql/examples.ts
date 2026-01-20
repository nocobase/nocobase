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

export async function selectRows(ctx: FlowCtx) {
  return ctx.runsql({
    uid: 'list-users',
    sql: 'SELECT * FROM users WHERE age > $age',
    bind: { age: 30 },
    type: 'selectRows',
  });
}

export async function selectRow(ctx: FlowCtx, userId: number) {
  return ctx.runsql({
    uid: 'get-user',
    type: 'selectRow',
    sql: 'SELECT * FROM users WHERE id = $userId',
    bind: { userId },
  });
}

export async function selectVar(ctx: FlowCtx) {
  return ctx.runsql({
    uid: 'count-users',
    type: 'selectVar',
    sql: 'SELECT COUNT(id) FROM users',
  });
}

export async function selectWithFilter(ctx: FlowCtx) {
  return ctx.runsql({
    uid: 'filter-users',
    sql: 'SELECT * FROM users',
    filter: { status: 'active' },
  });
}
