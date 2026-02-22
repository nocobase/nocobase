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
import { AIPluginFeatureManagerImpl } from './manager/ai-feature-manager';
import { openaiResponsesProviderOptions } from './llm-providers/openai';
import { openaiCompletionsProviderOptions } from './llm-providers/openai';
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
import {
  getWorkflowCallers,
  createDocsSearchTool,
  createReadDocEntryTool,
  loadDocsIndexes,
  describeDocModules,
} from './tools';
import { Model } from '@nocobase/database';
import { anthropicProviderOptions } from './llm-providers/anthropic';
import aiSettings from './resource/aiSettings';
import { dashscopeProviderOptions } from './llm-providers/dashscope';
import { ollamaProviderOptions } from './llm-providers/ollama';
import { BuiltInManager } from './manager/built-in-manager';
import { AIContextDatasourceManager } from './manager/ai-context-datasource-manager';
import { aiContextDatasources } from './resource/aiContextDatasources';
import { createWorkContextHandler } from './manager/work-context-handler';
import { AICodingManager } from './manager/ai-coding-manager';
import { kimiProviderOptions } from './llm-providers/kimi';
// import { tongyiProviderOptions } from './llm-providers/tongyi';

export class PluginAIServer extends Plugin {
  features = new AIPluginFeatureManagerImpl();
  aiManager = new AIManager(this);
  aiEmployeesManager = new AIEmployeesManager(this);
  builtInManager = new BuiltInManager(this);
  aiContextDatasourceManager = new AIContextDatasourceManager(this);
  aiCodingManager = new AICodingManager(this);
  workContextHandler = createWorkContextHandler(this);
  snowflake: Snowflake;

