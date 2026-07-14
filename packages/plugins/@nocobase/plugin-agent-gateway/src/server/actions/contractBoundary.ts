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

import {
  AGENT_GATEWAY_API_RESOURCE,
  AgentGatewayContractError,
  isAgentGatewayApiAction,
  parseAgentGatewayActionQuery,
  parseAgentGatewayActionRequest,
  parseAgentGatewayActionResponse,
} from '../../shared/apiContract';
import { isJsonRecord } from '../../shared/json';

export function registerAgentGatewayContractBoundary(plugin: Plugin) {
  plugin.app.resourceManager.use(
    async (ctx: Context, next: Next) => {
      if (ctx.action.resourceName !== AGENT_GATEWAY_API_RESOURCE || !isAgentGatewayApiAction(ctx.action.actionName)) {
        await next();
        return;
      }

      try {
        ctx.request.body = parseAgentGatewayActionRequest(
          ctx.action.actionName,
          isJsonRecord(ctx.request.body) ? ctx.request.body : {},
        );
        parseAgentGatewayActionQuery(ctx.action.actionName, isJsonRecord(ctx.query) ? ctx.query : {});
      } catch (error) {
        if (error instanceof AgentGatewayContractError) {
          ctx.throw(400, error.message);
        }
        throw error;
      }

      await next();

      try {
        ctx.body = parseAgentGatewayActionResponse(ctx.action.actionName, ctx.body === undefined ? {} : ctx.body);
      } catch (error) {
        if (error instanceof AgentGatewayContractError) {
          ctx.throw(500, `Invalid Agent Gateway response: ${error.message}`);
        }
        throw error;
      }
    },
    {
      tag: 'agentGatewayContractBoundary',
    },
  );
}
