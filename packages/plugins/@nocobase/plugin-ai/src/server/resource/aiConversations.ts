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
  const infoForm: {
    name: string;
    title: string;
    type: 'blocks' | 'collections';
  }[] = aiEmployee.chatSettings?.infoForm;
  if (!infoForm) {
    return;
  }
  if (!content) {
    return;
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
        return;
      }
      info += `${field.title}: ${JSON.stringify(schema)}; `;
    } else {
      info += `${field.title}: ${content[key]}; `;
    }
  }
  if (!info) {
    return;
  }
  return `The following information you can utilize in your conversation: ${info}`;
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
      const rows = await ctx.db.getRepository('aiConversations.messages', sessionId).find({
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
      ctx.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      const { sessionId, aiEmployee, messages } = ctx.action.params.values || {};
      if (!sessionId) {
        ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'sessionId is required' })}\n\n`);
        ctx.res.end();
        return next();
      }
      const userMessage = messages.find((message: any) => message.role === 'user');
      if (!userMessage) {
        ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'user message is required' })}\n\n`);
        ctx.res.end();
        return next();
      }
      let stream: any;
      const controller = new AbortController();
      const { signal } = controller;
      try {
        const conversation = await ctx.db.getRepository('aiConversations').findOne({
          filterByTk: sessionId,
        });
        if (!conversation) {
          ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'conversation not found' })}\n\n`);
          ctx.res.end();
          return next();
        }
        if (!conversation.title) {
          const textUserMessage = messages.find(
            (message: any) => message.role === 'user' && message.content?.type === 'text' && message.content?.content,
          );
          if (textUserMessage) {
            const content = textUserMessage.content.content;
            conversation.title = content.substring(0, 10);
            conversation.save();
          }
        }
        const employee = await ctx.db.getRepository('aiEmployees').findOne({
          filter: {
            username: aiEmployee,
          },
        });
        if (!employee) {
          ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'AI employee not found' })}\n\n`);
          ctx.res.end();
          return next();
        }
        const modelSettings = employee.modelSettings;
        if (!modelSettings?.llmService) {
          ctx.log.error('llmService not configured');
          ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'Chat error warning' })}\n\n`);
          ctx.res.end();
          return next();
        }
        const service = await ctx.db.getRepository('llmServices').findOne({
          filter: {
            name: modelSettings.llmService,
          },
        });
        if (!service) {
          ctx.log.error('llmService not found');
          ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'Chat error warning' })}\n\n`);
          ctx.res.end();
          return next();
        }
        const plugin = ctx.app.pm.get('ai') as PluginAIServer;
        const providerOptions = plugin.aiManager.llmProviders.get(service.provider);
        if (!providerOptions) {
          ctx.log.error('llmService provider not found');
          ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'Chat error warning' })}\n\n`);
          ctx.res.end();
          return next();
        }

        const historyMessages = await ctx.db.getRepository('aiConversations.messages', sessionId).find({
          sort: ['messageId'],
        });
        const history = [];
        for (const msg of historyMessages) {
          let content = msg.content.content;
          if (msg.content.type === 'info') {
            content = await parseInfoMessage(ctx.db, employee, content);
          }
          history.push({
            role: msg.role === 'user' ? 'user' : 'ai',
            content,
          });
        }
        try {
          await ctx.db.getRepository('aiConversations.messages', sessionId).create({
            values: messages.map((message: any) => ({
              messageId: snowflake.generate(),
              role: message.role,
              content: message.content,
            })),
          });
        } catch (err) {
          ctx.log.error(err);
          ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'Chat error warning' })}\n\n`);
          ctx.res.end();
          return next();
        }
        ctx.status = 200;
        const userMessages = [];
        for (const msg of messages) {
          let content = msg.content.content;
          if (msg.content.type === 'info') {
            content = await parseInfoMessage(ctx.db, employee, content);
          }
          if (!content) {
            continue;
          }
          userMessages.push({
            role: msg.role === 'user' ? 'user' : 'ai',
            content,
          });
        }
        const msgs = [
          {
            role: 'system',
            content: employee.about,
          },
          ...history,
          ...userMessages,
        ];
        const Provider = providerOptions.provider;
        const provider = new Provider({
          app: ctx.app,
          serviceOptions: service.options,
          chatOptions: {
            ...modelSettings,
            messages: msgs,
          },
        });
        try {
          stream = await provider.stream({
            signal,
          });
          plugin.aiEmployeesManager.conversationController.set(sessionId, controller);
        } catch (err) {
          ctx.log.error(err);
          ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'Chat error warning' })}\n\n`);
          ctx.res.end();
          return next();
        }
      } catch (err) {
        ctx.log.error(err);
        ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'Chat error warning' })}\n\n`);
        ctx.res.end();
        return next();
      }
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
        return next();
      }
      if (message) {
        const content = {
          content: message,
          type: 'text',
        };
        if (signal.aborted) {
          content['interrupted'] = true;
        }
        await ctx.db.getRepository('aiConversations.messages', sessionId).create({
          values: {
            messageId: snowflake.generate(),
            role: aiEmployee,
            content,
          },
        });
      }
      ctx.res.end();
      await next();
    },
    async abort(ctx: Context, next: Next) {
      const { sessionId } = ctx.action.params.values || {};
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      plugin.aiEmployeesManager.abortConversation(sessionId);
      await next();
    },
    async resendMessages(ctx: Context, next: Next) {
      const plugin = ctx.app.pm.get('ai') as PluginAIServer;
      ctx.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      ctx.status = 200;
      let stream: any;
      let employee: any;
      const controller = new AbortController();
      const { signal } = controller;
      const { sessionId, messageId } = ctx.action.params.values || {};
      if (!sessionId) {
        ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'sessionId and messageId are required' })}\n\n`);
        ctx.res.end();
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
          ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'conversation not found' })}\n\n`);
          ctx.res.end();
          return next();
        }
        if (messageId) {
          const message = await ctx.db.getRepository('aiConversations.messages', sessionId).findOne({
            filter: {
              messageId,
            },
          });
          if (!message) {
            ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'message not found' })}\n\n`);
            ctx.res.end();
            return next();
          }
        }
        employee = conversation.aiEmployee;
        const modelSettings = employee.modelSettings;
        if (!modelSettings?.llmService) {
          ctx.log.error('llmService not configured');
          ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'Chat error warning' })}\n\n`);
          ctx.res.end();
          return next();
        }
        const service = await ctx.db.getRepository('llmServices').findOne({
          filter: {
            name: modelSettings.llmService,
          },
        });
        if (!service) {
          ctx.log.error('llmService not found');
          ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'Chat error warning' })}\n\n`);
          ctx.res.end();
          return next();
        }
        const providerOptions = plugin.aiManager.llmProviders.get(service.provider);
        if (!providerOptions) {
          ctx.log.error('llmService provider not found');
          ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'Chat error warning' })}\n\n`);
          ctx.res.end();
          return next();
        }
        const historyMessages = await ctx.db.getRepository('aiConversations.messages', sessionId).find({
          sort: ['messageId'],
          ...(messageId
            ? {
                filter: {
                  messageId: {
                    $lt: messageId,
                  },
                },
              }
            : {}),
        });
        const history = [];
        for (const msg of historyMessages) {
          let content = msg.content.content;
          if (msg.content.type === 'info') {
            content = await parseInfoMessage(ctx.db, employee, content);
          }
          history.push({
            role: msg.role === 'user' ? 'user' : 'ai',
            content,
          });
        }
        const msgs = [
          {
            role: 'system',
            content: conversation.aiEmployee.about,
          },
          ...history,
        ];
        const Provider = providerOptions.provider;
        const provider = new Provider({
          app: ctx.app,
          serviceOptions: service.options,
          chatOptions: {
            ...modelSettings,
            messages: msgs,
          },
        });

        try {
          stream = await provider.stream({
            signal,
          });
          plugin.aiEmployeesManager.conversationController.set(sessionId, controller);
        } catch (err) {
          ctx.log.error(err);
          ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'Chat error warning' })}\n\n`);
          ctx.res.end();
          return next();
        }
      } catch (err) {
        ctx.log.error(err);
        ctx.res.write(`data: ${JSON.stringify({ type: 'error', body: 'Chat error warning' })}\n\n`);
        ctx.res.end();
        return next();
      }
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
        return next();
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
              messageId: snowflake.generate(),
              role: employee.username,
              content,
            },
          });
        }
      }
      ctx.res.end();
      await next();
    },
  },
};
