/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import { DynamicToolsProvider, ToolsEntry, ToolsFilter, ToolsManager, ToolsOptions } from './types';
import _ from 'lodash';

export class DefaultToolsManager implements ToolsManager {
  constructor(
    private readonly tools = new Registry<ToolsEntry>(),
    private readonly dynamicTools: DynamicToolsProvider[] = [],
  ) {}

  async getTools(toolName: string): Promise<ToolsEntry> {
    const target = this.tools.get(toolName);
    if (target) {
      return target;
    }
    const dynamicTools = await this.syncDynamicTools();
    return dynamicTools.find((x) => x.definition.name === toolName);
  }

  async listTools(filter?: ToolsFilter): Promise<ToolsEntry[]> {
    const toolsList = await this.getToolsList();
    return toolsList.filter((x) => {
      if (!filter) {
        return true;
      }

      let result = true;
      if (filter.scope) {
        result &&= filter.scope === x.scope;
      }

      if (filter.defaultPermission) {
        result &&= filter.defaultPermission === x.defaultPermission;
      }

      if (filter.silence != null && filter.silence !== undefined) {
        result &&= filter.silence === x.silence;
      }

      return result;
    });
  }

  registerTools(options: ToolsOptions | ToolsOptions[]): void {
    const list = _.isArray(options) ? options : [options];
    for (const item of list) {
      const toolsEntry = { ...item } as ToolsEntry;
      if (!toolsEntry.execution) {
        toolsEntry.execution = 'backend';
      }
      if (!toolsEntry.defaultPermission) {
        toolsEntry.defaultPermission = 'ASK';
      }
      toolsEntry.silence = toolsEntry.silence === true;
      if (!toolsEntry.introduction) {
        toolsEntry.introduction = {
          title: toolsEntry.definition.name,
        };
      }
      this.tools.register(item.definition.name, toolsEntry);
    }
  }

  registerDynamicTools(provider: DynamicToolsProvider): void {
    this.dynamicTools.push(provider);
  }

  private async getToolsList(): Promise<ToolsEntry[]> {
    const dynamicTools = await this.syncDynamicTools();
    return [...this.tools.getValues(), ...dynamicTools];
  }

  private async syncDynamicTools(): Promise<ToolsEntry[]> {
    if (this.dynamicTools.length === 0) {
      return [];
    }
    const registry = new Registry<ToolsEntry>();
    const ephemeral = new DefaultToolsManager(registry);
    await Promise.all(this.dynamicTools.map((register) => register(ephemeral)));
    return [...registry.getValues()];
  }
}

export function defineTools(options: ToolsOptions) {
  return options;
}

export * from './types';
