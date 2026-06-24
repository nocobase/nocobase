/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { UserOutlined } from '@ant-design/icons';
import { Instruction } from '@nocobase/plugin-workflow/client-v2';
import { tExpr } from '../../../locale';
import { AI_EMPLOYEE_INSTRUCTION_TYPE, AI_WORKFLOW_GROUP, DEFAULT_AI_EMPLOYEE_CONFIG } from '../../constants';
import type {
  AIEmployeeInstructionConfig,
  JsonSchema,
  WorkflowInstructionNode,
  WorkflowNodeVariableOption,
} from '../../types';

export default class AIEmployeeInstruction extends Instruction {
  title = tExpr('AI employee');
  type = AI_EMPLOYEE_INSTRUCTION_TYPE;
  group = AI_WORKFLOW_GROUP;
  async = true;
  icon = (<UserOutlined />);
  FieldsetLoader = () => import('./components/AIEmployeeFieldset').then((m) => ({ default: m.AIEmployeeFieldset }));

  createDefaultConfig(): AIEmployeeInstructionConfig {
    return {
      username: DEFAULT_AI_EMPLOYEE_CONFIG.username,
      skillSettings: {
        skills: [],
        tools: [],
      },
      webSearch: DEFAULT_AI_EMPLOYEE_CONFIG.webSearch,
      requiresApproval: DEFAULT_AI_EMPLOYEE_CONFIG.requiresApproval,
    };
  }

  useVariables(node: WorkflowInstructionNode<AIEmployeeInstructionConfig>): WorkflowNodeVariableOption | null {
    const outputSchema = node.config?.structuredOutput?.schema;
    if (!outputSchema) {
      return null;
    }
    const schema = parseJsonSchema(outputSchema);
    if (!schema) {
      return null;
    }
    return {
      label: node.title ?? this.title,
      value: node.key,
      children: traversal(schema),
    };
  }
}

function parseJsonSchema(schema: string | JsonSchema): JsonSchema | null {
  if (typeof schema !== 'string') {
    return schema;
  }
  try {
    return JSON.parse(schema) as JsonSchema;
  } catch {
    return null;
  }
}

function traversal(schema?: JsonSchema): WorkflowNodeVariableOption[] {
  return Object.entries(schema?.properties ?? {}).map(([key, value]) => {
    const children = traversal(value);
    return {
      label: typeof value.title === 'string' ? value.title : key,
      value: key,
      children: children.length ? children : undefined,
    };
  });
}
