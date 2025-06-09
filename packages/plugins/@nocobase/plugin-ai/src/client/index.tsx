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
import { CardItem, CollectionField, Plugin, lazy } from '@nocobase/client';
import { AIManager } from './manager/ai-manager';
import { openaiProviderOptions } from './llm-providers/openai';
import { deepseekProviderOptions } from './llm-providers/deepseek';
import { LLMInstruction } from './workflow/nodes/llm';
import { AIEmployeeInstruction } from './workflow/nodes/employee';
import { tval } from '@nocobase/utils/client';
import { namespace } from './locale';
import { aiEmployeesInitializer } from './ai-employees/initializer/AIEmployees';
import { aiEmployeeButtonSettings } from './ai-employees/settings/AIEmployeeButton';
import { withAISelectable } from './ai-employees/selector/withAISelectable';
import { googleGenAIProviderOptions } from './llm-providers/google-genai';
import { AIEmployeeTrigger } from './workflow/triggers/ai-employee';
import { PermissionsTab } from './ai-employees/permissions/PermissionsTab';
import { anthropicProviderOptions } from './llm-providers/anthropic';
const { AIEmployeesProvider } = lazy(() => import('./ai-employees/AIEmployeesProvider'), 'AIEmployeesProvider');
const { Employees } = lazy(() => import('./ai-employees/manager/Employees'), 'Employees');
const { LLMServices } = lazy(() => import('./llm-services/LLMServices'), 'LLMServices');
const { MessagesSettings } = lazy(() => import('./chat-settings/Messages'), 'MessagesSettings');
const { AdminSettings } = lazy(() => import('./admin-settings/AdminSettings'), 'AdminSettings');
const { Chat } = lazy(() => import('./llm-providers/components/Chat'), 'Chat');
const { ModelSelect } = lazy(() => import('./llm-providers/components/ModelSelect'), 'ModelSelect');
const { AIEmployeeButton } = lazy(() => import('./ai-employees/initializer/AIEmployeeButton'), 'AIEmployeeButton');
const { AIFormContextCollector } = lazy(
  () => import('./ai-employees/selector/AIContextCollector'),
  'AIFormContextCollector',
);
// const { PermissionsTab } = lazy(() => import('./ai-employees/permissions/PermissionsTab'), 'PermissionsTab');

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
      AIEmployeeButton,
      AIFormContextCollector,
      CardItem: withAISelectable(CardItem, {
        selectType: 'blocks',
      }),
      CollectionField: withAISelectable(CollectionField, {
        selectType: 'fields',
      }),
    });
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

    this.app.schemaInitializerManager.addItem(
      'table:configureActions',
      'enableActions.aiEmployees',
      aiEmployeesInitializer,
    );
    this.app.schemaInitializerManager.addItem(
      'details:configureActions',
      'enableActions.aiEmployees',
      aiEmployeesInitializer,
    );
    this.app.schemaInitializerManager.addItem(
      'createForm:configureActions',
      'enableActions.aiEmployees',
      aiEmployeesInitializer,
    );
    this.app.schemaInitializerManager.addItem(
      'editForm:configureActions',
      'enableActions.aiEmployees',
      aiEmployeesInitializer,
    );
    this.app.schemaSettingsManager.add(aiEmployeeButtonSettings);

    const aclPlugin = this.app.pm.get(PluginACLClient);
    if (aclPlugin) {
      aclPlugin.settingsUI.addPermissionsTab(PermissionsTab);
    }

    this.aiManager.registerLLMProvider('openai', openaiProviderOptions);
    this.aiManager.registerLLMProvider('deepseek', deepseekProviderOptions);
    this.aiManager.registerLLMProvider('google-genai', googleGenAIProviderOptions);
    this.aiManager.registerLLMProvider('anthropic', anthropicProviderOptions);
    // this.aiManager.registerLLMProvider('tongyi', tongyiProviderOptions);
    this.aiManager.chatSettings.set('messages', {
      title: tval('Messages'),
      Component: MessagesSettings,
    });
    this.aiManager.registerTool('formFiller', {
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
