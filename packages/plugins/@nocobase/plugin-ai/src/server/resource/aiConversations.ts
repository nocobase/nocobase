/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context, Next } from '@nocobase/actions';
import PluginAIServer from '../plugin';
import { Model, Op } from '@nocobase/database';
import { ResourceActionError, sendSSEError } from '../utils';
import { AIEmployee } from '../ai-employees/ai-employee';
import { AIMessageInput } from '../types';
import { createAIChatConversation } from '../manager/ai-chat-conversation';

async function getAIEmployee(ctx: Context, username: string) {
  const filter = {
    username,
  };
  if (!ctx.state.currentRoles?.includes('root')) {
    filter['roles.name'] = ctx.state.currentRoles;
  }
  const employee = await ctx.db.getRepository('aiEmployees').findOne({
    filter,
  });
  return employee;
}

function setupSSEHeaders(ctx: Context) {
  ctx.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  ctx.status = 200;
}

function sendErrorResponse(ctx: Context, errorMessage: string) {
  sendSSEError(ctx, errorMessage);
}

async function loginInCheck(ctx: Context, next: Next) {
  const userId = ctx.auth?.user.id;
  if (!userId) {
    return ctx.throw(403);
  }

  await next();
}

const isReachParallelLimit = async (ctx: Context) => {
  const userId = ctx.auth?.user.id;

  const activeStreamCount = await ctx.db.getModel('aiConversations').count({
    where: {
      userId,
      llmActiveState: 'streaming',
      updatedAt: {
        [Op.gte]: new Date(Date.now() - 10 * 60 * 1000),
      },
    },
  });

  return activeStreamCount > 2;
};

