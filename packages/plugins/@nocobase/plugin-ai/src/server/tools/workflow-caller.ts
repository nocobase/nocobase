/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { z } from 'zod';
import PluginWorkflowServer, { Processor } from '@nocobase/plugin-workflow';
import { Context } from '@nocobase/actions';
import { truncateLongStrings } from './utils';
import { ToolsRegistration } from '@nocobase/ai';
import { Plugin } from '@nocobase/server';
import _ from 'lodash';

interface ParameterConfig {
  name: string;
  displayName?: string;
  description?: string;
  type: 'string' | 'number' | 'enum' | 'boolean';
  options?: Array<{ value: string | number; label: string }>;
  required?: boolean;
}

interface ToolConfig {
  name: string;
  description?: string;
  parameters?: ParameterConfig[];
}

interface Workflow {
  key: string;
  title: string;
  description?: string;
  config: ToolConfig;
}

const buildSchema = (config: ToolConfig): z.ZodObject<any> => {
  const schemaProperties: Record<string, z.ZodTypeAny> = {};
  if (config.parameters?.length) {
    config.parameters.forEach((item) => {
      let fieldSchema: z.ZodTypeAny;

      switch (item.type) {
        case 'string':
          fieldSchema = z.string();
          break;
        case 'number':
          fieldSchema = z.number();
          break;
        case 'boolean':
          fieldSchema = z.boolean();
          break;
        case 'enum':
          if (item.options && item.options.length > 0) {
            const enumValues = item.options.map((option) => option.value);
            if (typeof enumValues[0] === 'number') {
              const values = enumValues.map(String) as [string, ...string[]];
              fieldSchema = z.enum(values).transform((v) => Number(v));
            } else {
              fieldSchema = z.enum(enumValues as [string, ...string[]]);
            }
          } else {
            fieldSchema = z.string();
          }
          break;
        default:
          fieldSchema = z.any();
      }

      if (item.description) {
        fieldSchema = fieldSchema.describe(item.description);
      }
      if (!item.required) {
        fieldSchema = fieldSchema.optional();
      }
      schemaProperties[item.name] = fieldSchema;
    });
  }

  const schema = z.object(schemaProperties);
  return schema.describe(config.description || '');
};

const invoke = async (ctx: Context, workflow: Workflow, args: Record<string, any>) => {
  const workflowPlugin = ctx.app.pm.get('workflow') as PluginWorkflowServer;
  const processor = (await workflowPlugin.trigger(workflow as any, {
    ...args,
  })) as Processor;
  const output = processor.execution.output ?? processor.lastSavedJob?.result;
  if (output == null || output === '') {
    return { status: 'error' as const, content: 'No content' };
  }
  if (processor.execution.status < 0) {
    return { status: 'error' as const, content: 'Workflow execution exceptions' };
  }
  const result = truncateLongStrings(output);
  return {
    status: 'success' as const,
    content: JSON.stringify(result),
  };
};

export const getWorkflowCallers = (plugin: Plugin, prefix?: string) => async (register: ToolsRegistration) => {
  const workflowPlugin = plugin.app.pm.get('workflow') as PluginWorkflowServer;
  const aiSupporterWorkflows = Array.from(workflowPlugin.enabledCache.values()).filter(
    (item) => item.type === 'ai-employee',
  );

  for (const workflow of aiSupporterWorkflows) {
    const config = workflow.config;
    register.registerTools({
      scope: 'CUSTOM',
      introduction: {
        title: workflow.title,
        about: workflow.description,
      },
      definition: {
        name: !_.isEmpty(prefix) ? `${prefix}-${workflow.key}` : workflow.key,
        description: workflow.description,
        schema: buildSchema(config),
      },
      invoke: async (ctx: Context, args: Record<string, any>) => invoke(ctx, workflow, args),
    });
  }
};
