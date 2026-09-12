/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import PluginAIClientV2 from '@nocobase/plugin-ai/client-v2';
import { gigachatProviderOptions } from './llm-providers/gigachat';

export class PluginAIGigaChatClientV2 extends Plugin<object, Application> {
  async load() {
    this.aiPlugin.aiManager.registerLLMProvider('gigachat', gigachatProviderOptions);
  }

  private get aiPlugin(): PluginAIClientV2 {
    const plugin = this.app.pm.get('ai') ?? this.app.pm.get(PluginAIClientV2);
    if (!plugin) {
      throw new Error('plugin-ai is required before registering the GigaChat LLM provider');
    }
    return plugin as PluginAIClientV2;
  }
}

export default PluginAIGigaChatClientV2;
