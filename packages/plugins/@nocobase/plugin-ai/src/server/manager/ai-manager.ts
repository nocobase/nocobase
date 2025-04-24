/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/server';
import { LLMProvider } from '../llm-providers/provider';
import { Registry } from '@nocobase/utils';
import { ZodObject } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

export type LLMProviderOptions = {
  title: string;
  provider: new (opts: {
    app: Application;
    serviceOptions?: any;
    chatOptions?: any;
    abortSignal?: AbortSignal;
  }) => LLMProvider;
};

export type ToolOptions =
  | {
      title: string;
      description: string;
      type?: 'tool';
      schema: any;
      action?: (params: Record<string, any>) => Promise<any>;
    }
  | {
      title: string;
      description: string;
      type: 'group';
      action: (toolName: string, params: Record<string, any>) => Promise<any>;
      getTools: () => Promise<
        Omit<ToolOptions, 'action'> &
          {
            toolName: string;
          }[]
      >;
    };

export class AIManager {
  llmProviders = new Map<string, LLMProviderOptions>();
  tools = new Registry<ToolOptions>();

  registerLLMProvider(name: string, options: LLMProviderOptions) {
    this.llmProviders.set(name, options);
  }

  listLLMProviders() {
    const providers = this.llmProviders.entries();
    return Array.from(providers).map(([name, { title }]) => ({ name, title }));
  }

  registerTool(name: string, options: ToolOptions) {
    this.tools.register(name, options);
  }

  getTool(name: string, raw = false) {
    const tool = this.tools.get(name);
    if (!tool) {
      return null;
    }
    const { title, description } = tool;
    const result = {
      name,
      title,
      description,
    };
    if (tool.type !== 'group') {
      let schema = tool.schema;
      if (schema instanceof ZodObject && raw) {
        schema = zodToJsonSchema(schema);
      }
      result['schema'] = schema;
    }
    return result;
  }

  listTools() {
    const tools = this.tools.getKeys();
    const result = [];
    for (const name of tools) {
      const tool = this.getTool(name, true);
      result.push(tool);
    }
    return result;
  }
}
