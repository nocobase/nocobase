/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';

export type McpTool = {
  name: string;
  description: string;
  inputSchema?: any;
  call: (args: Record<string, any>) => Promise<any>;
};

export class McpToolsManager {
  private tools = new Registry<McpTool>();

  registerTools(tools: McpTool[]) {
    for (const tool of tools) {
      this.tools.register(tool.name, tool);
    }
  }

  listTools() {
    return [...this.tools.getValues()];
  }

  getTool(name: string) {
    return this.tools.get(name);
  }
}
