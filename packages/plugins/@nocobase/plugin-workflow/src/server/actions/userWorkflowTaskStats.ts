/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';

type WorkflowStats = {
  workflowKey: string;
  stats: {
    pending: number;
    all: number;
  };
};

export async function listMine(context: Context, next) {
  const repository = context.db.getRepository('userWorkflowTaskStats');
  const rows = await repository.find({
    filter: {
      userId: context.state.currentUser.id,
    },
    fields: ['workflowKey', 'pending', 'all'],
  });
  const statsMap = new Map<string, WorkflowStats>();

  for (const row of rows) {
    if (!row.workflowKey) {
      continue;
    }
    const existed = statsMap.get(row.workflowKey) ?? {
      workflowKey: row.workflowKey,
      stats: { pending: 0, all: 0 },
    };
    existed.stats.pending += Number(row.pending) || 0;
    existed.stats.all += Number(row.all) || 0;
    statsMap.set(row.workflowKey, existed);
  }

  const data = Array.from(statsMap.values()).sort((a, b) => a.workflowKey.localeCompare(b.workflowKey));
  context.body = {
    count: data.length,
    rows: data,
  };

  await next();
}
