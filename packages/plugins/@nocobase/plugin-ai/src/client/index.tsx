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

    await this.registerFlowModels();

    await this.addPluginSettings();
    await this.setupAIFeatures();
    await this.setupWorkflow();

    const [{ setupDataModeling }, { setupAICoding }] = await Promise.all([
      import('./ai-employees/data-modeling/setup'),
      import('./ai-employees/ai-coding/setup'),
    ]);
    setupDataModeling(this);
    setupAICoding();
  }

  async addPluginSettings() {
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

    const { PermissionsTab } = await import('./ai-employees/permissions/PermissionsTab');
    const aclPlugin = this.app.pm.get(PluginACLClient);
    if (aclPlugin) {
      aclPlugin.settingsUI.addPermissionsTab(PermissionsTab);
    }
  }

  async setupAIFeatures() {
    const [
      { aiEmployeesData },
      { googleGenAIProviderOptions },
      { openaiResponsesProviderOptions },
      { anthropicProviderOptions },
      { openaiCompletionsProviderOptions },
      { deepseekProviderOptions },
      { dashscopeProviderOptions },
      { ollamaProviderOptions },
    ] = await Promise.all([
      import('./ai-employees/flow/context'),
      import('./llm-providers/google-genai'),
      import('./llm-providers/openai/responses'),
      import('./llm-providers/anthropic'),
      import('./llm-providers/openai/completions'),
      import('./llm-providers/deepseek'),
      import('./llm-providers/dashscope'),
      import('./llm-providers/ollama'),
    ]);

    this.app.flowEngine.context.defineProperty(...aiEmployeesData);

    this.aiManager.registerLLMProvider('google-genai', googleGenAIProviderOptions);
    this.aiManager.registerLLMProvider('openai', openaiResponsesProviderOptions);
    this.aiManager.registerLLMProvider('anthropic', anthropicProviderOptions);
    this.aiManager.registerLLMProvider('openai-completions', openaiCompletionsProviderOptions);
    this.aiManager.registerLLMProvider('deepseek', deepseekProviderOptions);
    this.aiManager.registerLLMProvider('dashscope', dashscopeProviderOptions);
    this.aiManager.registerLLMProvider('ollama', ollamaProviderOptions);
    // this.aiManager.registerLLMProvider('tongyi', tongyiProviderOptions);
    this.aiManager.chatSettings.set('messages', {
      title: tval('Messages'),
      Component: MessagesSettings,
    });
    this.aiManager.chatSettings.set('structured-output', {
      title: tval('Structured output'),
      Component: StructuredOutputSettings,
    });

    const [{ FlowModelsContext }, { DatasourceContext }, { CodeEditorContext }, { chartConfigWorkContext }] =
      await Promise.all([
        import('./ai-employees/context/flow-models'),
        import('./ai-employees/context/datasource'),
        import('./ai-employees/context/code-editor'),
        import('./ai-employees/data-visualization/context'),
      ]);

    this.aiManager.registerWorkContext('flow-model', FlowModelsContext);
    this.aiManager.registerWorkContext('datasource', DatasourceContext);
    this.aiManager.registerWorkContext('code-editor', CodeEditorContext);

    // 使用可视化员工的工作上下文参数
    this.aiManager.registerWorkContext('chart-config', chartConfigWorkContext);

    // 使用可视化员工的工具参数
    const [
      { vizSwitchModesTool, vizRunQueryTool },
      { defineCollectionsTool },
      { formFillerTool },
      { chartGeneratorTool },
      { listCodeSnippetTool, getCodeSnippetTool },
      { getContextApisTool, getContextEnvsTool, getContextVarsTool, lintAndTestJSTool },
      { suggestionsTool },
    ] = await Promise.all([
      import('./ai-employees/data-visualization/tools'),
      import('./ai-employees/data-modeling/tools'),
      import('./ai-employees/form-filler/tools'),
      import('./ai-employees/chart-generator/tools'),
      import('./ai-employees/ai-coding/tools'),
      import('./ai-employees/ai-coding/tools/context-tools'),
      import('./ai-employees/suggestions/tools'),
    ]);

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

  async setupWorkflow() {
    const [{ AIEmployeeTrigger }, { LLMInstruction }] = await Promise.all([
      import('./workflow/triggers/ai-employee'),
      import('./workflow/nodes/llm'),
    ]);
    const workflow = this.app.pm.get('workflow') as PluginWorkflowClient;
    workflow.registerTrigger('ai-employee', AIEmployeeTrigger);
    workflow.registerInstructionGroup('ai', { label: tval('AI', { ns: namespace }) });
    workflow.registerInstruction('llm', LLMInstruction);
    // workflow.registerInstruction('ai-employee', AIEmployeeInstruction);
  }

  private async registerFlowModels() {
    const [{ AIEmployeeShortcutListModel, AIEmployeeShortcutModel, AIEmployeeButtonModel }] = await Promise.all([
      import('./ai-employees/flow/models'),
      import('./ai-employees/flow/events'),
    ]);
    this.flowEngine.registerModels({
      AIEmployeeShortcutListModel,
      AIEmployeeShortcutModel,
      AIEmployeeButtonModel,
    });
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
