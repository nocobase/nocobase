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
import aiConversations from './resource/aiConversations';
import aiTools from './resource/aiTools';
import { AIEmployeesManager } from './ai-employees/ai-employees-manager';
import Snowflake from './snowflake';
import * as aiEmployeeActions from './resource/aiEmployees';
import { googleGenAIProviderOptions } from './llm-providers/google-genai';
import { AIEmployeeTrigger } from './workflow/triggers/ai-employee';
import { formFiller, workflowCaller } from './tools';
import { Model } from '@nocobase/database';
import { anthropicProviderOptions } from './llm-providers/anthropic';
import aiSettings from './resource/aiSettings';
// import { tongyiProviderOptions } from './llm-providers/tongyi';

export class PluginAIServer extends Plugin {
  aiManager = new AIManager(this);
  aiEmployeesManager = new AIEmployeesManager(this);
  snowflake: Snowflake;

  async afterAdd() {}

  async beforeLoad() {
    const pluginRecord = await this.db.getRepository('applicationPlugins').findOne({
      filter: {
        name: this.name,
      },
    });
    this.snowflake = new Snowflake(pluginRecord?.createdAt.getTime());
  }

  async load() {
    this.aiManager.registerLLMProvider('openai', openaiProviderOptions);
    this.aiManager.registerLLMProvider('deepseek', deepseekProviderOptions);
    this.aiManager.registerLLMProvider('google-genai', googleGenAIProviderOptions);
    this.aiManager.registerLLMProvider('anthropic', anthropicProviderOptions);
    // this.aiManager.registerLLMProvider('tongyi', tongyiProviderOptions);
    this.aiManager.registerTool('formFiller', formFiller);
    this.aiManager.registerTool('workflowCaller', workflowCaller);

    this.app.resourceManager.define(aiResource);
    this.app.resourceManager.define(aiConversations);
    this.app.resourceManager.define(aiTools);
    this.app.resourceManager.define(aiSettings);

    this.app.resourceManager.use(
      async (ctx, next) => {
        const { resourceName, actionName } = ctx.action;
        if (resourceName === 'aiFiles' && actionName === 'create') {
          const settings = await this.db.getRepository('aiSettings').findOne();
          const collection = ctx.db.getCollection('aiFiles');
          collection.options.storage = settings?.options?.storage;
        }
        await next();
      },
      { before: 'createMiddleware' },
    );

    this.app.acl.registerSnippet({
      name: `pm.${this.name}.llm-services`,
      actions: ['ai:*', 'llmServices:*'],
    });
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.ai-employees`,
      actions: ['aiEmployees:*', 'aiTools:*', 'roles.aiEmployees:*'],
    });
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.ai-settings`,
      actions: ['aiSettings:*'],
    });
    this.app.acl.allow('aiConversations', '*', 'loggedIn');
    this.app.acl.allow('aiFiles', 'create', 'loggedIn');
    this.app.acl.allow('aiSettings', 'publicGet', 'loggedIn');

    Object.entries(aiEmployeeActions).forEach(([name, action]) => {
      this.app.resourceManager.registerActionHandler(`aiEmployees:${name}`, action);
    });
    this.app.acl.allow('aiEmployees', 'listByUser', 'loggedIn');
    this.app.acl.allow('aiEmployees', 'updateUserPrompt', 'loggedIn');

    const workflowSnippet = this.app.acl.snippetManager.snippets.get('pm.workflow.workflows');
    if (workflowSnippet) {
      workflowSnippet.actions.push('ai:listModels');
    }

    const workflow = this.app.pm.get('workflow') as PluginWorkflowServer;
    workflow.registerTrigger('ai-employee', AIEmployeeTrigger);
    workflow.registerInstruction('llm', LLMInstruction);

    this.app.db.on('roles.beforeCreate', async (instance: Model) => {
      instance.set('allowNewAiEmployee', ['admin', 'member'].includes(instance.name));
    });
    this.app.db.on('aiEmployees.afterCreate', async (instance: Model, { transaction }) => {
      const roles = await this.app.db.getRepository('roles').find({
        filter: {
          allowNewAiEmployee: true,
        },
        transaction,
      });

      // @ts-ignore
      await this.app.db.getRepository('aiEmployees.roles', instance.username).add({
        tk: roles.map((role: { name: string }) => role.name),
        transaction,
      });
    });
  }

  handleSyncMessage(message: any): Promise<void> {
    const { type, payload } = message;
    switch (type) {
      case 'aiEmployees:abortConversation':
        return (async () => {
          this.aiEmployeesManager.onAbortConversation(payload.sessionId);
        })();
    }
  }

  async install() {
    const aiSettings = await this.db.getRepository('aiSettings').findOne();
    if (aiSettings) {
      return;
    }
    await this.db.getRepository('aiSettings').create({});
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginAIServer;
