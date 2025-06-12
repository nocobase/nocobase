/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils/client';
import { ComponentType } from 'react';

export type LLMProviderOptions = {
  components: {
    ProviderSettingsForm?: ComponentType;
    ModelSettingsForm?: ComponentType;
    MessageRenderer?: ComponentType<{
      msg: any;
    }>;
  };
};

export type ToolOptions = {
  invoke: (ctx: any, params: any) => void | Promise<void>;
};

export class AIManager {
  llmProviders = new Registry<LLMProviderOptions>();
  chatSettings = new Map<
    string,
    {
      title: string;
      Component: ComponentType;
    }
  >();
  tools = new Registry<ToolOptions>();

  registerLLMProvider(name: string, options: LLMProviderOptions) {
    this.llmProviders.register(name, options);
  }

  registerTool(name: string, options: ToolOptions) {
    this.tools.register(name, options);
  }
}
