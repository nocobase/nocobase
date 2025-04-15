/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context, Next } from '@nocobase/actions';
import snowflake from '../snowflake';
import PluginAIServer from '../plugin';
import { Database, Model } from '@nocobase/database';

async function parseInfoMessage(db: Database, aiEmployee: Model, content: Record<string, any>) {
  const infoForm = aiEmployee.chatSettings?.infoForm;

  if (!infoForm || !content) {
    return null;
  }

  let info = '';
  for (const key in content) {
    const field = infoForm.find((item) => item.name === key);
    if (!field) {
      continue;
    }

    if (field.type === 'blocks') {
      const uiSchemaRepo = db.getRepository('uiSchemas') as any;
      const schema = await uiSchemaRepo.getJsonSchema(content[key]);
      if (!schema) {
        continue;
      }
      info += `${field.title}: ${JSON.stringify(schema)}; `;
    } else {
      info += `${field.title}: ${content[key]}; `;
    }
  }

  if (!info) {
    return null;
  }

  return `The following information you can utilize in your conversation: ${info}`;
}

async function formatMessages(ctx: Context, messages: any[], employee: Model) {
  const formattedMessages = [];

  for (const msg of messages) {
    let content = msg.content.content;
    if (msg.content.type === 'info') {
      content = await parseInfoMessage(ctx.db, employee, content);
    }
    if (!content) {
      continue;
    }
    formattedMessages.push({
      role: msg.role === 'user' ? 'user' : 'ai',
      content,
    });
  }

  return formattedMessages;
}

async function prepareChatStream(ctx: Context, sessionId: string, employee: Model, messages: any[]) {
  const plugin = ctx.app.pm.get('ai') as PluginAIServer;
  const modelSettings = employee.modelSettings;

  if (!modelSettings?.llmService) {
    throw new Error('LLM service not configured');
  }

  const service = await ctx.db.getRepository('llmServices').findOne({
    filter: {
      name: modelSettings.llmService,
    },
  });

  if (!service) {
    throw new Error('LLM service not found');
  }

  const providerOptions = plugin.aiManager.llmProviders.get(service.provider);
  if (!providerOptions) {
    throw new Error('LLM service provider not found');
  }

  const Provider = providerOptions.provider;
  const provider = new Provider({
    app: ctx.app,
    serviceOptions: service.options,
    chatOptions: {
      ...modelSettings,
      messages,
    },
  });

  const controller = new AbortController();
  const { signal } = controller;

  try {
    const stream = await provider.stream({ signal });
    plugin.aiEmployeesManager.conversationController.set(sessionId, controller);
    return { stream, controller, signal };
  } catch (error) {
    throw error;
  }
}