  /**
   * Check if the AI employee is a builder/admin-only type (e.g., Nathan, Orin).
   * These employees have powerful capabilities (coding, schema modification) and should be restricted to admins.
   */
  isBuilderAI(username: string) {
    const BUILDER_AI_USERNAMES = ['nathan', 'orin', 'dara'];
    return BUILDER_AI_USERNAMES.includes(username);
  }

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
    await loadDocsIndexes();
    this.registerLLMProviders();
    this.registerTools();
    this.defineResources();
    this.setPermissions();
    this.registerWorkflow();
    this.registerWorkContextResolveStrategy();
  }

  async setupBuiltIn() {
    await this.builtInManager.createOrUpdateAIEmployee();
  }

  registerLLMProviders() {
    this.aiManager.registerLLMProvider('google-genai', googleGenAIProviderOptions);
    this.aiManager.registerLLMProvider('openai', openaiResponsesProviderOptions);
    this.aiManager.registerLLMProvider('anthropic', anthropicProviderOptions);
    this.aiManager.registerLLMProvider('deepseek', deepseekProviderOptions);
    this.aiManager.registerLLMProvider('dashscope', dashscopeProviderOptions);
    // this.aiManager.registerLLMProvider('tongyi', tongyiProviderOptions);
    this.aiManager.registerLLMProvider('ollama', ollamaProviderOptions);
    this.aiManager.registerLLMProvider('openai-completions', openaiCompletionsProviderOptions);
    this.aiManager.registerLLMProvider('kimi', kimiProviderOptions);
  }

  registerTools() {
    const toolsManager = this.ai.toolsManager;

    const docsModulesDescription = describeDocModules('Docs modules unavailable. Run ai:create-docs-index first.');

    toolsManager.registerTools([
      createDocsSearchTool({ description: docsModulesDescription }),
      createReadDocEntryTool(),
    ]);

    toolsManager.registerDynamicTools(getWorkflowCallers(this, 'workflowCaller'));
  }

  defineResources() {
    this.app.resourceManager.define(aiResource);
    this.app.resourceManager.define(aiConversations);
    this.app.resourceManager.define(aiTools);
    this.app.resourceManager.define(aiSettings);
    this.app.resourceManager.define(aiContextDatasources);

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

    Object.entries(aiEmployeeActions).forEach(([name, action]) => {
      this.app.resourceManager.registerActionHandler(`aiEmployees:${name}`, action);
    });
  }

  setPermissions() {
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.llm-services`,
      actions: ['ai:*', 'llmServices:*'],
    });
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.ai-employees`,
      actions: ['aiEmployees:*', 'aiTools:*', 'roles.aiEmployees:*', 'aiContextDatasources:*'],
    });
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.ai-settings`,
      actions: ['aiSettings:*'],
    });
    this.app.acl.allow('aiConversations', '*', 'loggedIn');
    this.app.acl.allow('aiContextDatasources', 'get', 'loggedIn');
    this.app.acl.allow('aiContextDatasources', 'list', 'loggedIn');
    this.app.acl.allow('aiContextDatasources', 'preview', 'loggedIn');
    this.app.acl.allow('aiFiles', 'create', 'loggedIn');
    this.app.acl.allow('aiSettings', 'publicGet', 'loggedIn');
    this.app.acl.allow('ai', 'listAllEnabledModels', 'loggedIn');

    this.app.acl.allow('aiEmployees', 'listByUser', 'loggedIn');
    this.app.acl.allow('aiEmployees', 'updateUserPrompt', 'loggedIn');

    this.app.acl.allow('aiTools', 'list', 'loggedIn');

    const workflowSnippet = this.app.acl.snippetManager.snippets.get('pm.workflow.workflows');
    if (workflowSnippet) {
      workflowSnippet.actions.push('ai:listModels');
    }

    this.app.db.on('roles.beforeCreate', async (instance: Model) => {
      instance.set('allowNewAiEmployee', true);
    });
    // 为新角色默认开启 AI 员工
    this.app.db.on('roles.afterCreate', async (instance: Model, { transaction }) => {
      const allAiEmployees = await this.app.db.getRepository('aiEmployees').find({
        transaction,
      });

      const generalAiEmployees = allAiEmployees.filter((ai: { username: string }) => !this.isBuilderAI(ai.username));

      if (generalAiEmployees.length > 0) {
        await instance.addAiEmployees(generalAiEmployees, { transaction });
      }
    });

    this.app.db.on('aiEmployees.afterCreate', async (instance: Model, { transaction }) => {
      const roles = await this.app.db.getRepository('roles').find({
        filter: {
          allowNewAiEmployee: true,
        },
        transaction,
      });

      // 为初始化/新创建的 AI 员工分配角色，builder 类的AI员工默认只对 Admin 角色开启
      let targetRoles = roles;
      if (this.isBuilderAI(instance.username)) {
        targetRoles = roles.filter((role: { name: string }) => role.name === 'admin');
      }

      // @ts-ignore
      await this.app.db.getRepository('aiEmployees.roles', instance.username).add({
        tk: targetRoles.map((role: { name: string }) => role.name),
        transaction,
      });
    });
  }

  registerWorkflow() {
    const workflow = this.app.pm.get('workflow') as PluginWorkflowServer;
    workflow.registerTrigger('ai-employee', AIEmployeeTrigger);
    workflow.registerInstruction('llm', LLMInstruction);
  }

  registerWorkContextResolveStrategy() {
    this.workContextHandler.registerStrategy('datasource', {
      resolve: this.aiContextDatasourceManager.provideWorkContextResolveStrategy(),
    });
    this.workContextHandler.registerStrategy('code-editor', {
      resolve: this.aiCodingManager.provideWorkContextResolveStrategy(),
      background: this.aiCodingManager.provideWorkContextBackgroundStrategy(),
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
    await this.setupBuiltIn();
  }

  async upgrade() {
    await this.setupBuiltIn();
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}

  get repositories() {
    return {
      aiContextDatasources: this.repository('aiContextDatasources'),
    };
  }

  private repository(collectionName: string) {
    return this.app.db.getRepository(collectionName);
  }
}

export default PluginAIServer;
