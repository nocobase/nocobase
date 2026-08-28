/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { gigachatProviderOptions } from '../client-v2/llm-providers/gigachat';

type AIPluginClientLike = {
  aiManager: {
    registerLLMProvider: (name: string, options: typeof gigachatProviderOptions) => void;
  };
};

export class PluginAIGigaChatClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.aiPlugin.aiManager.registerLLMProvider('gigachat', gigachatProviderOptions);
  }

  private get aiPlugin(): AIPluginClientLike {
    const plugin = this.app.pm.get('ai');
    if (!plugin) {
      throw new Error('plugin-ai is required before registering the GigaChat LLM provider');
    }
    return plugin as AIPluginClientLike;
  }
}

export default PluginAIGigaChatClient;
