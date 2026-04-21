/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import { FlowModel, tExpr } from '@nocobase/flow-engine';
import { SkillSettings } from '../components/skill-settings';
import { ModelOptions } from '../components/model-options';
import { WebSearchOptions } from '../components/web-search-options';
import { MessageInputs } from '../components/message-inputs';
import { AIEmployeeSelect } from '../components/AIEmployeeSelect';
import { FileInputs } from '../components/file-inputs';
import { UsersSelect } from '../components/users-select';
import { namespace } from '../../../../locale';

export class AIEmployeeTaskModel extends FlowModel {
  public render() {
    return (
      <SchemaComponent
        components={{ SkillSettings, ModelOptions, WebSearchOptions, AIEmployeeSelect, FileInputs }}
        schema={{
          type: 'void',
          properties: {
            username: {
              title: tExpr('AI employee', { ns: namespace }),
              type: 'string',
              'x-decorator': 'FormItem',
              'x-decorator-props': {
                tooltip: tExpr('Choose the AI employee for this task', { ns: namespace }),
                layout: 'horizontal',
                labelAlign: 'left',
              },
              'x-component': AIEmployeeSelect,
              default: this.props.aiEmployee.username,
            },
            model: {
              type: 'void',
              'x-component': ModelOptions,
            },
            userId: {
              type: 'string',
              title: tExpr('Operator', { ns: namespace }),
              'x-decorator': 'FormItem',
              'x-decorator-props': {
                tooltip: tExpr('Complete the task using operator permissions', {
                  ns: namespace,
                }),
              },
              'x-component': UsersSelect,
              'x-component-props': {
                multiple: false,
              },
              required: true,
            },
            message: {
              type: 'void',
              'x-component': MessageInputs,
            },
            files: {
              type: 'void',
              title: tExpr('Attachments', { ns: namespace }),
              'x-decorator': 'FormItem',
              'x-decorator-props': {
                tooltip: tExpr('Select the file or image to be sent to the LLM', { ns: namespace }),
              },
              'x-component': FileInputs,
            },
            skillSettings: {
              type: 'object',
              'x-component': SkillSettings,
            },
            webSearch: {
              type: 'void',
              'x-component': WebSearchOptions,
            },
          },
        }}
      />
    );
  }
}

AIEmployeeTaskModel.registerFlow({
  key: 'resourceSettings',
  steps: {
    initResource: {
      handler: async (ctx) => {
        await ctx.aiConfigRepository.getAIEmployees();
      },
    },
  },
});
