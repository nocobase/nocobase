/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model, Transaction } from '@nocobase/database';
import { Context } from '@nocobase/actions';
import { LLMProvider } from '../llm-providers/provider';
import { Database } from '@nocobase/database';
import PluginAIServer from '../plugin';
import { sendSSEError, parseVariables } from '../utils';
import { getSystemPrompt } from './prompts';
import _ from 'lodash';
import { AIChatContext, AIChatConversation, AIMessage, AIMessageInput, UserDecision } from '../types';
import { createAIChatConversation } from '../manager/ai-chat-conversation';
import { DocumentSegmentedWithScore } from '../features';
import { KnowledgeBaseGroup } from '../types';
import { EEFeatures } from '../manager/ai-feature-manager';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import type { AIEmployee as AIEmployeeType } from '../../collections/ai-employees';
import {
  conversationMiddleware,
  debugMiddleware,
  toolCallStatusMiddleware,
  toolInteractionMiddleware,
} from './middleware';
import { ToolOptions } from '../manager/tool-manager';

type ToolMessage = {
  id: string;
  sessionId: string;
  messageId: string;
  toolCallId: string;
  status: 'success' | 'error';
  content: string;
  invokeStatus: 'init' | 'pending' | 'done' | 'confirmed';
  invokeStartTime: Date;
  invokeEndTime: Date;
  toolName: string;
  auto: boolean;
  execution: 'backend' | 'frontend';
};

export class AIEmployee {
  employee: Model;
  aiChatConversation: AIChatConversation;
  skillSettings?: Record<string, any>;
  private plugin: PluginAIServer;
  private db: Database;
  private sessionId: string;
  private ctx: Context;
  private systemMessage: string;
  private webSearch?: boolean;

  constructor(
    ctx: Context,
    employee: Model,
    sessionId: string,
    systemMessage?: string,
    skillSettings?: Record<string, any>,
    webSearch?: boolean,
  ) {
    this.employee = employee;
    this.ctx = ctx;
    this.plugin = ctx.app.pm.get('ai') as PluginAIServer;
    this.db = ctx.db;
    this.sessionId = sessionId;
    this.systemMessage = systemMessage;
    this.aiChatConversation = createAIChatConversation(this.ctx, this.sessionId);
    this.skillSettings = skillSettings;

    const locale = this.ctx.getCurrentLocale();
    const builtInManager = this.plugin.builtInManager;
    builtInManager.setupBuiltInInfo(locale, this.employee as unknown as AIEmployeeType);
    this.webSearch = webSearch;
  }

  async getLLMService() {
    const modelSettings = this.employee.modelSettings;

    if (!modelSettings?.llmService) {
      throw new Error('LLM service not configured');
    }

    if (modelSettings?.builtIn?.webSearch === true) {
      if (this.webSearch !== false) {
        modelSettings.builtIn.webSearch = true;
      } else {
        modelSettings.builtIn.webSearch = false;
      }
    }

    const service = await this.db.getRepository('llmServices').findOne({
      filter: {
        name: modelSettings.llmService,
      },
    });

    if (!service) {
      throw new Error('LLM service not found');
    }

    const providerOptions = this.plugin.aiManager.llmProviders.get(service.provider);
    if (!providerOptions) {
      throw new Error('LLM service provider not found');
    }

    const Provider = providerOptions.provider;
    const provider = new Provider({
      app: this.ctx.app,
      serviceOptions: service.options,
      modelOptions: {
        ...modelSettings,
      },
    });

    return { provider, model: modelSettings.model, service };
  }

  async prepareChatStream(chatContext: AIChatContext, provider: LLMProvider) {
    const controller = new AbortController();
    const { signal } = controller;

    try {
      const stream = await provider.getAgentStream(chatContext, {
        signal,
        streamMode: ['updates', 'messages', 'custom'],
        configurable: { thread_id: this.sessionId },
        context: { ctx: this.ctx },
      });
      this.plugin.aiEmployeesManager.conversationController.set(this.sessionId, controller);
      return { stream, controller, signal };
    } catch (error) {
      throw error;
    }
  }

