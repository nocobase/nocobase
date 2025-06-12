/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LLMProvider } from '../llm-providers/provider';
import { Registry } from '@nocobase/utils';
import { ZodObject } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import PluginAIServer from '../plugin';
import { Context } from '@nocobase/actions';
import { Application } from '@nocobase/server';

export type LLMProviderOptions = {
  title: string;
  provider: new (opts: {
    app: Application;
    serviceOptions?: any;
    chatOptions?: any;
    abortSignal?: AbortSignal;
  }) => LLMProvider;
};

interface BaseToolProps {
  title: string;
  description: string;
  execution?: 'frontend' | 'backend';
  name?: string;
  schema?: any;
  invoke: (
    ctx: Context,
    args: Record<string, any>,
  ) => Promise<{
    status: 'success' | 'error';
    content: string;
  }>;
}

export interface GroupToolChild extends BaseToolProps {
  name: string;
  schema?: any;
}

export type ToolOptions =
  | (BaseToolProps & { type?: 'tool' })
  | {
      title: string;
      description: string;
      type: 'group';
      getTool(plugin: PluginAIServer, name: string): Promise<GroupToolChild | null>;
      getTools(plugin: PluginAIServer): Promise<GroupToolChild[]>;
    };

export class AIManager {
  llmProviders = new Map<string, LLMProviderOptions>();
  tools = new Registry<ToolOptions>();

  constructor(protected plugin: PluginAIServer) {}

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

  async getTool(name: string, raw = false) {
    const [root, child] = name.split('-');
    const tool = this.tools.get(root);
    if (!tool) return null;

    const processSchema = (schema: any) => {
      if (!schema) return undefined;
      return schema instanceof ZodObject && raw ? zodToJsonSchema(schema) : schema;
    };

    if (tool.type === 'group' && child) {
      const subTool = await tool.getTool(this.plugin, child);
      if (!subTool) return null;

      return {
        ...subTool,
        schema: processSchema(subTool.schema),
      };
    }

    const result: any = {
      name,
      title: tool.title,
      description: tool.description,
    };

    if (tool.type === 'group') {
      const children = await tool.getTools(this.plugin);
      result.children = children.map((child) => ({
        ...child,
        schema: processSchema(child.schema),
      }));
    } else {
      result.invoke = tool.invoke;
      result.schema = processSchema(tool.schema);
      result.execution = tool.execution;
    }

    return result;
  }

  async listTools() {
    const tools = this.tools.getKeys();
    const result = [];
    for (const name of tools) {
      const tool = await this.getTool(name, true);
      result.push(tool);
    }
    return result;
  }
}
