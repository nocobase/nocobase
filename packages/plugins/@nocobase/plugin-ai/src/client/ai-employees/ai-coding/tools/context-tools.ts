/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ToolsOptions } from '@nocobase/client';
import { useChatMessagesStore } from '../../chatbox/stores/chat-messages';
import { FlowContext } from '@nocobase/flow-engine';

export const getContextApisTool: [string, ToolsOptions] = [
  'getContextApis',
  {
    async invoke(_app, _args) {
      const result = await this.flowContext?.getApiInfos?.();
      return result ?? {};
    },
    useHooks() {
      this.flowContext = useChatMessagesStore.use.flowContext();
      return this;
    },
  },
];

export const getContextEnvsTool: [string, ToolsOptions] = [
  'getContextEnvs',
  {
    async invoke(_app, _args) {
      const result = await this.flowContext?.getEnvInfos?.();
      return result ?? {};
    },
    useHooks() {
      this.flowContext = useChatMessagesStore.use.flowContext();
      return this;
    },
  },
];

export const getContextVarsTool: [string, ToolsOptions] = [
  'getContextVars',
  {
    async invoke(_app, args) {
      const result = await this.flowContext?.getVarInfos?.({
        path: args?.path,
        maxDepth: args?.depth ?? 3,
      });
      return result ?? {};
    },
    useHooks() {
      this.flowContext = useChatMessagesStore.use.flowContext();
      return this;
    },
  },
];

export const lintAndTestJSTool: [string, ToolsOptions] = [
  'lintAndTestJS',
  {
    async invoke(app, { code }) {
      let ctx: FlowContext = this.flowContext;
      if (!ctx) {
        ctx = app.flowEngine?.context;
      }
      if (!ctx?.previewRunJS) {
        return {
          status: 'error',
          content: {
            success: false,
            message: 'Preview context not available. Cannot run code validation.',
          },
        };
      }
      try {
        const content = await ctx.previewRunJS(code);
        return {
          status: 'success',
          content,
        };
      } catch (error: any) {
        return {
          status: 'error',
          content: {
            success: false,
            message: `Preview execution error: ${error?.message || error}`,
          },
        };
      }
    },
    useHooks() {
      this.flowContext = useChatMessagesStore.use.flowContext();
      return this;
    },
  },
];
