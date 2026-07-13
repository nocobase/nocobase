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
import { getAgentGatewayCollectionRegistration } from '../../collectionRegistry';
import { authenticateNodeToken } from '../../security';
import {
  AGENT_GATEWAY_STANDARD_COLLECTIONS,
  ModelRecord,
  asActionContext,
  getActionTargetKey,
  matchStandardCollectionAction,
  requireManagePermission,
} from '../../actions/utils';
import { ackCancelRun, cancelRun } from './cancelRun';
import { claimRun } from './claimLease';
import {
  applyBuildRunnerFallbackToRun,
  createRun,
  createTaskRun,
  findFallbackForQueuedBuildRun,
  listBuildRunOptions,
} from './createRun';
import { runHeartbeat } from './heartbeatLease';
import { createRunLifecycleHookContext, expireLeases } from './leaseRecovery';
import { getRun, getStandardRun, listRuns, listStandardRuns } from './queryRuns';
import { completeRun, failRun, timeoutRun } from './terminalizeRun';
import { HookOptions, isMutableModelRecord } from './types';

export function registerRunLifecycleHooks(plugin: Plugin) {
  plugin.db.on('agRuns.beforeSave', async (model: ModelRecord, options: HookOptions) => {
    if (!isMutableModelRecord(model)) {
      return;
    }
    const fallback = await findFallbackForQueuedBuildRun(
      createRunLifecycleHookContext(plugin),
      model,
      options?.transaction,
    );
    if (fallback) {
      applyBuildRunnerFallbackToRun(model, fallback);
    }
  });
}

export function registerRunLifecycleRoutes(plugin: Plugin) {
  plugin.app.resourceManager.registerActionHandlers({
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listRunOptions)]: async (ctx, next) => {
      await listBuildRunOptions(asActionContext(ctx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.createTaskRun)]: async (ctx, next) => {
      await createTaskRun(asActionContext(ctx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listRuns)]: async (ctx, next) => {
      await listRuns(asActionContext(ctx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.getRun)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await getRun(actionCtx, getActionTargetKey(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.createRun)]: async (ctx, next) => {
      await createRun(asActionContext(ctx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.claimRun)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await claimRun(actionCtx, getActionTargetKey(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.heartbeatRun)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      const auth = await authenticateNodeToken(actionCtx);
      await runHeartbeat(actionCtx, String(auth.subject.nodeId), getActionTargetKey(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.completeRun)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      const auth = await authenticateNodeToken(actionCtx);
      await completeRun(actionCtx, String(auth.subject.nodeId), getActionTargetKey(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.failRun)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      const auth = await authenticateNodeToken(actionCtx);
      await failRun(actionCtx, String(auth.subject.nodeId), getActionTargetKey(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.timeoutRun)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      const auth = await authenticateNodeToken(actionCtx);
      await timeoutRun(actionCtx, String(auth.subject.nodeId), getActionTargetKey(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.ackCancelRun)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      const auth = await authenticateNodeToken(actionCtx);
      await ackCancelRun(actionCtx, String(auth.subject.nodeId), getActionTargetKey(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.cancelRun)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await cancelRun(actionCtx, getActionTargetKey(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.expireRunLeases)]: async (ctx, next) => {
      await expireLeases(asActionContext(ctx));
      await next();
    },
  });

  plugin.app.use(
    async (ctx: Context, next: Next) => {
      const standardCollectionAction = matchStandardCollectionAction(ctx.path, AGENT_GATEWAY_STANDARD_COLLECTIONS);
      const collectionRegistration = standardCollectionAction
        ? getAgentGatewayCollectionRegistration(standardCollectionAction.collectionName)
        : undefined;
      if (standardCollectionAction && collectionRegistration?.directCrudPolicy === 'scoped-read') {
        if (ctx.method === 'GET' && standardCollectionAction.action === 'list') {
          await listStandardRuns(ctx);
          return;
        } else if (ctx.method === 'GET' && standardCollectionAction.action === 'get') {
          await getStandardRun(ctx);
          return;
        } else {
          await requireManagePermission(ctx);
        }
      } else if (standardCollectionAction) {
        await requireManagePermission(ctx);
      }

      await next();
    },
    {
      tag: 'agentGatewayRunLifecycleRoutes',
      after: 'agentGatewayNodeLifecycleRoutes',
      before: 'dataSource',
    },
  );
}
