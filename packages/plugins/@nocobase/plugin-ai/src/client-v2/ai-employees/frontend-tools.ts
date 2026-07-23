/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ToolsOptions } from '@nocobase/client-v2';
import { EXECUTE_FRONTEND_TOOL_NAME, LOAD_FRONTEND_TOOL_NAME } from '../../common/frontend-tools';
import { getFrontendToolRegistry } from '../manager/frontend-tool-registry';
import { WorkspaceChangeCard } from './tools/WorkspaceChangeCard';

type FrontendToolParams = {
  toolId?: unknown;
  args?: unknown;
};

const getRegistry = (app: { pm: { get: (name: string) => unknown } }) => {
  const registry = getFrontendToolRegistry(app);
  if (!registry) {
    throw new Error('Frontend tool registry is unavailable');
  }
  return registry;
};

const getToolId = (params: FrontendToolParams): string => {
  if (typeof params.toolId !== 'string' || !params.toolId) {
    throw new Error('Frontend tool id is required');
  }
  return params.toolId;
};

export const loadFrontendTool: [string, ToolsOptions] = [
  LOAD_FRONTEND_TOOL_NAME,
  {
    invoke: async (app, params: FrontendToolParams) => getRegistry(app).getManifest(getToolId(params)),
  },
];

export const executeFrontendTool: [string, ToolsOptions] = [
  EXECUTE_FRONTEND_TOOL_NAME,
  {
    invoke: async (app, params: FrontendToolParams) => getRegistry(app).execute(getToolId(params), params.args ?? {}),
    ui: {
      card: WorkspaceChangeCard,
    },
  },
];