  async processChatStream(
    stream: any,
    options: {
      signal: AbortSignal;
      messageId?: string;
      model: string;
      service: {
        provider: string;
      };
      provider: LLMProvider;
      allowEmpty?: boolean;
    },
  ) {
    const { signal, provider, allowEmpty = false } = options;
    let isMessageEmpty = true;
    try {
      for await (const [mode, chunks] of stream) {
        if (mode === 'messages') {
          const [chunk] = chunks;
          if (chunk.type !== 'ai') {
            continue;
          }
          if (isMessageEmpty && chunk.content?.length) {
            isMessageEmpty = false;
          }

          if (chunk.content) {
            this.ctx.res.write(
              `data: ${JSON.stringify({ type: 'content', body: provider.parseResponseChunk(chunk.content) })}\n\n`,
            );
          }

          const webSearch = provider.parseWebSearchAction(chunk);
          if (webSearch?.length) {
            this.ctx.res.write(`data: ${JSON.stringify({ type: 'web_search', body: webSearch })}\n\n`);
          }
        } else if (mode === 'updates') {
          if ('__interrupt__' in chunks) {
            if (isMessageEmpty) {
              isMessageEmpty = false;
            }
            console.log(`\n\nInterrupt: ${JSON.stringify(chunks.__interrupt__)}`);
          }
        } else if (mode === 'custom') {
          if (isMessageEmpty) {
            isMessageEmpty = false;
          }
          if (chunks.action === 'showToolCalls') {
            this.ctx.res.write(`data: ${JSON.stringify({ type: 'tool_call_chunks', body: chunks.body })}\n\n`);
          } else if (chunks.action === 'beforeToolCall') {
            this.ctx.res.write(`data: ${JSON.stringify({ type: 'new_message' })}\n\n`);
          } else {
            this.ctx.logger.warn(`Unknown custom action: `, chunks);
          }
        }
      }

      if (isMessageEmpty && !signal.aborted && !allowEmpty) {
        this.sendErrorResponse('Empty message');
        return;
      }
    } catch (err) {
      this.ctx.log.error(err);
      this.sendErrorResponse(err.message);
    } finally {
      this.ctx.res.end();
    }
  }

  async parseUISchema(content: string) {
    const regex = /\{\{\$UISchema\.([^}]+)\}\}/g;
    const uiSchemaRepo = this.db.getRepository('uiSchemas') as any;
    const matches = [...content.matchAll(regex)];
    let result = content;

    for (const match of matches) {
      const fullMatch = match[0];
      const uid = match[1];
      try {
        const schema = await uiSchemaRepo.getJsonSchema(uid);
        if (schema) {
          const s = JSON.stringify(schema);
          result = result.replace(fullMatch, `UI schema id: ${uid}, UI schema: ${s}`);
        }
      } catch (error) {
        this.ctx.log.error(error, { module: 'aiConversations', method: 'parseUISchema', uid });
      }
    }