async function processChatStream(
  ctx: Context,
  stream: any,
  sessionId: string,
  options: {
    aiEmployeeUsername: string;
    signal: AbortSignal;
    messageId?: string;
  },
) {
  const plugin = ctx.app.pm.get('ai') as PluginAIServer;
  const { aiEmployeeUsername, signal, messageId } = options;

  let message = '';
  try {
    for await (const chunk of stream) {
      if (!chunk.content) {
        continue;
      }
      ctx.res.write(`data: ${JSON.stringify({ type: 'content', body: chunk.content })}\n\n`);
      message += chunk.content;
    }
  } catch (err) {
    ctx.log.error(err);
  }

  plugin.aiEmployeesManager.conversationController.delete(sessionId);

  if (!message && !signal.aborted) {
    ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'No content' })}\n\n`);
    ctx.res.end();
    return;
  }

  if (message) {
    const content = {
      content: message,
      type: 'text',
    };

    if (signal.aborted) {
      content['interrupted'] = true;
    }

    if (messageId) {
      await ctx.db.sequelize.transaction(async (transaction) => {
        await ctx.db.getRepository('aiMessages').update({
          filter: {
            sessionId,
            messageId,
          },
          values: {
            content,
          },
          transaction,
        });
        await ctx.db.getRepository('aiMessages').destroy({
          filter: {
            sessionId,
            messageId: {
              $gt: messageId,
            },
          },
          transaction,
        });
      });
    } else {
      await ctx.db.getRepository('aiConversations.messages', sessionId).create({
        values: {
          messageId: plugin.snowflake.generate(),
          role: aiEmployeeUsername,
          content,
        },
      });
    }
  }

  ctx.res.end();
}

async function getConversationHistory(ctx: Context, sessionId: string, employee: Model, messageIdFilter?: string) {
  const historyMessages = await ctx.db.getRepository('aiConversations.messages', sessionId).find({
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

  return await formatMessages(ctx, historyMessages, employee);
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
  ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: errorMessage })}\n\n`);
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
      const { aiEmployee } = ctx.action.params.values || {};
      const repo = ctx.db.getRepository('aiConversations');
      ctx.body = await repo.create({
        values: {
          userId,
          aiEmployee,
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
      const userId = ctx.auth?.user.id;
      if (!userId) {
        return ctx.throw(403);
      }

      const { sessionId, cursor } = ctx.action.params || {};
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

      const pageSize = 10;
      const messageRepository = ctx.db.getRepository('aiConversations.messages', sessionId);
      const rows = await messageRepository.find({
        sort: ['-messageId'],
        limit: pageSize + 1,
        ...(cursor
          ? {
              filter: {
                messageId: {
                  $lt: cursor,
                },
              },
            }
          : {}),
      });

      const hasMore = rows.length > pageSize;
      const data = hasMore ? rows.slice(0, -1) : rows;
      const newCursor = data.length ? data[data.length - 1].messageId : null;

      ctx.body = {
        rows: data.map((row: Model) => ({
          key: row.messageId,
          content: {
            ...row.content,
            messageId: row.messageId,
          },
          role: row.role,
        })),
        hasMore,
        cursor: newCursor,
      };

      await next();
    },

    async sendMessages(ctx: Context, next: Next) {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;

      setupSSEHeaders(ctx);

      const { sessionId, aiEmployee, messages } = ctx.action.params.values || {};
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

        const employee = await ctx.db.getRepository('aiEmployees').findOne({
          filter: {
            username: aiEmployee,
          },
        });

        if (!employee) {
          sendErrorResponse(ctx, 'AI employee not found');
          return next();
        }

        try {
          await ctx.db.getRepository('aiConversations.messages', sessionId).create({
            values: messages.map((message: any) => ({
              messageId: plugin.snowflake.generate(),
              role: message.role,
              content: message.content,
            })),
          });
        } catch (err) {
          ctx.log.error(err);
          sendErrorResponse(ctx, 'Chat error warning');
          return next();
        }

        const history = await getConversationHistory(ctx, sessionId, employee);
        const userMessages = await formatMessages(ctx, messages, employee);
        const formattedMessages = [
          {
            role: 'system',
            content: employee.about,
          },
          ...history,
          ...userMessages,
        ];

        const { stream, signal } = await prepareChatStream(ctx, sessionId, employee, formattedMessages);
        await processChatStream(ctx, stream, sessionId, {
          aiEmployeeUsername: aiEmployee,
          signal,
        });
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
          appends: ['aiEmployee'],
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

        const employee = conversation.aiEmployee;
        const history = await getConversationHistory(ctx, sessionId, employee, messageId);
        const formattedMessages = [
          {
            role: 'system',
            content: employee.about,
          },
          ...history,
        ];

        const { stream, signal } = await prepareChatStream(ctx, sessionId, employee, formattedMessages);
        await processChatStream(ctx, stream, sessionId, {
          aiEmployeeUsername: employee.username,
          signal,
          messageId,
        });
      } catch (err) {
        ctx.log.error(err);
        sendErrorResponse(ctx, 'Chat error warning');
      }

      await next();
    },
  },
};
