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
import { concat } from '@langchain/core/utils/stream';
import PluginAIServer from '../plugin';
import { parseVariables } from '../utils';
import { getSystemPrompt } from './prompts';
import _ from 'lodash';
import { AIChatContext, AIChatConversation, AIMessage, AIMessageInput } from '../types';
import { createAIChatConversation } from '../manager/ai-chat-conversation';
import { DocumentSegmentedWithScore } from '../features';
import { KnowledgeBaseGroup } from '../types';
import { EEFeatures } from '../manager/ai-feature-manager';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import type { AIEmployee as AIEmployeeType } from '../../collections/ai-employees';

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
  private employee: Model;
  private plugin: PluginAIServer;
  private db: Database;
  private sessionId: string;
  private ctx: Context;
  private systemMessage: string;
  private aiChatConversation: AIChatConversation;
  private skillSettings?: Record<string, any>;
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
      const stream = await provider.stream(chatContext, { signal, version: 'v2' });
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
    const { signal, messageId, model, service, provider, allowEmpty = false } = options;

    let gathered: any;
    let errMsg = '';
    try {
      for await (const streamEvent of stream) {
        if (streamEvent.event !== 'on_chat_model_stream') {
          this.ctx.log.debug(`skip event: ${streamEvent.event}`);
          continue;
        }
        const chunk = streamEvent.data.chunk;
        gathered = gathered !== undefined ? concat(gathered, chunk) : chunk;
        if (chunk.content) {
          this.ctx.res.write(
            `data: ${JSON.stringify({ type: 'content', body: provider.parseResponseChunk(chunk.content) })}\n\n`,
          );
        }
        if (chunk.tool_call_chunks) {
          this.ctx.res.write(`data: ${JSON.stringify({ type: 'tool_call_chunks', body: chunk.tool_call_chunks })}\n\n`);
        }
        const webSearch = provider.parseWebSearchAction(chunk);
        if (webSearch?.length) {
          this.ctx.res.write(`data: ${JSON.stringify({ type: 'web_search', body: webSearch })}\n\n`);
        }
      }
    } catch (err) {
      errMsg = err.message;
      this.ctx.log.error(err);
    }

    this.plugin.aiEmployeesManager.conversationController.delete(this.sessionId);

    const message = gathered?.content;
    const toolCalls = gathered?.tool_calls;
    const skills = this.employee.skillSettings?.skills;
    if (!message && !toolCalls?.length && !signal.aborted && !allowEmpty) {
      this.ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: errMsg })}\n\n`);
      this.ctx.res.end();
      return;
    }

    if (message || toolCalls?.length) {
      const values: AIMessageInput = {
        role: this.employee.username,
        content: {
          type: 'text',
          content: message,
        },
        metadata: {
          model,
          provider: service.provider,
          usage_metadata: {},
        },
        toolCalls: null,
      };

      if (signal.aborted) {
        values.metadata.interrupted = true;
      }

      if (toolCalls?.length) {
        values.toolCalls = toolCalls;
        values.metadata.autoCallTools = toolCalls
          .filter((tool: { name: string }) => {
            return skills?.some((s: { name: string; autoCall?: boolean }) => s.name === tool.name && s.autoCall);
          })
          .map((tool: { name: string }) => tool.name);
      }

      if (gathered?.usage_metadata) {
        values.metadata.usage_metadata = gathered.usage_metadata;
      }
      if (gathered?.response_metadata) {
        values.metadata.response_metadata = gathered.response_metadata;
      }

      const aiMessage = await this.aiChatConversation.withTransaction(async (conversation, transaction) => {
        if (messageId) {
          await conversation.removeMessages({ messageId });
          await this.aiToolMessagesRepo.destroy({
            filter: {
              sessionId: this.sessionId,
              messageId: {
                $gte: messageId,
              },
            },
            transaction,
          });
        }
        const result: AIMessage = await conversation.addMessages(values);
        if (toolCalls?.length) {
          await this.initToolCall(transaction, result.messageId, toolCalls);
        }

        return result;
      });

      if (toolCalls?.length) {
        this.ctx.res.write(`data: ${JSON.stringify({ type: 'new_message' })}\n\n`);
        await this.callTool(aiMessage.messageId, true);
        return;
      }
    }

    this.ctx.res.end();
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

  getDataSources() {
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

  async getSystemPrompt(aiMessages: AIMessage[]) {
    const userConfig = await this.db.getRepository('usersAiEmployees').findOne({
      filter: {
        userId: this.ctx.auth?.user.id,
        aiEmployee: this.employee.username,
      },
    });

    let systemMessage = await parseVariables(this.ctx, this.employee.about);
    const dataSourceMessage = this.getDataSources();
    if (dataSourceMessage) {
      systemMessage = `${systemMessage}\n${dataSourceMessage}`;
    }

    let background = '';
    if (this.systemMessage) {
      background = await parseVariables(this.ctx, this.systemMessage);
    }

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
        about: this.employee.about,
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

  async callTool(messageId: string, autoCall: boolean) {
    try {
      const toolCalls = await this.getToolCallList(messageId);
      const tools = await this.withTool(toolCalls);

      const backendTools = tools
        .filter(({ auto }) => auto === autoCall)
        .filter(({ tool }) => tool.execution === 'backend');
      const frontendTools = tools
        .filter(({ auto }) => auto === autoCall)
        .filter(({ tool }) => tool.execution === 'frontend');

      if (!_.isEmpty(backendTools)) {
        const parallelToolCall = backendTools.map(async (toolCall) => {
          const [updated] = await this.aiToolMessagesModel.update(
            {
              invokeStatus: 'pending',
              invokeStartTime: new Date(),
            },
            {
              where: {
                messageId,
                toolCallId: toolCall.id,
                invokeStatus: 'init',
              },
            },
          );
          if (updated === 0) {
            return;
          }
          const result = await toolCall.tool.invoke(this.ctx, toolCall.args);
          await this.aiToolMessagesModel.update(
            {
              invokeStatus: 'done',
              invokeEndTime: new Date(),
              status: result.status,
              content: result.content,
            },
            {
              where: {
                messageId,
                toolCallId: toolCall.id,
                invokeStatus: 'pending',
              },
            },
          );
        });
        await Promise.all(parallelToolCall);
      }

      if (!_.isEmpty(frontendTools)) {
        const parallelToolCall = frontendTools.map(async (toolCall) => {
          const [updated] = await this.aiToolMessagesModel.update(
            {
              invokeStatus: 'pending',
              invokeStartTime: new Date(),
            },
            {
              where: {
                messageId,
                toolCallId: toolCall.id,
                invokeStatus: 'init',
              },
            },
          );
          if (updated === 0) {
            return null;
          } else {
            return toolCall;
          }
        });

        const type = 'tool_calls';
        const body = (await Promise.all(parallelToolCall)).filter((x) => !_.isNull(x));
        if (!_.isEmpty(body)) {
          this.ctx.res.write(`data: ${JSON.stringify({ type, body })} \n\n`);
        }
        this.ctx.res.end();
      } else {
        await this.sendToolMessage(messageId);
      }
    } catch (err) {
      this.ctx.log.error(err);
      this.sendErrorResponse('Tool call error');
    }
  }

  async confirmToolCall(messageId: string, toolCallIds: string[] = []) {
    if (!_.isEmpty(toolCallIds)) {
      const toolCallList = await this.getToolCallList(messageId);
      const tools = await this.withTool(toolCallList.filter((x) => toolCallIds.includes(x.id)));
      const frontendTools = tools.filter(({ tool }) => tool.execution === 'frontend');
      if (!_.isEmpty(frontendTools)) {
        const parallelToolCall = frontendTools.map(async (toolCall) => {
          const result = await toolCall.tool.invoke(this.ctx, toolCall.args);
          await this.aiToolMessagesModel.update(
            {
              invokeStatus: 'done',
              invokeEndTime: new Date(),
              status: result.status,
              content: result.content,
            },
            {
              where: {
                messageId,
                toolCallId: toolCall.id,
                invokeStatus: 'pending',
              },
            },
          );
        });
        await Promise.all(parallelToolCall);
      }
    }
    await this.sendToolMessage(messageId);
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

  private async sendToolMessage(messageId: string) {
    const toolCalls: ToolMessage[] = await this.aiToolMessagesRepo.find({ filter: { messageId } });
    if (_.isEmpty(toolCalls) || !toolCalls.every((item) => item.invokeStatus === 'done')) {
      this.ctx.res.end();
      return;
    }

    const { provider, model, service } = await this.getLLMService();
    const toolCallMap = await this.getToolCallMap(messageId);
    await this.aiChatConversation.withTransaction(async (conversation, transaction) => {
      await conversation.addMessages(
        toolCalls.map((toolCall) => ({
          role: 'tool',
          content: {
            type: 'text',
            content: toolCall.content,
          },
          metadata: {
            model,
            provider: service.provider,
            toolCall: toolCallMap.get(toolCall.toolCallId),
            autoCall: toolCall.auto,
          },
        })),
      );
      for (const toolCall of toolCalls) {
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

    const chatContext = await this.aiChatConversation.getChatContext({
      workContextHandler: this.plugin.workContextHandler,
      provider,
      getSystemPrompt: async (aiMessages) => await this.getSystemPrompt(aiMessages),
      tools: await this.getTools(),
    });

    const { stream, signal } = await this.prepareChatStream(chatContext, provider);
    await this.processChatStream(stream, {
      signal,
      model,
      service,
      provider,
      allowEmpty: true,
    });
  }

  sendErrorResponse(errorMessage: string) {
    this.ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: errorMessage })} \n\n`);
    this.ctx.res.end();
  }

  async processMessages(userMessages: AIMessageInput[], messageId?: string) {
    try {
      await this.aiChatConversation.withTransaction(async (conversation) => {
        if (messageId) {
          await conversation.removeMessages({ messageId });
        }
        await conversation.addMessages(userMessages);
      });

      const { provider, model, service } = await this.getLLMService();
      const chatContext = await this.aiChatConversation.getChatContext({
        workContextHandler: this.plugin.workContextHandler,
        provider,
        getSystemPrompt: async (aiMessages) => await this.getSystemPrompt(aiMessages),
        tools: await this.getTools(),
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
      this.sendErrorResponse('Chat error warning');
      return false;
    }
  }

  async resendMessages(messageId?: string) {
    try {
      const { provider, model, service } = await this.getLLMService();
      const chatContext = await this.aiChatConversation.getChatContext({
        workContextHandler: this.plugin.workContextHandler,
        provider,
        getSystemPrompt: async (aiMessages) => await this.getSystemPrompt(aiMessages),
        messageId,
        tools: await this.getTools(),
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
    const tools = [];
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
          tools.push(tool);
        }
      }
    }
    return tools;
  }

  private async getToolMap() {
    const toolGroupList = await this.plugin.aiManager.toolManager.listTools();
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