    return result;
  }

  // Notice: employee.dataSourceSettings is not used in the current version.
  getEmployeeDataSourceContext() {
    const dataSourceSettings: {
      collections?: {
        collection: string;
      }[];
    } = this.employee.dataSourceSettings;

    if (!dataSourceSettings) {
      return null;
    }

    const collections = dataSourceSettings.collections || [];
    const names = collections.map((collection) => collection.collection);
    let message = '';

    for (const name of names) {
      let [dataSourceName, collectionName] = name.split(':');
      let db: Database;
      if (!collectionName) {
        collectionName = dataSourceName;
        dataSourceName = 'main';
        db = this.db;
      } else {
        const dataSource = this.ctx.app.dataSourceManager.dataSources.get(dataSourceName);
        db = dataSource?.collectionManager.db;
      }
      if (!db) {
        continue;
      }
      const collection = db.getCollection(collectionName);
      if (!collection || collection.options.hidden) {
        continue;
      }
      message += `\nDatabase type: ${db.sequelize.getDialect()}, Collection: ${collectionName}, Title: ${
        collection.options.title
      }`;
      const fields = collection.getFields();
      for (const field of fields) {
        if (field.options.hidden) {
          continue;
        }
        message += `\nField: ${field.name}, Title: ${field.options.uiSchema?.title}, Type: ${field.type}, Interface: ${
          field.options.interface
        }, Options: ${JSON.stringify(field.options)}`;
      }
    }

    return message;
  }

  async getSystemPrompt() {
    const userConfig = await this.db.getRepository('usersAiEmployees').findOne({
      filter: {
        userId: this.ctx.auth?.user.id,
        aiEmployee: this.employee.username,
      },
    });

    let systemMessage = await parseVariables(this.ctx, this.employee.about ?? this.employee.defaultPrompt);
    const dataSourceMessage = this.getEmployeeDataSourceContext();
    if (dataSourceMessage) {
      systemMessage = `${systemMessage}\n${dataSourceMessage}`;
    }

    let background = '';
    if (this.systemMessage) {
      background = await parseVariables(this.ctx, this.systemMessage);
    }

    const aiMessages = await this.aiChatConversation.listMessages();
    const workContextBackground = await this.plugin.workContextHandler.background(this.ctx, aiMessages);
    if (workContextBackground?.length) {
      background = `${background}\n${workContextBackground.join('\n')}`;
    }

    let knowledgeBase;
    if (this.isEnabledKnowledgeBase() && this.employee.knowledgeBasePrompt) {
      const lastUserMessage = await this.aiChatConversation.lastUserMessage();
      const docs = await this.retrieveKnowledgeBase(lastUserMessage);
      const knowledgeBaseData = docs.map((x) => x.content).join('\n');
      const promptTemplate = ChatPromptTemplate.fromTemplate(this.employee.knowledgeBasePrompt);
      knowledgeBase = _.isEmpty(knowledgeBaseData)
        ? undefined
        : await promptTemplate.format({
            knowledgeBaseData,
          });
    }

    return getSystemPrompt({
      aiEmployee: {
        nickname: this.employee.nickname,
        about: this.employee.about ?? this.employee.defaultPrompt,
      },
      task: {
        background,
      },
      personal: userConfig?.prompt,
      dataSources: dataSourceMessage,
      environment: {
        database: this.db.sequelize.getDialect(),
        locale: this.ctx.getCurrentLocale() || 'en-US',
      },
      knowledgeBase,
    });
  }

  async retrieveKnowledgeBase(userMessage: AIMessage): Promise<DocumentSegmentedWithScore[]> {
    const vectorStoreProvider = this.plugin.features.vectorStoreProvider;
    let queryResult: DocumentSegmentedWithScore[] = [];
    const queryString: string = userMessage.content.content as string;
    if (!queryString || _.isEmpty(queryString)) {
      return queryResult;
    }
    const { topK, score } = this.getAIEmployeeKnowledgeBaseConfig();
    const knowledgeBaseGroup = await this.getKnowledgeBaseGroup();
    for (const entry of knowledgeBaseGroup) {
      const { vectorStoreConfig, knowledgeBaseType, knowledgeBaseList } = entry;
      if (!knowledgeBaseList || _.isEmpty(knowledgeBaseList)) {
        continue;
      }

      if (knowledgeBaseType === 'LOCAL') {
        const vectorStoreService = await vectorStoreProvider.createVectorStoreService(
          vectorStoreConfig.vectorStoreProvider,
          [
            {
              key: 'vectorStoreConfigId',
              value: vectorStoreConfig.vectorStoreConfigId,
            },
          ],
        );
        const knowledgeBaseOuterIds = knowledgeBaseList.map((x) => x.knowledgeBaseOuterId);
        const result = await vectorStoreService.search(queryString, {
          topK,
          score,
          filter: {
            knowledgeBaseOuterId: { in: knowledgeBaseOuterIds },
          },
        });
        queryResult = [...queryResult, ...result];
      } else if (knowledgeBaseType === 'READONLY') {
        for (const knowledgeBase of knowledgeBaseList) {
          const vectorStoreService = await vectorStoreProvider.createVectorStoreService(
            vectorStoreConfig.vectorStoreProvider,
            [
              ...knowledgeBase.vectorStoreProps,
              {
                key: 'vectorStoreConfigId',
                value: vectorStoreConfig.vectorStoreConfigId,
              },
            ],
          );
          const result = await vectorStoreService.search(queryString, {
            topK,
            score,
          });
          queryResult = [...queryResult, ...result];
        }
      } else if (knowledgeBaseType === 'EXTERNAL') {
        for (const knowledgeBase of knowledgeBaseList) {
          const vectorStoreService = await vectorStoreProvider.createVectorStoreService(
            vectorStoreConfig.vectorStoreProvider,
            knowledgeBase.vectorStoreProps,
          );
          const result = await vectorStoreService.search(queryString, {
            topK,
            score,
          });
          queryResult = [...queryResult, ...result];
        }
      }
    }
    return queryResult;
  }

  isEnabledKnowledgeBase(): boolean {
    const featureEnabled = this.plugin.features.isFeaturesEnabled(Object.values(EEFeatures));
    const knowledgeBaseEnabled = this.employee.enableKnowledgeBase;
    return featureEnabled && knowledgeBaseEnabled;
  }

  getAIEmployeeKnowledgeBaseConfig(): {
    topK: number;
    score: string;
  } {
    const { topK, score } = this.employee.knowledgeBase ?? {};
    return {
      topK,
      score,
    };
  }

  async getKnowledgeBaseGroup(): Promise<KnowledgeBaseGroup[]> {
    const { knowledgeBaseIds } = this.employee.knowledgeBase ?? {};
    if (!knowledgeBaseIds || _.isEmpty(knowledgeBaseIds)) {
      return [];
    }
    return await this.plugin.features.knowledgeBase.getKnowledgeBaseGroup(knowledgeBaseIds);
  }

  async initToolCall(
    transaction: Transaction,
    messageId: string,
    toolCalls: {
      id: string;
      name: string;
      args: any;
    }[],
  ) {
    const nowTime = new Date();
    const tools = await this.withTool(toolCalls);
    await this.aiToolMessagesRepo.create({
      values: tools.map((toolCall) => ({
        id: this.plugin.snowflake.generate(),
        sessionId: this.sessionId,
        messageId: messageId,
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        status: toolCall.toolExist ? null : 'error',
        content: toolCall.toolExist ? null : `Tool ${toolCall.name} not found`,
        invokeStatus: toolCall.toolExist ? 'init' : 'done',
        invokeStartTime: toolCall.toolExist ? null : nowTime,
        invokeEndTime: toolCall.toolExist ? null : nowTime,
        auto: toolCall.auto,
        execution: toolCall?.tool?.execution ?? 'backend',
      })),
      transaction,
    });
  }

  async updateToolCallPending(toolCallId: string) {
    const [updated] = await this.aiToolMessagesModel.update(
      {
        invokeStatus: 'pending',
        invokeStartTime: new Date(),
      },
      {
        where: {
          sessionId: this.sessionId,
          toolCallId,
          invokeStatus: 'init',
        },
      },
    );
    return updated;
  }

  async updateToolCallDone(toolCallId: string, result: any) {
    const [updated] = await this.aiToolMessagesModel.update(
      {
        invokeStatus: 'done',
        invokeEndTime: new Date(),
        status: result?.status ?? 'success',
        content: result?.content ?? result,
      },
      {
        where: {
          sessionId: this.sessionId,
          toolCallId,
          invokeStatus: 'pending',
        },
      },
    );
    return updated;
  }

  async cancelToolCall() {
    let messageId;
    const historyMessages = await this.db.getRepository('aiConversations.messages', this.sessionId).find({
      sort: ['-messageId'],
    });
    const [lastMessage] = historyMessages;
    if (lastMessage?.toolCalls?.length ?? 0 > 0) {
      messageId = lastMessage.messageId;
    } else {
      return;
    }
    const toolCalls: ToolMessage[] = await this.aiToolMessagesRepo.find({
      filter: {
        messageId,
        invokeStatus: {
          $ne: 'confirmed',
        },
      },
    });
    if (!toolCalls || _.isEmpty(toolCalls)) {
      return;
    }

    const { model, service } = await this.getLLMService();
    const toolCallMap = await this.getToolCallMap(messageId);
    const now = new Date();
    const toolMessageContent = 'The user rejected this tool invocation and needs to continue modifying the parameters.';
    await this.db.sequelize.transaction(async (transaction) => {
      for (const toolCall of toolCalls) {
        const [updated] = await this.aiToolMessagesModel.update(
          {
            invokeStatus: 'done',
            status: 'error',
            content: toolMessageContent,
            invokeStartTime: toolCall.invokeStartTime ?? now,
            invokeEndTime: toolCall.invokeEndTime ?? now,
          },
          {
            where: {
              id: toolCall.id,
              invokeStatus: toolCall.invokeStatus,
            },
            transaction,
          },
        );
        if (updated === 0) {
          continue;
        }
        await this.db.getRepository('aiConversations.messages', this.sessionId).create({
          values: toolCalls.map((toolCall) => ({
            messageId: this.plugin.snowflake.generate(),
            role: 'tool',
            content: {
              type: 'text',
              content: toolMessageContent,
            },
            metadata: {
              model,
              provider: service.provider,
              toolCall: toolCallMap.get(toolCall.toolCallId),
              autoCall: toolCall.auto,
            },
            transaction,
          })),
        });
        await this.aiToolMessagesRepo.update({
          filter: {
            messageId,
            toolCallId: toolCall.toolCallId,
          },
          values: {
            invokeStatus: 'confirmed',
          },
          transaction,
        });
      }
    });
  }

  get logger() {
    return this.ctx.logger;
  }

  sendErrorResponse(errorMessage: string) {
    sendSSEError(this.ctx, errorMessage);
  }

  async processMessages({
    userMessages = [],
    userDecisions,
  }: {
    userMessages?: AIMessageInput[];
    userDecisions?: UserDecision[];
  }) {
    try {
      const { provider, model, service } = await this.getLLMService();
      const chatContext = await this.aiChatConversation.getChatContext({
        userMessages,
        userDecisions,
        workContextHandler: this.plugin.workContextHandler,
        provider,
        model,
        service,
        getSystemPrompt: async () => this.getSystemPrompt(),
        getTools: async () => this.getTools(),
        getMiddleware: async (chatContext) => this.getMiddleware(chatContext),
      });
      const { stream, signal } = await this.prepareChatStream(chatContext, provider);

      await this.processChatStream(stream, {
        signal,
        model,
        provider,
        service,
      });

      return true;
    } catch (err) {
      this.ctx.log.error(err);
      this.sendErrorResponse(err.message || 'Chat error warning');
      return false;
    }
  }

  async resendMessages(messageId?: string) {
    try {
      const { provider, model, service } = await this.getLLMService();
      const chatContext = await this.aiChatConversation.getChatContext({
        userMessages: [],
        workContextHandler: this.plugin.workContextHandler,
        provider,
        model,
        service,
        messageId,
        getSystemPrompt: async () => this.getSystemPrompt(),
        getTools: async () => this.getTools(),
        getMiddleware: async (chatContext) => this.getMiddleware(chatContext),
      });
      const { stream, signal } = await this.prepareChatStream(chatContext, provider);

      await this.processChatStream(stream, {
        signal,
        messageId,
        model,
        provider,
        service,
      });

      return true;
    } catch (err) {
      this.ctx.log.error(err);
      this.sendErrorResponse(err.message);
      return false;
    }
  }

  removeAbortController() {
    this.plugin.aiEmployeesManager.conversationController.delete(this.sessionId);
  }

  private getAutoSkillNames(): string[] {
    const skills = this.getSkills();
    return skills.filter(({ autoCall }) => autoCall ?? false).map(({ name }) => name);
  }

  private getSkills(): { name: string; autoCall?: boolean }[] {
    return this.employee.skillSettings?.skills ?? [];
  }

  private async getToolCallList(messageId: string): Promise<
    Array<{
      id: string;
      args: unknown;
      name: string;
      type: string;
    }>
  > {
    const { toolCalls } = await this.aiMessagesRepo.findByTargetKey(messageId);
    return toolCalls;
  }

  private async getToolCallMap(messageId: string): Promise<
    Map<
      string,
      {
        id: string;
        args: unknown;
        name: string;
        type: string;
      }
    >
  > {
    const result = new Map();
    const { toolCalls } = await this.aiMessagesRepo.findById(messageId);
    if (!toolCalls) {
      return result;
    }
    for (const toolCall of toolCalls) {
      result.set(toolCall.id, toolCall);
    }
    return result;
  }

  private async withTool(toolCalls: { id: string; args: unknown; name: string }[]) {
    const autoSkillNames = this.getAutoSkillNames();
    const toolMap = await this.getToolMap();
    return toolCalls.map((toolCall) => ({
      ...toolCall,
      toolExist: toolMap.has(toolCall.name),
      tool: toolMap.get(toolCall.name),
      auto: autoSkillNames.includes(toolCall.name),
    }));
  }

  private async getTools() {
    const toolMap = await this.getToolMap();
    const tools: ToolOptions[] = [];
    let skills = this.getSkills();
    const skillFilter = this.skillSettings?.skills;
    if (skillFilter) {
      if (skillFilter.length) {
        skills = skills.filter((skill) => skillFilter.includes(skill.name));
      } else {
        skills = [];
      }
    }
    if (skills?.length) {
      for (const skill of skills) {
        const tool = toolMap.get(skill.name);
        if (tool) {
          tool.autoCall = skill.autoCall;
          tools.push(tool);
        }
      }
    }
    return tools;
  }

  private async getMiddleware(chatContext: AIChatContext) {
    const tools = await this.getTools();
    return [
      toolInteractionMiddleware(this, tools),
      toolCallStatusMiddleware(this),
      conversationMiddleware(this, chatContext),
      debugMiddleware(this, this.ctx.logger),
    ];
  }

  private async getToolMap() {
    const toolGroupList = await this.plugin.aiManager.toolManager.listTools(false);
    const toolList = toolGroupList.flatMap(({ tools }) => tools);
    return new Map(toolList.map((tool) => [tool.name, tool]));
  }

  private get aiMessagesRepo() {
    return this.ctx.db.getRepository('aiMessages');
  }

  private get aiToolMessagesRepo() {
    return this.ctx.db.getRepository('aiToolMessages');
  }

  private get aiToolMessagesModel() {
    return this.ctx.db.getModel('aiToolMessages');
  }
}
