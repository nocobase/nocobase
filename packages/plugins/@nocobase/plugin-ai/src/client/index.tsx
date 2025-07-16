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
import { openaiProviderOptions } from './llm-providers/openai';
import { deepseekProviderOptions } from './llm-providers/deepseek';
import { LLMInstruction } from './workflow/nodes/llm';
import { tval } from '@nocobase/utils/client';
import { namespace } from './locale';
import { googleGenAIProviderOptions } from './llm-providers/google-genai';
import { AIEmployeeTrigger } from './workflow/triggers/ai-employee';
import { PermissionsTab } from './ai-employees/permissions/PermissionsTab';
import { anthropicProviderOptions } from './llm-providers/anthropic';
import { AIEmployeeShortcutListModel, AIEmployeeShortcutModel } from './ai-employees/flow/models';
import { defineCollectionsTool } from './ai-employees/data-modeling/tools';
const { AIEmployeesProvider } = lazy(() => import('./ai-employees/AIEmployeesProvider'), 'AIEmployeesProvider');
const { Employees } = lazy(() => import('./ai-employees/manager/Employees'), 'Employees');
const { LLMServices } = lazy(() => import('./llm-services/LLMServices'), 'LLMServices');
const { MessagesSettings } = lazy(() => import('./chat-settings/Messages'), 'MessagesSettings');
const { AdminSettings } = lazy(() => import('./admin-settings/AdminSettings'), 'AdminSettings');
const { Chat } = lazy(() => import('./llm-providers/components/Chat'), 'Chat');
const { ModelSelect } = lazy(() => import('./llm-providers/components/ModelSelect'), 'ModelSelect');
const { AIResourceContextCollector } = lazy(
  () => import('./ai-employees/selector/AIContextCollector'),
  'AIResourceContextCollector',
);

export class PluginAIClient extends Plugin {
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
    });

    this.addPluginSettings();
    this.setupAIFeatures();
    this.setupWorkflow();
  }

  addPluginSettings() {
    this.app.pluginSettingsManager.add('ai', {
      icon: 'TeamOutlined',
      title: tval('AI employees', { ns: namespace }),
      aclSnippet: 'pm.ai',
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
    this.app.pluginSettingsManager.add('ai.settings', {
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

  setupAIFeatures() {
    this.aiManager.registerLLMProvider('openai', openaiProviderOptions);
    this.aiManager.registerLLMProvider('deepseek', deepseekProviderOptions);
    this.aiManager.registerLLMProvider('google-genai', googleGenAIProviderOptions);
    this.aiManager.registerLLMProvider('anthropic', anthropicProviderOptions);
    // this.aiManager.registerLLMProvider('tongyi', tongyiProviderOptions);
    this.aiManager.chatSettings.set('messages', {
      title: tval('Messages'),
      Component: MessagesSettings,
    });
    // this.aiManager.registerWorkContext('classic-pages', ClassicPagesContext);
    // this.aiManager.registerWorkContext('collection-definitions', CollectionDefinitionsContext);
    this.aiManager.registerTool(...defineCollectionsTool);
    this.aiManager.registerTool('frontEnd', 'formFiller', {
      invoke: (ctx, params) => {
        const { form: uid, data } = params;
        if (!uid || !data) {
          return;
        }
        const form = ctx[uid]?.form;
        if (!form) {
          return;
        }
        form.setValues(data);
      },
    });
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
export type { LLMProviderOptions } from './manager/ai-manager';
