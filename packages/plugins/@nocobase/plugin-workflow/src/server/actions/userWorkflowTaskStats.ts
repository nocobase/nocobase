/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, utils } from '@nocobase/actions';

type WorkflowStats = {
  workflowKey: string;
  title?: string;
  stats: {
    pending: number;
    all: number;
  };
};

export async function listMine(context: Context, next) {
  const { type, search } = context.action.params;
  const normalizedSearch = typeof search === 'string' ? search.trim() : '';
  const page = Math.max(Number.parseInt(String(context.action.params.page ?? 1), 10) || 1, 1);
  const pageSize = Math.min(
    Math.max(Number.parseInt(String(context.action.params.pageSize ?? 200), 10) || 200, 1),
    200,
  );
  const pagination = utils.pageArgsToLimitArgs(page, pageSize);
  const repository = context.db.getRepository('userWorkflowTaskStats');
  const rows = await repository.find({
    filter: {
      userId: context.state.currentUser.id,
      ...(type ? { type } : {}),
      all: {
        $gt: 0,
      },
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

  const workflowKeys = Array.from(statsMap.keys());
  if (!workflowKeys.length) {
    context.body = {
      rows: [],
      page,
      pageSize,
      hasNext: false,
    };
    await next();
    return;
  }

  const workflows = await context.db.getRepository('workflows').find({
    filter: {
      key: workflowKeys,
      current: true,
      ...(normalizedSearch
        ? {
            title: {
              $includes: normalizedSearch,
            },
          }
        : {}),
    },
    fields: ['key', 'title'],
    sort: ['title'],
    limit: pagination.limit + 1,
    offset: pagination.offset,
  });
  const hasNext = workflows.length > pageSize;
  const data = workflows.slice(0, pageSize).map((workflow) => ({
    workflowKey: workflow.key,
    title: workflow.title,
    stats: statsMap.get(workflow.key)?.stats ?? { pending: 0, all: 0 },
  }));
  context.body = {
    rows: data,
    page,
    pageSize,
    hasNext,
  };

  await next();
}
