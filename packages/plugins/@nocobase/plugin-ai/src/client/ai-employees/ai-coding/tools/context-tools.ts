/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ToolOptions } from '../../../manager/ai-manager';
import { useChatMessagesStore } from '../../chatbox/stores/chat-messages';

export const getContextApisTool: [string, string, ToolOptions] = [
  'codeEditor',
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

export const getContextEnvsTool: [string, string, ToolOptions] = [
  'codeEditor',
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

export const getContextVarsTool: [string, string, ToolOptions] = [
  'codeEditor',
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

export const lintAndTestJSTool: [string, string, ToolOptions] = [
  'codeEditor',
  'lintAndTestJS',
  {
    async invoke(_app, { code }) {
      if (!this.flowContext?.previewRunJS) {
        return {
          success: false,
          message: 'Preview context not available. Cannot run code validation.',
        };
      }
      try {
        const result = await this.flowContext.previewRunJS(code);
        return result;
      } catch (error: any) {
        return {
          success: false,
          message: `Preview execution error: ${error?.message || error}`,
        };
      }
    },
    useHooks() {
      this.flowContext = useChatMessagesStore.use.flowContext();
      return this;
    },
  },
];
