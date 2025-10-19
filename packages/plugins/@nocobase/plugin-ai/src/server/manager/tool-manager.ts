/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import { Context } from '@nocobase/actions';
import { ZodObject } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import _ from 'lodash';

export interface AIToolRegister {
  registerToolGroup(options: ToolGroupRegisterOptions);
  registerDynamicTool(delegate: ToolRegisterDelegate);
  registerTools<T>(options: ToolRegisterOptions | ToolRegisterOptions[]);
  getTool(name: string, raw?: boolean): Promise<ToolOptions>;
  listTools(): Promise<
    {
      group: ToolGroupRegisterOptions;
      tools: ToolOptions[];
    }[]
  >;
}

export interface ToolOptions {
  title: string;
  description: string;
  execution?: 'frontend' | 'backend';
  name: string;
  schema?: any;
  invoke: (
    ctx: Context,
    args: Record<string, any>,
    id: string,
  ) => Promise<{
    status: 'success' | 'error';
    content: string;
  }>;
}

export type ToolRegisterOptions = {
  groupName?: string;
  tool: ToolOptions;
};

export type ToolGroupRegisterOptions = {
  groupName: string;
  title?: string;
  description?: string;
  sort?: number;
};

export type ToolRegisterDelegate = {
  groupName: string;
  getTools: () => Promise<ToolRegisterOptions[]>;
};

const DEFAULT_TOOL_GROUP: ToolGroupRegisterOptions = {
  groupName: 'others',
  title: '{{t("Others")}}',
  description: '{{t("Other tools")}}',
  sort: 1000,
};

export class ToolManager implements AIToolRegister {
  tools = new Registry<ToolRegisterOptions>();
  groups = new Registry<ToolGroupRegisterOptions>();
  delegates = new Array<ToolRegisterDelegate>();

  constructor() {
    this.groups.register(DEFAULT_TOOL_GROUP.groupName, DEFAULT_TOOL_GROUP);
  }

  registerToolGroup(options: ToolGroupRegisterOptions) {
    this.checkGroupName(options.groupName);
    this.groups.register(options.groupName, options);
  }

  registerDynamicTool(delegate: ToolRegisterDelegate) {
    this.checkGroupName(delegate.groupName);
    this.delegates.push(delegate);
  }

  registerTools<T>(options: ToolRegisterOptions | ToolRegisterOptions[]) {
    const list = _.isArray(options) ? options : [options];
    list
      .map((x) => ({ ...x, tool: { ...x.tool } }))
      .forEach((x) => {
        if (!x.groupName) {
          x.groupName = DEFAULT_TOOL_GROUP.groupName;
        } else {
          this.checkGroupName(x.groupName);
        }
        const toolName = `${x.groupName}-${x.tool.name}`;
        x.tool.name = toolName;
        x.tool.execution = x.tool.execution ?? 'backend';
        this.tools.register(x.tool.name, x);
      });
  }

  async getTool(name: string, raw = false): Promise<ToolOptions> {
    const result = await this._getTool(this.tools, name, raw);
    if (result) {
      return result;
    } else {
      const delegateTools: Registry<ToolRegisterOptions> = new Registry();
      const [groupName] = name.split('-');
      for (const delegate of this.delegates.filter((x) => x.groupName === groupName)) {
        const tools = await delegate.getTools();
        for (const tool of tools) {
          const item = {
            ...tool,
          };
          item.tool.name = `${groupName}-${item.tool.name}`;
          item.tool.execution = item.tool.execution ?? 'backend';
          delegateTools.register(item.tool.name, item);
        }
      }
      return await this._getTool(delegateTools, name, raw);
    }
  }

  async listTools(): Promise<
    {
      group: ToolGroupRegisterOptions;
      tools: ToolOptions[];
    }[]
  > {
    const groupRegisters = Array.from(this.groups.getValues());
    const toolRegisters = Array.from(this.tools.getValues());
    for (const delegate of this.delegates) {
      let delegateTools = await delegate.getTools();
      delegateTools = delegateTools.map((item) => ({
        ...item,
        groupName: delegate.groupName,
        tool: {
          ...item.tool,
          name: `${delegate.groupName}-${item.tool.name}`,
          execution: item.tool.execution ?? 'backend',
        },
      }));
      toolRegisters.push(...delegateTools);
    }

    const toolList = toolRegisters.map((x) => {
      const t = { ...x };
      t.tool.schema = this.processSchema(t.tool.schema, true);
      return t;
    });

    const groupedTools = _.groupBy(toolList, (item) => item.groupName);
    return Array.from(groupRegisters)
      .map((group) => ({
        group,
        tools: groupedTools[group.groupName]?.map((x) => x.tool) ?? [],
      }))
      .sort((a, b) => (a.group.sort || 0) - (b.group.sort || 0));
  }

  private async _getTool(register: Registry<ToolRegisterOptions>, name: string, raw = false): Promise<ToolOptions> {
    const registeredTool = register.get(name);
    if (!registeredTool || !registeredTool.tool) {
      return null;
    }
    const { tool } = registeredTool;
    return {
      ...tool,
      schema: this.processSchema(tool.schema, raw),
    };
  }

  private processSchema(schema: any, raw = false) {
    if (!schema) return undefined;
    try {
      // Use type assertion to break the recursive type checking
      return (schema as any) instanceof ZodObject && raw ? zodToJsonSchema(schema as any) : schema;
    } catch (error) {
      // Fallback if zodToJsonSchema fails
      return schema;
    }
  }

  private checkGroupName(name: string) {
    if (!name || _.isEmpty(name) || name.includes('-')) {
      throw new Error('Invalid group name');
    }
  }
}
