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
import { AIChatContext, AIChatConversation, AIMessage, AIMessageInput } from '../types/ai-chat-conversation.type';
import { createAIChatConversation } from '../manager/ai-chat-conversation';

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

  constructor(ctx: Context, employee: Model, sessionId: string, systemMessage?: string) {
    this.employee = employee;
    this.ctx = ctx;
    this.plugin = ctx.app.pm.get('ai') as PluginAIServer;
    this.db = ctx.db;
    this.sessionId = sessionId;
    this.systemMessage = systemMessage;
    this.aiChatConversation = createAIChatConversation(this.ctx, this.sessionId);
  }

  async getLLMService() {
    const modelSettings = this.employee.modelSettings;

    if (!modelSettings?.llmService) {
      throw new Error('LLM service not configured');
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
      chatOptions: {
        ...modelSettings,
      },
    });

    return { provider, model: modelSettings.model, service };
  }

  async prepareChatStream(chatContext: AIChatContext, provider: LLMProvider) {
    const controller = new AbortController();
    const { signal } = controller;

    try {
      const stream = await provider.stream(chatContext, { signal });
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
    try {
      for await (const chunk of stream) {
        gathered = gathered !== undefined ? concat(gathered, chunk) : chunk;
        if (!chunk.content) {
          continue;
        }
        this.ctx.res.write(
          `data: ${JSON.stringify({ type: 'content', body: provider.parseResponseChunk(chunk.content) })}\n\n`,
        );
      }
    } catch (err) {
      this.ctx.log.error(err);
    }

    this.plugin.aiEmployeesManager.conversationController.delete(this.sessionId);

    const message = gathered?.content;
    const toolCalls = gathered?.tool_calls;
    const skills = this.employee.skillSettings?.skills;
    if (!message && !toolCalls?.length && !signal.aborted && !allowEmpty) {
      this.ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'No content' })}\n\n`);
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

  async getSystemPrompt() {
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
    });
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

        const type = 'tool';
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
      systemPrompt: await this.getSystemPrompt(),
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

      const chatContext = await this.aiChatConversation.getChatContext({
        systemPrompt: await this.getSystemPrompt(),
        tools: await this.getTools(),
      });
      const { provider, model, service } = await this.getLLMService();
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
      const chatContext = await this.aiChatConversation.getChatContext({
        systemPrompt: await this.getSystemPrompt(),
        messageId,
        tools: await this.getTools(),
      });
      const { provider, model, service } = await this.getLLMService();
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
      this.sendErrorResponse('Chat error warning');
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
    this.getSkills();
    const toolMap = await this.getToolMap();
    const tools = [];
    const skills = this.getSkills();
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
