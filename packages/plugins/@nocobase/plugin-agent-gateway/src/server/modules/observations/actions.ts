/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';

import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiActionName } from '../../../shared/apiContract';
import {
  asActionContext,
  getActionTargetKey,
  getRecord,
  getString,
  matchStandardCollectionAction,
  requireManagePermission,
} from '../../actions/utils';
import {
  getRunArtifactContent,
  listRunApiCallLogs,
  listRunArtifacts,
  listRunEvents,
  listRunSnapshots,
} from './readActions';
import { appendEvent, registerArtifact, registerSnapshot } from './writeActions';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STANDARD_OBSERVABILITY_COLLECTIONS = [
  'agRunEvents',
  'agRunArtifacts',
  'agRunSnapshots',
  'agApiCallLogs',
] as const;
const DIRECT_OBSERVABILITY_READ_ACTIONS = new Set(['get', 'list']);

function getRunId(ctx: Context) {
  const runId = getActionTargetKey(ctx);
  if (!UUID_PATTERN.test(runId)) {
    ctx.throw(400, 'runId must be a valid UUID');
  }
  return runId;
}

export function registerRunObservabilityRoutes(plugin: Plugin) {
  plugin.app.resourceManager.registerActionHandlers({
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.appendRunEvents)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await appendEvent(actionCtx, getRunId(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.registerRunArtifact)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await registerArtifact(actionCtx, getRunId(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.registerRunSnapshot)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await registerSnapshot(actionCtx, getRunId(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listRunEvents)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await listRunEvents(actionCtx, getRunId(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listRunArtifacts)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await listRunArtifacts(actionCtx, getRunId(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listRunSnapshots)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await listRunSnapshots(actionCtx, getRunId(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listRunApiCallLogs)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await listRunApiCallLogs(actionCtx, getRunId(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.getRunArtifactContent)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      const runId = getRunId(actionCtx);
      const artifactId = getString(getRecord(actionCtx.query).artifactId);
      if (!UUID_PATTERN.test(artifactId)) {
        actionCtx.throw(400, 'artifactId must be a valid UUID');
      }
      await getRunArtifactContent(actionCtx, runId, artifactId);
      await next();
    },
  });

  plugin.app.use(
    async (ctx: Context, next: Next) => {
      const standardCollectionAction = matchStandardCollectionAction(ctx.path, STANDARD_OBSERVABILITY_COLLECTIONS);
      if (standardCollectionAction) {
        if (ctx.method === 'GET' && DIRECT_OBSERVABILITY_READ_ACTIONS.has(standardCollectionAction.action)) {
          ctx.throw(403, 'Use Agent Gateway observability routes to read run data');
        }
        await requireManagePermission(ctx);
      }
      await next();
    },
    {
      tag: 'agentGatewayRunObservabilityRoutes',
      after: 'agentGatewayRunLifecycleRoutes',
      before: 'dataSource',
    },
  );
}