const saveUserMessages = async (ctx: Context, sessionId: string, messages: AIMessageInput[], messageId?: string) => {
  const userMessages = messages.filter((message) => message.role === 'user');
  if (!userMessages.length) {
    return;
  }

  const aiChatConversation = createAIChatConversation(ctx, sessionId);
  await aiChatConversation.withTransaction(async (conversation) => {
    if (messageId && (await conversation.getMessage(messageId))) {
      await conversation.removeMessages({ messageId });
    }
    await conversation.addMessages(userMessages);
  });
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function normalizeIncomingMessageAttachments(ctx: Context, messages: AIMessageInput[]) {
  for (const message of messages) {
    if (message.attachments == null) {
      continue;
    }
    if (!Array.isArray(message.attachments)) {
      throw new ResourceActionError(400, ctx.t('Invalid attachment'));
    }
    message.attachments = message.attachments.map((attachment) => {
      if (!isRecord(attachment) || !isRecord(attachment.source)) {
        throw new ResourceActionError(400, ctx.t('Invalid attachment'));
      }
      const source = { ...attachment.source };
      delete source.trustworthy;
      if (typeof source.collectionName !== 'string' || !source.collectionName) {
        throw new ResourceActionError(400, ctx.t('Invalid attachment'));
      }
      return {
        ...attachment,
        source,
      };
    });
  }
}

export default {
  name: 'aiConversations',
  middlewares: [
    {
      handler: loginInCheck,
    },
  ],
  actions: {
    async list(ctx: Context, next: Next) {
      const userId = ctx.auth?.user.id;
      const filter = ctx.action.params.filter || {};
      ctx.action.mergeParams({
        filter: {
          ...filter,
          userId,
          from: filter.from ?? 'main-agent',
          category: 'chat',
        },
      });
      return actions.list(ctx, next);
    },

    async unreadCount(ctx: Context, next: Next) {
      const userId = ctx.auth?.user.id;

      const count = await ctx.db.getModel('aiConversations').count({
        where: {
          userId,
          read: false,
          from: 'main-agent',
          category: 'chat',
        },
      });

      ctx.body = {
        count,
      };

      await next();
    },

    async unreadCounts(ctx: Context, next: Next) {
      const userId = ctx.auth?.user.id;

      const [conversationUnreadCount, workflowTaskUnreadCount] = await Promise.all([
        ctx.db.getModel('aiConversations').count({
          where: {
            userId,
            read: false,
            from: 'main-agent',
            category: 'chat',
          },
        }),
        ctx.db.getModel('usersAiWorkflowTasks').count({
          where: {
            userId,
            read: false,
          },
        }),
      ]);

      ctx.body = {
        conversationUnreadCount,
        workflowTaskUnreadCount,
      };

      await next();
    },

    async create(ctx: Context, next: Next) {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const userId = ctx.auth?.user.id;
      const { aiEmployee, systemMessage, skillSettings, conversationSettings, modelSettings } =
        ctx.action.params.values || {};
      const employee = await getAIEmployee(ctx, aiEmployee.username);
      if (!employee) {
        ctx.throw(400, 'AI employee not found');
      }

      try {
        ctx.body = await plugin.aiConversationsManager.create({
          userId,
          aiEmployee,
          options: {
            systemMessage,
            skillSettings,
            conversationSettings,
            modelSettings,
          },
        });
      } catch (error) {
        if (error.message === 'AI employee not found') {
          ctx.throw(400, error.message);
        }
        throw error;
      }
      await next();
    },

    async update(ctx: Context, next: Next) {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const userId = ctx.auth?.user.id;
      const { filterByTk: sessionId } = ctx.action.params;
      const { title } = ctx.action.params.values || {};
      ctx.body = await plugin.aiConversationsManager.update({ userId, sessionId, title });
      await next();
    },

    async updateOptions(ctx: Context, next: Next) {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const userId = ctx.auth?.user.id;

      const { filterByTk: sessionId } = ctx.action.params;
      if (!sessionId) {
        return ctx.throw(400, 'invalid sessionId');
      }

      const { systemMessage, skillSettings, conversationSettings, modelSettings } = ctx.action.params.values || {};
      if (!systemMessage && !skillSettings && !conversationSettings && !modelSettings) {
        return ctx.throw(400, 'invalid options');
      }

      try {
        ctx.body = await plugin.aiConversationsManager.update({
          userId,
          sessionId,
          options: { systemMessage, skillSettings, conversationSettings, modelSettings },
        });
      } catch (error) {
        if (error.message === 'invalid sessionId') {
          ctx.throw(400, error.message);
        }
        throw error;
      }

      await next();
    },

    async destroy(ctx: Context, next: Next) {
      const userId = ctx.auth?.user.id;
      ctx.action.mergeParams({
        filter: {
          userId,
        },
      });
      return actions.destroy(ctx, next);
    },

    async getMessages(ctx: Context, next: Next) {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const userId = ctx.auth?.user.id;

      const { sessionId, cursor, updateRead: originalUpdateRead } = ctx.action.params || {};
      if (!sessionId) {
        ctx.throw(400);
      }

      const paginate = ctx.action.params?.paginate === 'false' ? false : true;
      const updateRead = originalUpdateRead === 'true' || originalUpdateRead === true;
      try {
        ctx.body = await plugin.aiConversationsManager.getMessages({
          userId,
          sessionId,
          cursor,
          paginate,
          updateRead,
        });
      } catch (error) {
        if (error.message === 'invalid sessionId') {
          ctx.throw(400);
        }
        throw error;
      }

      await next();
    },

    async updateToolArgs(ctx: Context, next: Next) {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const userId = ctx.auth?.user.id;

      const {
        sessionId,
        messageId,
        tool: { id, args },
      } = ctx.action.params.values || {};
      if (!sessionId) {
        ctx.throw(400);
      }

      const conversation = await plugin.aiConversationsManager.getConversation({
        sessionId,
        userId,
      });

      if (!conversation) {
        ctx.throw(400);
      }

      const messageRepository = ctx.db.getRepository('aiConversations.messages', sessionId);
      const message = await messageRepository.findOne({
        filter: { messageId },
      });
      const toolCalls = message.toolCalls || [];
      const index = toolCalls.findIndex((toolCall: { id: string }) => toolCall.id === id);
      if (index === -1) {
        return next();
      }
      toolCalls[index] = {
        ...toolCalls[index],
        args,
      };
      await messageRepository.update({
        filter: { messageId },
        values: {
          toolCalls,
        },
      });
      await next();
    },

    async sendMessages(ctx: Context, next: Next) {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const userId = ctx.auth?.user.id;
      const {
        sessionId,
        aiEmployee: employeeName,
        messages,
        editingMessageId,
        model,
        webSearch,
        stream = true,
      } = ctx.action.params.values || {};

      const shouldStream = stream !== false;
      if (shouldStream) {
        setupSSEHeaders(ctx);
      }

      try {
        if (!sessionId) {
          throw new ResourceActionError(400, ctx.t('sessionId is required'));
        }

        if (!Array.isArray(messages)) {
          throw new ResourceActionError(400, ctx.t('messages must be an array'));
        }
        normalizeIncomingMessageAttachments(ctx, messages);
        const userMessage = messages.find((message: any) => message.role === 'user');
        if (!userMessage) {
          throw new ResourceActionError(400, ctx.t('user message is required'));
        }

        const conversation = await plugin.aiConversationsManager.getConversation({
          sessionId,
          userId,
        });

        if (!conversation) {
          throw new ResourceActionError(400, ctx.t('conversation not found'));
        }

        const employee = await getAIEmployee(ctx, employeeName);
        if (!employee) {
          throw new ResourceActionError(400, ctx.t('AI employee not found'));
        }

        if (!conversation.title) {
          const textUserMessage = messages.find(
            (message: any) => message.role === 'user' && message.content?.type === 'text' && message.content?.content,
          );

          if (textUserMessage) {
            const content = textUserMessage.content.content;
            conversation.title = content.substring(0, 30);
            await conversation.save();
          }
        }

        if (await isReachParallelLimit(ctx)) {
          await saveUserMessages(ctx, sessionId, messages, editingMessageId);
          throw new ResourceActionError(400, ctx.t('There are conversations in progress. Please try again later.'));
        }

        const legacy = conversation.thread === 0;
        const resolvedModel = await plugin.aiEmployeesManager.resolveModel(employee, model);
        const aiEmployee = new AIEmployee({
          ctx,
          employee,
          sessionId,
          systemMessage: conversation.options?.systemMessage,
          skillSettings: conversation.options?.skillSettings,
          tools: conversation.options?.tools,
          webSearch,
          model: resolvedModel,
          legacy,
        });

        if (!editingMessageId) {
          if (await plugin.subAgentsDispatcher.isInterrupted(ctx)) {
            const userDecisions = await plugin.subAgentsDispatcher.reject(ctx);
            if (userDecisions) {
              if (shouldStream) {
                await aiEmployee.stream({ userDecisions });
              } else {
                ctx.body = await aiEmployee.invoke({ userDecisions });
              }
              return;
            }
          } else {
            const toolMessages = await aiEmployee.cancelToolCall();
            if (toolMessages?.length) {
              for (let i = toolMessages.length - 1; i >= 0; i--) {
                const toolMessage = toolMessages[i];
                messages.unshift({
                  role: toolMessage.role,
                  content: toolMessage.content,
                  toolCalls: toolMessage.toolCalls,
                  attachments: toolMessage.attachments,
                  workContext: toolMessage.workContext,
                  metadata: toolMessage.metadata,
                });
              }
            }
          }
        }

        if (shouldStream) {
          await aiEmployee.stream({ userMessages: messages, messageId: editingMessageId });
        } else {
          ctx.body = await aiEmployee.invoke({ userMessages: messages, messageId: editingMessageId });
        }
      } catch (err) {
        ctx.log.error(err);
        let status = 500;
        let message = ctx.t('Server unexpected error occur');
        if (err instanceof ResourceActionError) {
          status = err.status;
          message = err.message;
        } else if (err instanceof Error) {
          status = 500;
          message = err.message;
        }
        if (shouldStream) {
          sendErrorResponse(ctx, message);
        } else {
          ctx.throw(status, message);
        }
      } finally {
        await next();
      }
    },

    async abort(ctx: Context, next: Next) {
      const userId = ctx.auth?.user.id;
      const { sessionId } = ctx.action.params.values || {};
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;

      const conversation = await plugin.aiConversationsManager.getConversation({
        sessionId,
        userId,
      });

      if (!conversation) {
        ctx.throw(404, 'conversation not found');
      }

      plugin.aiEmployeesManager.abortConversation(sessionId);
      await next();
    },

    async resumeStream(ctx: Context, next: Next) {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const userId = ctx.auth?.user.id;
      const abortController = new AbortController();
      const abortStream = () => abortController.abort();
      const shouldStopStream = () => abortController.signal.aborted || ctx.res.destroyed || ctx.res.writableEnded;

      setupSSEHeaders(ctx);

      const sessionId =
        ctx.action.params?.sessionId || ctx.action.params?.values?.sessionId || ctx.action.params?.filterByTk;
      if (!sessionId) {
        sendErrorResponse(ctx, 'sessionId is required');
        return;
      }

      ctx.req.once('aborted', abortStream);
      ctx.res.once('close', abortStream);

      try {
        const conversation = await plugin.aiConversationsManager.getConversation({
          sessionId,
          userId,
        });
        if (shouldStopStream()) {
          return;
        }

        if (!conversation) {
          sendErrorResponse(ctx, 'conversation not found');
          return;
        }

        const reachLimit = await isReachParallelLimit(ctx);
        if (shouldStopStream()) {
          return;
        }

        let hasChunks = false;
        if (!reachLimit) {
          for await (const chunk of plugin.llmStreamCachedManager
            .getCached(sessionId)
            .stream({ signal: abortController.signal })) {
            if (shouldStopStream()) {
              break;
            }
            hasChunks = true;
            ctx.res.write(chunk);
          }
        }

        if (!hasChunks && !shouldStopStream()) {
          const currentConversation = await plugin.aiConversationsManager.getConversation({
            sessionId,
            userId,
          });
          const llmActiveState = currentConversation?.llmActiveState;
          if (llmActiveState && llmActiveState !== 'idle') {
            ctx.res.write(`data: ${JSON.stringify({ type: 'chunks_cache_missing', body: { llmActiveState } })}\n\n`);
          }
        }
      } catch (err) {
        if (shouldStopStream()) {
          return;
        }
        ctx.log.error(err);
        sendErrorResponse(ctx, err.message || 'Resume stream error');
        return;
      } finally {
        ctx.req.off('aborted', abortStream);
        ctx.res.off('close', abortStream);
        if (!shouldStopStream()) {
          ctx.res.end();
        }
        await next();
      }
    },

    async resendMessages(ctx: Context, next: Next) {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const userId = ctx.auth?.user.id;
      const { sessionId, webSearch, model, stream = true } = ctx.action.params.values || {};
      let { messageId } = ctx.action.params.values || {};

      const shouldStream = stream !== false;
      if (shouldStream) {
        setupSSEHeaders(ctx);
      }

      try {
        if (!sessionId) {
          throw new ResourceActionError(400, ctx.t('sessionId is required'));
        }

        const conversation = await plugin.aiConversationsManager.getConversation({
          sessionId,
          userId,
        });

        if (!conversation) {
          throw new ResourceActionError(400, ctx.t('conversation not found'));
        }

        const employee = await getAIEmployee(ctx, conversation.aiEmployeeUsername);
        if (!employee) {
          throw new ResourceActionError(400, ctx.t('AI employee not found'));
        }

        const resendMessages: AIMessageInput[] = [];
        if (messageId) {
          const message = await ctx.db.getRepository('aiConversations.messages', sessionId).findOne({
            filter: {
              messageId,
            },
          });

          if (!message) {
            throw new ResourceActionError(400, ctx.t('message not found'));
          }
        } else {
          const message = await ctx.db.getRepository('aiConversations.messages', sessionId).findOne({
            filter: {
              sessionId,
            },
            sort: ['-messageId'],
          });
          if (!message) {
            throw new ResourceActionError(400, ctx.t('message not found'));
          }
          messageId = message.messageId;
          if (['user', 'tool'].includes(message.role)) {
            resendMessages.push({
              role: message.role,
              content: message.content,
              toolCalls: message.toolCalls,
              attachments: message.attachments,
              workContext: message.workContext,
              metadata: message.metadata,
            });
          }
        }

        if (await isReachParallelLimit(ctx)) {
          throw new ResourceActionError(400, ctx.t('There are conversations in progress. Please try again later.'));
        }
        const resolvedModel = await plugin.aiEmployeesManager.resolveModel(employee, model);

        const aiEmployee = new AIEmployee({
          ctx,
          employee,
          sessionId,
          systemMessage: conversation.options?.systemMessage,
          skillSettings: conversation.options?.skillSettings,
          tools: conversation.options?.tools,
          webSearch,
          model: resolvedModel,
        });

        if (shouldStream) {
          await aiEmployee.stream({ messageId, userMessages: resendMessages.length ? resendMessages : undefined });
        } else {
          ctx.body = await aiEmployee.invoke({
            messageId,
            userMessages: resendMessages.length ? resendMessages : undefined,
          });
        }
      } catch (err) {
        ctx.log.error(err);
        let status = 500;
        let message = ctx.t('Server unexpected error occur');
        if (err instanceof ResourceActionError) {
          status = err.status;
          message = err.message;
        } else if (err instanceof Error) {
          status = 500;
          message = err.message;
        }
        if (shouldStream) {
          sendErrorResponse(ctx, message);
        } else {
          ctx.throw(status, message);
        }
      } finally {
        await next();
      }
    },

    async updateUserDecision(ctx: Context, next: Next) {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const userId = ctx.auth?.user.id;

      const { sessionId, messageId, toolCallId, userDecision } = ctx.action.params.values || {};
      if (!sessionId) {
        ctx.throw(400);
      }

      const conversation = await plugin.aiConversationsManager.getConversation({
        sessionId,
        userId,
      });

      if (!conversation) {
        ctx.throw(400);
      }

      const message = await ctx.db.getRepository('aiMessages').findOne({
        filter: {
          messageId,
        },
      });
      if (!message) {
        ctx.throw(400);
      }

      const messageConversation = await plugin.aiConversationsManager.getConversation({
        sessionId: message.sessionId,
        userId,
      });

      if (!messageConversation) {
        ctx.throw(400);
      }

      const toolCalls = message.toolCalls;
      if (!toolCalls?.length) {
        ctx.throw(400);
      }

      const aiToolMessagesModel = ctx.db.getModel('aiToolMessages');
      const toolCall = await aiToolMessagesModel.findOne({
        where: { sessionId: message.sessionId, messageId: message.messageId, toolCallId },
      });
      if (!toolCall) {
        ctx.throw(400);
      }

      const [updated] = await aiToolMessagesModel.update(
        {
          userDecision,
          invokeStatus: 'waiting',
        },
        {
          where: {
            sessionId: message.sessionId,
            messageId: message.messageId,
            toolCallId,
            invokeStatus: 'interrupted',
          },
        },
      );

      const toolCallIds = toolCalls.map((x) => x.id);
      const toolMessages = await ctx.db.getRepository('aiToolMessages').find({
        filter: {
          sessionId: message.sessionId,
          messageId: message.messageId,
          toolCallId: {
            $in: toolCallIds,
          },
        },
      });
      const toolMessageMap = new Map<string, Model>(
        toolMessages.map((toolMessage: Model) => [toolMessage.toolCallId, toolMessage]),
      );

      const toolsList = await plugin.ai.toolsManager.listTools({ sessionId: message.sessionId, ctx });
      const toolsMap = new Map(toolsList.map((t) => [t.definition.name, t]));

      for (const toolCall of toolCalls) {
        const tools = toolsMap.get(toolCall.name);
        const toolMessage = toolMessageMap.get(toolCall.id);
        toolCall.invokeStatus = toolMessage?.invokeStatus;
        toolCall.auto = toolMessage?.auto;
        toolCall.status = toolMessage?.status;
        toolCall.content = toolMessage?.content;
        toolCall.execution = tools?.execution;
        toolCall.willInterrupt = tools?.execution === 'frontend' || toolMessage?.auto === false;
        toolCall.defaultPermission = tools?.defaultPermission;
      }

      ctx.body = {
        updated,
        toolCalls,
      };

      await next();
    },

    async resumeToolCall(ctx: Context, next: Next) {
      const userId = ctx.auth?.user.id;
      setupSSEHeaders(ctx);

      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const { sessionId, messageId, model, webSearch } = ctx.action.params.values || {};
      if (!sessionId) {
        sendErrorResponse(ctx, 'sessionId is required');
        return next();
      }
      try {
        const conversation = await plugin.aiConversationsManager.getConversation({
          sessionId,
          userId,
        });
        if (!conversation) {
          sendErrorResponse(ctx, 'conversation not found');
          return next();
        }

        const employee = await getAIEmployee(ctx, conversation.aiEmployeeUsername);
        if (!employee) {
          sendErrorResponse(ctx, 'AI employee not found');
          return next();
        }

        let message: Model;
        if (messageId) {
          message = await ctx.db.getRepository('aiMessages').findOne({
            filter: {
              messageId,
            },
          });
        } else {
          message = await ctx.db.getRepository('aiConversations.messages', sessionId).findOne({
            sort: ['-messageId'],
          });
        }

        if (!message) {
          sendErrorResponse(ctx, 'message not found');
          return next();
        }

        const messageConversation = await plugin.aiConversationsManager.getConversation({
          sessionId: message.sessionId,
          userId,
        });
        if (!messageConversation) {
          sendErrorResponse(ctx, 'conversation not found');
          return next();
        }

        const tools = message.toolCalls;
        if (!tools?.length) {
          sendErrorResponse(ctx, 'No tool calls found');
          return next();
        }
        const resolvedModel = await plugin.aiEmployeesManager.resolveModel(employee, model);

        const aiEmployee = new AIEmployee({
          ctx,
          employee,
          sessionId,
          systemMessage: conversation.options?.systemMessage,
          skillSettings: conversation.options?.skillSettings,
          tools: conversation.options?.tools,
          webSearch,
          model: resolvedModel,
        });

        const userDecisions = await plugin.aiConversationsManager.getUserDecisions(message.messageId);
        await aiEmployee.stream({
          userDecisions,
        });
      } catch (err) {
        ctx.log.error(err);
        sendErrorResponse(ctx, err.message || 'Tool call error');
      }
      await next();
    },
  },
};
