/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginACLClient from '@nocobase/plugin-acl/client';
import PluginWorkflowClient from '@nocobase/plugin-workflow/client';
import { Plugin, lazy } from '@nocobase/client';
import { AIManager } from '../client-v2/manager/ai-manager';
import { tval } from '@nocobase/utils/client';
import { namespace } from './locale';
import { AIPluginFeatureManagerImpl } from '../client-v2/manager/ai-feature-manager';
import { LLMInstruction } from './workflow/nodes/llm';
import { AIEmployeeTrigger } from './workflow/triggers/ai-employee';
import { PermissionsTab } from './ai-employees/permissions/PermissionsTab';
import {
  AIEmployeeShortcutListModel,
  AIEmployeeShortcutModel,
  AIEmployeeButtonModel,
} from '../client-v2/models/ai-employees';
import { AIConfigRepository } from '../client-v2/repositories/AIConfigRepository';
import { FlowModelsContext } from '../client-v2/ai-employees/context/flow-models';
import { DatasourceContext } from '../client-v2/ai-employees/context/datasource';
import { CodeEditorContext } from '../client-v2/ai-employees/context/code-editor';
import { chartConfigWorkContext } from '../client-v2/ai-employees/context/chart-config';
import { setupAICoding } from '../client-v2/ai-employees/ai-coding/setup';
import { setupDataModeling } from '../client-v2/ai-employees/data-modeling/setup';
import { AIEmployeeInstruction } from './workflow/nodes/employee';
import { registerPluginAIClientV2BuiltinTools } from '../client-v2/ai-employees/tools';
import { builtinLLMProviderOptions } from '../client-v2/llm-providers';
import { ChatBoxLayout } from '../client-v2/ai-employees/chatbox/components/ChatBoxLayout';
import { registerPluginAIRunJSFacade } from '../client-v2/runjs/registerAIEmployeeRunJSFacade';
const Employees = lazy(() => import('../client-v2/pages/EmployeesPage'));
const LLMServices = lazy(() => import('../client-v2/pages/LLMServicesPage'));
const MCPSettings = lazy(() => import('../client-v2/pages/MCPSettingsPage'));
const AdminSettings = lazy(() => import('../client-v2/pages/AdminSettingsPage'));
const DatasourceSettingPage = lazy(() => import('../client-v2/pages/DatasourceSettingsPage'));
const { AIResourceContextCollector } = lazy(
  () => import('./ai-employees/1.x/selector/AIContextCollector'),
  'AIResourceContextCollector',
);

export class PluginAIClient extends Plugin {
  features = new AIPluginFeatureManagerImpl();
  aiManager = new AIManager(this.app);

  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.use(ChatBoxLayout);

    this.app.addComponents({
      AIResourceContextCollector,
    });

    this.flowEngine.registerModels({
      AIEmployeeShortcutListModel,
      AIEmployeeShortcutModel,
      AIEmployeeButtonModel,
    });

    this.addPluginSettings();
    this.setupAIFeatures();
    this.setupWorkflow();
    setupDataModeling(this);
    setupAICoding();
  }

  addPluginSettings() {
    this.app.pluginSettingsManager.add('ai', {
      icon: 'TeamOutlined',
      title: tval('AI employees', { ns: namespace }),
      aclSnippet: 'pm.ai',
      isPinned: true,
      sort: 400,
    });
    this.app.pluginSettingsManager.add('ai.employees', {
      icon: 'TeamOutlined',
      title: tval('AI employees', { ns: namespace }),
      aclSnippet: 'pm.ai.employees',
      Component: Employees,
    });
    this.app.pluginSettingsManager.add('ai.llm-services', {
      icon: 'LinkOutlined',
      title: tval('LLM services', { ns: namespace }),
      aclSnippet: 'pm.ai.llm-services',
      Component: LLMServices,
    });
    this.app.pluginSettingsManager.add('ai.mcp-settings', {
      icon: 'ApiOutlined',
      title: tval('MCP settings', { ns: namespace }),
      aclSnippet: 'pm.ai.mcp-settings',
      Component: MCPSettings,
    });
    this.app.pluginSettingsManager.add('ai.datasource', {
      sort: 99,
      icon: 'CloudServerOutlined',
      title: tval('Datasource', { ns: namespace }),
      aclSnippet: 'pm.ai.datasource',
      Component: DatasourceSettingPage,
    });
    this.app.pluginSettingsManager.add('ai.settings', {
      sort: 100,
      icon: 'SettingOutlined',
      title: tval('Settings'),
      aclSnippet: 'pm.ai.settings',
      Component: AdminSettings,
    });

    const aclPlugin = this.app.pm.get(PluginACLClient);
    if (aclPlugin) {
      aclPlugin.settingsUI.addPermissionsTab(PermissionsTab);
    }
  }

  async setupAIFeatures() {
    const aiConfigRepository = new AIConfigRepository(this.app.apiClient, {
      toolsManager: this.app.aiManager.toolsManager,
    });
    this.app.flowEngine.context.defineProperty('aiConfigRepository', { value: aiConfigRepository });
    registerPluginAIRunJSFacade(this.app.flowEngine.context, this.aiManager);

    builtinLLMProviderOptions.forEach(([name, options]) => {
      this.aiManager.registerLLMProvider(name, options);
    });

    this.aiManager.registerWorkContext('flow-model', FlowModelsContext);
    this.aiManager.registerWorkContext('datasource', DatasourceContext);
    this.aiManager.registerWorkContext('code-editor', CodeEditorContext);
    // 使用可视化员工的工作上下文参数
    this.aiManager.registerWorkContext('chart-config', chartConfigWorkContext);

    registerPluginAIClientV2BuiltinTools(this.ai.toolsManager);
  }

  setupWorkflow() {
    const workflow = this.app.pm.get('workflow') as PluginWorkflowClient;
    workflow.registerTrigger('ai-employee', AIEmployeeTrigger);
    workflow.registerInstructionGroup('ai', { label: tval('AI', { ns: namespace }) });
    workflow.registerInstruction('llm', LLMInstruction);
    workflow.registerInstruction('ai-employee', AIEmployeeInstruction);
  }
}

export default PluginAIClient;
export type { LLMProviderOptions, ToolModalProps, ToolOptions } from '../client-v2/manager/ai-manager';
export type { AIEmployee, ToolCall } from '../client-v2/ai-employees/types';
export * from '../client-v2/features';
export { defaultVectorStorePropForm } from '../client-v2/features/components';
export { AIEmployeeActionModel } from '../client-v2/models/ai-employees/AIEmployeeActionModel';
export { useChat } from '../client-v2/ai-employees/chatbox/hooks/useChat';
export { useChatBoxActions } from '../client-v2/ai-employees/chatbox/hooks/useChatBoxActions';
export { getGlobalChatBoxRuntime } from '../client-v2/ai-employees/chatbox/stores/runtime';
export { useChatConversationsStore } from '../client-v2/ai-employees/chatbox/stores/chat-conversations';
export { useAIConfigRepository } from '../client-v2/repositories/hooks/useAIConfigRepository';
export { AIEmployeeProfileCard as ProfileCard } from '../client-v2/ai-employees/ProfileCard';
export { avatars } from '../client-v2/ai-employees/avatars';
