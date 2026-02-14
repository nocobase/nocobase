/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model, Op, Transaction } from '@nocobase/database';
import { Context } from '@nocobase/actions';
import { LLMProvider, ToolDefinition } from '../llm-providers/provider';
import { Database } from '@nocobase/database';
import PluginAIServer from '../plugin';
import { sendSSEError, parseVariables } from '../utils';
import { getSystemPrompt } from './prompts';
import _ from 'lodash';
import { AIChatContext, AIChatConversation, AIMessage, AIMessageInput, AIToolCall, UserDecision } from '../types';
import { createAIChatConversation } from '../manager/ai-chat-conversation';
import { DocumentSegmentedWithScore } from '../features';
import { KnowledgeBaseGroup } from '../types';
import { EEFeatures } from '../manager/ai-feature-manager';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import type { AIEmployee as AIEmployeeType } from '../../collections/ai-employees';
import { conversationMiddleware, toolCallStatusMiddleware, toolInteractionMiddleware } from './middleware';
import { ToolsEntry, ToolsFilter, ToolsManager } from '@nocobase/ai';
import { AIToolMessage } from '../types/ai-message.type';
import { SequelizeCollectionSaver } from './checkpoints';
import { createAgent as createLangChainAgent } from 'langchain';
import { Command } from '@langchain/langgraph';
import { concat } from '@langchain/core/utils/stream';
import { convertAIMessage } from './utils';
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { LLMResult } from '@langchain/core/outputs';

