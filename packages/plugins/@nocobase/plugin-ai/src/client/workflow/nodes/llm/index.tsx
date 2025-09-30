/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Instruction } from '@nocobase/plugin-workflow/client';
import { RobotOutlined } from '@ant-design/icons';
import { tval } from '@nocobase/utils/client';
import { namespace } from '../../../locale';
import { Settings } from './ModelSettings';
import { Chat } from '../../../llm-providers/components/Chat';

export class LLMInstruction extends Instruction {
  title = 'LLM';
  type = 'llm';
  group = 'ai';
  // @ts-ignore
  icon = (<RobotOutlined />);
  fieldset = {
    llmService: {
      type: 'string',
      title: tval('LLM service', { ns: namespace }),
      name: 'llmService',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'RemoteSelect',
      'x-component-props': {
        manual: false,
        fieldNames: {
          label: 'title',
          value: 'name',
        },
        service: {
          resource: 'llmServices',
          action: 'list',
          params: {
            fields: ['title', 'name'],
          },
        },
      },
    },
    options: {
      type: 'void',
      'x-component': 'Settings',
    },
    chat: {
      type: 'void',
      'x-component': 'Chat',
    },
  };
  components = {
    Settings,
    Chat,
  };

  isAvailable({ engine, workflow }) {
    return !engine.isWorkflowSync(workflow);
  }

  useVariables(node, options) {
    return {
      label: node.title,
      value: node.key,
      children: [
        {
          value: 'content',
          label: 'Content',
        },
        {
          value: 'structuredContent',
          label: 'Structured content',
        },
        {
          value: 'additionalKwargs',
          label: 'Additional Kwargs',
        },
      ],
    };
  }
}
