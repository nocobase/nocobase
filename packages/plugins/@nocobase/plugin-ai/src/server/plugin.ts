/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { AIManager } from './manager/ai-manager';
import { openaiProviderOptions } from './llm-providers/openai';
import { deepseekProviderOptions } from './llm-providers/deepseek';
import aiResource from './resource/ai';
import PluginWorkflowServer from '@nocobase/plugin-workflow';
import { LLMInstruction } from './workflow/nodes/llm';

export class PluginAIServer extends Plugin {
  aiManager = new AIManager();

  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.aiManager.registerLLMProvider('openai', openaiProviderOptions);
    this.aiManager.registerLLMProvider('deepseek', deepseekProviderOptions);

    this.app.resourceManager.define(aiResource);
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.llm-services`,
      actions: ['ai:*', 'llmServices:*'],
    });
    const workflowSnippet = this.app.acl.snippetManager.snippets.get('pm.workflow.workflows');
    if (workflowSnippet) {
      workflowSnippet.actions.push('ai:listModels');
    }

    const workflow = this.app.pm.get('workflow') as PluginWorkflowServer;
    workflow.registerInstruction('llm', LLMInstruction);
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginAIServer;
