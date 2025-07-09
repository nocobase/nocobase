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
import _ from 'lodash';

export type LLMProviderOptions = {
  title: string;
  provider: new (opts: {
    app: Application;
    serviceOptions?: any;
    chatOptions?: any;
    abortSignal?: AbortSignal;
  }) => LLMProvider;
};

export interface ToolOptions<T> {
  title: string;
  description: string;
  execution?: 'frontend' | 'backend';
  name?: string;
  schema?: any;
  invoke: (
    ctx: Context,
    args: T,
  ) => Promise<{
    status: 'success' | 'error';
    content: string;
  }>;
}

export type ToolRegisterOptions<T> = {
  groupName?: string;
  toolName: string;
  tool: ToolOptions<T>;
};

export type ToolGroupRegisterOptions = {
  groupName: string;
  title?: string;
  description?: string;
};

export type ToolRegisterDelegate = {
  groupName: string;
  getTools: () => Promise<ToolRegisterOptions<unknown>[]>;
};

export interface AIToolRegister {
  registerToolGroup(options: ToolGroupRegisterOptions);
  registerDynamicTool(delegate: ToolRegisterDelegate);
  registerTool<T>(options: ToolRegisterOptions<T> | ToolRegisterOptions<T>[]);
}

const DEFAULT_TOOL_GROUP: ToolGroupRegisterOptions = {
  groupName: 'others',
  title: '{{t("Others")}}',
  description: '{{t("Other tools")}}',
};

export class AIManager implements AIToolRegister {
  llmProviders = new Map<string, LLMProviderOptions>();

  tools = new Registry<ToolRegisterOptions<unknown>>();
  groups = new Registry<ToolGroupRegisterOptions>();
  delegates = new Array<ToolRegisterDelegate>();

  constructor(protected plugin: PluginAIServer) {
    this.groups.register(DEFAULT_TOOL_GROUP.groupName, DEFAULT_TOOL_GROUP);
  }

  registerLLMProvider(name: string, options: LLMProviderOptions) {
    this.llmProviders.set(name, options);
  }

  listLLMProviders() {
    const providers = this.llmProviders.entries();
    return Array.from(providers).map(([name, { title }]) => ({ name, title }));
  }

  registerToolGroup(options: ToolGroupRegisterOptions) {
    this.groups.register(options.groupName, options);
  }

  registerDynamicTool(delegate: ToolRegisterDelegate) {
    this.delegates.push(delegate);
  }

  registerTool<T>(options: ToolRegisterOptions<T> | ToolRegisterOptions<T>[]) {
    const list = _.isArray(options) ? options : [options];
    list.forEach((x) => {
      if (!x.groupName) {
        x.groupName = DEFAULT_TOOL_GROUP.groupName;
      }
      this.tools.register(x.toolName, x);
    });
  }

  async getTool(name: string, raw = false): Promise<ToolOptions<unknown>> {
    const result = await this._getTool(this.tools, name, raw);
    if (result) {
      return result;
    } else {
      const delegateTools: Registry<ToolRegisterOptions<unknown>> = new Registry();
      const [groupName] = name.split('-');
      for (const delegate of this.delegates.filter((x) => x.groupName === groupName)) {
        const tools = await delegate.getTools();
        for (const tool of tools) {
          const item = {
            ...tool,
            toolName: tool.toolName,
          };
          delegateTools.register(item.toolName, item);
        }
      }
      return await this._getTool(delegateTools, name, raw);
    }
  }

  private async _getTool(
    register: Registry<ToolRegisterOptions<unknown>>,
    name: string,
    raw = false,
  ): Promise<ToolOptions<unknown>> {
    const processSchema = (schema: any) => {
      if (!schema) return undefined;
      try {
        // Use type assertion to break the recursive type checking
        return (schema as any) instanceof ZodObject && raw ? zodToJsonSchema(schema as any) : schema;
      } catch (error) {
        // Fallback if zodToJsonSchema fails
        return schema;
      }
    };

    const { tool } = register.get(name);
    if (!tool) {
      return null;
    }
    return {
      ...tool,
      schema: processSchema(tool.schema),
    };
  }

  async listTools(): Promise<
    {
      group: ToolGroupRegisterOptions;
      tools: ToolOptions<unknown>[];
    }[]
  > {
    const groupRegisters = Array.from(this.groups.getValues());
    const toolRegisters = Array.from(this.tools.getValues());
    for (const delegate of this.delegates) {
      const delegateTools = await delegate.getTools();
      toolRegisters.push(...delegateTools);
    }
    const groupedTools = _.groupBy(toolRegisters, (item) => item.groupName);
    return Array.from(groupRegisters).map((group) => ({
      group,
      tools: groupedTools[group.groupName]?.map((x) => x.tool) ?? [],
    }));
  }
}
