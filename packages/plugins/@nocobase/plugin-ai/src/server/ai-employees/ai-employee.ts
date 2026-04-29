/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model, Op, Transaction } from '@nocobase/database';
import { LLMProvider } from '../llm-providers/provider';
import { Database } from '@nocobase/database';
import PluginAIServer from '../plugin';
import { sendSSEError, parseVariables, buildTool } from '../utils';
import { getSystemPrompt } from './prompts';
import _ from 'lodash';
import { AIChatContext, AIChatConversation, AIMessage, AIMessageInput, AIToolCall, UserDecision } from '../types';
import { createAIChatConversation } from '../manager/ai-chat-conversation';
import { DocumentSegmentedWithScore } from '../features';
import { KnowledgeBaseGroup } from '../types';
import { EEFeatures } from '../manager/ai-feature-manager';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import type { AIEmployee as AIEmployeeType } from '../../collections/ai-employees';
import {
  conversationMiddleware,
  skillToolBindingMiddleware,
  toolCallStatusMiddleware,
  toolInteractionMiddleware,
  workflowHistoryMiddleware,
} from './middleware';
import { SkillsEntry, ToolsEntry, ToolsFilter, ToolsManager } from '@nocobase/ai';
import { AIToolMessage } from '../types/ai-message.type';
import { SequelizeCollectionSaver } from './checkpoints';
import { createAgent as createLangChainAgent } from 'langchain';
import { Command } from '@langchain/langgraph';
import { concat } from '@langchain/core/utils/stream';
import { convertAIMessage } from './utils';
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { LLMResult } from '@langchain/core/outputs';
import { Context } from '@nocobase/actions';
import { listAccessibleAIEmployees, serializeEmployeeSummary } from '../../ai/tools/sub-agents/shared';

export interface ModelRef {
  llmService: string;
  model: string;
}

export interface AIEmployeeOptions {
  ctx: Context;
  employee: Model;
  sessionId: string;
  systemMessage?: string;
  skillSettings?: Record<string, any>;
  webSearch?: boolean;
  model?: ModelRef;
  legacy?: boolean;
  from?: 'main-agent' | 'sub-agent';
  tools?: { name: string }[];
}

type InterruptPayload = {
  actionRequests: { name: string; args: unknown; description: string }[];
  reviewConfigs: { actionName: string; allowedDecisions: string[] }[];
};

type InterruptAction = {
  order: number;
  description: string;
  allowedDecisions: string[];
  toolCall?: { id: string; name: string };
  currentConversation?: {
    sessionId: string;
    from: string;
    username: string;
  };
};

export class AIEmployee {
  sessionId: string;
  from = 'main-agent';
  employee: Model;
  aiChatConversation: AIChatConversation;
  skillSettings?: Record<string, any>;
  private plugin: PluginAIServer;
  private db: Database;

  private ctx: Context;
  private systemMessage: string;
  private protocol: ChatStreamProtocol;
  private webSearch?: boolean;
  private model?: ModelRef;
  private legacy?: boolean;
  private tools: { name: string }[];
  private inWorkflow?: boolean;

  constructor({
    ctx,
    employee,
    sessionId,
    systemMessage,
    skillSettings,
    webSearch,
    model,
    legacy,
    from = 'main-agent',
    tools = [],
  }: AIEmployeeOptions) {
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
    this.from = from;
    this.tools = tools;

    const builtInManager = this.plugin.builtInManager;
    builtInManager.setupBuiltInInfo(ctx, this.employee as unknown as AIEmployeeType);
    this.webSearch = webSearch;
    this.protocol = ChatStreamProtocol.fromContext(ctx);
  }

  async getFormatMessages(userMessages: AIMessageInput[]) {
    const { provider } = await this.plugin.aiManager.getLLMService({
      ...this.model,
    });
    const { messages } = await this.aiChatConversation.getChatContext({
      userMessages,
      formatMessages: (messages) => this.formatMessages({ messages, provider }),
    });
    return messages;
  }

