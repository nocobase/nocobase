import { Registry } from "@nocobase/utils";
import { Context } from '@nocobase/actions';
import { ZodObject } from "zod";
import zodToJsonSchema from 'zod-to-json-schema';
import _ from "lodash";

export interface AIToolRegister {
  registerToolGroup(options: ToolGroupRegisterOptions);
  registerDynamicTool(delegate: ToolRegisterDelegate);
  registerTools<T>(options: ToolRegisterOptions | ToolRegisterOptions[]);
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
};

export type ToolRegisterDelegate = {
  groupName: string;
  getTools: () => Promise<ToolRegisterOptions[]>;
};

const DEFAULT_TOOL_GROUP: ToolGroupRegisterOptions = {
  groupName: 'others',
  title: '{{t("Others")}}',
  description: '{{t("Other tools")}}',
};

export class ToolManager implements AIToolRegister {

  tools = new Registry<ToolRegisterOptions>();
  groups = new Registry<ToolGroupRegisterOptions>();
  delegates = new Array<ToolRegisterDelegate>();

  constructor() {
    this.groups.register(DEFAULT_TOOL_GROUP.groupName, DEFAULT_TOOL_GROUP);
  }

  registerToolGroup(options: ToolGroupRegisterOptions) {
    this.groups.register(options.groupName, options);
  }

  registerDynamicTool(delegate: ToolRegisterDelegate) {
    this.delegates.push(delegate);
  }

  registerTools<T>(options: ToolRegisterOptions | ToolRegisterOptions[]) {
    const list = _.isArray(options) ? options : [options];
    list.forEach((x) => {
      if (!x.groupName) {
        x.groupName = DEFAULT_TOOL_GROUP.groupName;
      }
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
            ...tool
          };
          item.tool.name = `${groupName}-${item.tool.name}}`;
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
      const delegateTools = await delegate.getTools();
      toolRegisters.push(...delegateTools);
    }

    const toolList = toolRegisters
      .map(x => {
        const t = {...x};
        t.tool.schema = this.processSchema(t.tool.schema, true);
        return t;
      });

    const groupedTools = _.groupBy(toolList, (item) => item.groupName);
    return Array.from(groupRegisters).map((group) => ({
      group,
      tools: groupedTools[group.groupName]?.map((x) => x.tool) ?? [],
    }));
  }

  private async _getTool(
    register: Registry<ToolRegisterOptions>,
    name: string,
    raw = false,
  ): Promise<ToolOptions> {
    const { tool } = register.get(name);
    if (!tool) {
      return null;
    }
    return {
      ...tool,
      schema: this.processSchema(tool.schema, raw),
    };
  }

  private processSchema (schema: any, raw = false) {
    if (!schema) return undefined;
    try {
      // Use type assertion to break the recursive type checking
      return (schema as any) instanceof ZodObject && raw ? zodToJsonSchema(schema as any) : schema;
    } catch (error) {
      // Fallback if zodToJsonSchema fails
      return schema;
    }
  };
}
