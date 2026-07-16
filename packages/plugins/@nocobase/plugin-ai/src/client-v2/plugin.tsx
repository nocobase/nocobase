/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import PluginACLClientV2 from '@nocobase/plugin-acl/client-v2';
import { ChatBoxLayout } from './ai-employees/chatbox/components';
import { registerPluginAIClientV2BuiltinTools } from './ai-employees/tools';
import { FlowModelsContext } from './ai-employees/context/flow-models';
import { chartConfigWorkContext } from './ai-employees/context/chart-config';
import { CodeEditorContext } from './ai-employees/context/code-editor';
import { AIManager } from './manager/ai-manager';
import { AIPluginFeatureManagerImpl } from './manager/ai-feature-manager';
import { AIConfigRepository } from './repositories/AIConfigRepository';
import { builtinLLMProviderOptions } from './llm-providers';
import { registerPluginAIWorkflow } from './workflow/register';
import { setupAICoding } from './ai-employees/ai-coding/setup';
import { registerPluginAIRunJSFacade } from './runjs/registerAIEmployeeRunJSFacade';
import {
  AIChatDemoBlockModel,
  AIChatDemoChatContentBlockModel,
  AIChatDemoConversationListBlockModel,
  AIChatDemoMessageListBlockModel,
  AIChatDemoMessagesAndSenderBlockModel,
  AIChatDemoNewActionModel,
  AIChatDemoSenderBlockModel,
} from './block';
import { AIChatBoxBlockModel, AIChatBoxCoreModel } from './block/ai-chat-box';

type AIFlowContext = {
  aiConfigRepository?: AIConfigRepository;
  defineProperty: (name: string, descriptor: { value: unknown }) => void;
};

type PluginSettingsManagerLike = {
  addMenuItem: (options: Record<string, unknown>) => void;
  addPageTabItem: (options: Record<string, unknown>) => void;
};

type ACLPluginLike = {
  settingsUI: {
    addPermissionsTab: (options: Record<string, unknown>) => void;
  };
};

type PluginManagerLike = {
  get: (plugin: typeof PluginACLClientV2) => ACLPluginLike | undefined;
};

export const registerPluginAIPermissionsTab = (pluginManager: PluginManagerLike, t: (key: string) => string) => {
  const aclPlugin = pluginManager.get(PluginACLClientV2);
  aclPlugin?.settingsUI.addPermissionsTab({
    key: 'ai-employees',
    label: t('AI employees'),
    sort: 30,
    componentLoader: () => import('./pages/permissions/PermissionsTab'),
  });
};

export const registerPluginAISettingsPages = (
  pluginSettingsManager: PluginSettingsManagerLike,
  t: (key: string) => string,
) => {
  pluginSettingsManager.addMenuItem({
    key: 'ai',
    icon: 'TeamOutlined',
    title: t('AI employees'),
    aclSnippet: 'pm.ai',
    isPinned: true,
    sort: 400,
    showTabs: true,
  });
  pluginSettingsManager.addPageTabItem({
    menuKey: 'ai',
    key: 'employees',
    icon: 'TeamOutlined',
    title: t('AI employees'),
    aclSnippet: 'pm.ai.employees',
    componentLoader: () => import('./pages/EmployeesPage'),
    sort: 10,
  });
  pluginSettingsManager.addPageTabItem({
    menuKey: 'ai',
    key: 'llm-services',
    icon: 'LinkOutlined',
    title: t('LLM services'),
    aclSnippet: 'pm.ai.llm-services',
    componentLoader: () => import('./pages/LLMServicesPage'),
    sort: 20,
  });
  pluginSettingsManager.addPageTabItem({
    menuKey: 'ai',
    key: 'mcp-settings',
    icon: 'ApiOutlined',
    title: t('MCP settings'),
    aclSnippet: 'pm.ai.mcp-settings',
    componentLoader: () => import('./pages/MCPSettingsPage'),
    sort: 30,
  });
  pluginSettingsManager.addPageTabItem({
    menuKey: 'ai',
    key: 'settings',
    icon: 'SettingOutlined',
    title: t('Settings'),
    aclSnippet: 'pm.ai.settings',
    componentLoader: () => import('./pages/AdminSettingsPage'),
    sort: 100,
  });
};

export class PluginAIClientV2 extends Plugin<object, Application> {
  features = new AIPluginFeatureManagerImpl();
  aiManager = new AIManager(this.app);

  async load() {
    const context = this.app.flowEngine.context as AIFlowContext;
    if (!context.aiConfigRepository) {
      context.defineProperty('aiConfigRepository', {
        value: new AIConfigRepository(this.app.apiClient, {
          toolsManager: this.ai.toolsManager,
        }),
      });
    }
    registerPluginAIRunJSFacade(context, this.aiManager);
    registerPluginAISettingsPages(this.pluginSettingsManager, this.t.bind(this));
    registerPluginAIPermissionsTab(this.app.pm, this.t.bind(this));
    registerPluginAIWorkflow(this.app.pm);
    builtinLLMProviderOptions.forEach(([name, options]) => {
      this.aiManager.registerLLMProvider(name, options);
    });
    registerPluginAIClientV2BuiltinTools(this.ai.toolsManager);
    this.aiManager.registerWorkContext('flow-model', FlowModelsContext);
    this.aiManager.registerWorkContext('code-editor', CodeEditorContext);
    this.aiManager.registerWorkContext('chart-config', chartConfigWorkContext);
    setupAICoding();
    this.flowEngine.registerModels({
      AIChatBoxBlockModel,
      AIChatBoxCoreModel,
      AIChatDemoBlockModel,
      AIChatDemoMessagesAndSenderBlockModel,
      AIChatDemoChatContentBlockModel,
      AIChatDemoMessageListBlockModel,
      AIChatDemoSenderBlockModel,
      AIChatDemoConversationListBlockModel,
      AIChatDemoNewActionModel,
    });
    this.flowEngine.registerModelLoaders({
      AIEmployeeShortcutModel: {
        loader: () => import('./models/ai-employees'),
      },
      AIEmployeeShortcutListModel: {
        loader: () => import('./models/ai-employees'),
      },
      AIEmployeeButtonModel: {
        loader: () => import('./models/ai-employees'),
      },
      AIEmployeeActionModel: {
        extends: 'ActionModel',
        loader: () => import('./models/ai-employees'),
      },
    });
    this.app.use(ChatBoxLayout);
  }
}

export default PluginAIClientV2;
export {
  registerPluginAIRunJSContextContribution,
  registerPluginAIRunJSFacade,
} from './runjs/registerAIEmployeeRunJSFacade';
