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
import {
  BusinessReportCard,
  BusinessReportModal,
  BusinessReportModalFooter,
  ChartGeneratorCard,
  SubAgentDispatchCard,
  SuggestionsOptionsCard,
} from './ai-employees/tools';
import { FlowModelsContext } from './ai-employees/context/flow-models';
import { chartConfigWorkContext } from './ai-employees/context/chart-config';
import { CodeEditorContext } from './ai-employees/context/code-editor';
import { DatasourceContext } from './ai-employees/context/datasource';
import { formFillerTool } from './ai-employees/form-filler/tools';
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
    this.ai.toolsManager.registerTools('chartGenerator', {
      ui: {
        card: ChartGeneratorCard,
      },
    });
    this.ai.toolsManager.registerTools('dispatch-sub-agent-task', {
      ui: {
        card: SubAgentDispatchCard,
      },
    });
    this.ai.toolsManager.registerTools('suggestions', {
      ui: {
        card: SuggestionsOptionsCard,
      },
    });
    this.ai.toolsManager.registerTools('businessReportGenerator', {
      ui: {
        card: BusinessReportCard,
        modal: {
          title: 'Business analysis report',
          hideOkButton: true,
          props: {
            width: '92%',
            styles: {
              body: {
                height: 'calc(100vh - 240px)',
                maxHeight: 'calc(100vh - 240px)',
                overflow: 'hidden',
              },
            },
          },
          footer: BusinessReportModalFooter,
          Component: BusinessReportModal,
        },
      },
    });
    this.ai.toolsManager.registerTools(...formFillerTool);
    this.aiManager.registerWorkContext('flow-model', FlowModelsContext);
    this.aiManager.registerWorkContext('datasource', DatasourceContext);
    this.aiManager.registerWorkContext('code-editor', CodeEditorContext);
    this.aiManager.registerWorkContext('chart-config', chartConfigWorkContext);
    this.app.use(ChatBoxLayout);
  }
}

export default PluginAIClientV2;
