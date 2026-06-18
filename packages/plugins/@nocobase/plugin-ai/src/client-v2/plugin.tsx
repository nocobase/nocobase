/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import { ChatBoxLayout } from './ai-employees/chatbox/components';
import { registerPluginAIClientV2BuiltinTools } from './ai-employees/tools';
import { FlowModelsContext } from './ai-employees/context/flow-models';
import { chartConfigWorkContext } from './ai-employees/context/chart-config';
import { CodeEditorContext } from './ai-employees/context/code-editor';
import { DatasourceContext } from './ai-employees/context/datasource';
import { AIManager } from './manager/ai-manager';
import { AIPluginFeatureManagerImpl } from './manager/ai-feature-manager';
import { AIConfigRepository } from './repositories/AIConfigRepository';

type AIFlowContext = {
  aiConfigRepository?: AIConfigRepository;
  defineProperty: (name: string, descriptor: { value: unknown }) => void;
};

export class PluginAIClientV2 extends Plugin<any, Application> {
  features = new AIPluginFeatureManagerImpl();
  aiManager = new AIManager();

  async load() {
    const context = this.app.flowEngine.context as AIFlowContext;
    if (!context.aiConfigRepository) {
      context.defineProperty('aiConfigRepository', {
        value: new AIConfigRepository(this.app.apiClient, {
          toolsManager: this.ai.toolsManager,
        }),
      });
    }
    registerPluginAIClientV2BuiltinTools(this.ai.toolsManager);
    this.aiManager.registerWorkContext('flow-model', FlowModelsContext);
    this.aiManager.registerWorkContext('datasource', DatasourceContext);
    this.aiManager.registerWorkContext('code-editor', CodeEditorContext);
    this.aiManager.registerWorkContext('chart-config', chartConfigWorkContext);
    this.app.use(ChatBoxLayout);
  }
}

export default PluginAIClientV2;