export interface ModelRef {
  llmService: string;
  model: string;
}

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
  private model?: ModelRef;
  private legacy?: boolean;
  private protocol: ChatStreamProtocol;

  constructor(
    ctx: Context,
    employee: Model,
    sessionId: string,
    systemMessage?: string,
    skillSettings?: Record<string, any>,
    webSearch?: boolean,
    model?: ModelRef,
    legacy?: boolean,
  ) {
    this.employee = employee;
    this.ctx = ctx;
    this.plugin = ctx.app.pm.get('ai') as PluginAIServer;
    this.db = ctx.db;
    this.sessionId = sessionId;
    this.systemMessage = systemMessage;
    this.aiChatConversation = createAIChatConversation(this.ctx, this.sessionId);
    this.skillSettings = skillSettings;
    this.model = model;
    this.legacy = legacy;

    const locale = this.ctx.getCurrentLocale();
    const builtInManager = this.plugin.builtInManager;
    builtInManager.setupBuiltInInfo(locale, this.employee as unknown as AIEmployeeType);
    this.webSearch = webSearch;
    this.protocol = ChatStreamProtocol.create(ctx);
  }

  // === Chat flow ===
  private buildState(messages: AIMessage[]) {
    return {
      lastMessageIndex: {
        lastHumanMessageIndex: messages.filter((m) => m.role === 'user').length,
        lastAIMessageIndex: messages.filter((m) => m.role === this.employee.username).length,
        lastToolMessageIndex: messages.filter((m) => m.role === 'tool').length,
        lastMessageIndex: messages.length,
      },
    };
  }

  private async initSession({ messageId, provider, model, providerName }) {
    const tools = await this.getAIEmployeeTools();

    if (!messageId && this.legacy !== true) {
      return {
        historyMessages: [],
        tools,
        middleware: this.getMiddleware({ tools, model, providerName }),
        config: undefined,
        state: undefined,
      };
    }

    const agentThread = await this.forkCurrentThread(provider);

    const historyMessages = await this.aiChatConversation.listMessages({
      messageId,
    });

    return {
      historyMessages,
      tools,
      middleware: this.getMiddleware({
        tools,
        model,
        providerName,
        messageId,
        agentThread,
      }),
      config: {
        configurable: {
          thread_id: agentThread.threadId,
        },
      },
      state: this.buildState(historyMessages),
    };
  }

  private async buildChatContext({
    messageId,
    userMessages,
    userDecisions,
  }: {
    messageId?: string;
    userMessages?: AIMessageInput[];
    userDecisions?: UserDecision[];
  }) {
    const { provider, model, service } = await this.getLLMService();
    const { historyMessages, tools, middleware, config, state } = await this.initSession({
      messageId,
      provider,
      model,
      providerName: service.provider,
    });

    const chatContext = await this.aiChatConversation.getChatContext({
      userMessages: [...historyMessages, ...(userMessages ?? [])],
      userDecisions,
      tools,
      middleware,
      getSystemPrompt: () => this.getSystemPrompt(),
      formatMessages: (messages) => this.formatMessages({ messages, provider }),
    });

    return { providerName: service.provider, model, provider, chatContext, config, state };
  }

  async stream({
    messageId,
    userMessages = [],
    userDecisions,
  }: {
    messageId?: string;
    userMessages?: AIMessageInput[];
    userDecisions?: UserDecision[];
  }) {
    try {
      const { providerName, model, provider, chatContext, config, state } = await this.buildChatContext({
        messageId,
        userMessages,
        userDecisions,
      });

      const responseMetadata = new Map<string, any>();
      const responseMetadataCollector = new ResponseMetadataCollector(provider, responseMetadata);

      const { stream, signal } = await this.prepareChatStream({
        chatContext,
        provider,
        config: { ...config, callbacks: [responseMetadataCollector] } as any,
        state,
      });
      await this.processChatStream(stream, {
        signal,
        providerName,
        model,
        provider,
        responseMetadata,
      });

      return true;
    } catch (err) {
      this.ctx.log.error(err);
      this.sendErrorResponse(err.message || 'Chat error warning');
      return false;
    }
  }

  async invoke({
    messageId,
    userMessages = [],
    userDecisions,
  }: {
    messageId?: string;
    userMessages?: AIMessageInput[];
    userDecisions?: UserDecision[];
  }) {
    try {
      const { provider, chatContext, config, state } = await this.buildChatContext({
        messageId,
        userMessages,
        userDecisions,
      });
      const { threadId } = await this.getCurrentThread();
      const invokeConfig = {
        configurable: { thread_id: threadId },
        context: { ctx: this.ctx },
        recursionLimit: 100,
        ...config,
      };
      return await this.agentInvoke(provider, chatContext, invokeConfig, state);
    } catch (err) {
      this.ctx.log.error(err);
      throw err;
    }
  }

  // === LLM/provider setup ===
  async getLLMService() {
    // model is required - it's set by the frontend ModelSwitcher
    if (!this.model?.llmService || !this.model?.model) {
      throw new Error('LLM service not configured');
    }

    const llmServiceName = this.model.llmService;
    const model = this.model.model;

    // Build model options from model
    const modelOptions: Record<string, any> = {
      llmService: llmServiceName,
      model,
    };

    if (this.webSearch === true) {
      modelOptions.builtIn = { webSearch: true };
    }

    const service = await this.db.getRepository('llmServices').findOne({
      filter: {
        name: llmServiceName,
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
      modelOptions,
    });

    return { provider, model, service };
  }

  // === Agent wiring & execution ===
  async createAgent({
    provider,
    systemPrompt,
    tools,
    middleware,
  }: {
    provider: LLMProvider;
    systemPrompt?: string;
    tools?: any[];
    middleware?: any[];
  }) {
    const model = provider.createModel();
    const toolDefinitions = tools?.map(ToolDefinition.from('ToolsEntry')) ?? [];
    const allTools = provider.resolveTools(toolDefinitions);
    const checkpointer = new SequelizeCollectionSaver(() => this.ctx.app.mainDataSource);
    return createLangChainAgent({ model, tools: allTools, middleware, systemPrompt, checkpointer });
  }

  private getAgentInput(context: AIChatContext, state?: any) {
    if (context.decisions?.length) {
      return new Command({
        resume: {
          decisions: context.decisions,
        },
      });
    }
    if (context.messages) {
      return { messages: context.messages, ...state };
    }
    return null;
  }

  async agentStream(provider: LLMProvider, context: AIChatContext, config?: any, state?: any) {
    const { systemPrompt, tools, middleware } = context;
    const agent = await this.createAgent({ provider, systemPrompt, tools, middleware });
    const input = this.getAgentInput(context, state);
    return agent.stream(input, config);
  }

  async agentInvoke(provider: LLMProvider, context: AIChatContext, config?: any, state?: any): Promise<any> {
    const { systemPrompt, tools, middleware } = context;
    const agent = await this.createAgent({ provider, systemPrompt, tools, middleware });
    const input = this.getAgentInput(context, state);
    return agent.invoke(input, config);
  }

  async prepareChatStream({
    chatContext,
    provider,
    config,
    state,
  }: {
    chatContext: AIChatContext;
    provider: LLMProvider;
    config?: { configurable?: any };
    state?: any;
  }) {
    const controller = new AbortController();
    const { signal } = controller;

    try {
      const { threadId } = await this.getCurrentThread();
      const stream = await this.agentStream(
        provider,
        chatContext,
        {
          signal,
          streamMode: ['updates', 'messages', 'custom'],
          configurable: { thread_id: threadId },
          context: { ctx: this.ctx },
          recursionLimit: 100,
          ...config,
        },
        state,
      );
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
      providerName: string;
      model: string;
      provider: LLMProvider;
      allowEmpty?: boolean;
      responseMetadata: Map<string, any>;
    },
  ) {
    let toolCalls: AIToolCall[];
    const { signal, providerName, model, provider, responseMetadata, allowEmpty = false } = options;

    let gathered: any;
    signal.addEventListener('abort', async () => {
      if (gathered?.type === 'ai') {
        const values = convertAIMessage({
          aiEmployee: this,
          providerName,
          model,
          aiMessage: gathered,
        });
        if (values) {
          values.metadata.interrupted = true;
        }

        await this.aiChatConversation.withTransaction(async (conversation, transaction) => {
          const result: AIMessage = await conversation.addMessages(values);
          if (toolCalls?.length) {
            await this.initToolCall(transaction, result.messageId, toolCalls as any);
          }
        });
      }
    });

    try {
      this.protocol.startStream();
      for await (const [mode, chunks] of stream) {
        if (mode === 'messages') {
          const [chunk] = chunks;
          if (chunk.type === 'ai') {
            gathered = gathered !== undefined ? concat(gathered, chunk) : chunk;
            if (chunk.content) {
              const parsedContent = provider.parseResponseChunk(chunk.content);
              if (parsedContent) {
                this.protocol.content(parsedContent);
              }
            }

            if (chunk.tool_call_chunks?.length) {
              this.protocol.toolCallChunks(chunk.tool_call_chunks);
            }

            const webSearch = provider.parseWebSearchAction(chunk);
            if (webSearch?.length) {
              this.protocol.webSearch(webSearch);
            }
          }
        } else if (mode === 'updates') {
          if ('__interrupt__' in chunks) {
            const interruptActions = this.toInterruptActions(chunks.__interrupt__[0].value);
            if (interruptActions.size) {
              for (const toolCall of toolCalls ?? []) {
                const interruptAction = interruptActions.get(toolCall.name);
                if (!interruptAction) {
                  continue;
                }
                await this.updateToolCallInterrupted(toolCall.messageId, toolCall.id, interruptAction);
                this.protocol.toolCallStatus({
                  toolCall: {
                    messageId: toolCall.messageId,
                    id: toolCall.id,
                    name: toolCall.name,
                    willInterrupt: toolCall.willInterrupt,
                  },
                  invokeStatus: 'interrupted',
                  interruptAction,
                });
              }
            }
          }
        } else if (mode === 'custom') {
          if (chunks.action === 'AfterAIMessageSaved') {
            const data = responseMetadata.get(chunks.body.id);
            if (data) {
              const savedMessage = await this.aiMessagesModel.findOne({
                where: {
                  messageId: chunks.body.messageId,
                },
              });
              if (savedMessage) {
                await this.aiMessagesModel.update(
                  {
                    metadata: {
                      ...savedMessage.metadata,
                      response_metadata: {
                        ...savedMessage.metadata.response_metadata,
                        ...data,
                      },
                    },
                  },
                  {
                    where: {
                      messageId: chunks.body.messageId,
                    },
                  },
                );
              }
            }
          } else if (chunks.action === 'initToolCalls') {
            toolCalls = chunks.body?.toolCalls ?? [];
            this.protocol.toolCalls(chunks.body);
          } else if (chunks.action === 'beforeToolCall') {
            const toolsMap = await this.getToolsMap();
            const willInterrupt = this.shouldInterruptToolCall(toolsMap.get(chunks.body?.toolCall?.name));
            this.protocol.toolCallStatus({
              toolCall: {
                messageId: chunks.body?.toolCall?.messageId,
                id: chunks.body?.toolCall?.id,
                name: chunks.body?.toolCall?.name,
                willInterrupt,
              },
              invokeStatus: 'pending',
            });
          } else if (chunks.action === 'afterToolCall') {
            const toolsMap = await this.getToolsMap();
            const willInterrupt = this.shouldInterruptToolCall(toolsMap.get(chunks.body?.toolCall?.name));
            this.protocol.toolCallStatus({
              toolCall: {
                messageId: chunks.body?.toolCall?.messageId,
                id: chunks.body?.toolCall?.id,
                name: chunks.body?.toolCall?.name,
                willInterrupt,
              },
              invokeStatus: 'done',
              status: chunks.body?.toolCallResult?.status,
            });
          } else if (chunks.action === 'beforeSendToolMessage') {
            const { messageId, messages } = chunks.body ?? {};
            if (messages.length) {
              const toolsMap = await this.getToolsMap();
              const toolCallResultMap = await this.getToolCallResultMap(
                messageId,
                messages.map((x) => x.metadata).map((x) => x.toolCallId),
              );
              for (const { metadata } of messages) {
                const tools = toolsMap.get(metadata.toolName);
                const toolCallResult = toolCallResultMap.get(metadata.toolCallId);
                this.protocol.toolCallStatus({
                  toolCall: {
                    messageId,
                    id: metadata.toolCallId,
                    name: metadata.toolName,
                    willInterrupt: this.shouldInterruptToolCall(tools),
                  },
                  invokeStatus: 'confirmed',
                  status: toolCallResult?.status,
                });
              }
            }

            this.protocol.newMessage();
          }
        }
      }

      if (this.protocol.statistics.sent === 0 && !signal.aborted && !allowEmpty) {
        this.sendErrorResponse('Empty message');
        return;
      }

      this.protocol.endStream();
    } catch (err) {
      this.ctx.log.error(err);
      if (err.name === 'GraphRecursionError') {
        this.sendSpecificError({ name: err.name, message: err.message });
      } else {
        this.sendErrorResponse(err.message);
      }
    } finally {
      this.ctx.res.end();
    }
  }

  // === Prompts & knowledge base ===
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

    const systemPrompt = getSystemPrompt({
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

    const { important } = this.ctx.action.params.values || {};
    if (important === 'GraphRecursionError') {
      const importantPrompt = `<Important>You have already called tools multiple times and gathered sufficient information.
First, provide a summary based on the existing information. Do not call additional tools.
If information is missing, clearly state it in the summary.</Important>`;
      return importantPrompt + '\n\n' + systemPrompt;
    } else {
      return systemPrompt;
    }
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

  // === Tool calls ===
  async initToolCall(
    transaction: Transaction,
    messageId: string,
    toolCalls: {
      id: string;
      name: string;
      args: any;
    }[],
  ): Promise<Model<AIToolMessage>[]> {
    const nowTime = new Date();
    const toolMap = await this.getToolsMap();
    return await this.aiToolMessagesRepo.create({
      values: toolCalls.map((toolCall) => {
        const toolsExisted = toolMap.has(toolCall.name);
        const tools = toolMap.get(toolCall.name);
        const auto = this.isAutoCall(tools);
        return {
          id: this.plugin.snowflake.generate(),
          sessionId: this.sessionId,
          messageId: messageId,
          toolCallId: toolCall.id,
          toolName: toolCall.name,
          status: toolsExisted ? null : 'error',
          content: toolsExisted ? null : `Tool ${toolCall.name} not found`,
          invokeStatus: toolsExisted ? 'init' : 'done',
          invokeStartTime: toolsExisted ? null : nowTime,
          invokeEndTime: toolsExisted ? null : nowTime,
          auto,
          execution: tools?.execution ?? 'backend',
        };
      }),
      transaction,
    });
  }

  async updateToolCallInterrupted(
    messageId: string,
    toolCallId: string,
    interruptAction: {
      order: number;
      description?: string;
      allowed_decisions?: string[];
    },
  ) {
    const [updated] = await this.aiToolMessagesModel.update(
      {
        invokeStatus: 'interrupted',
        interruptActionOrder: interruptAction.order,
        interruptAction,
      },
      {
        where: {
          sessionId: this.sessionId,
          messageId,
          toolCallId,
          invokeStatus: 'init',
        },
      },
    );
    return updated;
  }

  async updateToolCallPending(messageId: string, toolCallId: string) {
    const [updated] = await this.aiToolMessagesModel.update(
      {
        invokeStatus: 'pending',
        invokeStartTime: new Date(),
      },
      {
        where: {
          sessionId: this.sessionId,
          messageId,
          toolCallId,
          invokeStatus: {
            [Op.in]: ['init', 'waiting'],
          },
        },
      },
    );
    return updated;
  }

  async updateToolCallDone(messageId: string, toolCallId: string, result: any) {
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
          messageId,
          toolCallId,
          invokeStatus: 'pending',
        },
      },
    );
    return updated;
  }

  async confirmToolCall(transaction: Transaction, messageId: string, toolCallIds: string[]) {
    const [updated] = await this.aiToolMessagesModel.update(
      {
        invokeStatus: 'confirmed',
      },
      {
        where: {
          sessionId: this.sessionId,
          messageId,
          toolCallId: {
            [Op.in]: toolCallIds,
          },
        },
        transaction,
      },
    );
    return updated;
  }

  async getToolCallResult(messageId: string, toolCallId: string): Promise<AIToolMessage> {
    return (
      await this.aiToolMessagesModel.findOne({
        where: {
          sessionId: this.sessionId,
          messageId,
          toolCallId,
        },
      })
    )?.toJSON();
  }

  async getToolCallResultMap(messageId: string, toolCallIds: string[]): Promise<Map<string, AIToolMessage>> {
    const list: AIToolMessage[] = (
      await this.aiToolMessagesModel.findAll({
        where: {
          sessionId: this.sessionId,
          messageId,
          toolCallId: {
            [Op.in]: toolCallIds,
          },
        },
      })
    ).map((it) => it.toJSON());
    return new Map(list.map((it) => [it.toolCallId, it]));
  }

  async getUserDecisions(messageId: string): Promise<UserDecision[]> {
    const allInterruptedToolCall = await this.aiToolMessagesModel.findAll({
      where: {
        messageId,
        interruptActionOrder: { [Op.not]: null },
      },
      order: [['interruptActionOrder', 'ASC']],
    });
    if (!allInterruptedToolCall.every((t) => t.invokeStatus === 'waiting')) {
      return [];
    }
    return allInterruptedToolCall.map((item) => item.userDecision as UserDecision);
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
    const toolCalls: AIToolMessage[] = await this.aiToolMessagesRepo.find({
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

  sendSpecificError({ name, message }: { name: string; message: string }) {
    sendSSEError(this.ctx, message, name);
  }

  // === Conversation/thread helpers ===
  async updateThread(transaction: Transaction, { sessionId, thread }: { sessionId: string; thread: number }) {
    await this.aiConversationsRepo.update({
      values: { thread },
      filter: {
        sessionId,
        thread: {
          $lt: thread,
        },
      },
      transaction,
    });
  }

  removeAbortController() {
    this.plugin.aiEmployeesManager.conversationController.delete(this.sessionId);
  }

  shouldInterruptToolCall(tools: ToolsEntry): boolean {
    return tools?.execution === 'frontend' || !this.isAutoCall(tools);
  }

  isAutoCall(tools: ToolsEntry): boolean {
    if (!tools) {
      return false;
    }
    const isAutoCall = tools.defaultPermission === 'ALLOW';
    if (tools.scope !== 'CUSTOM') {
      return isAutoCall;
    }
    const skills = this.employee.skillSettings?.skills ?? [];
    const presetTools = skills.find((s) => s.name === tools.definition.name);
    return presetTools ? presetTools.autoCall : isAutoCall;
  }

  private async formatMessages({ messages, provider }: { messages: AIMessageInput[]; provider: LLMProvider }) {
    const formattedMessages = [];
    const workContextHandler = this.plugin.workContextHandler;

    // 截断过长的内容
    const truncate = (text: string, maxLen = 50000) => {
      if (!text || text.length <= maxLen) return text;
      return text.slice(0, maxLen) + '\n...[truncated]';
    };

    for (const msg of messages) {
      const attachments = msg.attachments;
      const workContext = msg.workContext;
      const userContent = msg.content;
      let { content } = userContent ?? {};

      // Handle array content from providers like Anthropic web search (backward compat)
      if (Array.isArray(content)) {
        const textBlocks = content.filter((block: any) => block.type === 'text');
        content = textBlocks.map((block: any) => block.text).join('') || '';
      }

      // 截断消息内容
      if (typeof content === 'string') {
        content = truncate(content);
      }
      if (msg.role === 'user') {
        if (typeof content === 'string') {
          content = `<user_query>${content}</user_query>`;
          if (workContext?.length) {
            const workContextStr = (await workContextHandler.resolve(this.ctx, workContext))
              .map((x) => `<work_context>${x}</work_context>`)
              .join('\n');
            content = workContextStr + '\n' + content;
          }
        }
        const contents = [];
        if (attachments?.length) {
          for (const attachment of attachments) {
            const parsed = await provider.parseAttachment(this.ctx, attachment);
            contents.push(parsed);
          }
          if (content) {
            contents.push({
              type: 'text',
              text: content,
            });
          }
        }
        formattedMessages.push({
          role: 'user',
          content: contents.length ? contents : content,
          additional_kwargs: {
            userContent,
            attachments,
            workContext,
          },
        });
        continue;
      }
      if (msg.role === 'tool') {
        formattedMessages.push({
          role: 'tool',
          content,
          tool_call_id: msg.metadata?.toolCallId,
        });
        continue;
      }
      formattedMessages.push({
        role: 'assistant',
        content,
        tool_calls: msg.toolCalls,
        additional_kwargs: msg.metadata?.additional_kwargs,
      });
    }

    return formattedMessages;
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

  private toInterruptActions(interrupt: {
    actionRequests: { name: string; args: unknown; description: string }[];
    reviewConfigs: { actionName: string; allowedDecisions: string[] }[];
  }): Map<string, { order: number; description: string; allowedDecisions: string[] }> {
    const result = new Map();
    const { actionRequests = [], reviewConfigs = [] } = interrupt;
    if (!actionRequests.length) {
      return result;
    }
    let order = 0;
    const actionRequestsMap = new Map(actionRequests.map((x) => [x.name, x]));
    const reviewConfigsMap = new Map(reviewConfigs.map((x) => [x.actionName, x]));
    for (const [name, actionRequest] of actionRequestsMap.entries()) {
      result.set(name, {
        order: order++,
        description: actionRequest.description,
        allowedDecisions: reviewConfigsMap.get(name)?.allowedDecisions,
      });
    }
    return result;
  }

  private async getAIEmployeeTools() {
    const tools: ToolsEntry[] = await this.listTools({ scope: 'GENERAL' });
    const generalToolsNameSet = new Set(tools.map((x) => x.definition.name));
    const toolMap = await this.getToolsMap();
    const skills = this.employee.skillSettings?.skills ?? [];
    for (const skill of skills) {
      if (generalToolsNameSet.has(skill.name)) {
        continue;
      }
      const tool = toolMap.get(skill.name);
      if (!tool) {
        continue;
      }
      tools.push(tool);
    }
    const skillFilter = this.skillSettings?.skills ?? [];
    return tools.filter((t) => skillFilter.length === 0 || skillFilter.includes(t.definition.name));
  }

  private getMiddleware(options: {
    providerName: string;
    model: string;
    tools: ToolsEntry[];
    messageId?: string;
    agentThread?: AgentThread;
  }) {
    const { providerName, model, tools, messageId, agentThread } = options;
    return [
      toolInteractionMiddleware(this, tools),
      toolCallStatusMiddleware(this),
      conversationMiddleware(this, { providerName, model, messageId, agentThread }),
    ];
  }

  private async getCurrentThread(): Promise<AgentThread> {
    const aiConversation = await this.aiConversationsRepo.findByTargetKey(this.sessionId);
    if (!aiConversation) {
      throw new Error('Conversation not existed');
    }
    return AgentThread.newThread(aiConversation.sessionId, aiConversation.thread);
  }

  private async forkCurrentThread(provider: LLMProvider): Promise<AgentThread> {
    let retTry = 3;
    const agent = await this.createAgent({ provider });
    let currentThread = await this.getCurrentThread();
    do {
      currentThread = currentThread.fork();
      const existedState = await agent.graph.getState({ configurable: { thread_id: currentThread.threadId } });
      if (!existedState.config.configurable?.checkpoint_id) {
        return currentThread;
      }
    } while (retTry-- > 0);
    throw new Error('Fail to create new agent thread');
  }

  async getToolsMap() {
    const tools = await this.listTools();
    return new Map(tools.map((tool) => [tool.definition.name, tool]));
  }

  private listTools(filter?: ToolsFilter) {
    return this.toolsManager.listTools(filter);
  }

  private get toolsManager(): ToolsManager {
    return this.ctx.app.aiManager.toolsManager;
  }

  private get aiConversationsRepo() {
    return this.ctx.db.getRepository('aiConversations');
  }

  private get aiMessagesRepo() {
    return this.ctx.db.getRepository('aiMessages');
  }

  private get aiMessagesModel() {
    return this.ctx.db.getModel('aiMessages');
  }

  private get aiToolMessagesRepo() {
    return this.ctx.db.getRepository('aiToolMessages');
  }

  private get aiToolMessagesModel() {
    return this.ctx.db.getModel('aiToolMessages');
  }
}

class AgentThread {
  constructor(
    private readonly _sessionId: string,
    private readonly _thread: number,
  ) {}

  static newThread(sessionId: string, thread: number) {
    return new AgentThread(sessionId, thread);
  }

  get sessionId() {
    return this._sessionId;
  }

  get thread() {
    return this._thread;
  }

  get threadId() {
    return `${this._sessionId}:${this._thread}`;
  }

  fork(): AgentThread {
    return new AgentThread(this._sessionId, this._thread + 1);
  }
}

class ChatStreamProtocol {
  private _statistics = {
    sent: 0,
    addSent: (s: number) => {
      this._statistics.sent += s;
    },
    reset: () => {
      this._statistics.sent = 0;
    },
  };

  constructor(private readonly ctx: Context) {}

  static create(ctx: Context) {
    return new ChatStreamProtocol(ctx);
  }

  startStream() {
    this._statistics.reset();
    this.write({ type: 'stream_start' });
  }

  endStream() {
    this.write({ type: 'stream_end' });
  }

  newMessage(content?: unknown) {
    this.write({ type: 'new_message', body: content });
  }

  content(content: string): void {
    this.write({ type: 'content', body: content });
  }

  webSearch(content: { type: string; query: string }[]) {
    this.write({ type: 'web_search', body: content });
  }

  toolCallChunks(content: unknown) {
    this.write({ type: 'tool_call_chunks', body: content });
  }

  toolCalls(content: unknown) {
    this.write({ type: 'tool_calls', body: content });
  }

  toolCallStatus({
    toolCall,
    invokeStatus,
    status,
    interruptAction,
  }: {
    toolCall: { messageId: string; id: string; name: string; willInterrupt: boolean };
    invokeStatus: string;
    status?: string;
    interruptAction?: {
      order: number;
      description: string;
      allowedDecisions: string[];
    };
  }) {
    this.write({
      type: 'tool_call_status',
      body: {
        toolCall,
        invokeStatus,
        status,
        interruptAction,
      },
    });
  }

  get statistics() {
    return {
      sent: this._statistics.sent,
    };
  }

  private write({ type, body }: { type: string; body?: any }) {
    const data = `data: ${JSON.stringify({ type, body })}\n\n`;
    this.ctx.res.write(data);
    this._statistics.addSent(data.length);
  }
}

class ResponseMetadataCollector extends BaseCallbackHandler {
  name = 'ResponseMetadataCollector';
  constructor(
    private readonly llmProvider: LLMProvider,
    private readonly responseMetadata: Map<string, any>,
  ) {
    super();
  }

  handleLLMEnd(output: LLMResult, runId: string) {
    const [id, metadata] = this.llmProvider.parseResponseMetadata(output);
    if (id && metadata) {
      this.responseMetadata.set(id, metadata);
    }
  }

  getResponseMetadata(id: string) {
    return this.responseMetadata.get(id);
  }
}
