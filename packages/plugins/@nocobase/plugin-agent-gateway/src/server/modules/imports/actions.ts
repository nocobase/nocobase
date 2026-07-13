/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiActionName } from '../../../shared/apiContract';
import { asActionContext, getActionTargetKey } from '../../actions/utils';
import { appendExternalRunObservations, importExternalRun } from './importRun';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function registerExternalRunImportRoutes(plugin: Plugin) {
  plugin.app.resourceManager.registerActionHandlers({
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.importExternalRun)]: async (ctx, next) => {
      await importExternalRun(asActionContext(ctx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.appendExternalRunObservations)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      const runId = getActionTargetKey(actionCtx);
      if (!UUID_PATTERN.test(runId)) {
        actionCtx.throw(400, 'runId must be a valid UUID');
      }
      await appendExternalRunObservations(actionCtx, runId);
      await next();
    },
  });
}
