/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model } from '@nocobase/database';
import { Context } from '@nocobase/actions';
import { LLMProvider } from '../llm-providers/provider';
import { Database } from '@nocobase/database';
import { concat } from '@langchain/core/utils/stream';
import PluginAIServer from '../plugin';
import { parseVariables } from '../utils';
import { getSystemPrompt } from './prompts';

export class AIEmployee {
  private employee: Model;
  private plugin: PluginAIServer;
  private db: Database;
  private sessionId: string;
  private ctx: Context;
  private systemMessage: string;

  constructor(ctx: Context, employee: Model, sessionId: string, systemMessage?: string) {
    this.employee = employee;
    this.ctx = ctx;
    this.plugin = ctx.app.pm.get('ai') as PluginAIServer;
    this.db = ctx.db;
    this.sessionId = sessionId;
    this.systemMessage = systemMessage;
  }

  async getLLMService(messages: any[]) {
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

    const tools = [];
    const skills = this.employee.skillSettings?.skills || [];
    if (skills?.length) {
      for (const skill of skills) {
        const tool = await this.plugin.aiManager.toolManager.getTool(skill.name);
        if (tool) {
          tools.push(tool);
        }
      }
    }

    const Provider = providerOptions.provider;
    const provider = new Provider({
      app: this.ctx.app,
      serviceOptions: service.options,
      chatOptions: {
        ...modelSettings,
        messages,
        tools,
      },
    });

    return { provider, model: modelSettings.model, service };
  }

  async prepareChatStream(provider: LLMProvider) {
    const controller = new AbortController();
    const { signal } = controller;

    try {
      const stream = await provider.stream({ signal });
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
      const values = {
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
        values.metadata['interrupted'] = true;
      }

      if (toolCalls?.length) {
        values.toolCalls = toolCalls;
        values.metadata['autoCallTools'] = toolCalls
          .filter((tool: { name: string }) => {
            return skills?.some((s: { name: string; autoCall?: boolean }) => s.name === tool.name && s.autoCall);
          })
          .map((tool: { name: string }) => tool.name);
      }

      if (gathered?.usage_metadata) {
        values.metadata.usage_metadata = gathered.usage_metadata;
      }

      if (messageId) {
        await this.db.sequelize.transaction(async (transaction) => {
          await this.db.getRepository('aiMessages').update({
            filter: {
              sessionId: this.sessionId,
              messageId,
            },
            values,
            transaction,
          });
          await this.db.getRepository('aiMessages').destroy({
            filter: {
              sessionId: this.sessionId,
              messageId: {
                $gt: messageId,
              },
            },
            transaction,
          });
        });
      } else {
        await this.db.getRepository('aiConversations.messages', this.sessionId).create({
          values: {
            messageId: this.plugin.snowflake.generate(),
            role: this.employee.username,
            ...values,
          },
        });
      }
    }

    if (toolCalls?.length) {
      const tool = toolCalls[0];
      const skill = skills?.find((s: { name: string; autoCall?: boolean }) => s.name === tool.name);
      if (skill.autoCall) {
        await this.callTool(toolCalls[0], true);
      }
    }

    this.ctx.res.end();
  }

  async getConversationHistory(messageIdFilter?: string) {
    const historyMessages = await this.db.getRepository('aiConversations.messages', this.sessionId).find({
      sort: ['messageId'],
      ...(messageIdFilter
        ? {
            filter: {
              messageId: {
                $lt: messageIdFilter,
              },
            },
          }
        : {}),
    });

    return await this.formatMessages(historyMessages);
  }

  async formatMessages(messages: any[]) {
    const formattedMessages = [];

    for (const msg of messages) {
      const attachments = msg.attachments;
      const workContext = msg.workContext;
      let content = msg.content.content;
      if (typeof content === 'string') {
        content = `<user_query>${content}</user_query>`;
        if (workContext?.length) {
          content = `<work_context>${JSON.stringify(workContext)}</work_context>
${content}`;
        }
      }
      if (!content && !attachments && !msg.toolCalls?.length) {
        continue;
      }
      if (msg.role === 'user') {
        const contents = [];
        if (attachments?.length) {
          for (const attachment of attachments) {
            contents.push({
              type: 'file',
              content: attachment,
            });
          }
          if (content) {
            contents.push({
              type: 'text',
              content,
            });
          }
        }
        formattedMessages.push({
          role: 'user',
          content: contents.length ? contents : content,
        });
        continue;
      }
      if (msg.role === 'tool') {
        formattedMessages.push({
          role: 'tool',
          content,
          tool_call_id: msg.metadata?.toolCall?.id,
        });
        continue;
      }
      formattedMessages.push({
        role: 'assistant',
        content,
        tool_calls: msg.toolCalls,
      });
    }

    return formattedMessages;
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

  async getHistoryMessages(messageId?: string) {
    const history = await this.getConversationHistory(messageId);
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
    const historyMessages = [
      {
        role: 'system',
        content: getSystemPrompt({
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
        }),
      },
      ...history,
    ];

    return historyMessages;
  }

  async callTool(
    toolCall: {
      id: string;
      name: string;
      args: any;
    },
    autoCall = false,
  ) {
    try {
      const tool = await this.plugin.aiManager.toolManager.getTool(toolCall.name);
      if (!tool) {
        this.sendErrorResponse('Tool not found');
        return;
      }

      if (tool.execution === 'frontend' && autoCall) {
        this.ctx.res.write(`data: ${JSON.stringify({ type: 'tool', body: toolCall })} \n\n`);
        this.ctx.res.end();
        return;
      }

      const result = await tool.invoke(this.ctx, toolCall.args);
      if (result.status === 'error') {
        this.sendErrorResponse(result.content);
      }

      const historyMessages = await this.getHistoryMessages();
      const formattedMessages = [
        ...historyMessages,
        {
          role: 'tool',
          name: toolCall.name,
          content: result.content,
          tool_call_id: toolCall.id,
        },
      ];

      const { provider, model, service } = await this.getLLMService(formattedMessages);
      await this.db.getRepository('aiConversations.messages', this.sessionId).create({
        values: {
          messageId: this.plugin.snowflake.generate(),
          role: 'tool',
          content: {
            type: 'text',
            content: result.content,
          },
          metadata: {
            model,
            provider: service.provider,
            toolCall,
          },
        },
      });

      const { stream, signal } = await this.prepareChatStream(provider);
      await this.processChatStream(stream, {
        signal,
        model,
        service,
        provider,
        allowEmpty: true,
      });
    } catch (err) {
      this.ctx.log.error(err);
      this.sendErrorResponse('Tool call error');
    }
  }

  sendErrorResponse(errorMessage: string) {
    this.ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: errorMessage })} \n\n`);
    this.ctx.res.end();
  }

  async processMessages(userMessages: any[]) {
    try {
      const formattedUserMessages = await this.formatMessages(userMessages);
      const historyMessages = await this.getHistoryMessages();
      const formattedMessages = [...historyMessages, ...formattedUserMessages];

      const { provider, model, service } = await this.getLLMService(formattedMessages);
      const { stream, signal } = await this.prepareChatStream(provider);

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
      const historyMessages = await this.getHistoryMessages(messageId);
      const { provider, model, service } = await this.getLLMService(historyMessages);
      const { stream, signal } = await this.prepareChatStream(provider);

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
}
