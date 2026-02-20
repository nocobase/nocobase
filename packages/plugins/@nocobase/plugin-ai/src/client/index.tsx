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
import { AIManager } from './manager/ai-manager';
import { tval } from '@nocobase/utils/client';
import { namespace } from './locale';
import { AIPluginFeatureManagerImpl } from './manager/ai-feature-manager';
import { LLMInstruction } from './workflow/nodes/llm';
import { AIEmployeeTrigger } from './workflow/triggers/ai-employee';
import { anthropicProviderOptions } from './llm-providers/anthropic';
import { dashscopeProviderOptions } from './llm-providers/dashscope';
import { deepseekProviderOptions } from './llm-providers/deepseek';
import { googleGenAIProviderOptions } from './llm-providers/google-genai';
import { ollamaProviderOptions } from './llm-providers/ollama';
import { kimiProviderOptions } from './llm-providers/kimi';
import { openaiCompletionsProviderOptions } from './llm-providers/openai/completions';
import { openaiResponsesProviderOptions } from './llm-providers/openai/responses';
import { PermissionsTab } from './ai-employees/permissions/PermissionsTab';
import {
  AIEmployeeShortcutListModel,
  AIEmployeeShortcutModel,
  AIEmployeeButtonModel,
} from './ai-employees/flow/models';
import './ai-employees/flow/events';
import { aiEmployeesData } from './ai-employees/flow/context';
import { LLMServicesRepository } from './llm-services/LLMServicesRepository';
import { FlowModelsContext } from './ai-employees/context/flow-models';
import { DatasourceContext } from './ai-employees/context/datasource';
import { CodeEditorContext } from './ai-employees/context/code-editor';
import { chartConfigWorkContext } from './ai-employees/data-visualization/context';
import { defineCollectionsTool } from './ai-employees/data-modeling/tools';
import { formFillerTool } from './ai-employees/form-filler/tools';
import { chartGeneratorTool } from './ai-employees/chart-generator/tools';
import { getCodeSnippetTool, listCodeSnippetTool } from './ai-employees/ai-coding/tools';
import {
  getContextApisTool,
  getContextEnvsTool,
  getContextVarsTool,
  lintAndTestJSTool,
} from './ai-employees/ai-coding/tools/context-tools';
import { vizSwitchModesTool, vizRunQueryTool } from './ai-employees/data-visualization/tools';
import { suggestionsTool } from './ai-employees/suggestions/tools';
import { setupAICoding } from './ai-employees/ai-coding/setup';
import { setupDataModeling } from './ai-employees/data-modeling/setup';
const { AIEmployeesProvider } = lazy(() => import('./ai-employees/AIEmployeesProvider'), 'AIEmployeesProvider');
const { Employees } = lazy(() => import('./ai-employees/admin/Employees'), 'Employees');
const { LLMServices } = lazy(() => import('./llm-services/LLMServices'), 'LLMServices');
const { MessagesSettings } = lazy(() => import('./chat-settings/Messages'), 'MessagesSettings');
const { StructuredOutputSettings } = lazy(() => import('./chat-settings/StructuredOutput'), 'StructuredOutputSettings');
const { AdminSettings } = lazy(() => import('./admin-settings/AdminSettings'), 'AdminSettings');
const { DatasourceSettingPage } = lazy(() => import('./ai-employees/admin/datasource'), 'DatasourceSettingPage');
const { Chat } = lazy(() => import('./llm-providers/components/Chat'), 'Chat');
const { ModelSelect } = lazy(() => import('./llm-providers/components/ModelSelect'), 'ModelSelect');
const { AIResourceContextCollector } = lazy(
  () => import('./ai-employees/1.x/selector/AIContextCollector'),
  'AIResourceContextCollector',
);

export class PluginAIClient extends Plugin {
  features = new AIPluginFeatureManagerImpl();
  aiManager = new AIManager();

  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.use(AIEmployeesProvider);

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
    this.app.flowEngine.context.defineProperty(...aiEmployeesData);

    const llmServicesRepository = new LLMServicesRepository(this.app.apiClient);
    this.app.flowEngine.context.defineProperty('llmServicesRepository', { value: llmServicesRepository });

    this.aiManager.registerLLMProvider('google-genai', googleGenAIProviderOptions);
    this.aiManager.registerLLMProvider('openai', openaiResponsesProviderOptions);
    this.aiManager.registerLLMProvider('anthropic', anthropicProviderOptions);
    this.aiManager.registerLLMProvider('openai-completions', openaiCompletionsProviderOptions);
    this.aiManager.registerLLMProvider('deepseek', deepseekProviderOptions);
    this.aiManager.registerLLMProvider('dashscope', dashscopeProviderOptions);
    this.aiManager.registerLLMProvider('ollama', ollamaProviderOptions);
    this.aiManager.registerLLMProvider('kimi', kimiProviderOptions);
    // this.aiManager.registerLLMProvider('tongyi', tongyiProviderOptions);
    this.aiManager.chatSettings.set('messages', {
      title: tval('Messages'),
      Component: MessagesSettings,
    });
    this.aiManager.chatSettings.set('structured-output', {
      title: tval('Structured output'),
      Component: StructuredOutputSettings,
    });

    this.aiManager.registerWorkContext('flow-model', FlowModelsContext);
    this.aiManager.registerWorkContext('datasource', DatasourceContext);
    this.aiManager.registerWorkContext('code-editor', CodeEditorContext);
    // 使用可视化员工的工作上下文参数
    this.aiManager.registerWorkContext('chart-config', chartConfigWorkContext);

    this.ai.toolsManager.registerTools(...vizSwitchModesTool);
    this.ai.toolsManager.registerTools(...vizRunQueryTool);
    this.ai.toolsManager.registerTools(...defineCollectionsTool);
    this.ai.toolsManager.registerTools(...formFillerTool);
    this.ai.toolsManager.registerTools(...chartGeneratorTool);
    this.ai.toolsManager.registerTools(...listCodeSnippetTool);
    this.ai.toolsManager.registerTools(...getCodeSnippetTool);
    this.ai.toolsManager.registerTools(...suggestionsTool);
    this.ai.toolsManager.registerTools(...getContextApisTool);
    this.ai.toolsManager.registerTools(...getContextEnvsTool);
    this.ai.toolsManager.registerTools(...getContextVarsTool);
    this.ai.toolsManager.registerTools(...lintAndTestJSTool);
  }

  setupWorkflow() {
    const workflow = this.app.pm.get('workflow') as PluginWorkflowClient;
    workflow.registerTrigger('ai-employee', AIEmployeeTrigger);
    workflow.registerInstructionGroup('ai', { label: tval('AI', { ns: namespace }) });
    workflow.registerInstruction('llm', LLMInstruction);
    // workflow.registerInstruction('ai-employee', AIEmployeeInstruction);
  }
}

export default PluginAIClient;
export { ModelSelect, Chat };
export type { LLMProviderOptions, ToolOptions } from './manager/ai-manager';
export type { ToolCall } from './ai-employees/types';
export * from './features';
export { AIEmployeeActionModel } from './ai-employees/flow/models/AIEmployeeActionModel';
export { useAIEmployeesData } from './ai-employees/hooks/useAIEmployeesData';
export { useChatMessagesStore } from './ai-employees/chatbox/stores/chat-messages';
export { useChatBoxStore } from './ai-employees/chatbox/stores/chat-box';
export { useChatBoxActions } from './ai-employees/chatbox/hooks/useChatBoxActions';
export { ProfileCard } from './ai-employees/ProfileCard';
export { avatars } from './ai-employees/avatars';