  async isInWorkflow() {
    if (this.inWorkflow !== undefined) {
      return this.inWorkflow;
    }
    const conversation = await this.aiConversationsRepo.findByTargetKey(this.sessionId);
    this.inWorkflow = conversation?.category === 'task';
    return this.inWorkflow;
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
    const { tools, baseToolNames } = await this.getAgentTools();
    const resolvedTools = provider.resolveTools(tools.map(buildTool));
    if (!messageId && this.legacy !== true) {
      return {
        historyMessages: [],
        tools,
        resolvedTools,
        middleware: await this.getMiddleware({ tools, baseToolNames, model, providerName }),
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
      resolvedTools,
      middleware: await this.getMiddleware({
        tools,
        baseToolNames,
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
    userDecisions?: {
      interruptId?: string;
      decisions: UserDecision[];
    };
  }) {
    const { provider, model, service } = await this.plugin.aiManager.getLLMService({
      ...this.model,
    });
    const { historyMessages, tools, resolvedTools, middleware, config, state } = await this.initSession({
      messageId,
      provider,
      model,
      providerName: service.provider,
    });

    const chatContext = await this.aiChatConversation.getChatContext({
      userMessages: [...historyMessages, ...(userMessages ?? [])],
      userDecisions,
      tools: resolvedTools,
      middleware,
      getSystemPrompt: (userMessages) => this.getSystemPrompt(userMessages),
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
    userDecisions?: {
      interruptId?: string;
      decisions: UserDecision[];
    };
  }) {
    await this.aiConversationsRepo.update({
      values: { llmActiveState: 'streaming' },
      filter: {
        sessionId: this.sessionId,
      },
    });
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
    } finally {
      await this.aiConversationsRepo.update({
        values: { llmActiveState: 'idle' },
        filter: {
          sessionId: this.sessionId,
        },
      });
    }
  }

  async invoke({
    messageId,
    userMessages = [],
    userDecisions,
    writer,
    context,
  }: {
    messageId?: string;
    userMessages?: AIMessageInput[];
    userDecisions?: {
      interruptId?: string;
      decisions: UserDecision[];
    };
    writer?: (chunk: any) => void;
    context?: any;
  }) {
    await this.aiConversationsRepo.update({
      values: { llmActiveState: 'invoking' },
      filter: {
        sessionId: this.sessionId,
      },
    });
    try {
      const { provider, chatContext, config, state } = await this.buildChatContext({
        messageId,
        userMessages,
        userDecisions,
      });

      const { threadId } = await this.getCurrentThread();
      const invokeConfig = {
        context: { ctx: this.ctx, decisions: chatContext.decisions, ...context },
        recursionLimit: 100,
        configurable: this.from === 'main-agent' ? { thread_id: threadId } : undefined,
        writer,
        ...config,
      };

      const invokeResult = await this.agentInvoke(provider, chatContext, invokeConfig, state);

      await this.handleInterruptedToolCalls(invokeResult?.__interrupt__?.[0], () => invokeResult?.messageId);

      return invokeResult;
    } catch (err) {
      if (err.name === 'GraphInterrupt') {
        throw err;
      }
      this.ctx.log.error(err);
      throw err;
    } finally {
      await this.aiConversationsRepo.update({
        values: { llmActiveState: 'idle' },
        filter: {
          sessionId: this.sessionId,
        },
      });
    }
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
    const allTools = tools ?? [];
    if (this.from === 'main-agent') {
      const checkpointer = new SequelizeCollectionSaver(() => this.ctx.app.mainDataSource);
      return createLangChainAgent({ model, tools: allTools, middleware, systemPrompt, checkpointer });
    } else {
      return createLangChainAgent({ model, tools: allTools, middleware, systemPrompt });
    }
  }

  private getAgentInput(context: AIChatContext, state?: any) {
    if (context.decisions?.decisions?.length) {
      return new Command({
        resume: context.decisions.interruptId
          ? {
              [context.decisions.interruptId]: {
                decisions: context.decisions.decisions,
              },
            }
          : {
              decisions: context.decisions.decisions,
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
    if (this.from === 'sub-agent') {
      delete config.configurable;
    }
    return agent.stream(input, this.withRunMetadata(config));
  }

  async agentInvoke(provider: LLMProvider, context: AIChatContext, config?: any, state?: any): Promise<any> {
    const { systemPrompt, tools, middleware } = context;
    const agent = await this.createAgent({ provider, systemPrompt, tools, middleware });
    const input = this.getAgentInput(context, state);
    if (this.from === 'sub-agent') {
      delete config.configurable;
    }
    return agent.invoke(input, this.withRunMetadata(config));
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
          configurable: this.from === 'main-agent' ? { thread_id: threadId } : undefined,
          context: { ctx: this.ctx, decisions: chatContext.decisions },
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
    const aiMessageIdMap = new Map<string, string>();
    const { signal, providerName, model, provider, responseMetadata, allowEmpty = false } = options;

    let isReasoning = false;
    let gathered: any;
    signal.addEventListener('abort', async () => {
      try {
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
          });
        }
      } catch (e) {
        this.logger.error('Fail to save message after conversation abort', gathered);
      }
    });

    try {
      const aiEmployeeConversation = {
        sessionId: this.sessionId,
        from: this.from,
        username: this.employee.username,
      };
      this.protocol.with(aiEmployeeConversation).startStream();
      for await (const [mode, chunks] of stream) {
        if (mode === 'messages') {
          const [chunk, metadata] = chunks;
          const { currentConversation } = metadata;
          if (chunk.type === 'ai') {
            gathered = gathered !== undefined ? concat(gathered, chunk) : chunk;
            if (chunk.content) {
              if (isReasoning) {
                isReasoning = false;
                this.protocol.with(currentConversation).stopReasoning();
              }
              const parsedContent = provider.parseResponseChunk(chunk.content);
              if (parsedContent) {
                this.protocol.with(currentConversation).content(parsedContent);
              }
            }

            if (chunk.tool_call_chunks?.length) {
              this.protocol.with(currentConversation).toolCallChunks(chunk.tool_call_chunks);
            }

            const webSearch = provider.parseWebSearchAction(chunk);
            if (webSearch?.length) {
              this.protocol.with(currentConversation).webSearch(webSearch);
            }

            const reasoningContent = provider.parseReasoningContent(chunk);
            if (reasoningContent) {
              isReasoning = true;
              this.protocol.with(currentConversation).reasoning(reasoningContent);
            }
          }
        } else if (mode === 'updates') {
          const interrupt = chunks?.__interrupt__?.[0];
          if (interrupt) {
            const toolsMap = await this.getToolsMap();
            await this.handleInterruptedToolCalls(
              interrupt,
              (sessionId) => aiMessageIdMap.get(sessionId),
              ({ messageId, interruptAction, toolCall, currentConversation }) => {
                this.protocol.with(currentConversation).toolCallStatus({
                  toolCall: {
                    messageId,
                    id: toolCall.id,
                    name: toolCall.name,
                    willInterrupt: this.shouldInterruptToolCall(toolsMap.get(toolCall.name)),
                  },
                  invokeStatus: 'interrupted',
                  interruptAction,
                });
              },
            );
          }
        } else if (mode === 'custom') {
          const { currentConversation } = chunks;
          if (chunks.action === 'AfterAIMessageSaved') {
            aiMessageIdMap.set(currentConversation.sessionId, chunks.body.messageId);

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
            this.protocol.with(currentConversation).toolCalls(chunks.body);
          } else if (chunks.action === 'beforeToolCall') {
            const toolsMap = await this.getToolsMap();
            const willInterrupt = this.shouldInterruptToolCall(toolsMap.get(chunks.body?.toolCall?.name));
            this.protocol.with(currentConversation).toolCallStatus({
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
            this.protocol.with(currentConversation).toolCallStatus({
              toolCall: {
                messageId: chunks.body?.toolCall?.messageId,
                id: chunks.body?.toolCall?.id,
                name: chunks.body?.toolCall?.name,
                willInterrupt,
              },
              invokeStatus: 'done',
              status: chunks.body?.toolCallResult?.status,
              invokeStartTime: chunks.body?.toolCallResult?.invokeStartTime,
              invokeEndTime: chunks.body?.toolCallResult?.invokeEndTime,
              content: chunks.body?.toolCallResult?.content,
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
                this.protocol.with(currentConversation).toolCallStatus({
                  toolCall: {
                    messageId,
                    id: metadata.toolCallId,
                    name: metadata.toolName,
                    willInterrupt: this.shouldInterruptToolCall(tools),
                  },
                  invokeStatus: 'confirmed',
                  status: toolCallResult?.status,
                  invokeStartTime: toolCallResult?.invokeStartTime,
                  invokeEndTime: toolCallResult?.invokeEndTime,
                  content: toolCallResult?.content,
                });
              }
            }

            this.protocol.with(currentConversation).newMessage();
          } else if (chunks.action === 'afterSubAgentInvoke') {
            this.protocol.with(currentConversation).subAgentCompleted();
          }
        }
      }

      if (this.protocol.statistics.sent === 0 && !signal.aborted && !allowEmpty) {
        this.sendErrorResponse('Empty message');
        return;
      }

      this.protocol.with(aiEmployeeConversation).endStream();
    } catch (err) {
      this.ctx.log.error(err);
      if (err.name === 'GraphRecursionError') {
        this.sendSpecificError({ name: err.name, message: err.message });
      } else {
        this.sendErrorResponse(provider.parseResponseError(err));
      }
    } finally {
      if (this.from === 'main-agent') {
        this.ctx.res.end();
      }
    }
  }

  private async handleInterruptedToolCalls(
    interrupt: { id?: string; value?: InterruptPayload } | undefined,
    getMessageId: (sessionId: string) => string | undefined,
    onInterrupted?: (params: {
      messageId: string;
      interruptId: string;
      interruptAction: InterruptAction;
      toolCall: { id: string; name: string };
      currentConversation: { sessionId: string; from: string; username: string };
    }) => Promise<void> | void,
  ) {
    const interruptId = interrupt?.id;
    const interruptActions = this.toInterruptActions(interrupt?.value);
    if (!interruptId || !interruptActions.size) {
      return;
    }

    for (const interruptAction of interruptActions.values()) {
      const currentConversation = interruptAction.currentConversation;
      const toolCall = interruptAction.toolCall;
      if (!currentConversation || !toolCall) {
        this.logger.warn('currentConversation or toolCall not exist in __interrupt__', interruptAction);
        continue;
      }

      const messageId = getMessageId(currentConversation.sessionId);
      if (!messageId) {
        continue;
      }

      await this.updateToolCallInterrupted(
        currentConversation.sessionId,
        messageId,
        toolCall.id,
        interruptId,
        interruptAction,
      );
      await onInterrupted?.({
        messageId,
        interruptId,
        interruptAction,
        toolCall,
        currentConversation,
      });
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

  async getSystemPrompt(userMessages: AIMessageInput[]) {
    const userConfig = await this.db.getRepository('usersAiEmployees').findOne({
      filter: {
        userId: this.ctx.auth?.user.id ?? 0,
        aiEmployee: this.employee.username,
      },
    });

    const about = await parseVariables(this.ctx, this.employee.about ?? this.employee.defaultPrompt ?? '');

    let background = '';
    if (this.systemMessage) {
      background = await parseVariables(this.ctx, this.systemMessage);
    }
    const dataSourceMessage = this.getEmployeeDataSourceContext();
    if (dataSourceMessage) {
      background = `${background}\n${dataSourceMessage}`;
    }

    const aiMessages = await this.aiChatConversation.listMessages();
    const workContextBackground = await this.plugin.workContextHandler.background(this.ctx, aiMessages);
    if (workContextBackground?.length) {
      background = `${background}\n${workContextBackground.join('\n')}`;
    }
    const addSystemPrompt = userMessages?.filter((it) => it.role == 'system');
    if (addSystemPrompt.length) {
      background = `${background}\n${addSystemPrompt.map((it) => it.content).join('\n')}`;
    }

    let knowledgeBase: string | undefined;
    const { knowledgeBaseManager } = this.plugin;
    const employee: AIEmployeeType = this.employee.toJSON();
    if (
      (await knowledgeBaseManager.isEnabledKnowledgeBase(employee)) &&
      employee.knowledgeBasePrompt &&
      userMessages?.length
    ) {
      const lastUserMessage = userMessages.filter((x) => x.role === 'user').at(-1);
      if (lastUserMessage) {
        knowledgeBase = await knowledgeBaseManager.retrievePrompt({
          employee,
          query: lastUserMessage.content.content as string,
        });
      }
    }

    const availableSkills = await this.getAvailableSkills();
    const availableAIEmployees = await this.getAvailableAIEmployees();

    const systemPrompt = getSystemPrompt({
      aiEmployee: {
        nickname: this.employee.nickname,
        about,
      },
      task: {
        background,
      },
      personal: userConfig?.prompt,
      environment: {
        database: this.db.sequelize.getDialect(),
        locale: this.ctx.getCurrentLocale?.() || 'en-US',
        currentDateTime: getCurrentDateTimeForPrompt(this.ctx.getCurrentLocale?.(), getCurrentTimezone(this.ctx)),
        timezone: getCurrentTimezone(this.ctx),
      },
      knowledgeBase,
      availableSkills,
      availableAIEmployees,
    });

    const { important } = this.ctx.action?.params?.values || {};
    if (important === 'GraphRecursionError') {
      const importantPrompt = `<Important>You have already called tools multiple times and gathered sufficient information.
First, provide a summary based on the existing information. Do not call additional tools.
If information is missing, clearly state it in the summary.</Important>`;
      return importantPrompt + '\n\n' + systemPrompt;
    } else {
      return systemPrompt;
    }
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
    sessionId: string,
    messageId: string,
    toolCallId: string,
    interruptId: string,
    interruptAction: {
      order: number;
      description?: string;
      allowed_decisions?: string[];
    },
  ) {
    return await this.db.sequelize.transaction(async (transaction) => {
      const [updated] = await this.aiToolMessagesModel.update(
        {
          invokeStatus: 'interrupted',
          interruptActionOrder: interruptAction.order,
          interruptAction,
        },
        {
          where: {
            sessionId,
            messageId,
            toolCallId,
            invokeStatus: 'init',
          },
          transaction,
        },
      );

      if (!updated) {
        return updated;
      }

      const message = await this.aiMessagesModel.findOne({
        where: {
          messageId,
          sessionId,
        },
        transaction,
      });

      if (!message) {
        return updated;
      }

      await this.aiMessagesModel.update(
        {
          metadata: {
            ...(message.get('metadata') ?? {}),
            interruptId,
          },
        },
        {
          where: {
            messageId,
            sessionId,
          },
          transaction,
        },
      );

      return updated;
    });
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
          messageId,
          toolCallId: {
            [Op.in]: toolCallIds,
          },
        },
      })
    ).map((it) => it.toJSON());
    return new Map(list.map((it) => [it.toolCallId, it]));
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
    const toolMessages: AIToolMessage[] = (
      await this.aiToolMessagesModel.findAll<Model<AIToolMessage>>({
        where: {
          messageId,
          invokeStatus: {
            [Op.ne]: 'confirmed',
          },
        },
      })
    ).map((it) => it.toJSON());
    if (!toolMessages || _.isEmpty(toolMessages)) {
      return;
    }

    const { model, service } = await this.plugin.aiManager.getLLMService({
      ...this.model,
    });
    const toolCallMap = await this.getToolCallMap(messageId);
    const now = new Date();
    const toolMessageContent = 'The user ignored the application for tools usage and will continued to ask questions';
    return await this.db.sequelize.transaction(async (transaction) => {
      for (const toolMessage of toolMessages) {
        await this.aiToolMessagesModel.update(
          {
            invokeStatus: 'confirmed',
            status: 'success',
            content: toolMessageContent,
            invokeStartTime: toolMessage.invokeStartTime ?? now,
            invokeEndTime: toolMessage.invokeEndTime ?? now,
          },
          {
            where: {
              id: toolMessage.id,
              invokeStatus: toolMessage.invokeStatus,
            },
            transaction,
          },
        );
      }
      return await this.db.getRepository('aiConversations.messages', this.sessionId).create({
        values: toolMessages.map((toolMessage) => ({
          messageId: this.plugin.snowflake.generate(),
          role: 'tool',
          content: {
            type: 'text',
            content: toolMessageContent,
          },
          metadata: {
            model,
            provider: service.provider,
            toolCall: toolCallMap.get(toolMessage.toolCallId),
            toolCallId: toolMessage.toolCallId,
            autoCall: toolMessage.auto,
          },
          transaction,
        })),
      });
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
    const employeeTools = this.employee.skillSettings?.tools ?? [];
    const presetTools = employeeTools.find((s) => s.name === tools.definition.name);
    return presetTools ? presetTools.autoCall : isAutoCall;
  }

  private async formatMessages({ messages, provider }: { messages: AIMessageInput[]; provider: LLMProvider }) {
    const formattedMessages = [];
    const workContextHandler = this.plugin.workContextHandler;
    await this.hydrateAttachmentsMeta(messages);

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
        const contentBlocks = [];
        if (attachments?.length) {
          for (const attachment of attachments) {
            const parsed = await provider.parseAttachment(this.ctx, attachment as any);
            if (parsed.placement === 'system') {
              formattedMessages.push({
                role: 'system',
                content: parsed.content,
              });
            } else {
              contentBlocks.push(parsed.content);
            }
          }
          if (content && contentBlocks.length > 0) {
            contentBlocks.push({
              type: 'text',
              text: content,
            });
          }
        }
        const role = 'user';
        const additional_kwargs = { userContent, attachments, workContext };
        if (contentBlocks.length) {
          formattedMessages.push({
            role,
            additional_kwargs,
            contentBlocks,
          });
        } else {
          formattedMessages.push({
            role,
            additional_kwargs,
            content,
          });
        }

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

  private async hydrateAttachmentsMeta(messages: AIMessageInput[]) {
    type AttachmentWithMeta = { id?: string | number; meta?: unknown };
    const attachmentIds = new Set<string | number>();

    for (const message of messages) {
      if (!message.attachments?.length) {
        continue;
      }
      for (const attachment of message.attachments as AttachmentWithMeta[]) {
        if (attachment?.id != null) {
          attachmentIds.add(attachment.id);
        }
      }
    }

    if (!attachmentIds.size) {
      return;
    }

    const files = await this.aiFilesModel.findAll({
      where: {
        id: {
          [Op.in]: Array.from(attachmentIds),
        },
      },
      attributes: ['id', 'meta'],
    });
    const metaById = new Map(files.map((file) => [file.get('id') as string | number, file.get('meta')]));

    for (const message of messages) {
      if (!message.attachments?.length) {
        continue;
      }
      for (const attachment of message.attachments as AttachmentWithMeta[]) {
        if (attachment?.id == null) {
          continue;
        }
        const meta = metaById.get(attachment.id);
        if (meta !== undefined) {
          attachment.meta = meta;
        }
      }
    }
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

  private toInterruptActions(interrupt?: InterruptPayload): Map<string, InterruptAction> {
    const result = new Map<string, InterruptAction>();
    const { actionRequests = [], reviewConfigs = [] } = interrupt ?? {};
    if (!actionRequests.length) {
      return result;
    }
    let order = 0;
    const actionRequestsMap = new Map(actionRequests.map((x) => [x.name, x]));
    const reviewConfigsMap = new Map(reviewConfigs.map((x) => [x.actionName, x]));

    for (const [name, actionRequest] of actionRequestsMap.entries()) {
      const payload = actionRequest.description ? JSON.parse(actionRequest.description) : null;
      result.set(name, {
        order: order++,
        description: actionRequest.description,
        allowedDecisions: reviewConfigsMap.get(name)?.allowedDecisions,
        toolCall: {
          id: payload.toolCallId,
          name: payload.toolCallName,
        },
        currentConversation: {
          sessionId: payload.sessionId,
          from: payload.from,
          username: payload.username,
        },
      });
    }
    return result;
  }

  private async getAIEmployeeTools() {
    const tools: ToolsEntry[] = await this.listTools({ scope: 'GENERAL' });
    if (this.webSearch === true) {
      const subAgentWebSearch = await this.toolsManager.getTools('subAgentWebSearch');
      tools.push(subAgentWebSearch);
    }
    const generalToolsNameSet = new Set(tools.map((x) => x.definition.name));
    const toolMap = await this.getToolsMap();
    const employeeTools = this.employee.skillSettings?.tools ?? [];
    employeeTools.push(...this.tools);
    if (await this.plugin.knowledgeBaseManager.isEnabledKnowledgeBase(this.employee.toJSON() as AIEmployeeType)) {
      const knowledgeBaseRetrieveTool = await this.toolsManager.getTools('knowledge-base-retrieve');
      if (knowledgeBaseRetrieveTool) {
        employeeTools.push({ name: 'knowledge-base-retrieve' });
      }
    }
    for (const toolSetting of employeeTools) {
      if (generalToolsNameSet.has(toolSetting.name)) {
        continue;
      }
      const tool = toolMap.get(toolSetting.name);
      if (!tool) {
        continue;
      }
      tools.push(tool);
    }
    if (!this.skillSettings) {
      return tools;
    } else if (!this.skillSettings.toolsVersion) {
      const toolFilter = this.skillSettings.tools ?? [];
      return tools.filter((t) => toolFilter.length === 0 || toolFilter.includes(t.definition.name));
    } else {
      const toolFilter = this.skillSettings.tools;
      if (_.isArray(toolFilter)) {
        return tools.filter((t) => toolFilter.includes(t.definition.name));
      } else {
        return tools;
      }
    }
  }

  private async getAvailableSkills(): Promise<SkillsEntry[]> {
    const { skillsManager } = this.plugin.ai;
    const aIEmployeeTools = await this.getAIEmployeeTools();
    const getSkill = aIEmployeeTools.find((it) => it.definition.name === 'getSkill');
    if (!getSkill) {
      return [];
    }
    const generalSkills = await skillsManager.listSkills({ scope: 'GENERAL' });
    const specifiedSkillNames = this.employee.skillSettings?.skills ?? [];
    const specifiedSkills = specifiedSkillNames.length ? await skillsManager.getSkills(specifiedSkillNames) : [];
    const mergedSkills = _.uniqBy([...(specifiedSkills || []), ...(generalSkills || [])], 'name');

    if (!this.skillSettings) {
      return mergedSkills;
    } else if (!this.skillSettings.skillsVersion) {
      const skillFilter = this.skillSettings.skills ?? [];
      return mergedSkills.filter((it) => skillFilter.length === 0 || skillFilter.includes(it.name));
    } else {
      const skillFilter = this.skillSettings.skills;
      if (_.isArray(skillFilter)) {
        return mergedSkills.filter((it) => skillFilter.includes(it.name));
      } else {
        return mergedSkills;
      }
    }
  }

  private async getAgentTools(): Promise<{
    tools: ToolsEntry[];
    baseToolNames: Set<string>;
  }> {
    const baseTools = await this.getAIEmployeeTools();
    const toolMap = await this.getToolsMap();
    const availableSkills = await this.getAvailableSkills();
    const skillOwnedToolNames = new Set(availableSkills.flatMap((it) => it.tools ?? []));
    const baseToolNames = new Set(
      baseTools.map((it) => it.definition.name).filter((name) => name === 'getSkill' || !skillOwnedToolNames.has(name)),
    );

    return {
      tools: Array.from(toolMap.values()),
      baseToolNames,
    };
  }

  async getLoadedSkillNames(): Promise<string[]> {
    const list = (await this.aiToolMessagesModel.findAll({
      where: {
        sessionId: this.sessionId,
        toolName: 'getSkill',
        status: 'success',
      },
      order: [['id', 'ASC']],
    })) as Model<AIToolMessage>[];
    const result = new Set<string>();
    for (const item of list) {
      const { content } = item.toJSON();
      if (_.isPlainObject(content) && typeof content['skillName'] === 'string') {
        result.add(content['skillName']);
        continue;
      }
      if (typeof content === 'string') {
        try {
          const parsed = JSON.parse(content);
          if (_.isPlainObject(parsed) && typeof parsed['skillName'] === 'string') {
            result.add(parsed['skillName']);
          }
        } catch (e) {
          // ignore unexpected plain-string content
        }
      }
    }
    return Array.from(result.values());
  }

  async getActivatedSkillToolNames(): Promise<Set<string>> {
    const loadedSkillNames = await this.getLoadedSkillNames();
    if (!loadedSkillNames.length) {
      return new Set<string>();
    }
    const availableSkills = await this.getAvailableSkills();
    const loadedSkills = await this.plugin.ai.skillsManager.getSkills(loadedSkillNames);
    const normalizedLoadedSkills = Array.isArray(loadedSkills) ? loadedSkills : [loadedSkills];
    const skillsMap = new Map(
      [...availableSkills, ...normalizedLoadedSkills.filter(Boolean)].map((it) => [it.name, it]),
    );
    const result = new Set<string>();
    for (const skillName of loadedSkillNames) {
      const target = skillsMap.get(skillName);
      for (const toolName of target?.tools ?? []) {
        result.add(toolName);
      }
    }
    return result;
  }

  private async getAvailableAIEmployees() {
    const specifiedToolNames: string[] =
      this.employee.skillSettings?.tools?.map(({ name }: { name: string }) => name) ?? [];
    if (!specifiedToolNames.includes('dispatch-sub-agent-task')) {
      return [];
    }
    const availableAIEmployees = (await listAccessibleAIEmployees(this.ctx))
      .map((employee) => serializeEmployeeSummary(this.ctx, employee))
      .filter((it) => it.username !== this.employee.username);
    return availableAIEmployees;
  }

  private async getMiddleware(options: {
    providerName: string;
    model: string;
    tools: any[];
    baseToolNames: Set<string>;
    messageId?: string;
    agentThread?: AgentThread;
  }) {
    const { providerName, model, tools, baseToolNames, messageId, agentThread } = options;
    const inWorkflow = await this.isInWorkflow();
    return [
      skillToolBindingMiddleware(this, {
        baseToolNames: Array.from(baseToolNames.values()),
      }),
      toolInteractionMiddleware(this, tools),
      toolCallStatusMiddleware(this),
      ...(inWorkflow ? [workflowHistoryMiddleware(this, this.db)] : []),
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
    const tools = await this.listTools({
      sessionId: this.sessionId,
    });
    return new Map(tools.map((tool) => [tool.definition.name, tool]));
  }

  private listTools(filter?: ToolsFilter) {
    return this.toolsManager.listTools(filter);
  }

  private withRunMetadata(config?: any) {
    return {
      ...config,
      metadata: {
        ...(config?.metadata ?? {}),
        currentConversation: {
          sessionId: this.sessionId,
          from: this.from,
          username: this.employee.get('username'),
        },
      },
    };
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

  private get aiFilesModel() {
    return this.ctx.db.getModel('aiFiles');
  }
}

function getCurrentTimezone(ctx: Context): string | undefined {
  const value =
    ctx.get?.('x-timezone') ||
    ctx.request?.get?.('x-timezone') ||
    ctx.request?.header?.['x-timezone'] ||
    ctx.req?.headers?.['x-timezone'] ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (Array.isArray(value)) {
    return value[0];
  }

  return typeof value === 'string' ? value : undefined;
}

function getCurrentDateTimeForPrompt(locale: string | undefined, timezone?: string) {
  const now = new Date();
  const normalizedLocale = locale || 'en-US';

  try {
    const formatter = new Intl.DateTimeFormat(normalizedLocale, {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    return `${formatter.format(now)}${timezone ? ` (${timezone})` : ''}`;
  } catch (error) {
    return `${now.toISOString()}${timezone ? ` (${timezone})` : ''}`;
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

export class ChatStreamProtocol {
  private _statistics = {
    sent: 0,
    addSent: (s: number) => {
      this._statistics.sent += s;
    },
    reset: () => {
      this._statistics.sent = 0;
    },
  };

  constructor(private readonly streamConsumer: StreamConsumer) {}

  static fromContext(ctx: Context) {
    return new ChatStreamProtocol(ctx.res);
  }

  with(conversation: { sessionId: string; from: string; username: string }) {
    const write = ({ type, body }: { type: string; body?: any }) => {
      const { sessionId, from, username } = conversation;
      const data = `data: ${JSON.stringify({ sessionId, from, username, type, body })}\n\n`;
      this.streamConsumer.write(data);
      this._statistics.addSent(data.length);
    };

    return {
      startStream: () => {
        this._statistics.reset();
        write({ type: 'stream_start' });
      },

      endStream: () => {
        write({ type: 'stream_end' });
      },

      subAgentCompleted: () => {
        write({ type: 'sub_agent_completed' });
      },

      newMessage: (content?: unknown) => {
        write({ type: 'new_message', body: content });
      },

      content: (content: string): void => {
        write({ type: 'content', body: content });
      },

      webSearch: (content: { type: string; query: string }[]) => {
        write({ type: 'web_search', body: content });
      },

      reasoning: (content: { status: string; content: string }) => {
        write({ type: 'reasoning', body: content });
      },

      stopReasoning: () => {
        write({
          type: 'reasoning',
          body: {
            status: 'stop',
            content: '',
          },
        });
      },

      toolCallChunks: (content: unknown) => {
        write({ type: 'tool_call_chunks', body: content });
      },

      toolCalls: (content: unknown) => {
        write({ type: 'tool_calls', body: content });
      },

      toolCallStatus: ({
        toolCall,
        invokeStatus,
        status,
        invokeStartTime,
        invokeEndTime,
        content,
        interruptAction,
      }: {
        toolCall: { messageId: string; id: string; name: string; willInterrupt: boolean };
        invokeStatus: string;
        status?: string;
        invokeStartTime?: string | Date | null;
        invokeEndTime?: string | Date | null;
        content?: unknown;
        interruptAction?: {
          order: number;
          description: string;
          allowedDecisions: string[];
        };
      }) => {
        write({
          type: 'tool_call_status',
          body: {
            toolCall,
            invokeStatus,
            status,
            invokeStartTime,
            invokeEndTime,
            content,
            interruptAction,
          },
        });
      },
    };
  }

  get statistics() {
    return {
      sent: this._statistics.sent,
    };
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

export type StreamConsumer = {
  write: (chunk: any) => void;
};
