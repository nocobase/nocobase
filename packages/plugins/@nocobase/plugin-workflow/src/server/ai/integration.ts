/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type PluginWorkflowServer from '../Plugin';
import type { ToolManagerLike } from './types';
import { workflowNodeUpsertTool, workflowUpsertTool } from './workflow-designer-tools';
import { resolveWorkflowContext } from './workflow-context';
import workflowArchitect from './built-in/workflow-architect';

const WORKFLOW_AI_INTEGRATION = Symbol.for('nocobase.workflow.ai.integration');

type WorkflowAIPluginLike = {
  app: {
    pm: {
      get: (name: string) => any;
    };
  };
  aiManager?: {
    toolManager?: ToolManagerLike;
  };
  workContextHandler?: {
    registerStrategy: (type: string, strategies: any) => void;
  };
  builtInManager?: {
    registerBuiltInEmployees?: (employees: any[]) => void;
    createOrUpdateAIEmployee?: (language?: string) => Promise<void> | void;
  };
};

export const registerWorkflowAIIntegration = async (aiPlugin: WorkflowAIPluginLike) => {
  if (!aiPlugin?.aiManager?.toolManager || (aiPlugin as any)[WORKFLOW_AI_INTEGRATION]) {
    return;
  }

  const workflow = aiPlugin.app.pm.get('workflow') as PluginWorkflowServer;
  if (!workflow) {
    return;
  }

  (aiPlugin as any)[WORKFLOW_AI_INTEGRATION] = true;

  const toolManager = aiPlugin.aiManager.toolManager;
  const workflowDesignerGroupName = 'workflowDesigner';

  toolManager.registerToolGroup({
    groupName: workflowDesignerGroupName,
    title: '{{t("Workflow designer")}}',
    description: '{{t("Design or edit workflows directly from AI conversations.")}}',
  });

  toolManager.registerTools([
    {
      groupName: workflowDesignerGroupName,
      tool: workflowUpsertTool,
    },
    {
      groupName: workflowDesignerGroupName,
      tool: workflowNodeUpsertTool,
    },
  ]);

  aiPlugin.workContextHandler?.registerStrategy('workflow', {
    resolve: async (ctx, contextItem) => await resolveWorkflowContext(ctx, contextItem),
  });

  if (aiPlugin.builtInManager?.registerBuiltInEmployees) {
    aiPlugin.builtInManager.registerBuiltInEmployees([workflowArchitect]);
    if (typeof aiPlugin.builtInManager.createOrUpdateAIEmployee === 'function') {
      const repo = aiPlugin?.db?.getRepository?.('aiEmployees');
      if (repo && typeof repo.find === 'function') {
        await aiPlugin.builtInManager.createOrUpdateAIEmployee();
      }
    }
  }
};
