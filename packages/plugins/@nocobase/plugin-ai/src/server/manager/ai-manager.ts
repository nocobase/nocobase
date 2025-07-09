/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LLMProvider } from '../llm-providers/provider';
import PluginAIServer from '../plugin';
import { Application } from '@nocobase/server';
import _ from 'lodash';
import { AIToolRegister, ToolGroupRegisterOptions, ToolManager, ToolOptions, ToolRegisterDelegate, ToolRegisterOptions } from './tool-manager';

export type LLMProviderOptions = {
  title: string;
  provider: new (opts: {
    app: Application;
    serviceOptions?: any;
    chatOptions?: any;
    abortSignal?: AbortSignal;
  }) => LLMProvider;
};

export class AIManager implements AIToolRegister {
  llmProviders = new Map<string, LLMProviderOptions>();
  toolManager = new ToolManager();
  constructor(protected plugin: PluginAIServer) {}

  registerLLMProvider(name: string, options: LLMProviderOptions) {
    this.llmProviders.set(name, options);
  }

  listLLMProviders() {
    const providers = this.llmProviders.entries();
    return Array.from(providers).map(([name, { title }]) => ({ name, title }));
  }

  registerToolGroup(options: ToolGroupRegisterOptions) {
    this.toolManager.registerToolGroup(options);
  }

  registerDynamicTool(delegate: ToolRegisterDelegate) {
    this.toolManager.registerDynamicTool(delegate);
  }

  registerTools(options: ToolRegisterOptions | ToolRegisterOptions[]) {
    this.toolManager.registerTools(options);
  }

  async getTool(name: string, raw = false): Promise<ToolOptions> {
    return await this.toolManager.getTool(name, raw);
  }

  async listTools(): Promise<
    {
      group: ToolGroupRegisterOptions;
      tools: ToolOptions[];
    }[]
  > {
    return await this.toolManager.listTools();
  }
}
