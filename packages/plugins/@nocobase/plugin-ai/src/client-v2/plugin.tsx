/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import { AIPluginFeatureManagerImpl } from './manager/ai-feature-manager';
import { AIConfigRepository } from './repositories/AIConfigRepository';

type AIFlowContext = {
  aiConfigRepository?: AIConfigRepository;
  defineProperty: (name: string, descriptor: { value: unknown }) => void;
};

export class PluginAIClientV2 extends Plugin<any, Application> {
  features = new AIPluginFeatureManagerImpl();

  async load() {
    const context = this.app.flowEngine.context as AIFlowContext;
    if (!context.aiConfigRepository) {
      context.defineProperty('aiConfigRepository', {
        value: new AIConfigRepository(this.app.apiClient, {
          toolsManager: this.ai.toolsManager,
        }),
      });
    }
  }
}

export default PluginAIClientV2;
