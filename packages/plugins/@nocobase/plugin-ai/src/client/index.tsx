/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, lazy } from '@nocobase/client';
import { AIManager } from './manager/ai-manager';
import { openaiProviderOptions } from './llm-providers/openai';
import { deepseekProviderOptions } from './llm-providers/deepseek';
import PluginWorkflowClient from '@nocobase/plugin-workflow/client';
import { LLMInstruction } from './workflow/nodes/llm';
import { AIEmployeeInstruction } from './workflow/nodes/employee';
import { tval } from '@nocobase/utils/client';
import { namespace } from './locale';
import { detailsAIEmployeesInitializer, formAIEmployeesInitializer } from './ai-employees/initializer/AIEmployees';
import { aiEmployeeButtonSettings } from './ai-employees/settings/AIEmployeeButton';
import { useDetailsAIEmployeeChatContext, useFormAIEmployeeChatContext } from './ai-employees/useBlockChatContext';
const { AIEmployeesProvider } = lazy(() => import('./ai-employees/AIEmployeesProvider'), 'AIEmployeesProvider');
const { AIEmployeeChatProvider } = lazy(
  () => import('./ai-employees/AIEmployeeChatProvider'),
  'AIEmployeeChatProvider',
);
const { Employees } = lazy(() => import('./ai-employees/manager/Employees'), 'Employees');
const { LLMServices } = lazy(() => import('./llm-services/LLMServices'), 'LLMServices');
const { MessagesSettings } = lazy(() => import('./chat-settings/Messages'), 'MessagesSettings');
const { ModelSelect } = lazy(() => import('./llm-providers/components/ModelSelect'), 'ModelSelect');
const { AIEmployeeButton } = lazy(() => import('./ai-employees/initializer/AIEmployeeButton'), 'AIEmployeeButton');

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
      AIEmployeeChatProvider,
    });
    this.app.addScopes({
      useDetailsAIEmployeeChatContext,
      useFormAIEmployeeChatContext,
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

    this.app.schemaInitializerManager.addItem(
      'details:configureActions',
      'enableActions.aiEmployees',
      detailsAIEmployeesInitializer,
    );
    this.app.schemaInitializerManager.addItem(
      'createForm:configureActions',
      'enableActions.aiEmployees',
      formAIEmployeesInitializer,
    );
    this.app.schemaSettingsManager.add(aiEmployeeButtonSettings);

    this.aiManager.registerLLMProvider('openai', openaiProviderOptions);
    this.aiManager.registerLLMProvider('deepseek', deepseekProviderOptions);
    this.aiManager.chatSettings.set('messages', {
      title: tval('Messages'),
      Component: MessagesSettings,
    });

    const workflow = this.app.pm.get('workflow') as PluginWorkflowClient;
    workflow.registerInstructionGroup('ai', { label: tval('AI', { ns: namespace }) });
    workflow.registerInstruction('llm', LLMInstruction);
    workflow.registerInstruction('ai-employee', AIEmployeeInstruction);
  }
}

export default PluginAIClient;
export { ModelSelect };
export type { LLMProviderOptions } from './manager/ai-manager';
