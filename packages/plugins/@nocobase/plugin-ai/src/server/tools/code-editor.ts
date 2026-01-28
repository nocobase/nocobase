/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { z } from 'zod';
import { ToolOptions } from '../manager/tool-manager';

export const listCodeSnippet: ToolOptions = {
  name: 'listCodeSnippet',
  title: '{{t("Get code snippet list")}}',
  description: '{{t("Get code snippet list")}}',
  execution: 'frontend',
  schema: z.object({}),
  invoke: async (ctx, _args, id) => {
    const { toolCallResults } = ctx.action.params.values || {};
    const { result } = toolCallResults?.find((item) => item.id === id) ?? {};
    if (toolCallResults && result) {
      return {
        status: 'success',
        content: JSON.stringify(result),
      };
    } else {
      return {
        status: 'success',
        content: '[]',
      };
    }
  },
};

export const getContextApis: ToolOptions = {
  name: 'getContextApis',
  title: '{{t("Get context APIs")}}',
  description: '{{t("Get available API information from the current context")}}',
  execution: 'frontend',
  schema: z.object({}),
  invoke: async (ctx, _args, id) => {
    const { toolCallResults } = ctx.action.params.values || {};
    const { result } = toolCallResults?.find((item) => item.id === id) ?? {};
    if (toolCallResults && result) {
      return {
        status: 'success',
        content: JSON.stringify(result),
      };
    } else {
      return {
        status: 'success',
        content: '{}',
      };
    }
  },
};

export const getContextEnvs: ToolOptions = {
  name: 'getContextEnvs',
  title: '{{t("Get context environment variables")}}',
  description: '{{t("Get available environment variable information from the current context")}}',
  execution: 'frontend',
  schema: z.object({}),
  invoke: async (ctx, _args, id) => {
    const { toolCallResults } = ctx.action.params.values || {};
    const { result } = toolCallResults?.find((item) => item.id === id) ?? {};
    if (toolCallResults && result) {
      return {
        status: 'success',
        content: JSON.stringify(result),
      };
    } else {
      return {
        status: 'success',
        content: '{}',
      };
    }
  },
};

export const getContextVars: ToolOptions = {
  name: 'getContextVars',
  title: '{{t("Get context variables")}}',
  description: '{{t("Get available variable information from the current context")}}',
  execution: 'frontend',
  schema: z.object({
    path: z.string().optional().describe('Variable path for progressive disclosure'),
    depth: z.number().optional().describe('Max depth for variable traversal, default 3'),
  }),
  invoke: async (ctx, _args, id) => {
    const { toolCallResults } = ctx.action.params.values || {};
    const { result } = toolCallResults?.find((item) => item.id === id) ?? {};
    if (toolCallResults && result) {
      return {
        status: 'success',
        content: JSON.stringify(result),
      };
    } else {
      return {
        status: 'success',
        content: '{}',
      };
    }
  },
};

export const getCodeSnippet: ToolOptions = {
  name: 'getCodeSnippet',
  title: '{{t("Get code snippet content")}}',
  description: '{{t("Get code snippet content")}}',
  execution: 'frontend',
  schema: z.object({
    ref: z.string().describe('ref from tools "listCodeSnippet" for get code snippet content.'),
  }),
  invoke: async (ctx, _args, id) => {
    const { toolCallResults } = ctx.action.params.values || {};
    const { result } = toolCallResults?.find((item) => item.id === id) ?? {};
    if (toolCallResults && result) {
      return {
        status: 'success',
        content: JSON.stringify(result),
      };
    } else {
      return {
        status: 'success',
        content: '[]',
      };
    }
  },
};
