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
import { parseResponseMessage, sendSSEError } from '../utils';
import { AIEmployee } from '../ai-employees/ai-employee';
import { AIMessageInput } from '../types';

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

export default {
  name: 'aiConversations',
  actions: {
    async list(ctx: Context, next: Next) {
      const userId = ctx.auth?.user.id;
      if (!userId) {
        return ctx.throw(403);
      }
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

    async create(ctx: Context, next: Next) {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const userId = ctx.auth?.user.id;
      if (!userId) {
        return ctx.throw(403);
      }
      const { aiEmployee, systemMessage, skillSettings, conversationSettings } = ctx.action.params.values || {};
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
      if (!userId) {
        return ctx.throw(403);
      }
      const { filterByTk: sessionId } = ctx.action.params;
      const { title } = ctx.action.params.values || {};
      ctx.body = await plugin.aiConversationsManager.update({ userId, sessionId, title });
      await next();
    },

    async updateOptions(ctx: Context, next: Next) {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const userId = ctx.auth?.user.id;
      if (!userId) {
        return ctx.throw(403);
      }

      const { filterByTk: sessionId } = ctx.action.params;
      if (!sessionId) {
        return ctx.throw(400, 'invalid sessionId');
      }

      const { systemMessage, skillSettings, conversationSettings } = ctx.action.params.values || {};
      if (!systemMessage && !skillSettings && !conversationSettings) {
        return ctx.throw(400, 'invalid options');
      }

      try {
        ctx.body = await plugin.aiConversationsManager.update({
          userId,
          sessionId,
          options: { systemMessage, skillSettings, conversationSettings },
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
      if (!userId) {
        return ctx.throw(403);
      }
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
      if (!userId) {
        return ctx.throw(403);
      }

      const { sessionId, cursor } = ctx.action.params || {};
      if (!sessionId) {
        ctx.throw(400);
      }

      const paginate = ctx.action.params?.paginate === 'false' ? false : true;
      try {
        ctx.body = await plugin.aiConversationsManager.getMessages({
          userId,
          sessionId,
          cursor,
          paginate,
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
      if (!userId) {
        return ctx.throw(403);
      }

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
      const userId = ctx.auth?.user.id;
      if (!userId) {
        return ctx.throw(403);
      }

      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
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
      if (!sessionId) {
        if (shouldStream) {
          sendErrorResponse(ctx, 'sessionId is required');
        } else {
          ctx.status = 400;
          ctx.body = { error: 'sessionId is required' };
        }
        return next();
      }

      const userMessage = messages.find((message: any) => message.role === 'user');
      if (!userMessage) {
        if (shouldStream) {
          sendErrorResponse(ctx, 'user message is required');
        } else {
          ctx.status = 400;
          ctx.body = { error: 'user message is required' };
        }
        return next();
      }

      try {
        const conversation = await plugin.aiConversationsManager.getConversation({
          sessionId,
          userId,
        });

        if (!conversation) {
          if (shouldStream) {
            sendErrorResponse(ctx, 'conversation not found');
          } else {
            ctx.status = 404;
            ctx.body = { error: 'conversation not found' };
          }
          return next();
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

        const employee = await getAIEmployee(ctx, employeeName);
        if (!employee) {
          if (shouldStream) {
            sendErrorResponse(ctx, 'AI employee not found');
          } else {
            ctx.status = 404;
            ctx.body = { error: 'AI employee not found' };
          }
          return next();
        }

        const legacy = conversation.thread === 0;

        const aiEmployee = new AIEmployee({
          ctx,
          employee,
          sessionId,
          systemMessage: conversation.options?.systemMessage,
          skillSettings: conversation.options?.skillSettings,
          tools: conversation.options?.tools,
          webSearch,
          model,
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
        if (shouldStream) {
          sendErrorResponse(ctx, err.message || 'Tool call error');
        } else {
          ctx.status = 500;
          ctx.body = { error: err.message || 'Tool call error' };
        }
      } finally {
        await next();
      }
    },

    async abort(ctx: Context, next: Next) {
      const userId = ctx.auth?.user.id;
      if (!userId) {
        return ctx.throw(403);
      }
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

    async resendMessages(ctx: Context, next: Next) {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const userId = ctx.auth?.user.id;
      if (!userId) {
        return ctx.throw(403);
      }

      setupSSEHeaders(ctx);

      const { sessionId, webSearch, model } = ctx.action.params.values || {};
      let { messageId } = ctx.action.params.values || {};
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

        const resendMessages: AIMessageInput[] = [];
        if (messageId) {
          const message = await ctx.db.getRepository('aiConversations.messages', sessionId).findOne({
            filter: {
              messageId,
            },
          });

          if (!message) {
            sendErrorResponse(ctx, 'message not found');
            return next();
          }
        } else {
          const message = await ctx.db.getRepository('aiConversations.messages', sessionId).findOne({
            filter: {
              sessionId,
            },
            sort: ['-messageId'],
          });
          if (!message) {
            sendErrorResponse(ctx, 'No messages to resend');
            return next();
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

        const employee = await getAIEmployee(ctx, conversation.aiEmployeeUsername);
        if (!employee) {
          sendErrorResponse(ctx, 'AI employee not found');
          return next();
        }

        const aiEmployee = new AIEmployee({
          ctx,
          employee,
          sessionId,
          systemMessage: conversation.options?.systemMessage,
          skillSettings: conversation.options?.skillSettings,
          tools: conversation.options?.tools,
          webSearch,
          model,
        });
        await aiEmployee.stream({ messageId, userMessages: resendMessages.length ? resendMessages : undefined });
      } catch (err) {
        ctx.log.error(err);
        sendErrorResponse(ctx, err.message || 'Chat error warning');
      }

      await next();
    },

    async updateUserDecision(ctx: Context, next: Next) {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const userId = ctx.auth?.user.id;
      if (!userId) {
        return ctx.throw(403);
      }

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
      const toolMessageMap = new Map<string, any>(
        toolMessages.map((toolMessage: Model) => [toolMessage.toolCallId, toolMessage]),
      );

      const toolsList = await plugin.ai.toolsManager.listTools({ sessionId: message.sessionId });
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
      if (!userId) {
        return ctx.throw(403);
      }
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

        const tools = message.toolCalls;
        if (!tools?.length) {
          sendErrorResponse(ctx, 'No tool calls found');
          return next();
        }

        const aiEmployee = new AIEmployee({
          ctx,
          employee,
          sessionId,
          systemMessage: conversation.options?.systemMessage,
          skillSettings: conversation.options?.skillSettings,
          tools: conversation.options?.tools,
          webSearch,
          model,
        });

        const userDecisions = await plugin.aiConversationsManager.getUserDecisions(messageId);
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
