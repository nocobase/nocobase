/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { AGENT_GATEWAY_ACTIONS } from '../../security';
import {
  AGENT_GATEWAY_ERROR_CODES,
  ModelRecord,
  getRecord,
  getString,
  getVisibleRunFilter,
  normalizeNocoBaseApiPath,
  requireAgentGatewayPermission,
} from '../../actions/utils';
import { serializeRunForUser } from '../../services/runSerialization';
import {
  getRunListFilter,
  getRunListPagination,
  getRunListSort,
  getRunQueryLimit,
  getTotalPage,
} from '../../services/runListQuery';
import { listRunTaskTemplateFilterOptions } from './createRun';
import { serializeRunForManagement, serializeRunsForManagement } from './serialization';

export async function listRuns(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.readRuns,
    'Agent Gateway run read permission required',
  );
  const filter = await getVisibleRunFilter(ctx, getRunListFilter(ctx), 'list');
  const { page, pageSize, offset } = getRunListPagination(ctx);
  const sort = getRunListSort(ctx);
  const runRepo = ctx.db.getRepository('agRuns');

  const [count, runs, taskTemplates] = await Promise.all([
    runRepo.count({
      filter,
    }),
    runRepo.find({
      filter,
      sort,
      limit: pageSize,
      offset,
    }) as Promise<ModelRecord[]>,
    listRunTaskTemplateFilterOptions(ctx),
  ]);

  ctx.body = {
    rows: await serializeRunsForManagement(ctx, runs),
    count,
    page,
    pageSize,
    totalPage: getTotalPage(count, pageSize),
    taskTemplates,
  };
}

export async function getRun(ctx: Context, runId: string) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.readRunDetails,
    'Agent Gateway run detail read permission required',
  );

  const filter = await getVisibleRunFilter(
    ctx,
    {
      id: runId,
    },
    'get',
  );
  const run = (await ctx.db.getRepository('agRuns').findOne({
    filter,
  })) as ModelRecord | null;
  if (!run) {
    ctx.throw(404, {
      code: AGENT_GATEWAY_ERROR_CODES.resourceNotVisible,
      message: 'Run not found',
    });
  }

  ctx.body = await serializeRunForManagement(ctx, run);
}

export function getStandardAgRunsTargetKey(ctx: Context, action: 'get') {
  const normalizedPath = normalizeNocoBaseApiPath(ctx.path);
  const prefix = `/agRuns:${action}/`;
  const pathValue = normalizedPath.startsWith(prefix) ? normalizedPath.slice(prefix.length).split('/')[0] : '';
  const query = getRecord(ctx.query);
  const rawRunId = pathValue || getString(query.filterByTk);
  if (!rawRunId) {
    return '';
  }
  try {
    return decodeURIComponent(rawRunId);
  } catch {
    return rawRunId;
  }
}

export async function listStandardRuns(ctx: Context) {
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.readRuns,
    'Agent Gateway run read permission required',
  );
  const filter = await getVisibleRunFilter(ctx, getRunListFilter(ctx), 'list');
  const runs = (await ctx.db.getRepository('agRuns').find({
    filter,
    sort: ['-createdAt'],
    limit: getRunQueryLimit(ctx),
  })) as ModelRecord[];

  ctx.body = runs.map((run) => serializeRunForUser(run));
}

export async function getStandardRun(ctx: Context) {
  const runId = getStandardAgRunsTargetKey(ctx, 'get');
  if (!runId) {
    ctx.throw(400, 'Agent Gateway run id is required');
  }
  await requireAgentGatewayPermission(
    ctx,
    AGENT_GATEWAY_ACTIONS.readRun,
    'Agent Gateway run standard get permission required',
  );
  const filter = await getVisibleRunFilter(
    ctx,
    {
      id: runId,
    },
    'get',
  );
  const run = (await ctx.db.getRepository('agRuns').findOne({
    filter,
  })) as ModelRecord | null;
  if (!run) {
    ctx.throw(404, {
      code: AGENT_GATEWAY_ERROR_CODES.resourceNotVisible,
      message: 'Run not found',
    });
  }

  ctx.body = serializeRunForUser(run);
}
