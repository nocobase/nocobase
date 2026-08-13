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
import {
  executeWorkspaceAuthoringTool,
  getWorkspaceAuthoringToolManifests,
  parseWorkspaceAuthoringToolId,
} from './tools/workspace-authoring';
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

const executeRegisteredFrontendTool = async (
  app: Parameters<NonNullable<ToolsOptions['invoke']>>[0],
  params: FrontendToolParams,
) => {
  const toolId = getToolId(params);
  const workspaceResult = await executeWorkspaceAuthoringTool(app, toolId, params.args ?? {});
  if (workspaceResult !== undefined) {
    return workspaceResult;
  }
  return getRegistry(app).execute(toolId, params.args ?? {});
};

export const loadFrontendTool: [string, ToolsOptions] = [
  LOAD_FRONTEND_TOOL_NAME,
  {
    invoke: async (app, params: FrontendToolParams) => {
      const toolId = getToolId(params);
      const workspaceTool = parseWorkspaceAuthoringToolId(toolId);
      if (workspaceTool) {
        const manifest = getWorkspaceAuthoringToolManifests(workspaceTool.surfaceId).find((tool) => tool.id === toolId);
        if (!manifest) {
          throw new Error(`Workspace frontend tool is unavailable: ${toolId}`);
        }
        return manifest;
      }
      return getRegistry(app).getManifest(toolId);
    },
  },
];

export const executeFrontendTool: [string, ToolsOptions] = [
  EXECUTE_FRONTEND_TOOL_NAME,
  {
    invoke: executeRegisteredFrontendTool,
    ui: {
      card: WorkspaceChangeCard,
    },
  },
];
