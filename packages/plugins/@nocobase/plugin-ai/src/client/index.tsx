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
import { tval } from '@nocobase/utils/client';
import { namespace } from './locale';
const { LLMServices } = lazy(() => import('./llm-services/LLMServices'), 'LLMServices');
const { MessagesSettings } = lazy(() => import('./chat-settings/Messages'), 'MessagesSettings');
const { Chat } = lazy(() => import('./llm-providers/components/Chat'), 'Chat');
const { ModelSelect } = lazy(() => import('./llm-providers/components/ModelSelect'), 'ModelSelect');

export class PluginAIClient extends Plugin {
  aiManager = new AIManager();

  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.pluginSettingsManager.add('ai', {
      icon: 'RobotOutlined',
      title: tval('AI integration', { ns: namespace }),
      aclSnippet: 'pm.ai',
    });
    this.app.pluginSettingsManager.add('ai.llm-services', {
      icon: 'LinkOutlined',
      title: tval('LLM services', { ns: namespace }),
      aclSnippet: 'pm.ai.llm-services',
      Component: LLMServices,
    });

    this.aiManager.registerLLMProvider('openai', openaiProviderOptions);
    this.aiManager.registerLLMProvider('deepseek', deepseekProviderOptions);
    this.aiManager.chatSettings.set('messages', {
      title: tval('Messages'),
      Component: MessagesSettings,
    });

    const workflow = this.app.pm.get('workflow') as PluginWorkflowClient;
    workflow.registerInstructionGroup('ai', { label: tval('AI', { ns: namespace }) });
    workflow.registerInstruction('llm', LLMInstruction);
  }
}

export default PluginAIClient;
export { Chat, ModelSelect };
export type { LLMProviderOptions } from './manager/ai-manager';
