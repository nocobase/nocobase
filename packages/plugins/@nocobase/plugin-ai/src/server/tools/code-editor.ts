/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ToolsOptions } from '@nocobase/ai';
import { z } from 'zod';

export const listCodeSnippet: ToolsOptions = {
  scope: 'SPECIFIED',
  execution: 'frontend',
  introduction: {
    title: '{{t("Get code snippet list")}}',
    about: '{{t("Get code snippet list")}}',
  },
  definition: {
    name: 'listCodeSnippet',
    description: '{{t("Get code snippet list")}}',

    schema: z.object({}),
  },
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

export const getContextApis: ToolsOptions = {
  scope: 'SPECIFIED',
  execution: 'frontend',
  introduction: {
    title: '{{t("Get context APIs")}}',
    about: '{{t("Get available API methods from context")}}',
  },
  definition: {
    name: 'getContextApis',
    description: 'Get available API methods from context',
    schema: z.object({}),
  },
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

export const getContextEnvs: ToolsOptions = {
  scope: 'SPECIFIED',
  execution: 'frontend',
  introduction: {
    title: '{{t("Get context environment")}}',
    about: '{{t("Get current page/block/flow model metadata from context")}}',
  },
  definition: {
    name: 'getContextEnvs',
    description: 'Get current page/block/flow model metadata from context',
    schema: z.object({}),
  },
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

export const getContextVars: ToolsOptions = {
  scope: 'SPECIFIED',
  execution: 'frontend',
  introduction: {
    title: '{{t("Get context variables")}}',
    about:
      '{{t("Available variables from context, the actual value should be got via `await ctx.getVar()`, e.g. `await ctx.getVar(\'ctx.popup.record\')`")}}',
  },
  definition: {
    name: 'getContextVars',
    description:
      "Available variables from context, the actual value should be got via `await ctx.getVar()`, e.g. `await ctx.getVar('ctx.popup.record')`",
    schema: z.object({
      path: z.string().optional().describe('Variable path for progressive disclosure'),
      depth: z.number().optional().describe('Max depth for variable traversal, default 3'),
    }),
  },
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

export const getCodeSnippet: ToolsOptions = {
  scope: 'SPECIFIED',
  execution: 'frontend',
  introduction: {
    title: '{{t("Get code snippet content")}}',
    about: '{{t("Get code snippet content")}}',
  },
  definition: {
    name: 'getCodeSnippet',
    description: 'Get code snippet content',
    schema: z.object({
      ref: z.string().describe('ref from tools "listCodeSnippet" for get code snippet content.'),
    }),
  },
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
