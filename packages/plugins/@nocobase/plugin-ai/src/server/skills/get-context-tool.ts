/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { z } from 'zod';
import { ToolOptions } from '../manager/tool-manager';
import PluginAIServer from '../plugin';
import { getContextEnvs, getContextApis } from './context-skills';

/**
 * Tool for getting runtime environment variables (dynamic context)
 */
export const getContextEnvsTool: ToolOptions = {
  name: 'getContextEnvs',
  title: '{{t("Get Context Envs")}}',
  description: `Get runtime environment variables for the current block context.

Returns dynamic information about:
- block: Current block info (label, uid)
- flowModel: Current flow model information
- currentViewBlocks: All blocks visible in current view/dialog

Use this to understand "where am I" in the application.`,
  invoke: async (ctx: Context) => {
    const plugin = ctx.app.pm.get('ai') as PluginAIServer;
    const skillManager = plugin?.skillManager;

    if (!skillManager) {
      return {
        status: 'error',
        content: JSON.stringify({ error: 'Context manager not initialized' }),
      };
    }

    return {
      status: 'success',
      content: getContextEnvs(skillManager),
    };
  },
};

/**
 * Tool for getting API information (static structure, progressive disclosure)
 */
export const getContextApisTool: ToolOptions = {
  name: 'getContextApis',
  title: '{{t("Get Context APIs")}}',
  description: `Get available APIs for the current block context.

Usage:
- getContextApis() → All top-level APIs summary
- getContextApis("message") → Details for message API
- getContextApis("message.info") → Details for message.info method
- getContextApis("user.roles.name") → Nested property details

APIs include methods (type=function) and properties that can be accessed via ctx.`,
  schema: z.object({
    path: z
      .string()
      .optional()
      .describe('API path to get details. Empty for overview. Examples: "message", "user.roles", "resource.runAction"'),
  }),
  invoke: async (ctx: Context, args: { path?: string }) => {
    const plugin = ctx.app.pm.get('ai') as PluginAIServer;
    const skillManager = plugin?.skillManager;

    if (!skillManager) {
      return {
        status: 'error',
        content: JSON.stringify({ error: 'Context manager not initialized' }),
      };
    }

    return {
      status: 'success',
      content: getContextApis(skillManager, args.path),
    };
  },
};
