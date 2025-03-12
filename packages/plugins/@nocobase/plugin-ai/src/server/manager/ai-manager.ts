/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/server';
import { LLMProvider } from '../llm-providers/provider';

export type LLMProviderOptions = {
  title: string;
  provider: new (opts: { app: Application; serviceOptions?: any; chatOptions?: any }) => LLMProvider;
};

export class AIManager {
  llmProviders = new Map<string, LLMProviderOptions>();

  registerLLMProvider(name: string, options: LLMProviderOptions) {
    this.llmProviders.set(name, options);
  }

  listLLMProviders() {
    const providers = this.llmProviders.entries();
    return Array.from(providers).map(([name, { title }]) => ({ name, title }));
  }
}
