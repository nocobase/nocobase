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
import { concat } from '@langchain/core/utils/stream';

async function parseUISchema(ctx: Context, content: string) {
  const regex = /\{\{\$nUISchema\.([^}]+)\}\}/g;
  const uiSchemaRepo = ctx.db.getRepository('uiSchemas') as any;
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
      ctx.log.error(error, { module: 'aiConversations', method: 'parseUISchema', uid });
    }
  }

  return result;
}

async function formatMessages(ctx: Context, messages: any[]) {
  const formattedMessages = [];

  for (const msg of messages) {
    let content = msg.content.content;
    content = await parseUISchema(ctx, content);
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

  const tools = [];
  const skills = employee.skills;
  if (skills?.length) {
    for (const skill of skills) {
      const tool = plugin.aiManager.getTool(skill);
      if (tool) {
        tools.push(tool);
      }
    }
  }
  const Provider = providerOptions.provider;
  const provider = new Provider({
    app: ctx.app,
    serviceOptions: service.options,
    chatOptions: {
      ...modelSettings,
      messages,
      tools,
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
  let gathered: any;
  try {
    for await (const chunk of stream) {
      gathered = gathered !== undefined ? concat(gathered, chunk) : chunk;
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

  message = message.trim();
  if (!message && !gathered?.tool_calls?.length && !signal.aborted) {
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
    if (gathered?.tool_calls?.length) {
      content['tool_calls'] = gathered.tool_calls;
    }
    if (gathered?.usage_metadata) {
      content['usage_metadata'] = gathered.usage_metadata;
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

  return await formatMessages(ctx, historyMessages);
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
        const userMessages = await formatMessages(ctx, messages);
        const userConfig = await ctx.db.getRepository('usersAiEmployees').findOne({
          filter: {
            userId: ctx.auth?.user.id,
            aiEmployee,
          },
        });
        const formattedMessages = [
          {
            role: 'system',
            content: employee.about,
          },
          ...(userConfig?.prompt ? [{ role: 'user', content: userConfig.prompt }] : []),
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
        const userConfig = await ctx.db.getRepository('usersAiEmployees').findOne({
          filter: {
            userId: ctx.auth?.user.id,
            aiEmployee: employee.username,
          },
        });
        const formattedMessages = [
          {
            role: 'system',
            content: employee.about,
          },
          ...(userConfig?.prompt ? [{ role: 'user', content: userConfig.prompt }] : []),
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
      const tools = message?.content?.tool_calls || [];
      const toolNames = tools.map((tool: any) => tool.name);
      const result = {};
      for (const toolName of toolNames) {
        const tool = plugin.aiManager.getTool(toolName);
        if (tool) {
          result[toolName] = tool;
        }
      }
      ctx.body = result;
      await next();
    },
  },
};
