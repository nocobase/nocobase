/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { Op } from '@nocobase/database';

// Keep large JSON/text fields out of both the canvas summary and the node history.
export const jobListFields = [
  'id',
  'executionId',
  'nodeId',
  'nodeKey',
  'status',
  'createdAt',
  'updatedAt',
  'startedAt',
];

export async function list(context: Context, next: Next) {
  const { nodeId, before, snapshot } = context.action.params;
  const filterByTk = context.action.sourceId;
  const isId = (value: unknown) => /^(0|[1-9]\d*)$/.test(String(value));
  if (
    !isId(filterByTk) ||
    !isId(nodeId) ||
    (before != null && !isId(before)) ||
    (snapshot != null && !isId(snapshot)) ||
    (before != null && snapshot == null)
  ) {
    return context.throw(400);
  }
  const execution = await context.db.getRepository('executions').findOne({ filterByTk, fields: ['id'] });
  if (!execution) {
    return context.throw(404);
  }

  const Job = context.db.getModel('jobs');
  const scope = { executionId: execution.id, nodeId };
  // Freeze the upper bound for this browsing session so newly appended jobs do not shift later pages.
  const upperBound =
    snapshot ?? (await Job.findOne({ attributes: ['id'], where: scope, order: [['id', 'DESC']] }))?.get('id') ?? '0';
  const where = {
    ...scope,
    id: { [Op.lte]: upperBound, ...(before == null ? {} : { [Op.lt]: before }) },
  };
  const rows = await Job.findAll({ attributes: jobListFields, where, order: [['id', 'DESC']], limit: 21 });
  const items = rows.slice(0, 20);
  context.body = {
    items,
    total: before == null ? await Job.count({ where: { ...scope, id: { [Op.lte]: upperBound } } }) : undefined,
    snapshot: String(upperBound),
    nextCursor: rows.length > 20 ? String(items[items.length - 1].get('id')) : null,
  };
  await next();
}
