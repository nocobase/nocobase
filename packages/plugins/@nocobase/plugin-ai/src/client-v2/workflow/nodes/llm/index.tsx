/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { RobotOutlined } from '@ant-design/icons';
import { Instruction } from '@nocobase/plugin-workflow/client-v2';
import { tExpr } from '../../../locale';
import { AI_WORKFLOW_GROUP, LLM_INSTRUCTION_TYPE } from '../../constants';
import type { WorkflowInstructionNode, WorkflowNodeVariableOption } from '../../types';

export default class LLMInstruction extends Instruction {
  title = 'LLM';
  type = LLM_INSTRUCTION_TYPE;
  group = AI_WORKFLOW_GROUP;
  async = true;
  icon = (<RobotOutlined />);
  FieldsetLoader = () => import('./components/LLMFieldset').then((m) => ({ default: m.LLMFieldset }));

  createDefaultConfig() {
    return {
      messages: [{ role: 'user', content: [{ type: 'text' }] }],
    };
  }

  useVariables(node: WorkflowInstructionNode): WorkflowNodeVariableOption {
    return {
      label: node.title ?? this.title,
      value: node.key,
      children: [
        {
          value: 'content',
          label: tExpr('Content'),
        },
        {
          value: 'structuredContent',
          label: tExpr('Structured content'),
        },
        {
          value: 'additionalKwargs',
          label: tExpr('Additional Kwargs'),
        },
      ],
    };
  }
}
