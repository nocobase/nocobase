/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginWorkflowClientV2 from '@nocobase/plugin-workflow/client-v2';
import type { PluginManager } from '@nocobase/client-v2';
import { tExpr } from '../locale';
import {
  AI_EMPLOYEE_INSTRUCTION_TYPE,
  AI_EMPLOYEE_TRIGGER_TYPE,
  AI_WORKFLOW_GROUP,
  LLM_INSTRUCTION_TYPE,
} from './constants';
import AIEmployeeInstruction from './nodes/employee';
import LLMInstruction from './nodes/llm';
import AIEmployeeTrigger from './triggers/ai-employee';

type WorkflowPluginLike = Pick<
  PluginWorkflowClientV2,
  'registerInstructionGroup' | 'registerInstruction' | 'registerTrigger'
>;

export function registerPluginAIWorkflow(pluginManager: PluginManager) {
  const workflowPlugin = pluginManager.get(PluginWorkflowClientV2) as WorkflowPluginLike | undefined;
  if (!workflowPlugin) {
    return;
  }

  workflowPlugin.registerInstructionGroup(AI_WORKFLOW_GROUP, {
    key: AI_WORKFLOW_GROUP,
    label: tExpr('AI'),
  });
  workflowPlugin.registerInstruction(LLM_INSTRUCTION_TYPE, LLMInstruction);
  workflowPlugin.registerInstruction(AI_EMPLOYEE_INSTRUCTION_TYPE, AIEmployeeInstruction);
  workflowPlugin.registerTrigger(AI_EMPLOYEE_TRIGGER_TYPE, AIEmployeeTrigger);
}
