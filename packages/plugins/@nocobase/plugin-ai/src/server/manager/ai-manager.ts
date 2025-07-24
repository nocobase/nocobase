/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LLMProvider, LLMProviderOptions } from '../llm-providers/provider';
import PluginAIServer from '../plugin';
import _ from 'lodash';
import { ToolManager } from './tool-manager';

export type LLMProviderMeta = {
  title: string;
  provider: new (opts: LLMProviderOptions) => LLMProvider;
};

export class AIManager {
  llmProviders = new Map<string, LLMProviderMeta>();
  toolManager = new ToolManager();
  constructor(protected plugin: PluginAIServer) {}

  registerLLMProvider(name: string, meta: LLMProviderMeta) {
    this.llmProviders.set(name, meta);
  }

  listLLMProviders() {
    const providers = this.llmProviders.entries();
    return Array.from(providers).map(([name, { title }]) => ({ name, title }));
  }
}
