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
import { Model } from '@nocobase/database';
import { parseResponseMessage } from '../utils';
import { AIEmployee } from '../ai-employees/ai-employee';

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
  ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: errorMessage })} \n\n`);
  ctx.res.end();
}

export default {
  name: 'aiConversations',
  actions: {
    async list(ctx: Context, next: Next) {
      const userId = ctx.auth?.user.id;
      if (!userId) {
        return ctx.throw(403);
      }
      ctx.action.mergeParams({
        filter: {
          userId,
        },
      });
      return actions.list(ctx, next);
    },

    async create(ctx: Context, next: Next) {
      const userId = ctx.auth?.user.id;
      const { aiEmployee, systemMessage } = ctx.action.params.values || {};
      const employee = await getAIEmployee(ctx, aiEmployee.username);
      if (!employee) {
        ctx.throw(400, 'AI employee not found');
      }

      const repo = ctx.db.getRepository('aiConversations');
      ctx.body = await repo.create({
        values: {
          userId,
          aiEmployee,
          options: {
            systemMessage,
          },
        },
      });
      await next();
    },

    async update(ctx: Context, next: Next) {
      const userId = ctx.auth?.user.id;
      const { filterByTk: sessionId } = ctx.action.params;
      const { title } = ctx.action.params.values || {};
      const repo = ctx.db.getRepository('aiConversations');
      ctx.body = await repo.update({
        filter: {
          userId,
          sessionId,
        },
        values: {
          title,
        },
      });
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

      const conversation = await ctx.db.getRepository('aiConversations').findOne({
        filter: {
          sessionId,
          userId,
        },
      });

      if (!conversation) {
        ctx.throw(400);
      }

      const pageSize = 10;
      const maxLimit = 200;
      const messageRepository = ctx.db.getRepository('aiConversations.messages', sessionId);
      const filter = {
        role: {
          $notIn: ['tool'],
        },
      };
      if (paginate && cursor) {
        filter['messageId'] = {
          $lt: cursor,
        };
      }
      const rows = await messageRepository.find({
        sort: ['-messageId'],
        limit: paginate ? pageSize + 1 : maxLimit,
        filter,
      });

      const hasMore = paginate && rows.length > pageSize;
      const data = hasMore ? rows.slice(0, -1) : rows;
      const newCursor = data.length ? data[data.length - 1].messageId : null;

      const toolCallIds = data
        .filter((row: Model) => row?.toolCalls?.length ?? 0 > 0)
        .flatMap((row: Model) => row.toolCalls)
        .map((toolCall: any) => toolCall.id);
      const toolMessages = await ctx.db.getRepository('aiToolMessages').find({
        filter: {
          sessionId,
          toolCallId: {
            $in: toolCallIds,
          },
        },
      });
      const toolMessageMap = new Map<string, any>(
        toolMessages.map((toolMessage: Model) => [toolMessage.toolCallId, toolMessage]),
      );

      ctx.body = {
        rows: data.map((row: Model) => {
          if (row?.toolCalls?.length ?? 0 > 0) {
            for (const toolCall of row.toolCalls) {
              const toolMessage = toolMessageMap.get(toolCall.id);
              toolCall.invokeStatus = toolMessage?.invokeStatus;
              toolCall.auto = toolMessage?.auto;
              toolCall.status = toolMessage?.status;
            }
          }

          const providerOptions = plugin.aiManager.llmProviders.get(row.metadata?.provider);
          if (!providerOptions) {
            return parseResponseMessage(row);
          }
          const Provider = providerOptions.provider;
          const provider = new Provider({
            app: ctx.app,
          });
          return provider.parseResponseMessage(row);
        }),
        ...(paginate && {
          hasMore,
          cursor: newCursor,
        }),
      };

      await next();
    },

    async updateMessage(ctx: Context, next: Next) {
      const userId = ctx.auth?.user.id;
      if (!userId) {
        return ctx.throw(403);
      }

      const { sessionId, messageId, content } = ctx.action.params.values || {};
      if (!sessionId) {
        ctx.throw(400);
      }

      const conversation = await ctx.db.getRepository('aiConversations').findOne({
        filter: {
          sessionId,
          userId,
        },
      });

      if (!conversation) {
        ctx.throw(400);
      }

      const messageRepository = ctx.db.getRepository('aiConversations.messages', sessionId);
      await messageRepository.update({
        filter: {
          messageId,
        },
        values: {
          content,
        },
      });
      await next();
    },

    async sendMessages(ctx: Context, next: Next) {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;

      setupSSEHeaders(ctx);

      const { sessionId, aiEmployee: employeeName, messages, editingMessageId } = ctx.action.params.values || {};
      if (!sessionId) {
        sendErrorResponse(ctx, 'sessionId is required');
        return next();
      }

      const userMessage = messages.find((message: any) => message.role === 'user');
      if (!userMessage) {
        sendErrorResponse(ctx, 'user message is required');
        return next();
      }

      try {
        const conversation = await ctx.db.getRepository('aiConversations').findOne({
          filterByTk: sessionId,
        });

        if (!conversation) {
          sendErrorResponse(ctx, 'conversation not found');
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
          sendErrorResponse(ctx, 'AI employee not found');
          return next();
        }

        let persistenceMessages: Model[] = [];
        try {
          persistenceMessages = await ctx.db.sequelize.transaction(async (transaction) => {
            if (editingMessageId) {
              await ctx.db.getRepository('aiMessages').destroy({
                filter: {
                  sessionId,
                  messageId: {
                    $gte: editingMessageId,
                  },
                },
                transaction,
              });
            }
            return await ctx.db.getRepository('aiConversations.messages', sessionId).create({
              values: messages.map((message: any) => ({
                messageId: plugin.snowflake.generate(),
                role: message.role,
                content: message.content,
                attachments: message.attachments,
                workContext: message.workContext,
              })),
              transaction,
            });
          });
        } catch (err) {
          ctx.log.error(err);
          sendErrorResponse(ctx, 'Chat error warning');
          return next();
        }

        const [msg] = persistenceMessages;
        const aiEmployee = new AIEmployee(ctx, employee, sessionId, conversation.options?.systemMessage);
        await aiEmployee.processMessages(messages, msg?.messageId);
      } catch (err) {
        ctx.log.error(err);
        sendErrorResponse(ctx, 'Chat error warning');
      }

      await next();
    },

    async abort(ctx: Context, next: Next) {
      const { sessionId } = ctx.action.params.values || {};
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      plugin.aiEmployeesManager.abortConversation(sessionId);
      await next();
    },

    async resendMessages(ctx: Context, next: Next) {
      setupSSEHeaders(ctx);

      const { sessionId, messageId } = ctx.action.params.values || {};
      if (!sessionId) {
        sendErrorResponse(ctx, 'sessionId is required');
        return next();
      }

      try {
        const conversation = await ctx.db.getRepository('aiConversations').findOne({
          filter: {
            sessionId,
          },
        });

        if (!conversation) {
          sendErrorResponse(ctx, 'conversation not found');
          return next();
        }

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
        }

        const employee = await getAIEmployee(ctx, conversation.aiEmployeeUsername);
        if (!employee) {
          sendErrorResponse(ctx, 'AI employee not found');
          return next();
        }

        const aiEmployee = new AIEmployee(ctx, employee, sessionId, conversation.options?.systemMessage);
        await aiEmployee.resendMessages(messageId);
      } catch (err) {
        ctx.log.error(err);
        sendErrorResponse(ctx, 'Chat error warning');
      }

      await next();
    },

    async getTools(ctx: Context, next: Next) {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      const { sessionId, messageId } = ctx.action.params.values || {};
      if (!sessionId || !messageId) {
        ctx.throw(400);
      }
      const conversation = await ctx.db.getRepository('aiConversations').findOne({
        filter: {
          sessionId,
          userId: ctx.auth?.user.id,
        },
      });
      if (!conversation) {
        ctx.throw(400);
      }
      const message = await ctx.db.getRepository('aiConversations.messages', sessionId).findOne({
        filter: {
          messageId,
        },
      });
      const tools = message?.toolCalls || [];
      const toolNames = tools.map((tool: any) => tool.name);
      const result = {};
      for (const toolName of toolNames) {
        const tool = await plugin.aiManager.toolManager.getTool(toolName);
        if (tool) {
          result[toolName] = {
            name: tool.name,
            title: tool.title,
            description: tool.description,
          };
        }
      }
      ctx.body = result;
      await next();
    },

    async callTool(ctx: Context, next: Next) {
      setupSSEHeaders(ctx);

      const { sessionId, messageId } = ctx.action.params.values || {};
      if (!sessionId) {
        sendErrorResponse(ctx, 'sessionId is required');
        return next();
      }
      try {
        const conversation = await ctx.db.getRepository('aiConversations').findOne({
          filter: {
            sessionId,
            userId: ctx.auth?.user.id,
          },
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
          message = await ctx.db.getRepository('aiConversations.messages', sessionId).findOne({
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

        const aiEmployee = new AIEmployee(ctx, employee, sessionId, conversation.options?.systemMessage);
        await aiEmployee.callTool(message.messageId, false);
      } catch (err) {
        ctx.log.error(err);
        sendErrorResponse(ctx, 'Tool call error');
      }
      await next();
    },
    async confirmToolCall(ctx: Context, next: Next) {
      setupSSEHeaders(ctx);

      const { sessionId, messageId, toolCallIds } = ctx.action.params.values || {};
      if (!sessionId) {
        sendErrorResponse(ctx, 'sessionId is required');
        return next();
      }
      try {
        const conversation = await ctx.db.getRepository('aiConversations').findOne({
          filter: {
            sessionId,
            userId: ctx.auth?.user.id,
          },
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
          message = await ctx.db.getRepository('aiConversations.messages', sessionId).findOne({
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

        const aiEmployee = new AIEmployee(ctx, employee, sessionId, conversation.options?.systemMessage);
        await aiEmployee.confirmToolCall(message.messageId, toolCallIds);
      } catch (err) {
        ctx.log.error(err);
        sendErrorResponse(ctx, 'Tool call confirm error');
      }
      await next();
    },
  },
};
